/**
 * Service: Laporan Monitoring Kubikasi Koreksi & Audit Trail Stand Meter
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM)
 */

import { eq, and, sql, isNotNull, or, desc } from 'drizzle-orm';
import { db, caterBacaMeter, pelanggan, petugasCater } from '@cater/db';

export interface KoreksiItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  petugasId: string | null;
  namaPetugas: string;
  thbl: string;
  stml: number;
  stmaAwal: number;
  pakaiM3Awal: number;
  stmaRevisi: number;
  pakaiM3Revisi: number;
  selisihM3: number;
  alasanKoreksi: string | null;
  catatanAudit: string | null;
  statusVerifikasi: string;
  tglCatat: string | null;
  updatedAt: string;
}

export interface LaporanKoreksiResult {
  periode: string;
  summary: {
    totalKoreksi: number;
    totalM3Tambah: number;
    totalM3Kurang: number;
    nettoM3: number;
  };
  items: KoreksiItem[];
}

export class LaporanKoreksiService {
  async getLaporanKoreksi(thbl: string = '202601'): Promise<LaporanKoreksiResult> {
    const rows = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
        namaPetugas: petugasCater.nama,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        stmaRevisi: caterBacaMeter.stmaRevisi,
        pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
        ketCatatRevisi: caterBacaMeter.ketCatatRevisi,
        catatan: caterBacaMeter.catatan,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
        updatedAt: caterBacaMeter.updatedAt,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .where(
        and(
          eq(caterBacaMeter.thbl, thbl),
          or(
            isNotNull(caterBacaMeter.stmaRevisi),
            isNotNull(caterBacaMeter.pakaiM3Revisi),
            isNotNull(caterBacaMeter.ketCatatRevisi)
          )
        )
      )
      .orderBy(desc(caterBacaMeter.updatedAt));

    let totalM3Tambah = 0;
    let totalM3Kurang = 0;

    const items: KoreksiItem[] = rows.map((r) => {
      const stml = Number(r.stml ?? 0);
      const stmaAwal = Number(r.stma ?? 0);
      const pakaiM3Awal = Number(r.pakaiM3 ?? 0);
      const stmaRevisi = Number(r.stmaRevisi ?? stmaAwal);
      const pakaiM3Revisi = Number(r.pakaiM3Revisi ?? pakaiM3Awal);
      const selisihM3 = pakaiM3Revisi - pakaiM3Awal;

      if (selisihM3 > 0) totalM3Tambah += selisihM3;
      if (selisihM3 < 0) totalM3Kurang += Math.abs(selisihM3);

      return {
        id: r.id,
        nolg: r.nolg,
        nama: r.nama,
        alamat: r.alamat,
        tarifKode: r.tarifKode,
        ruteKode: r.ruteKode,
        petugasId: r.petugasId,
        namaPetugas: r.namaPetugas ?? r.petugasId ?? '—',
        thbl: r.thbl,
        stml,
        stmaAwal,
        pakaiM3Awal,
        stmaRevisi,
        pakaiM3Revisi,
        selisihM3,
        alasanKoreksi: r.ketCatatRevisi,
        catatanAudit: r.catatan,
        statusVerifikasi: r.statusVerifikasi,
        tglCatat: r.tglCatat ? new Date(r.tglCatat).toISOString() : null,
        updatedAt: new Date(r.updatedAt).toISOString(),
      };
    });

    return {
      periode: thbl,
      summary: {
        totalKoreksi: items.length,
        totalM3Tambah,
        totalM3Kurang,
        nettoM3: totalM3Tambah - totalM3Kurang,
      },
      items,
    };
  }
}

export const laporanKoreksiService = new LaporanKoreksiService();
