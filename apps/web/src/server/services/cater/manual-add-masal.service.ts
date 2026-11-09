/**
 * Service: Manual ADD Masal & Sistem Taksasi Dinamis Petugas Berhalangan
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM & Domain Engine Taksasi)
 */

import { eq, and, sql, desc, inArray, isNotNull, or, ilike } from 'drizzle-orm';
import {
  db,
  caterBacaMeter,
  pelanggan,
  ruteCater,
  petugasCater,
  kelurahan,
} from '@cater/db';
import { PEMAKAIAN_MINIMUM_PERDIR } from '../../domain/taksasi/taksasi.engine';

export interface PetugasOption {
  id: string;
  nama: string;
}

export interface RuteOption {
  kode: string;
  seksiNama: string | null;
  pencatatDefault: string | null;
}

export interface ItemPreviewTaksasi {
  nolg: string;
  nama: string;
  alamat: string;
  tarifKode: string | null;
  ruteKode: string | null;
  kelurahanNama: string | null;
  petugasId: string | null;
  stml: number;
  stmaTaksasi: number;
  pakaiM3Taksasi: number;
  pakaiLalu: number;
  metodeTaksasi: string;
  sudahTerbaca: boolean;
}

export interface PreviewTaksasiResult {
  periode: string;
  kpi: {
    totalPelanggan: number;
    totalBelumTerbaca: number;
    totalSudahTerbaca: number;
    totalEstimasiM3: number;
  };
  petugasTerpilih: string | null;
  ruteTerpilih: string | null;
  items: ItemPreviewTaksasi[];
}

export interface EksekusiTaksasiInput {
  periode: string;
  alasanKategori: string;
  catatanBeritaAcara: string;
  items: Array<{
    nolg: string;
    ruteKode?: string | null;
    stml: number;
    stma: number;
    pakaiM3: number;
  }>;
}

export class ManualAddMasalService {
  /**
   * Mengambil daftar pilihan Petugas dan Rute untuk dropdown filter dinamis
   */
  async getFilterOptions(): Promise<{ petugas: PetugasOption[]; rute: RuteOption[] }> {
    const [petugasRows, ruteRows] = await Promise.all([
      db
        .select({
          id: petugasCater.id,
          nama: petugasCater.nama,
        })
        .from(petugasCater)
        .where(eq(petugasCater.aktif, true))
        .orderBy(petugasCater.nama),
      db
        .select({
          kode: ruteCater.kode,
          seksiNama: ruteCater.seksiNama,
          pencatatDefault: ruteCater.pencatatDefault,
        })
        .from(ruteCater)
        .orderBy(ruteCater.kode),
    ]);

    return {
      petugas: petugasRows,
      rute: ruteRows,
    };
  }

