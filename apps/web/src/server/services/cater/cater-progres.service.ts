/**
 * Service: Monitoring Progres Lapangan Real-Time Petugas Cater
 * Lapisan: 2. Service Layer (Agregasi Beban Catat & Realisasi Pembacaan Nyata Database)
 */

import { eq, and, sql, desc } from 'drizzle-orm';
import { db, caterBacaMeter, petugasCater, pelanggan } from '@cater/db';

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

export class CaterProgresService {
  async getMonitoringProgres(thbl: string = '202601'): Promise<MonitoringProgresResult> {
    // 1. Ambil agregasi komprehensif riil pembacaan dari caterBacaMeter per petugas
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

    // 2. Ambil master data petugas
    const masterPetugas = await db.select().from(petugasCater);
    const petugasMap = new Map(masterPetugas.map((p) => [p.id, p]));

    // 3. Hitung target riil per petugas dari jumlah pelanggan di rute binaan
    const rutePetugasRows = await db
      .selectDistinct({
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl));

    const pelangganPerRute = await db
      .select({
        ruteKode: pelanggan.ruteKode,
        total: sql<number>`count(*)::int`,
      })
      .from(pelanggan)
      .groupBy(pelanggan.ruteKode);

    const pelRuteMap = new Map(pelangganPerRute.map((r) => [r.ruteKode, r.total]));

    const targetMap = new Map<string, number>();
    for (const rp of rutePetugasRows) {
      if (!rp.petugasId || !rp.ruteKode) continue;
      const count = pelRuteMap.get(rp.ruteKode) ?? 0;
      targetMap.set(rp.petugasId, (targetMap.get(rp.petugasId) ?? 0) + count);
    }

    let globalTarget = 0;
    let globalTerbaca = 0;
    let globalM3 = 0;
    let globalNol = 0;
    let globalEkstrim = 0;
    let globalTurun = 0;
    let globalRuteCount = 0;

    const list: PetugasProgresItem[] = readingStats.map((stat) => {
      const pid = stat.petugasId ?? 'UNKNOWN';
      const prof = petugasMap.get(pid);
      const nama = prof?.nama ?? pid;

      const target = Math.max(stat.terbaca, targetMap.get(pid) ?? stat.terbaca);
      const sisa = Math.max(0, target - stat.terbaca);
      const persentase = target > 0 ? Number(((stat.terbaca / target) * 100).toFixed(1)) : 100;
      const anomaliPetugas = stat.totalEkstrim + stat.totalNol + stat.totalTurun;

      let statusKerja: PetugasProgresItem['statusKerja'] = 'AKTIF_LAPANGAN';
      if (persentase >= 100) {
        statusKerja = 'SELESAI';
      } else if (stat.terbaca === 0) {
        statusKerja = 'BELUM_MULAI';
      } else {
        statusKerja = 'AKTIF_LAPANGAN';
      }

      globalTarget += target;
      globalTerbaca += stat.terbaca;
      globalM3 += stat.totalM3;
      globalNol += stat.totalNol;
      globalEkstrim += stat.totalEkstrim;
      globalTurun += stat.totalTurun;
      globalRuteCount += stat.totalRute;

      const rutes = stat.ruteCodes
        ? stat.ruteCodes.split(', ').map((r) => r.trim()).filter(Boolean)
        : [];

      return {
        petugasId: pid,
        nama,
        wilayahKode: (prof as any)?.wilayahKode ?? 'WIL-KOTA',
        ruteList: rutes,
        totalRute: stat.totalRute,
        target,
        terbaca: stat.terbaca,
        sisa,
        persentase,
        totalM3: stat.totalM3,
        anomali: anomaliPetugas,
        totalNol: stat.totalNol,
        totalEkstrim: stat.totalEkstrim,
        totalTurun: stat.totalTurun,
        mulaiCatat: stat.tglAwal,
        selesaiCatat: stat.tglAkhir,
        terakhirCatat: stat.tglAkhir,
        durasiRataRataDetik: stat.durasiRataRata,
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
