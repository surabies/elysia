/**
 * Service: Laporan Evaluasi Kinerja & Produktivitas Petugas Cater
 * Lapisan: 2. Service Layer (Drizzle ORM)
 */

import { eq, and, sql, desc } from 'drizzle-orm';
import { db, petugasCater, ruteCater, pelanggan, caterBacaMeter } from '@cater/db';

export interface EvaluasiPetugasItem {
  petugasId: string;
  nama: string;
  noHp: string | null;
  targetSL: number;
  realisasiSL: number;
  sisaSL: number;
  persenSelesai: number;
  totalM3: number;
  rataDurasiDetik: number;
  totalAnomali: number;
  akurasiGpsPersen: number;
  peringkat: number;
  gradeKinerja: 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'PERLU_BIMBINGAN';
}

export interface LaporanEvaluasiResult {
  periode: string;
  kpi: {
    totalPetugasAktif: number;
    rataRataPencapaian: number;
    totalSLSelesai: number;
    totalKubikasiTercatat: number;
  };
  items: EvaluasiPetugasItem[];
}

export class LaporanEvaluasiService {
  async getEvaluasiPetugas(thbl: string = '202601'): Promise<LaporanEvaluasiResult> {
    // 1. Ambil seluruh petugas
    const listPetugas = await db
      .select()
      .from(petugasCater)
      .where(eq(petugasCater.aktif, true))
      .orderBy(petugasCater.nama);

    // 2. Ambil pemetaan rute ke petugas
    const routes = await db.select().from(ruteCater);

    // 3. Ambil total target pelanggan per rute
    const targetPerRute = await db
      .select({
        ruteKode: pelanggan.ruteKode,
        total: sql<number>`count(*)::int`,
      })
      .from(pelanggan)
      .groupBy(pelanggan.ruteKode);

    const targetMap = new Map(targetPerRute.map((r) => [r.ruteKode, r.total]));

    // 4. Agregasi hasil bacaan di periode target per petugas
    const readingsPerPetugas = await db
      .select({
        petugasId: caterBacaMeter.petugasId,
        totalTerbaca: sql<number>`count(*)::int`,
        totalM3: sql<number>`coalesce(sum(${caterBacaMeter.pakaiM3}::numeric), 0)::int`,
        avgDurasi: sql<number>`coalesce(avg(${caterBacaMeter.durasiDetik}), 45)::int`,
        totalAnomali: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} in ('NEED_RESURVEY', 'ANOMALI') then 1 end)::int`,
        totalGpsValid: sql<number>`count(case when ${caterBacaMeter.jarakPelangganMeter} is not null and ${caterBacaMeter.jarakPelangganMeter} <= 50 then 1 end)::int`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl))
      .groupBy(caterBacaMeter.petugasId);

    const readingMap = new Map(readingsPerPetugas.map((r) => [r.petugasId, r]));

    let grandTotalSL = 0;
    let grandTotalM3 = 0;

    const rawEvaluasi: Omit<EvaluasiPetugasItem, 'peringkat'>[] = listPetugas.map((p) => {
      const assignedRoutes = routes.filter((r) => r.pencatatDefault === p.id);
      const targetSL = assignedRoutes.reduce(
        (acc, r) => acc + (targetMap.get(r.kode) ?? 0),
        0
      );

      const reading = readingMap.get(p.id);
      const realisasiSL = reading?.totalTerbaca ?? 0;
      const totalM3 = reading?.totalM3 ?? 0;
      const sisaSL = Math.max(0, targetSL - realisasiSL);
      const persenSelesai = targetSL > 0 ? Math.round((realisasiSL / targetSL) * 100) : 100;
      const rataDurasiDetik = reading?.avgDurasi ?? 42;
      const totalAnomali = reading?.totalAnomali ?? 0;

      const akurasiGpsPersen =
        realisasiSL > 0
          ? Math.min(100, Math.round(((reading?.totalGpsValid ?? 0) / realisasiSL) * 100))
          : 95;

      grandTotalSL += realisasiSL;
      grandTotalM3 += totalM3;

      let gradeKinerja: EvaluasiPetugasItem['gradeKinerja'] = 'CUKUP';
      if (persenSelesai >= 90) gradeKinerja = 'SANGAT_BAIK';
      else if (persenSelesai >= 70) gradeKinerja = 'BAIK';
      else if (persenSelesai < 50) gradeKinerja = 'PERLU_BIMBINGAN';

      return {
        petugasId: p.id,
        nama: p.nama,
        noHp: p.noHp,
        targetSL,
        realisasiSL,
        sisaSL,
        persenSelesai,
        totalM3,
        rataDurasiDetik,
        totalAnomali,
        akurasiGpsPersen,
        gradeKinerja,
      };
    });

    // Urutkan berdasarkan persenSelesai desc
    rawEvaluasi.sort((a, b) => b.persenSelesai - a.persenSelesai);

    const items: EvaluasiPetugasItem[] = rawEvaluasi.map((item, idx) => ({
      ...item,
      peringkat: idx + 1,
    }));

    const avgPencapaian =
      items.length > 0
        ? Math.round(items.reduce((acc, i) => acc + i.persenSelesai, 0) / items.length)
        : 0;

    return {
      periode: thbl,
      kpi: {
        totalPetugasAktif: listPetugas.length,
        rataRataPencapaian: avgPencapaian,
        totalSLSelesai: grandTotalSL,
        totalKubikasiTercatat: grandTotalM3,
      },
      items,
    };
  }
}

export const laporanEvaluasiService = new LaporanEvaluasiService();
