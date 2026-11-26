/**
 * Service: Buka Bulan Baru (Inisialisasi Periode N+1 & Penerbitan DPM Baru Terpadu)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 *
 * Menyatukan tiga operasi persiapan bulan baru dalam SATU eksekusi otomatis:
 * 1. Normalisasi urutan rute pelanggan yang belum berurutan (Sequencing).
 * 2. Carry-forward stand akhir periode N menjadi stand awal DPM periode N+1
 *    sekaligus menyertakan seluruh pelanggan aktif (termasuk Pasang Baru / PBPK)
 *    dan melewati pelanggan berstatus DICABUT.
 */

import { eq, sql } from 'drizzle-orm';
import { carryForwardPeriode, db, user } from '@cater/db';

const bulanBaruInFlightLocks = new Set<string>();

export interface BukaBulanBaruInput {
  periodeLalu: string;
  periodeBaru: string;
  userId?: string | null;
}

export interface HasilBukaBulanBaru {
  periodeBaru: string;
  totalDpmDiterbitkan: number;
  dilewatiDicabut: number;
  message: string;
}

export class BulanBaruService {
  /**
   * Menginisialisasi siklus penagihan bulan baru (N+1) secara menyeluruh dalam satu langkah.
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
      let validUserId: string | null = null;
      if (userId) {
        const [existingUser] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);
        validUserId = existingUser?.id ?? null;
      }

      // 1. Pastikan nomor urut kunjungan rute pelanggan yang masih kosong/0 sudah rapi sebelum carry-forward
      await db.execute(sql`
        WITH ranked AS (
          SELECT nolg, ROW_NUMBER() OVER (PARTITION BY coalesce(rute_kode, 'DEFAULT') ORDER BY nolg ASC)::int AS seq_num
          FROM pelanggan
        )
        UPDATE pelanggan AS p
        SET no_urut_rute = ranked.seq_num,
            updated_at = NOW()
        FROM ranked
        WHERE p.nolg = ranked.nolg
          AND (p.no_urut_rute IS NULL OR p.no_urut_rute <= 0)
      `);

      // 2. Jalankan carryForwardPeriode tunggal (otomatis membawa semua pelanggan aktif termasuk PB baru & melewati DICABUT)
      const hasil = await carryForwardPeriode({
        periodeLalu,
        periodeBaru,
        userId: validUserId,
      });

      return {
        periodeBaru: hasil.periodeBaru,
        totalDpmDiterbitkan: hasil.totalDpmDiterbitkan,
        dilewatiDicabut: hasil.dilewatiDicabut,
        message: `Jadwal bulan baru ${periodeBaru} berhasil dibuka lengkap dengan urutan rute rapi untuk ${hasil.totalDpmDiterbitkan.toLocaleString('id-ID')} pelanggan aktif (${hasil.dilewatiDicabut} sambungan DICABUT dilewati).`,
      };
    } finally {
      bulanBaruInFlightLocks.delete(lockKey);
    }
  }
}

export const bulanBaruService = new BulanBaruService();
