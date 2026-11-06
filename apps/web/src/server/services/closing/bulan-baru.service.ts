/**
 * Service: Buka Bulan Baru (Inisialisasi Periode N+1 & Penerbitan DPM Baru)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 *
 * Menerapkan Aturan Baku:
 * DPM(N+1) = [ DaftarCatat(N) ] − yang ditandai DICABUT pada DPM(N)
 */

import { eq, and, ne } from 'drizzle-orm';
import {
  db,
  periodePenagihan,
  daftarCatat,
  pelanggan,
  caterBacaMeter,
} from '@cater/db';

const UKURAN_BATCH = 1000;

export interface BukaBulanBaruInput {
  periodeLalu: string; // e.g. '202601'
  periodeBaru: string; // e.g. '202602'
  userId: string;
}

export interface HasilBukaBulanBaru {
  periodeBaru: string;
  totalDpmDiterbitkan: number;
  dilewatiDicabut: number;
  message: string;
}

export class BulanBaruService {
  /**
   * Menginisialisasi siklus penagihan bulan baru (N+1) dan menerbitkan DPM (Daftar Pelanggan Menjadi)
   */
  async bukaBulanBaru(input: BukaBulanBaruInput): Promise<HasilBukaBulanBaru> {
    const { periodeLalu, periodeBaru, userId } = input;

    // 1. Validasi periode penagihan baru belum pernah ada / terkunci
    const [existingPeriode] = await db
      .select()
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeBaru));

    if (existingPeriode) {
      throw new Error(`Periode ${periodeBaru} sudah ada dalam database (Status: ${existingPeriode.status}).`);
    }

    // 2. Ambil seluruh DPM dari periode lalu yang TIDAK berstatus DICABUT
    const dpmLalu = await db
      .select({
        nolg: daftarCatat.nolg,
        ruteKode: daftarCatat.ruteKode,
        petugasId: daftarCatat.petugasId,
        urutan: daftarCatat.urutan,
        status: daftarCatat.status,
      })
      .from(daftarCatat)
      .where(eq(daftarCatat.periode, periodeLalu));

    const aktifList = dpmLalu.filter((d) => d.status !== 'DICABUT');
    const dilewatiDicabut = dpmLalu.length - aktifList.length;

    let diterbitkan = 0;

    await db.transaction(async (tx) => {
      // 1. Buat record periode penagihan baru berstatus BERJALAN
      await tx.insert(periodePenagihan).values({
        periode: periodeBaru,
        status: 'BERJALAN',
        dibukaAt: new Date(),
        dibukaById: userId,
        jumlahSl: aktifList.length,
      });

      // 2. Batch insert DPM bulan baru
      for (let mulai = 0; mulai < aktifList.length; mulai += UKURAN_BATCH) {
        const batch = aktifList.slice(mulai, mulai + UKURAN_BATCH);
        const rows = batch.map((item, idx) => ({
          id: `dpm-${periodeBaru}-${item.nolg}`,
          periode: periodeBaru,
          nolg: item.nolg,
          ruteKode: item.ruteKode,
          petugasId: item.petugasId,
          urutan: item.urutan ?? mulai + idx + 1,
          sumber: 'CARRY_OVER' as const,
          status: 'BELUM_DICATAT' as const,
        }));

        await tx.insert(daftarCatat).values(rows).onConflictDoNothing();
        diterbitkan += batch.length;
      }
    });

    return {
      periodeBaru,
      totalDpmDiterbitkan: diterbitkan,
      dilewatiDicabut,
      message: `Periode baru ${periodeBaru} berhasil dibuka dengan ${diterbitkan} target DPM aktif.`,
    };
  }
}

export const bulanBaruService = new BulanBaruService();