  /**
   * Preview kalkulasi taksasi masal per Petugas atau per Rute
   */
  async getPreviewTaksasi(params: {
    thbl: string;
    petugasId?: string;
    ruteKode?: string;
    hanyaBelumBaca?: boolean;
    limit?: number;
  }): Promise<PreviewTaksasiResult> {
    const {
      thbl = '202601',
      petugasId,
      ruteKode,
      hanyaBelumBaca = true,
      limit = 200,
    } = params;

    // 1. Tentukan rute-rute yang menjadi target
    let targetRuteList: string[] = [];

    if (ruteKode && ruteKode !== 'all') {
      targetRuteList = [ruteKode];
    } else if (petugasId && petugasId !== 'all') {
      // Ambil seluruh rute yang ditugaskan ke petugas ini
      const rutes = await db
        .select({ kode: ruteCater.kode })
        .from(ruteCater)
        .where(eq(ruteCater.pencatatDefault, petugasId));

      targetRuteList = rutes.map((r) => r.kode);
    }

    // 2. Ambil seluruh pelanggan di rute target
    const conditions = [];
    if (targetRuteList.length > 0) {
      conditions.push(inArray(pelanggan.ruteKode, targetRuteList));
    }

    const pelangganList = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        kelurahanNama: kelurahan.nama,
        noMeter: pelanggan.noMeter,
      })
      .from(pelanggan)
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);

    if (pelangganList.length === 0) {
      return {
        periode: thbl,
        kpi: {
          totalPelanggan: 0,
          totalBelumTerbaca: 0,
          totalSudahTerbaca: 0,
          totalEstimasiM3: 0,
        },
        petugasTerpilih: petugasId ?? null,
        ruteTerpilih: ruteKode ?? null,
        items: [],
      };
    }

    const nolgList = pelangganList.map((p) => p.nolg);

    // 3. Cek pembacaan yang sudah ada pada periode target (thbl)
    const existingReadings = await db
      .select({
        nolg: caterBacaMeter.nolg,
        id: caterBacaMeter.id,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiLalu: caterBacaMeter.pakaiLalu,
      })
      .from(caterBacaMeter)
      .where(and(eq(caterBacaMeter.thbl, thbl), inArray(caterBacaMeter.nolg, nolgList)));

    const existingMap = new Map(existingReadings.map((r) => [r.nolg, r]));

    // 4. Ambil stand meter dan pemakaian historis terakhir pelanggan (periode < thbl)
    const historyReadings = await db
      .select({
        nolg: caterBacaMeter.nolg,
        stmaTerakhir: caterBacaMeter.stma,
        pakaiM3Terakhir: caterBacaMeter.pakaiM3,
        thbl: caterBacaMeter.thbl,
      })
      .from(caterBacaMeter)
      .where(
        and(
          sql`${caterBacaMeter.thbl} < ${thbl}`,
          inArray(caterBacaMeter.nolg, nolgList)
        )
      )
      .orderBy(desc(caterBacaMeter.thbl));

    // Petakan history terakhir per NOLG
    const historyMap = new Map<string, { stma: number; pakai: number }>();
    for (const h of historyReadings) {
      if (!historyMap.has(h.nolg)) {
        historyMap.set(h.nolg, {
          stma: Number(h.stmaTerakhir ?? 0),
          pakai: Number(h.pakaiM3Terakhir ?? 0),
        });
      }
    }

    // 5. Bangun kalkulasi taksasi untuk tiap pelanggan
    let countBelumBaca = 0;
    let countSudahBaca = 0;
    let totalEstimasiM3 = 0;

    const allItems: ItemPreviewTaksasi[] = pelangganList.map((pel) => {
      const existing = existingMap.get(pel.nolg);
      const sudahTerbaca = existing !== undefined;

      if (sudahTerbaca) {
        countSudahBaca++;
      } else {
        countBelumBaca++;
      }

      const hist = historyMap.get(pel.nolg);

      // Stand Lalu: dari pembacaan bulan lalu atau default 0
      const stml = Number(existing?.stml ?? hist?.stma ?? 0);

      // Estimasi Taksasi Pemakaian m3 sesuai Perdir:
      // Gunakan pemakaian historis terakhir jika > 0, atau standar minimum 5 m3
      let pakaiM3Taksasi = hist?.pakai && hist.pakai > 0 ? Math.ceil(hist.pakai) : PEMAKAIAN_MINIMUM_PERDIR;
      let metodeTaksasi = hist?.pakai && hist.pakai > 0 ? 'Rata-rata Konsumsi Lalu' : 'Standar Minimum Perdir (5 m³)';

      if (existing) {
        pakaiM3Taksasi = Number(existing.pakaiM3 ?? pakaiM3Taksasi);
        metodeTaksasi = 'Data Pembacaan Tercatat';
      }

      // Stand Akhir Taksasi = Stand Lalu + Estimasi m3
      const stmaTaksasi = stml + pakaiM3Taksasi;
      const pakaiLalu = Number(existing?.pakaiLalu ?? hist?.pakai ?? 0);

      if (!sudahTerbaca || !hanyaBelumBaca) {
        totalEstimasiM3 += pakaiM3Taksasi;
      }

      return {
        nolg: pel.nolg,
        nama: pel.nama,
        alamat: pel.alamat,
        tarifKode: pel.tarifKode,
        ruteKode: pel.ruteKode,
        kelurahanNama: pel.kelurahanNama ?? null,
        petugasId: petugasId ?? null,
        stml,
        stmaTaksasi,
        pakaiM3Taksasi,
        pakaiLalu,
        metodeTaksasi,
        sudahTerbaca,
      };
    });

    const filteredItems = hanyaBelumBaca
      ? allItems.filter((item) => !item.sudahTerbaca)
      : allItems;

    return {
      periode: thbl,
      kpi: {
        totalPelanggan: pelangganList.length,
        totalBelumTerbaca: countBelumBaca,
        totalSudahTerbaca: countSudahBaca,
        totalEstimasiM3,
      },
      petugasTerpilih: petugasId ?? null,
      ruteTerpilih: ruteKode ?? null,
      items: filteredItems,
    };
  }

  /**
   * Eksekusi penyimpanan masal Manual ADD (Taksasi Perdir)
   */
  async eksekusiTaksasiMasal(
    input: EksekusiTaksasiInput
  ): Promise<{ success: boolean; totalDiproses: number; periode: string }> {
    const { periode, alasanKategori, catatanBeritaAcara, items } = input;

    if (!items || items.length === 0) {
      return { success: true, totalDiproses: 0, periode };
    }

    const fullCatatan = `[Manual ADD Masal: ${alasanKategori}] ${catatanBeritaAcara.trim()}`.trim();
    const now = new Date();

    // Batch upsert per pelanggan
    for (const item of items) {
      const caterId = `cater-${periode}-${item.nolg}`;

      await db
        .insert(caterBacaMeter)
        .values({
          id: caterId,
          thbl: periode,
          nolg: item.nolg,
          ruteKode: item.ruteKode ?? undefined,
          stml: String(item.stml),
          stma: String(item.stma),
          pakaiM3: String(item.pakaiM3),
          ketCatat: 'Taksasi Perdir',
          metodeCatat: 'OFFSITE',
          sumberCatat: 'MANUAL',
          statusVerifikasi: 'VERIFIED',
          catatan: fullCatatan,
          tglCatat: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: caterBacaMeter.id,
          set: {
            stml: String(item.stml),
            stma: String(item.stma),
            pakaiM3: String(item.pakaiM3),
            ketCatat: 'Taksasi Perdir',
            metodeCatat: 'OFFSITE',
            sumberCatat: 'MANUAL',
            statusVerifikasi: 'VERIFIED',
            catatan: fullCatatan,
            updatedAt: now,
          },
        });
    }

    return {
      success: true,
      totalDiproses: items.length,
      periode,
    };
  }
}

export const manualAddMasalService = new ManualAddMasalService();
