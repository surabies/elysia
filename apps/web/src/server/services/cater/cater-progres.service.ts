/**
 * Service: Monitoring Progres Lapangan Real-Time Petugas Cater
 * Lapisan: 2. Service Layer (Agregasi Beban Catat & Realisasi Pembacaan Nyata Database SSOT)
 */

import { eq, and, sql, desc } from 'drizzle-orm';
import { db, caterBacaMeter, petugasCater, pelanggan, ruteCater, periodePenagihan, getActivePeriode } from '@cater/db';

export interface PetugasProgresItem {
  petugasId: string;
  nama: string;
  wilayahKode: string | null;
  ruteList: string[];
  totalRute: number;
  target: number;
  terbaca: number;
  sisa: number;
  persentase: number;
  totalM3: number;
  anomali: number;
  totalNol: number;
  totalEkstrim: number;
  totalTurun: number;
  mulaiCatat: string | null;
  selesaiCatat: string | null;
  terakhirCatat: string | null;
  durasiRataRataDetik: number;
  statusKerja: 'AKTIF_LAPANGAN' | 'ISTIRAHAT' | 'SELESAI' | 'BELUM_MULAI';
}

export interface ProgresDailyTrend {
  tanggal: string;
  hari: string;
  label: string;
  total: number;
  kubikasi: number;
  anomali: number;
}

export interface MonitoringProgresResult {
  periode: string;
  timestamp: string;
  kpi: {
    totalTarget: number;
    totalTerbaca: number;
    totalSisa: number;
    readRatePersen: number;
    totalM3: number;
    totalAnomali: number;
    totalEkstrim: number;
    totalNol: number;
    totalTurun: number;
    petugasAktif: number;
    totalPetugas: number;
    totalRute: number;
  };
  dailyTrends: ProgresDailyTrend[];
  petugas: PetugasProgresItem[];
}

function getPreviousThbl(thbl: string): string {
  const y = parseInt(thbl.slice(0, 4), 10);
  const m = parseInt(thbl.slice(4, 6), 10);
  if (m === 1) return `${y - 1}12`;
  return `${y}${String(m - 1).padStart(2, '0')}`;
}

