/**
 * Service: Buka Bulan Baru (Inisialisasi Periode N+1 & Penerbitan DPM Baru)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 *
 * Menggunakan SATU mekanisme carry-forward tunggal (`carryForwardPeriode` dari `@cater/db`)
 * yang juga dipakai oleh proses Seed data pembuka.
 */

import { carryForwardPeriode } from '@cater/db';

const bulanBaruInFlightLocks = new Set<string>();

export interface BukaBulanBaruInput {
  periodeLalu: string;
  periodeBaru: string;
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
   * dengan carry-forward stand_awal(N+1) = stand_akhir(N).
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
      const hasil = await carryForwardPeriode({
        periodeLalu,
        periodeBaru,
        userId,
      });

      return {
        periodeBaru: hasil.periodeBaru,
        totalDpmDiterbitkan: hasil.totalDpmDiterbitkan,
        dilewatiDicabut: hasil.dilewatiDicabut,
        message: `Jadwal baca meter bulan baru ${periodeBaru} berhasil disiapkan untuk ${hasil.totalDpmDiterbitkan.toLocaleString('id-ID')} pelanggan aktif (${hasil.dilewatiDicabut} pelanggan DICABUT dilewati).`,
      };
    } finally {
      bulanBaruInFlightLocks.delete(lockKey);
    }
  }
}

export const bulanBaruService = new BulanBaruService();
