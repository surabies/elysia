/**
 * Service: Laporan Rekapitulasi Stand Awal & Stand Akhir Meter
 * Lapisan: 2. Service Layer (Drizzle ORM)
 */

import { eq, and, sql, desc, isNotNull } from 'drizzle-orm';
import { db, caterBacaMeter, pelanggan, kelurahan } from '@cater/db';

export interface StandAwalAkhirItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  kelurahanNama: string | null;
  stml: number;
  stma: number;
  pakaiM3: number;
  ketCatat: string | null;
  statusVerifikasi: string;
  tglCatat: string | null;
}

export interface LaporanStandAwalAkhirResult {
  periode: string;
  kpi: {
    totalPelangganTerbaca: number;
    totalKubikasiM3: number;
    rataRataKubikasi: number;
    standTertinggi: number;
  };
  items: StandAwalAkhirItem[];
}

export class LaporanStandAwalAkhirService {
  async getStandAwalAkhir(
    thbl: string = '202601',
    limit: number = 100
  ): Promise<LaporanStandAwalAkhirResult> {
    const rows = await db
      .select({
        id: caterBacaMeter.id,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: caterBacaMeter.ruteKode,
        kelurahanNama: kelurahan.nama,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .where(eq(caterBacaMeter.thbl, thbl))
      .orderBy(desc(caterBacaMeter.updatedAt))
      .limit(limit);

    let totalKubikasi = 0;
    let standTertinggi = 0;

    const items: StandAwalAkhirItem[] = rows.map((r) => {
      const stml = Number(r.stml ?? 0);
      const stma = Number(r.stma ?? 0);
      const pakaiM3 = Number(r.pakaiM3 ?? 0);

      totalKubikasi += pakaiM3;
      if (stma > standTertinggi) standTertinggi = stma;

      return {
        id: r.id,
        nolg: r.nolg,
        nama: r.nama,
        alamat: r.alamat,
        tarifKode: r.tarifKode,
        ruteKode: r.ruteKode,
        kelurahanNama: r.kelurahanNama ?? '-',
        stml,
        stma,
        pakaiM3,
        ketCatat: r.ketCatat,
        statusVerifikasi: r.statusVerifikasi,
        tglCatat: r.tglCatat ? new Date(r.tglCatat).toISOString() : null,
      };
    });

    const rataRata = items.length > 0 ? Math.round((totalKubikasi / items.length) * 10) / 10 : 0;

    return {
      periode: thbl,
      kpi: {
        totalPelangganTerbaca: items.length,
        totalKubikasiM3: totalKubikasi,
        rataRataKubikasi: rataRata,
        standTertinggi,
      },
      items,
    };
  }
}

export const laporanStandAwalAkhirService = new LaporanStandAwalAkhirService();