export class CaterProgresService {
  async getMonitoringProgres(thblParam?: string): Promise<MonitoringProgresResult> {
    const thbl = thblParam || (await getActivePeriode());

    // 0. Cek status siklus penagihan & ambil snapshot jumlah SL resmi SSOT
    const [periodeInfo] = await db
      .select({
        status: periodePenagihan.status,
        jumlahSl: periodePenagihan.jumlahSl,
      })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, thbl));

    const isLocked = periodeInfo?.status === 'TERKUNCI';
    const prevThbl = getPreviousThbl(thbl);

    // Hitung total pelanggan riil SSOT di database
    const [pelangganRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pelanggan);
    const totalPelangganDb = Number(pelangganRow?.count ?? 22528);
    const totalTargetKota = isLocked
      ? (periodeInfo?.jumlahSl ? Number(periodeInfo.jumlahSl) : totalPelangganDb)
      : totalPelangganDb;

    // 1. Definisi SQL kriteria anomali identik 100% dengan Radar Anomali (cater-progress.service.ts)
    const ekstrimSql = sql`(${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_LONJAKAN_M3', 'ANOM_LONJAKAN_PERSEN', 'ANOM_LONJAKAN_RELATIF', 'ANOM_METER_MUNDUR') or (${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_DEVIASI_RING3', 'ANOM_DEVIASI_RING_3') and ${caterBacaMeter.pakaiM3} > ${caterBacaMeter.pakaiLalu}) or ${caterBacaMeter.pakaiM3} >= 100)`;
    const nolSql = sql`(${caterBacaMeter.pakaiM3} = 0 or ${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_PEMAKAIAN_NOL', 'ANOM_TIDAK_ADA_AIR_MENDADAK', 'ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN'))`;
    const turunSql = sql`(${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_PENURUNAN_DRASTIS') or (${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_DEVIASI_RING2', 'ANOM_DEVIASI_RING3') and ${caterBacaMeter.pakaiM3} < ${caterBacaMeter.pakaiLalu}) or (${caterBacaMeter.pakaiLalu} >= 10 and ${caterBacaMeter.pakaiM3} > 0 and ${caterBacaMeter.pakaiM3} <= ${caterBacaMeter.pakaiLalu} * 0.5))`;

    // Ekstraksi riil pembacaan caterBacaMeter per petugas pada periode berjalan
    const readingStats = await db
      .select({
        petugasId: caterBacaMeter.petugasId,
        terbaca: sql<number>`count(*)::int`,
        totalM3: sql<number>`round(coalesce(sum(${caterBacaMeter.pakaiM3}::float), 0))::int`,
        totalAnomali: sql<number>`count(case when ${caterBacaMeter.isAnomali} = true then 1 end)::int`,
        totalNol: sql<number>`count(case when ${nolSql} then 1 end)::int`,
        totalEkstrim: sql<number>`count(case when ${ekstrimSql} then 1 end)::int`,
        totalTurun: sql<number>`count(case when ${turunSql} then 1 end)::int`,
        totalRute: sql<number>`count(distinct ${caterBacaMeter.ruteKode})::int`,
        tglAwal: sql<string>`to_char(min(${caterBacaMeter.tglCatat}), 'YYYY-MM-DD HH24:MI')`,
        tglAkhir: sql<string>`to_char(max(${caterBacaMeter.tglCatat}), 'YYYY-MM-DD HH24:MI')`,
        durasiRataRata: sql<number>`coalesce(round(avg(${caterBacaMeter.durasiDetik})::numeric, 0), 45)::int`,
        ruteCodes: sql<string>`string_agg(distinct ${caterBacaMeter.ruteKode}, ', ')`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl))
      .groupBy(caterBacaMeter.petugasId);

    const readingMap = new Map(
      readingStats.map((r) => [r.petugasId?.toUpperCase() ?? 'UNKNOWN', r])
    );

    // 2. Ambil master data petugas
    const masterPetugas = await db.select().from(petugasCater);

    // 3. TARGET CATAT PROPORSIONAL BERDASARKAN DISTRIBUSI PELANGGAN RIIL
    // Ambil beban pelanggan per rute dari tabel pelanggan
    const rutePelangganStats = await db
      .select({
        ruteKode: pelanggan.ruteKode,
        count: sql<number>`count(*)::int`,
      })
      .from(pelanggan)
      .groupBy(pelanggan.ruteKode);

    const ruteSlMap = new Map(
      rutePelangganStats.map((r) => [r.ruteKode ?? '', r.count])
    );

    // Ambil penugasan rute default dari master ruteCater
    const masterRutes = await db.select().from(ruteCater);
    const petugasDefaultRuteMap = new Map<string, string[]>();
    for (const mr of masterRutes) {
      if (mr.pencatatDefault) {
        const pid = mr.pencatatDefault.toUpperCase();
        const existing = petugasDefaultRuteMap.get(pid) || [];
        existing.push(mr.kode);
        petugasDefaultRuteMap.set(pid, existing);
      }
    }

    // Ambil juga histori bulan sebelumnya sebagai referensi rute jika default belum diisi
    const prevStats = await db
      .select({
        petugasId: caterBacaMeter.petugasId,
        total: sql<number>`count(*)::int`,
        ruteCodes: sql<string>`string_agg(distinct ${caterBacaMeter.ruteKode}, ', ')`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, prevThbl))
      .groupBy(caterBacaMeter.petugasId);

    const prevMap = new Map(
      prevStats.map((p) => [p.petugasId?.toUpperCase() ?? '', p])
    );

    // 4. Time-series Harian Lengkap Siklus 20 Hari Catat (Tanggal 1 s.d. 20 tanpa tanggal yang di-skip)
    const rawDaily = await db.execute(sql`
      SELECT 
        to_char(tgl_catat, 'YYYY-MM-DD') as tanggal,
        to_char(tgl_catat, 'DD') as hari,
        count(*)::int as total,
        count(case when is_anomali = true then 1 end)::int as anomali,
        round(coalesce(sum(pakai_m3::float), 0))::int as kubikasi
      FROM cater_baca_meter
      WHERE thbl = ${thbl} AND tgl_catat IS NOT NULL
      GROUP BY to_char(tgl_catat, 'YYYY-MM-DD'), to_char(tgl_catat, 'DD')
      ORDER BY tanggal ASC
    `);

    const dailyMap = new Map<string, { total: number; kubikasi: number; anomali: number }>();
    for (const d of rawDaily as any[]) {
      dailyMap.set(d.tanggal, {
        total: Number(d.total || 0),
        kubikasi: Number(d.kubikasi || 0),
        anomali: Number(d.anomali || 0),
      });
    }

    const yrProgres = thbl.slice(0, 4);
    const moProgres = thbl.slice(4, 6);
    const dailyTrends: ProgresDailyTrend[] = [];
    for (let day = 1; day <= 20; day++) {
      const tglStr = `${yrProgres}-${moProgres}-${String(day).padStart(2, '0')}`;
      const entry = dailyMap.get(tglStr) || { total: 0, kubikasi: 0, anomali: 0 };
      dailyTrends.push({
        tanggal: tglStr,
        hari: String(day).padStart(2, '0'),
        label: `Tgl ${day}`,
        total: entry.total,
        kubikasi: entry.kubikasi,
        anomali: entry.anomali,
      });
    }

    let globalTerbaca = 0;
    let globalM3 = 0;
    let globalAnomali = 0;
    let globalNol = 0;
    let globalEkstrim = 0;
    let globalTurun = 0;
    let globalRuteCount = 0;

    // Iterasikan seluruh petugas aktif agar seluruh petugas terpantau
    const list: PetugasProgresItem[] = masterPetugas.map((prof) => {
      const pid = prof.id.toUpperCase();
      const stat = readingMap.get(pid);
      const prev = prevMap.get(pid);
      const defaultRutes = petugasDefaultRuteMap.get(pid) || [];

      const terbaca = stat?.terbaca ?? 0;
      const anomaliPetugas = stat?.totalAnomali ?? 0;

      // Gabungkan rute unik
      const curRutes = stat?.ruteCodes
        ? stat.ruteCodes.split(', ').map((r) => r.trim()).filter(Boolean)
        : [];
      const prevRutes = prev?.ruteCodes
        ? prev.ruteCodes.split(', ').map((r) => r.trim()).filter(Boolean)
        : [];
      const allRutes = Array.from(new Set([...curRutes, ...defaultRutes, ...prevRutes]));
      const totalRute = allRutes.length || 14;

      // Hitung beban target SL dari jumlah pelanggan di rute binaannya
      let rutePelangganSum = 0;
      for (const rCode of allRutes) {
        rutePelangganSum += ruteSlMap.get(rCode) ?? 0;
      }

      // Logika target terkalibrasi:
      // Jika periode TERKUNCI: target = terbaca (100% selesai)
      // Jika periode BERJALAN: target adalah pelanggan rute binaan (atau fallback ke prev total)
      const target = isLocked
        ? terbaca
        : (rutePelangganSum > 0 ? rutePelangganSum : (prev?.total ?? Math.round(totalTargetKota / masterPetugas.length)));

      const sisa = Math.max(0, target - terbaca);
      const persentase = target > 0 ? Number(((terbaca / target) * 100).toFixed(1)) : (isLocked ? 100 : 0);

      let statusKerja: PetugasProgresItem['statusKerja'] = 'AKTIF_LAPANGAN';
      if (isLocked || persentase >= 100) {
        statusKerja = 'SELESAI';
      } else if (terbaca === 0) {
        statusKerja = 'BELUM_MULAI';
      } else {
        statusKerja = 'AKTIF_LAPANGAN';
      }

      globalTerbaca += terbaca;
      globalM3 += stat?.totalM3 ?? 0;
      globalAnomali += anomaliPetugas;
      globalNol += stat?.totalNol ?? 0;
      globalEkstrim += stat?.totalEkstrim ?? 0;
      globalTurun += stat?.totalTurun ?? 0;
      globalRuteCount += totalRute;

      return {
        petugasId: pid,
        nama: prof.nama ?? pid,
        wilayahKode: (prof as any)?.wilayahKode ?? 'WIL-KOTA',
        ruteList: allRutes,
        totalRute,
        target,
        terbaca,
        sisa,
        persentase,
        totalM3: stat?.totalM3 ?? 0,
        anomali: anomaliPetugas,
        totalNol: stat?.totalNol ?? 0,
        totalEkstrim: stat?.totalEkstrim ?? 0,
        totalTurun: stat?.totalTurun ?? 0,
        mulaiCatat: stat?.tglAwal ?? null,
        selesaiCatat: stat?.tglAkhir ?? null,
        terakhirCatat: stat?.tglAkhir ?? null,
        durasiRataRataDetik: stat?.durasiRataRata ?? 45,
        statusKerja,
      };
    });

    // Urutkan berdasarkan total pembacaan terbanyak
    list.sort((a, b) => b.terbaca - a.terbaca);

    // Target agregat kota konsisten dengan SSOT pelanggan
    const totalTarget = isLocked ? globalTerbaca : Math.max(totalTargetKota, globalTerbaca);
    const readRatePersen =
      totalTarget > 0 ? Number(((globalTerbaca / totalTarget) * 100).toFixed(1)) : 100;

    return {
      periode: thbl,
      timestamp: new Date().toISOString(),
      kpi: {
        totalTarget,
        totalTerbaca: globalTerbaca,
        totalSisa: Math.max(0, totalTarget - globalTerbaca),
        readRatePersen,
        totalM3: globalM3,
        totalAnomali: globalAnomali,
        totalEkstrim: globalEkstrim,
        totalNol: globalNol,
        totalTurun: globalTurun,
        petugasAktif: list.length,
        totalPetugas: list.length,
        totalRute: globalRuteCount,
      },
      dailyTrends,
      petugas: list,
    };
  }
}

export const caterProgresService = new CaterProgresService();
