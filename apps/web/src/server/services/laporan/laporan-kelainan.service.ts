/**
 * Service: Laporan Rekapitulasi Kelainan Fisik Water Meter
 * Lapisan: 2. Service Layer (Drizzle ORM)
 */

import { eq, and, sql, desc, isNotNull, ne } from 'drizzle-orm';
import { db, caterBacaMeter, pelanggan, kelurahan, petugasCater, masterKondisiCatat } from '@cater/db';

export interface KelainanSummaryItem {
  kategori: string;
  totalKasus: number;
  persentase: number;
}

export interface KelainanDetailItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  kelurahanNama: string | null;
  petugasNama: string | null;
  ketCatat: string;
  stml: number;
  stma: number;
  pakaiM3: number;
  fotoMeterUrl: string | null;
  catatan: string | null;
  tglCatat: string | null;
}

export interface LaporanKelainanResult {
  periode: string;
  kpi: {
    totalKelainan: number;
    totalKendalaAkses: number;
    totalKerusakanFisik: number;
    totalPelanggaran: number;
  };
  summaryPerJenis: { kondisi: string; total: number; kategori: string }[];
  items: KelainanDetailItem[];
}

export class LaporanKelainanService {
  async getLaporanKelainan(thbl: string = '202601'): Promise<LaporanKelainanResult> {
    // 1. Ambil seluruh catatan meter di mana ketCatat bukan 'Normal' dan tidak kosong
    const rows = await db
      .select({
        id: caterBacaMeter.id,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: caterBacaMeter.ruteKode,
        kelurahanKode: pelanggan.kelurahanKode,
        kelurahanNama: kelurahan.nama,
        petugasNama: petugasCater.nama,
        ketCatat: caterBacaMeter.ketCatat,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        catatan: caterBacaMeter.catatan,
        tglCatat: caterBacaMeter.tglCatat,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .where(
        and(
          eq(caterBacaMeter.thbl, thbl),
          isNotNull(caterBacaMeter.ketCatat),
          ne(caterBacaMeter.ketCatat, 'Normal'),
          ne(caterBacaMeter.ketCatat, '')
        )
      )
      .orderBy(desc(caterBacaMeter.tglCatat));

    // 2. Kamus kondisi
    const masterConditions = await db.select().from(masterKondisiCatat);
    const kategoriMap = new Map(masterConditions.map((k) => [k.nama, k.kategori]));

    let totalKendalaAkses = 0;
    let totalKerusakanFisik = 0;
    let totalPelanggaran = 0;

    const jenisCountMap = new Map<string, number>();

    const items: KelainanDetailItem[] = rows.map((r) => {
      const ket = r.ketCatat || 'Lain-lain';
      jenisCountMap.set(ket, (jenisCountMap.get(ket) ?? 0) + 1);

      const kat = kategoriMap.get(ket) ?? 'KENDALA_AKSES';
      if (kat === 'KENDALA_AKSES') totalKendalaAkses++;
      else if (kat === 'KERUSAKAN_FISIK') totalKerusakanFisik++;
      else if (kat === 'PELANGGARAN') totalPelanggaran++;
      else totalKendalaAkses++;

      return {
        id: r.id,
        nolg: r.nolg,
        nama: r.nama,
        alamat: r.alamat,
        tarifKode: r.tarifKode,
        ruteKode: r.ruteKode,
        kelurahanNama: r.kelurahanNama ?? '-',
        petugasNama: r.petugasNama ?? '-',
        ketCatat: ket,
        stml: Number(r.stml ?? 0),
        stma: Number(r.stma ?? 0),
        pakaiM3: Number(r.pakaiM3 ?? 0),
        fotoMeterUrl: r.fotoMeterUrl,
        catatan: r.catatan,
        tglCatat: r.tglCatat ? new Date(r.tglCatat).toISOString() : null,
      };
    });

    const summaryPerJenis = Array.from(jenisCountMap.entries())
      .map(([kondisi, total]) => ({
        kondisi,
        total,
        kategori: kategoriMap.get(kondisi) ?? 'KENDALA_AKSES',
      }))
      .sort((a, b) => b.total - a.total);

    return {
      periode: thbl,
      kpi: {
        totalKelainan: items.length,
        totalKendalaAkses,
        totalKerusakanFisik,
        totalPelanggaran,
      },
      summaryPerJenis,
      items,
    };
  }
}

export const laporanKelainanService = new LaporanKelainanService();
