/**
 * Service: Pengolahan Data Pelanggan (Pencarian, Detail, Kontak, & Mutasi Golongan)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM & Query)
 */

import { eq, or, ilike, desc } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
  golonganTarif,
  waterMeter,
} from '@cater/db';

export class PelangganService {
  /**
   * Pencarian Cepat Pelanggan (NOLG, NPRS, Nama, atau Alamat)
   */
  async searchPelanggan(keyword: string, limit: number = 30) {
    const q = `%${keyword.trim()}%`;
    return db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noMeter: pelanggan.noMeter,
        noTelp: pelanggan.noTelp,
      })
      .from(pelanggan)
      .where(
        or(
          ilike(pelanggan.nolg, q),
          ilike(pelanggan.nprs, q),
          ilike(pelanggan.nama, q),
          ilike(pelanggan.alamat, q)
        )
      )
      .limit(limit);
  }

  /**
   * Mengambil Detail Profil Pelanggan Beserta Histori Pembacaan & Rekening DRD
   */
  async getDetailPelanggan(nolg: string) {
    const [cust] = await db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        rt: pelanggan.rt,
        rw: pelanggan.rw,
        noTelp: pelanggan.noTelp,
        isMbr: pelanggan.isMbr,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        tarifNama: golonganTarif.nama,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        noMeter: pelanggan.noMeter,
        titikLokasi: pelanggan.titikLokasi,
      })
      .from(pelanggan)
      .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan dengan nomor ${nolg} tidak ditemukan.`);
    }

    // Riwayat pembacaan 12 bulan terakhir
    const riwayatBaca = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        ketCatat: caterBacaMeter.ketCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.nolg, nolg))
      .orderBy(desc(caterBacaMeter.thbl))
      .limit(12);

    // Riwayat rekening DRD
    const riwayatDrd = await db
      .select({
        id: rekeningDrd.id,
        thbl: rekeningDrd.thbl,
        pakaiM3: rekeningDrd.pakaiM3,
        jmlHargaAir: rekeningDrd.jmlHargaAir,
        totalTagihan: rekeningDrd.totalTagihan,
        statusLunas: rekeningDrd.statusLunas,
      })
      .from(rekeningDrd)
      .where(eq(rekeningDrd.nolg, nolg))
      .orderBy(desc(rekeningDrd.thbl))
      .limit(12);

    return {
      pelanggan: cust,
      riwayatBaca,
      riwayatDrd,
    };
  }

  /**
   * Update Nomor Telepon / WhatsApp Pelanggan (Menu 3.4 No HP Pel)
   */
  async updateKontak(nolg: string, noTelp: string) {
    const [cust] = await db
      .select({ nolg: pelanggan.nolg })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    await db
      .update(pelanggan)
      .set({ noTelp, updatedAt: new Date() })
      .where(eq(pelanggan.nolg, nolg));

    return {
      nolg,
      noTelp,
      message: 'Nomor telepon/WhatsApp pelanggan berhasil diperbarui.',
    };
  }

  /**
   * Modifikasi Kategori Tarif Pelanggan (Menu 3.5 Pindah Jenis Pel)
   */
  async updateGolonganTarif(nolg: string, tarifKodeBaru: string) {
    const [cust] = await db
      .select({ nolg: pelanggan.nolg, tarifKodeLama: pelanggan.tarifKode })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    await db
      .update(pelanggan)
      .set({ tarifKode: tarifKodeBaru, updatedAt: new Date() })
      .where(eq(pelanggan.nolg, nolg));

    return {
      nolg,
      tarifKodeLama: cust.tarifKodeLama,
      tarifKodeBaru,
      message: `Golongan tarif berhasil diubah ke ${tarifKodeBaru}.`,
    };
  }
}

export const pelangganService = new PelangganService();
