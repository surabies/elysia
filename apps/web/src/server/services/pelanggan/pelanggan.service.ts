/**
 * Service: Pengolahan Data Pelanggan (Pencarian, Detail, Kontak, & Mutasi Golongan)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM & Query)
 */

import { eq, or, ilike, desc, isNull, sql } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
  golonganTarif,
  waterMeter,
  petugasCater,
  sambungKembaliPelanggan,
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
        fotoSegelUrl: caterBacaMeter.fotoSegelUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
        lokasiGps: caterBacaMeter.lokasiGps,
        petugasId: caterBacaMeter.petugasId,
        petugasNama: petugasCater.nama,
        ruteKode: caterBacaMeter.ruteKode,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
      })
      .from(caterBacaMeter)
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
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

  /**
   * Daftar Pelanggan Tanpa Nomor Meter Valid (no_meter IS NULL) untuk dilengkapi lewat UI
   */
  async getPelangganTanpaMeterValid(limit: number = 100, offset: number = 0) {
    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(pelanggan)
      .where(isNull(pelanggan.noMeter));

    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        ruteKode: pelanggan.ruteKode,
        noMeterAsli: pelanggan.noMeterAsli,
        ukuranMeter: pelanggan.ukuranMeter,
        merkMeter: pelanggan.merkMeter,
        tglPasangMeter: pelanggan.tglPasangMeter,
        perluVerifikasi: pelanggan.perluVerifikasi,
        catatanVerifikasi: pelanggan.catatanVerifikasi,
      })
      .from(pelanggan)
      .where(isNull(pelanggan.noMeter))
      .orderBy(pelanggan.ruteKode, pelanggan.nolg)
      .limit(limit)
      .offset(offset);

    return {
      total: countRow?.total ?? 0,
      items: rows,
    };
  }

  /**
   * Melengkapi / Memperbarui Nomor Meter Valid untuk Pelanggan (termasuk pelanggan yang awalnya no_meter = NULL)
   * Memastikan nomor meter baru tidak dipakai pelanggan lain sebelum membuat baris water_meter dan menautkannya.
   */
  async lengkapiNomorMeterValid(input: {
    nolg: string;
    noMeterBaru: string;
    merk?: string;
    ukuran?: string;
    noSegel?: string;
    tglPasang?: Date;
  }) {
    const { nolg, noMeterBaru, merk, ukuran, noSegel, tglPasang } = input;
    const cleanNoMeter = noMeterBaru.trim();
    if (!cleanNoMeter || cleanNoMeter === '-' || cleanNoMeter === '0' || cleanNoMeter === '00000000') {
      throw new Error(`Nomor meter '${noMeterBaru}' tidak valid.`);
    }

    const [cust] = await db
      .select()
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const [usedByOther] = await db
      .select({ nolg: pelanggan.nolg, nama: pelanggan.nama })
      .from(pelanggan)
      .where(eq(pelanggan.noMeter, cleanNoMeter));

    if (usedByOther && usedByOther.nolg !== nolg) {
      throw new Error(
        `Nomor meter '${cleanNoMeter}' sudah terdaftar pada pelanggan lain (${usedByOther.nolg} - ${usedByOther.nama}).`
      );
    }

    const ukuranFinal = ukuran?.trim() || cust.ukuranMeter || '1/2';
    const merkFinal = merk?.trim() || cust.merkMeter || null;
    const tglPasangFinal = tglPasang || cust.tglPasangMeter || new Date();

    await db.transaction(async (tx) => {
      await tx
        .insert(waterMeter)
        .values({
          noMeter: cleanNoMeter,
          merk: merkFinal,
          ukuran: ukuranFinal,
          noSegel: noSegel ?? null,
          tglPasang: tglPasangFinal,
          kondisi: 'Normal',
        })
        .onConflictDoUpdate({
          target: waterMeter.noMeter,
          set: {
            merk: merkFinal,
            ukuran: ukuranFinal,
            noSegel: noSegel ?? null,
            tglPasang: tglPasangFinal,
          },
        });

      await tx
        .update(pelanggan)
        .set({
          noMeter: cleanNoMeter,
          ukuranMeter: ukuranFinal,
          merkMeter: merkFinal,
          tglPasangMeter: tglPasangFinal,
          perluVerifikasi: false,
          catatanVerifikasi: `[METER TERVERIFIKASI] Nomor meter dilengkapi: ${cleanNoMeter} (sebelumnya: ${cust.noMeterAsli ?? '-'})`,
          updatedAt: new Date(),
        })
        .where(eq(pelanggan.nolg, nolg));
    });

    return {
      nolg,
      noMeter: cleanNoMeter,
      ukuranMeter: ukuranFinal,
      merkMeter: merkFinal,
      message: `Nomor meter ${cleanNoMeter} berhasil ditautkan ke pelanggan ${nolg}.`,
    };
  }

  /**
   * Jalur Resmi Sambung Kembali Pelanggan DICABUT -> PELANGGAN AKTIF & Masuk DPM Periode Open
   */
  async sambungKembali(nolg: string, periodeAktif?: string, catatan?: string) {
    return sambungKembaliPelanggan({ nolg, periodeAktif, catatan });
  }
}

export const pelangganService = new PelangganService();
