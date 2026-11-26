/**
 * Service: Inquiry Tagihan Publik & Integrasi 3 Pilar (Cater, Billing, Pengaduan)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM Multi-Tabel)
 */

import { eq, desc, and, inArray } from 'drizzle-orm';
import {
  db,
  pelanggan,
  golonganTarif,
  rekeningDrd,
  caterBacaMeter,
  pengaduan,
} from '@cater/db';

export class InquiryTagihanService {
  /**
   * Inquiry Lengkap Rekening Air Publik (Form Cek Tagihan Warga)
   * Menyinkronkan Profil Pelanggan + Tagihan DRD + Bukti Catat Meter + Tiket Pengaduan Terbuka
   */
  async inquiryTagihan(nolg: string) {
    // 1. Profil Pelanggan
    const [cust] = await db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        tarifNama: golonganTarif.nama,
        status: pelanggan.status,
        noMeter: pelanggan.noMeter,
      })
      .from(pelanggan)
      .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Nomor langganan ${nolg} tidak ditemukan dalam database.`);
    }

    // 2. Daftar Tagihan Belum Lunas (DRD)
    const tagihanBelumLunas = await db
      .select({
        id: rekeningDrd.id,
        thbl: rekeningDrd.thbl,
        pakaiM3: rekeningDrd.pakaiM3,
        blokM3: rekeningDrd.blokM3,
        jmlHargaAir: rekeningDrd.jmlHargaAir,
        beaBeban: rekeningDrd.beaBeban,
        beaAdmin: rekeningDrd.beaAdmin,
        airKotor: rekeningDrd.airKotor,
        totalTagihan: rekeningDrd.totalTagihan,
        statusLunas: rekeningDrd.statusLunas,
      })
      .from(rekeningDrd)
      .where(and(eq(rekeningDrd.nolg, nolg), eq(rekeningDrd.statusLunas, false)))
      .orderBy(rekeningDrd.thbl);

    // 3. Bukti Pencatatan Meter Terakhir (Pilar Cater)
    const [catatTerakhir] = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        ketCatat: caterBacaMeter.ketCatat,
        tglCatat: caterBacaMeter.tglCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.nolg, nolg))
      .orderBy(desc(caterBacaMeter.thbl))
      .limit(1);

    // 4. Tiket Pengaduan Terbuka (Pilar Pengaduan)
    const tiketTerbuka = await db
      .select({
        id: pengaduan.id,
        nomorTiket: pengaduan.nomorTiket,
        jenis: pengaduan.jenis,
        judul: pengaduan.judul,
        status: pengaduan.status,
        prioritas: pengaduan.prioritas,
        targetSelesaiAt: pengaduan.targetSelesaiAt,
        createdAt: pengaduan.createdAt,
      })
      .from(pengaduan)
      .where(
        and(
          eq(pengaduan.nomorLangganan, nolg),
          inArray(pengaduan.status, [
            'BARU',
            'TERVERIFIKASI',
            'DITUGASKAN',
            'MENUJU_LOKASI',
            'DIPROSES',
            'MENUNGGU_PELANGGAN',
            'DIBUKA_KEMBALI',
          ])
        )
      )
      .orderBy(desc(pengaduan.createdAt));

    // 5. Kalkulasi Total Kewajiban
    const totalTagihanNominal = tagihanBelumLunas.reduce(
      (sum, item) => sum + Number(item.totalTagihan ?? 0),
      0
    );

    return {
      pelanggan: cust,
      ringkasan: {
        totalLembarTagihan: tagihanBelumLunas.length,
        totalNominalTagihan: totalTagihanNominal,
        statusTagihan: tagihanBelumLunas.length === 0 ? 'LUNAS' : 'MENUNGGAK',
        adaKomplainAktif: tiketTerbuka.length > 0,
      },
      tagihan: tagihanBelumLunas,
      pencatatanTerakhir: catatTerakhir ?? null,
      tiketKomplainAktif: tiketTerbuka,
    };
  }
}

export const inquiryTagihanService = new InquiryTagihanService();
