/**
 * Service: Lapor Mandiri Pelanggan & Approval Override DK
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 */

import { eq } from 'drizzle-orm';
import {
  db,
  caterMandiriPelanggan,
  caterBacaMeter,
  caterVerifikasiLog,
  pelanggan,
} from '@cater/db';
import {
  periksaJendelaLaporMandiri,
  evaluasiGeofenceMandiri,
} from '../../domain/mandiri/mandiri.engine';

export interface SubmitLaporanMandiriInput {
  thbl: string;
  nolg: string;
  stma: number;
  fotoMeterUrl: string;
  fotoRumahUrl?: string;
  longitude?: number;
  latitude?: number;
  channel?: 'WEB_PORTAL' | 'MOBILE_APP';
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifikasiMandiriInput {
  mandiriId: string;
  action: 'APPROVE' | 'REJECT';
  alasanPenolakan?: string;
  userId: string;
}

export class MandiriService {
  /**
   * Pelanggan mengirimkan hasil baca meter mandiri (Web / Mobile)
   * Mengunci aturan tanggal 1-25 WIB dan evaluasi radius geofence
   */
  async submitLaporanMandiri(input: SubmitLaporanMandiriInput) {
    const {
      thbl,
      nolg,
      stma,
      fotoMeterUrl,
      fotoRumahUrl,
      longitude,
      latitude,
      channel = 'WEB_PORTAL',
      ipAddress,
      userAgent,
    } = input;

    // 1. Validasi Jendela Waktu Pelaporan Mandiri (1-25 WIB)
    const jendela = periksaJendelaLaporMandiri(new Date());
    if (!jendela.boleh) {
      throw new Error(jendela.pesan);
    }

    // 2. Validasi Keberadaan Pelanggan
    const [cust] = await db
      .select({ nolg: pelanggan.nolg, titikLokasi: pelanggan.titikLokasi })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Nomor Langganan ${nolg} tidak ditemukan dalam database.`);
    }

    // 3. Evaluasi Jarak Spasial Geofence
    let jarakMeter = 0;
    let isLokasiValid = true;

    if (longitude !== undefined && latitude !== undefined && cust.titikLokasi) {
      // Perhitungan jarak Haversine aproksimasi cepat
      const custGeo = cust.titikLokasi as { x: number; y: number };
      const dLat = ((latitude - custGeo.y) * Math.PI) / 180;
      const dLon = ((longitude - custGeo.x) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((custGeo.y * Math.PI) / 180) *
          Math.cos((latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      jarakMeter = Number((6371000 * c).toFixed(2)); // Radius bumi ~6.371 km

      const evalGeo = evaluasiGeofenceMandiri(jarakMeter);
      isLokasiValid = evalGeo.isLokasiValid;
    }

    const id = `mandiri-${thbl}-${nolg}`;

    await db
      .insert(caterMandiriPelanggan)
      .values({
        id,
        thbl,
        nolg,
        stma: String(stma),
        fotoMeterUrl,
        fotoRumahUrl,
        lokasiGps: longitude && latitude ? { x: longitude, y: latitude } : null,
        jarakDariRumahMeter: String(jarakMeter),
        isLokasiValid,
        channel,
        ipAddress,
        userAgent,
        statusVerifikasi: 'PENDING',
      })
      .onConflictDoUpdate({
        target: caterMandiriPelanggan.id,
        set: {
          stma: String(stma),
          fotoMeterUrl,
          fotoRumahUrl,
          lokasiGps: longitude && latitude ? { x: longitude, y: latitude } : null,
          jarakDariRumahMeter: String(jarakMeter),
          isLokasiValid,
          channel,
          statusVerifikasi: 'PENDING',
          updatedAt: new Date(),
        },
      });

    return {
      id,
      thbl,
      nolg,
      stma,
      jarakDariRumahMeter: jarakMeter,
      isLokasiValid,
      statusVerifikasi: 'PENDING',
      pesan: 'Laporan meter mandiri berhasil diterima dan menunggu verifikasi petugas.',
    };
  }

  /**
   * Verifikasi Laporan Mandiri oleh Petugas / Supervisor
   * APPROVE: Memperbarui cater_baca_meter dan meng-override kode DK (2) menjadi STAND-KONSUMEN (Z)
   * REJECT: Menyimpan alasan penolakan
   */
  async verifikasiLaporanMandiri(input: VerifikasiMandiriInput) {
    const { mandiriId, action, alasanPenolakan, userId } = input;

    const [mandiri] = await db
      .select()
      .from(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.id, mandiriId));

    if (!mandiri) {
      throw new Error(`Data laporan mandiri ${mandiriId} tidak ditemukan.`);
    }

    if (action === 'REJECT') {
      if (!alasanPenolakan) {
        throw new Error('Alasan penolakan wajib disertakan saat menolak laporan mandiri.');
      }
      await db
        .update(caterMandiriPelanggan)
        .set({
          statusVerifikasi: 'REJECTED',
          alasanPenolakan,
          verifiedBy: userId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(caterMandiriPelanggan.id, mandiriId));

      return {
        mandiriId,
        statusVerifikasi: 'REJECTED',
        alasanPenolakan,
        message: 'Laporan mandiri telah ditolak.',
      };
    }

    // Aksi: APPROVE -> Integrasikan ke cater_baca_meter
    const caterId = `cater-${mandiri.thbl}-${mandiri.nolg}`;

    await db.transaction(async (tx) => {
      // 1. Update status laporan mandiri
      await tx
        .update(caterMandiriPelanggan)
        .set({
          statusVerifikasi: 'APPROVED',
          verifiedBy: userId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(caterMandiriPelanggan.id, mandiriId));

      // 2. Ambil data pembacaan eksisting bila ada
      const [existingCater] = await tx
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));

      const stml = Number(existingCater?.stml ?? 0);
      const stmaMandiri = Number(mandiri.stma);
      const pakaiM3 = Math.max(0, stmaMandiri - stml);

      // 3. Simpan / Perbarui transaksi utama baca meter (Override DK -> Stand Konsumen)
      await tx
        .insert(caterBacaMeter)
        .values({
          id: caterId,
          thbl: mandiri.thbl,
          nolg: mandiri.nolg,
          stml: String(stml),
          stma: String(stmaMandiri),
          pakaiM3: String(pakaiM3),
          pakaiTagih: String(pakaiM3),
          tmss: 'Z',                        // STAND-KONSUMEN
          ketCatat: 'STAND-KONSUMEN',
          metodeCatat: 'OFFSITE',
          sumberCatat: mandiri.channel === 'MOBILE_APP' ? 'MANDIRI_APP' : 'MANDIRI_WEB',
          caterMandiriId: mandiri.id,
          fotoMeterUrl: mandiri.fotoMeterUrl,
          fotoRumahUrl: mandiri.fotoRumahUrl,
          statusVerifikasi: 'VERIFIED_L1',
          catatan: '[Override Mandiri] Disahkan dari hasil foto kiriman pelanggan',
        })
        .onConflictDoUpdate({
          target: caterBacaMeter.id,
          set: {
            stma: String(stmaMandiri),
            pakaiM3: String(pakaiM3),
            pakaiTagih: String(pakaiM3),
            tmss: 'Z',
            ketCatat: 'STAND-KONSUMEN',
            sumberCatat: mandiri.channel === 'MOBILE_APP' ? 'MANDIRI_APP' : 'MANDIRI_WEB',
            caterMandiriId: mandiri.id,
            fotoMeterUrl: mandiri.fotoMeterUrl,
            statusVerifikasi: 'VERIFIED_L1',
            catatan: '[Override Mandiri] Disahkan dari hasil foto kiriman pelanggan',
            updatedAt: new Date(),
          },
        });

      // 4. Catat ke audit trail verifikasi
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: 'V1',
        action: 'APPROVE',
        stmaSebelum: existingCater?.stma ?? null,
        stmaSesudah: String(stmaMandiri),
        pakaiSebelum: existingCater?.pakaiM3 ?? null,
        pakaiSesudah: String(pakaiM3),
        alasan: 'Persetujuan laporan mandiri warga (Override kondisi DK/Kelainan fisik)',
      });
    });

    return {
      mandiriId,
      caterId,
      statusVerifikasi: 'APPROVED',
      stma: mandiri.stma,
      tmss: 'Z',
      ketCatat: 'STAND-KONSUMEN',
      message: 'Laporan mandiri berhasil disetujui dan dialihkan ke transaksi baca meter.',
    };
  }
}

export const mandiriService = new MandiriService();
