/**
 * Service: Monitoring Progres Lapangan Real-Time Petugas Cater
 * Lapisan: 2. Service Layer (Agregasi Beban Catat & Realisasi Pembacaan Nyata Database)
 */

import { eq, and, sql, desc } from 'drizzle-orm';
import { db, caterBacaMeter, petugasCater, pelanggan, periodePenagihan, getActivePeriode } from '@cater/db';

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
    // 0. Cek status siklus penagihan & tentukan periode bulan sebelumnya sebagai baseline target
    const [periodeInfo] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, thbl));

    const isLocked = periodeInfo?.status === 'TERKUNCI';
    const prevThbl = getPreviousThbl(thbl);

    // 1. Ambil agregasi komprehensif riil pembacaan dari caterBacaMeter per petugas pada periode berjalan
    const readingStats = await db
      .select({
        petugasId: caterBacaMeter.petugasId,
        terbaca: sql<number>`count(*)::int`,
        totalM3: sql<number>`round(coalesce(sum(${caterBacaMeter.pakaiM3}::float), 0))::int`,
        totalNol: sql<number>`count(case when ${caterBacaMeter.pakaiM3}::float = 0 then 1 end)::int`,
        totalEkstrim: sql<number>`count(case when (
          (${caterBacaMeter.pakaiLalu}::float > 0 and ${caterBacaMeter.pakaiM3}::float >= ${caterBacaMeter.pakaiLalu}::float * 2)
          or (${caterBacaMeter.pakaiLalu}::float > 0 and (${caterBacaMeter.pakaiM3}::float - ${caterBacaMeter.pakaiLalu}::float) >= 30)
          or (${caterBacaMeter.pakaiM3}::float > 75)
          or (${caterBacaMeter.statusVerifikasi} in ('ANOMALY', 'ANOMALY_HIGH'))
        ) then 1 end)::int`,
        totalTurun: sql<number>`count(case when ${caterBacaMeter.pakaiLalu} is not null and ${caterBacaMeter.pakaiLalu}::float >= 10 and (${caterBacaMeter.pakaiM3}::float <= ${caterBacaMeter.pakaiLalu}::float * 0.5) then 1 end)::int`,
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
    const petugasMap = new Map(masterPetugas.map((p) => [p.id.toUpperCase(), p]));

    // 3. TARGET CATAT: Mengambil jumlah pencatatan riil pada periode bulan sebelumnya (baseline SSOT pembanding)
    const prevStats = await db
      .select({
        petugasId: caterBacaMeter.petugasId,
        total: sql<number>`count(*)::int`,
        totalRute: sql<number>`count(distinct ${caterBacaMeter.ruteKode})::int`,
        ruteCodes: sql<string>`string_agg(distinct ${caterBacaMeter.ruteKode}, ', ')`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, prevThbl))
      .groupBy(caterBacaMeter.petugasId);

    const prevTargetMap = new Map<
      string,
      { total: number; totalRute: number; rutes: string[] }
    >();
    for (const p of prevStats) {
      if (p.petugasId) {
        prevTargetMap.set(p.petugasId.toUpperCase(), {
          total: p.total,
          totalRute: p.totalRute,
          rutes: p.ruteCodes
            ? p.ruteCodes.split(', ').map((r) => r.trim()).filter(Boolean)
            : [],
        });
      }
    }

    let globalTarget = 0;
    let globalTerbaca = 0;
    let globalM3 = 0;
    let globalNol = 0;
    let globalEkstrim = 0;
    let globalTurun = 0;
    let globalRuteCount = 0;

    // Iterasikan seluruh petugas aktif agar seluruh petugas terpantau meskipun baru mulai mencatat
    const list: PetugasProgresItem[] = masterPetugas.map((prof) => {
      const pid = prof.id.toUpperCase();
      const stat = readingMap.get(pid);
      const prev = prevTargetMap.get(pid);

      const terbaca = stat?.terbaca ?? 0;

      // Logika Penentuan Target Catat:
      // - Jika periode sudah TERKUNCI (closing selesai), target = terbaca (100% selesai, historis beku).
      // - Jika periode BERJALAN, target adalah jumlah pencatatan di periode bulan sebelumnya (pembanding progres riil).
      // - Jika data bulan sebelumnya belum ada, fallback ke total rute binaan atau terbaca saat ini.
      const target = isLocked
        ? terbaca
        : (prev?.total ?? (terbaca > 0 ? terbaca : 2500));

      const sisa = Math.max(0, target - terbaca);
      const persentase = target > 0 ? Number(((terbaca / target) * 100).toFixed(1)) : (isLocked ? 100 : 0);
      const anomaliPetugas = (stat?.totalEkstrim ?? 0) + (stat?.totalNol ?? 0) + (stat?.totalTurun ?? 0);

      let statusKerja: PetugasProgresItem['statusKerja'] = 'AKTIF_LAPANGAN';
      if (isLocked || persentase >= 100) {
        statusKerja = 'SELESAI';
      } else if (terbaca === 0) {
        statusKerja = 'BELUM_MULAI';
      } else {
        statusKerja = 'AKTIF_LAPANGAN';
      }

      globalTarget += target;
      globalTerbaca += terbaca;
      globalM3 += stat?.totalM3 ?? 0;
      globalNol += stat?.totalNol ?? 0;
      globalEkstrim += stat?.totalEkstrim ?? 0;
      globalTurun += stat?.totalTurun ?? 0;

      // Gabungkan rute unik dari bulan sebelumnya dan bulan berjalan
      const curRutes = stat?.ruteCodes
        ? stat.ruteCodes.split(', ').map((r) => r.trim()).filter(Boolean)
        : [];
      const prevRutes = prev?.rutes ?? [];
      const allRutes = Array.from(new Set([...curRutes, ...prevRutes]));
      const totalRute = allRutes.length || prev?.totalRute || stat?.totalRute || 14;

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

    const readRatePersen =
      globalTarget > 0 ? Number(((globalTerbaca / globalTarget) * 100).toFixed(1)) : 100;

    const totalAnomali = globalEkstrim + globalNol + globalTurun;

    return {
      periode: thbl,
      timestamp: new Date().toISOString(),
      kpi: {
        totalTarget: globalTarget,
        totalTerbaca: globalTerbaca,
        totalSisa: Math.max(0, globalTarget - globalTerbaca),
        readRatePersen,
        totalM3: globalM3,
        totalAnomali,
        totalEkstrim: globalEkstrim,
        totalNol: globalNol,
        totalTurun: globalTurun,
        petugasAktif: list.length,
        totalPetugas: list.length,
        totalRute: globalRuteCount,
      },
      petugas: list,
    };
  }
}

export const caterProgresService = new CaterProgresService();
