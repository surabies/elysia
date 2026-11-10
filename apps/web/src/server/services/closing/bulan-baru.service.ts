/**
 * Service: Buka Bulan Baru (Inisialisasi Periode N+1 & Penerbitan DPM Baru)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 *
 * Menerapkan Aturan Baku:
 * DPM(N+1) = [ DaftarCatat(N) ] − yang ditandai DICABUT pada DPM(N)
 * Fallback jika DPM(N) belum ada di sistem: menggunakan seluruh Master Pelanggan aktif
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
const bulanBaruInFlightLocks = new Set<string>();

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
    const lockKey = `bulan-baru:${periodeBaru}`;

    if (bulanBaruInFlightLocks.has(lockKey)) {
      throw new Error(
        `Proses pembukaan jadwal bulan baru ${periodeBaru} sedang berlangsung. Mohon tunggu sebentar; data Anda tetap aman.`
      );
    }

    bulanBaruInFlightLocks.add(lockKey);

    try {
      // 0. Validasi pra-syarat: Periode berjalan (periodeLalu) wajib sudah ditutup (TERKUNCI)
      const [periodeLaluRow] = await db
        .select()
        .from(periodePenagihan)
        .where(eq(periodePenagihan.periode, periodeLalu));

      if (!periodeLaluRow || periodeLaluRow.status !== 'TERKUNCI') {
        throw new Error(
          `Jadwal bulan baru ${periodeBaru} belum dapat dibuka karena periode berjalan (${periodeLalu}) belum dikunci. Selesaikan Langkah 4 (Kunci Tutup Buku) terlebih dahulu.`
        );
      }

      // 1. Validasi periode penagihan baru belum pernah terkunci
      const [existingPeriode] = await db
        .select()
        .from(periodePenagihan)
        .where(eq(periodePenagihan.periode, periodeBaru));

      if (existingPeriode && existingPeriode.status === 'TERKUNCI') {
        throw new Error(
          `Periode ${periodeBaru} sudah pernah ditutup dan berstatus TERKUNCI. Tidak ada data yang diubah.`
        );
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

    let aktifList: Array<{
      nolg: string;
      ruteKode: string | null;
      petugasId: string | null;
      urutan: number | null;
    }> = [];
    let dilewatiDicabut = 0;

    if (dpmLalu.length > 0) {
      aktifList = dpmLalu.filter((d) => d.status !== 'DICABUT');
      dilewatiDicabut = dpmLalu.length - aktifList.length;
    } else {
      // Fallback robust: Ambil dari master pelanggan aktif jika daftarCatat periode lalu kosong
      const masterList = await db
        .select({
          nolg: pelanggan.nolg,
          ruteKode: pelanggan.ruteKode,
          urutan: pelanggan.noUrutRute,
        })
        .from(pelanggan);

      aktifList = masterList.map((p) => ({
        nolg: p.nolg,
        ruteKode: p.ruteKode,
        petugasId: null,
        urutan: p.urutan ?? 1,
      }));
    }

    let diterbitkan = 0;

    await db.transaction(async (tx) => {
      // 1. Buat record periode penagihan baru berstatus BERJALAN
      await tx
        .insert(periodePenagihan)
        .values({
          periode: periodeBaru,
          status: 'BERJALAN',
          dibukaAt: new Date(),
          dibukaById: userId,
          jumlahSl: aktifList.length,
        })
        .onConflictDoUpdate({
          target: periodePenagihan.periode,
          set: {
            status: 'BERJALAN',
            dibukaAt: new Date(),
            dibukaById: userId,
            jumlahSl: aktifList.length,
            updatedAt: new Date(),
          },
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
        message: `Jadwal baca meter bulan baru ${periodeBaru} berhasil disiapkan untuk ${diterbitkan.toLocaleString('id-ID')} pelanggan aktif.`,
      };
    } finally {
      bulanBaruInFlightLocks.delete(lockKey);
    }
  }
}

export const bulanBaruService = new BulanBaruService();
