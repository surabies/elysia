/**
 * Service: Monitoring Progres Lapangan Real-Time Petugas Cater
 * Lapisan: 2. Service Layer (Agregasi Beban Catat & Realisasi Pembacaan)
 */

import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db, caterBacaMeter, petugasCater, daftarCatat, ruteCater, wilayahAdministrasi, pelanggan } from '@cater/db';

export interface PetugasProgresItem {
  petugasId: string;
  nama: string;
  wilayahKode: string | null;
  ruteList: string[];
  target: number;
  terbaca: number;
  sisa: number;
  persentase: number;
  anomali: number;
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
    totalAnomali: number;
    petugasAktif: number;
    totalPetugas: number;
  };
  petugas: PetugasProgresItem[];
}

export class CaterProgresService {
  async getMonitoringProgres(thbl: string = '202601'): Promise<MonitoringProgresResult> {
    // 1. Ambil agregasi pembacaan nyata dari caterBacaMeter per petugas
    const readingStats = await db
      .select({
        petugasId: caterBacaMeter.petugasId,
        terbaca: sql<number>`count(*)::int`,
        anomali: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} like '%ANOMALY%' or ${caterBacaMeter.pakaiM3}::numeric < 0 or (${caterBacaMeter.ketCatat} is not null and lower(${caterBacaMeter.ketCatat}) not in ('normal', 'nihil', '')) then 1 end)::int`,
        tglAwal: sql<string>`min(${caterBacaMeter.tglCatat})`,
        tglAkhir: sql<string>`max(${caterBacaMeter.tglCatat})`,
        durasiRataRata: sql<number>`coalesce(round(avg(${caterBacaMeter.durasiDetik})::numeric, 0), 45)::int`,
        ruteCodes: sql<string>`string_agg(distinct ${caterBacaMeter.ruteKode}, ', ')`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl))
      .groupBy(caterBacaMeter.petugasId);

    // 2. Ambil master petugas cater
    const masterPetugas = await db.select().from(petugasCater);
    const petugasMap = new Map(masterPetugas.map((p) => [p.id, p]));

    // 3. Hitung target riil per petugas dari jumlah pelanggan di rute yang ditugaskan
    // a. Pemetaan rute ke petugas
    const rutePetugasRows = await db
      .selectDistinct({
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl));

    // b. Hitung total pelanggan per rute di tabel pelanggan
    const pelangganPerRute = await db
      .select({
        ruteKode: pelanggan.ruteKode,
        total: sql<number>`count(*)::int`,
      })
      .from(pelanggan)
      .groupBy(pelanggan.ruteKode);

    const pelRuteMap = new Map(pelangganPerRute.map((r) => [r.ruteKode, r.total]));

    // c. Agregasikan target pelanggan riil per petugas
    const targetMap = new Map<string, number>();
    for (const rp of rutePetugasRows) {
      if (!rp.petugasId || !rp.ruteKode) continue;
      const count = pelRuteMap.get(rp.ruteKode) ?? 0;
      targetMap.set(rp.petugasId, (targetMap.get(rp.petugasId) ?? 0) + count);
    }

    let globalTarget = 0;
    let globalTerbaca = 0;
    let globalAnomali = 0;
    let petugasAktifCount = 0;

    const list: PetugasProgresItem[] = readingStats.map((stat) => {
      const pid = stat.petugasId ?? 'UNKNOWN';
      const prof = petugasMap.get(pid);
      const nama = prof?.nama ?? pid;

      // Target pelanggan riil dari database
      const target = targetMap.get(pid) ?? stat.terbaca;
      const sisa = Math.max(0, target - stat.terbaca);
      const persentase = target > 0 ? Number(((stat.terbaca / target) * 100).toFixed(1)) : 100;

      let statusKerja: PetugasProgresItem['statusKerja'] = 'AKTIF_LAPANGAN';
      if (persentase >= 100) {
        statusKerja = 'SELESAI';
      } else if (stat.terbaca === 0) {
        statusKerja = 'BELUM_MULAI';
      } else {
        statusKerja = 'AKTIF_LAPANGAN';
        petugasAktifCount++;
      }

      globalTarget += target;
      globalTerbaca += stat.terbaca;
      globalAnomali += stat.anomali;

      const rutes = stat.ruteCodes
        ? stat.ruteCodes.split(', ').map((r) => r.trim()).filter(Boolean)
        : [];

      return {
        petugasId: pid,
        nama,
        wilayahKode: (prof as any)?.wilayahKode ?? 'WIL-BARAT',
        ruteList: rutes.slice(0, 8),
        target,
        terbaca: stat.terbaca,
        sisa,
        persentase,
        anomali: stat.anomali,
        terakhirCatat: stat.tglAkhir ? new Date(stat.tglAkhir).toISOString() : null,
        durasiRataRataDetik: stat.durasiRataRata,
        statusKerja,
      };
    });

    // Urutkan berdasarkan nama petugas
    list.sort((a, b) => a.nama.localeCompare(b.nama));

    const readRatePersen = globalTarget > 0
      ? Number(((globalTerbaca / globalTarget) * 100).toFixed(1))
      : 100;

    return {
      periode: thbl,
      timestamp: new Date().toISOString(),
      kpi: {
        totalTarget: globalTarget,
        totalTerbaca: globalTerbaca,
        totalSisa: Math.max(0, globalTarget - globalTerbaca),
        readRatePersen,
        totalAnomali: globalAnomali,
        petugasAktif: petugasAktifCount > 0 ? petugasAktifCount : list.length,
        totalPetugas: list.length,
      },
      petugas: list,
    };
  }
}

export const caterProgresService = new CaterProgresService();
