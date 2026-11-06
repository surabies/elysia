/**
 * Service: Manajemen Rute Cater (Pindah Rute, Penggabungan, & Pengurutan Sekuensial)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM)
 */

import { eq, inArray } from 'drizzle-orm';
import { db, pelanggan, ruteCater } from '@cater/db';

export interface PindahRuteInput {
  nolgList: string[];
  ruteTujuan: string;
}

export interface UrutkanRuteInput {
  ruteKode: string;
  urutanList: { nolg: string; noUrutRute: number }[];
}

export interface GabungRuteInput {
  ruteSumber: string;
  ruteTujuan: string;
}

export class CaterRuteService {
  /**
   * Memindahkan satu atau beberapa pelanggan ke rute baru (Menu 2.8 Pindah Rute)
   */
  async pindahRute(input: PindahRuteInput) {
    const { nolgList, ruteTujuan } = input;

    const [tujuan] = await db
      .select({ kode: ruteCater.kode })
      .from(ruteCater)
      .where(eq(ruteCater.kode, ruteTujuan));

    if (!tujuan) {
      throw new Error(`Rute tujuan ${ruteTujuan} tidak ditemukan.`);
    }

    if (nolgList.length === 0) {
      throw new Error('Daftar nomor langganan yang akan dipindahkan tidak boleh kosong.');
    }

    await db
      .update(pelanggan)
      .set({ ruteKode: ruteTujuan, updatedAt: new Date() })
      .where(inArray(pelanggan.nolg, nolgList));

    return {
      totalDipindahkan: nolgList.length,
      ruteTujuan,
      message: `${nolgList.length} pelanggan berhasil dipindahkan ke rute ${ruteTujuan}.`,
    };
  }

  /**
   * Mengatur nomor urut sekuensial pembacaan pelanggan di suatu rute (Menu 2.6 Pengurutan Rute)
   */
  async urutkanRute(input: UrutkanRuteInput) {
    const { ruteKode, urutanList } = input;

    await db.transaction(async (tx) => {
      for (const item of urutanList) {
        await tx
          .update(pelanggan)
          .set({ noUrutRute: item.noUrutRute, updatedAt: new Date() })
          .where(eq(pelanggan.nolg, item.nolg));
      }
    });

    return {
      ruteKode,
      totalDiurutkan: urutanList.length,
      message: `Urutan rute ${ruteKode} berhasil disimpan.`,
    };
  }

  /**
   * Menggabungkan seluruh pelanggan dari rute sumber ke rute tujuan (Menu 2.7 Penggabungan Rute)
   */
  async gabungRute(input: GabungRuteInput) {
    const { ruteSumber, ruteTujuan } = input;

    const [tujuan] = await db
      .select({ kode: ruteCater.kode })
      .from(ruteCater)
      .where(eq(ruteCater.kode, ruteTujuan));

    if (!tujuan) {
      throw new Error(`Rute tujuan ${ruteTujuan} tidak ditemukan.`);
    }

    const hasil = await db
      .update(pelanggan)
      .set({ ruteKode: ruteTujuan, updatedAt: new Date() })
      .where(eq(pelanggan.ruteKode, ruteSumber));

    return {
      ruteSumber,
      ruteTujuan,
      message: `Seluruh pelanggan dari rute ${ruteSumber} berhasil digabungkan ke rute ${ruteTujuan}.`,
    };
  }
}

export const caterRuteService = new CaterRuteService();
