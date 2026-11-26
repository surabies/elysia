/**
 * Service: Lapor Mandiri Pelanggan & Approval Override DK
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 *
 * PENTING (ATURAN ARSITEKTUR & BUSINESS LOGIC):
 * Tabel `cater_mandiri_pelanggan` HANYA BOLEH diisi oleh pelaporan mandiri dari warga,
 * baik melalui formulir web portal warga ('WEB_PORTAL') maupun aplikasi mobile warga ('MOBILE_APP').
 * Tabel ini TIDAK BOLEH diisi oleh seed, background job, ETL, atau hasil pencatatan petugas lapangan
 * yang memiliki keterangan kondisi catat "Stand Konsumen" (kode Z).
 */

import { eq, and, desc, lt, sql } from "drizzle-orm";
import {
  db,
  caterMandiriPelanggan,
  caterBacaMeter,
  caterVerifikasiLog,
  pelanggan,
  rekeningDrd,
  waterMeterMutasi,
  periodePenagihan,
} from "@cater/db";
import {
  periksaJendelaLaporMandiri,
  evaluasiGeofenceMandiri,
} from "@cater/backend/domain/mandiri/mandiri.engine";
import { evaluasiAnomaliBaris } from "@cater/backend/domain/cater/anomali-evaluator";
import { aturanAnomaliService } from "@/server/services/cater/aturan-anomali.service";
import { isCloudinaryConfigured, uploadToCloudinary } from "@cater/backend/lib/cloudinary";

export interface SubmitLaporanMandiriInput {
  thbl: string;
  nolg: string;
  stma: number;
  fotoMeterUrl: string;
  fotoRumahUrl?: string;
  longitude?: number;
  latitude?: number;
  channel?: "WEB_PORTAL" | "MOBILE_APP";
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifikasiMandiriInput {
  mandiriId: string;
  action: "APPROVE" | "REJECT";
  standDilaporkan?: number;
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
      channel = "WEB_PORTAL",
      ipAddress,
      userAgent,
    } = input;

    // 1. Validasi Jendela Waktu Pelaporan Mandiri (1-25 WIB)
    const jendela = periksaJendelaLaporMandiri(new Date());
    if (!jendela.boleh) {
      throw new Error(jendela.pesan);
    }

    // Tentukan periode target (ambil periode aktif dari database jika tidak dispesifikasikan)
    let targetThbl = thbl;
    if (!targetThbl) {
      const [periodeAktif] = await db
        .select({ periode: periodePenagihan.periode })
        .from(periodePenagihan)
        .where(eq(periodePenagihan.status, "BERJALAN"))
        .orderBy(desc(periodePenagihan.periode))
        .limit(1);
      targetThbl = periodeAktif?.periode ?? String(jendela.periode);
    }

    // 2. Validasi Pembatasan Cut-off Periode (Status TERKUNCI)
    const [periodeRow] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, targetThbl));

    if (periodeRow && periodeRow.status === "TERKUNCI") {
      throw new Error(
        `Pelaporan mandiri untuk periode ${targetThbl} telah ditutup (cut-off / terkunci). Laporan baru tidak dapat diterima lagi.`
      );
    }

    // 3. Validasi Anti-Duplikasi: Pelanggan tidak boleh melapor 2x dalam satu periode yang sama
    const [existing] = await db
      .select({
        id: caterMandiriPelanggan.id,
        statusVerifikasi: caterMandiriPelanggan.statusVerifikasi,
      })
      .from(caterMandiriPelanggan)
      .where(
        and(
          eq(caterMandiriPelanggan.nolg, nolg),
          eq(caterMandiriPelanggan.thbl, targetThbl)
        )
      );

    if (existing && existing.statusVerifikasi !== "REJECTED") {
      const statusLabel =
        existing.statusVerifikasi === "PENDING"
          ? "Menunggu Verifikasi Petugas"
          : existing.statusVerifikasi === "APPROVED"
            ? "Sudah Disetujui"
            : existing.statusVerifikasi;
      throw new Error(
        `Nomor langganan ${nolg} sudah melakukan pelaporan meter mandiri untuk periode ${targetThbl} (${statusLabel}). Anda tidak dapat mengirimkan laporan lebih dari 1 kali per periode.`
      );
    }

    // 4. Validasi Keberadaan Pelanggan
    const [cust] = await db
      .select({ nolg: pelanggan.nolg, titikLokasi: pelanggan.titikLokasi })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(
        `Nomor Langganan ${nolg} tidak ditemukan dalam database.`,
      );
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

    // 4. Hitung Estimasi Pemakaian (pakaiM3) berdasarkan Stand Meter Lalu (stml)
    // a. Cari di cater_baca_meter untuk periode sebelumnya
    const [caterRowLalu] = await db
      .select({ stma: caterBacaMeter.stma, stml: caterBacaMeter.stml })
      .from(caterBacaMeter)
      .where(and(eq(caterBacaMeter.nolg, nolg), lt(caterBacaMeter.thbl, thbl)))
      .orderBy(desc(caterBacaMeter.thbl))
      .limit(1);

    let stmlLalu: number | null = caterRowLalu ? Number(caterRowLalu.stma) : null;

    // b. Jika belum ada di cater_baca_meter, cari di mutasi pasang meter
    if (stmlLalu === null) {
      const [mutasiRow] = await db
        .select({ standPasang: waterMeterMutasi.standPasang })
        .from(waterMeterMutasi)
        .where(eq(waterMeterMutasi.nolg, nolg))
        .orderBy(desc(waterMeterMutasi.createdAt))
        .limit(1);
      if (mutasiRow) {
        stmlLalu = Number(mutasiRow.standPasang);
      }
    }

    // c. Jika masih null, periksa apakah ada stand dari pembacaan bulan yang sama
    if (stmlLalu === null) {
      const [caterRowSama] = await db
        .select({ stml: caterBacaMeter.stml })
        .from(caterBacaMeter)
        .where(and(eq(caterBacaMeter.nolg, nolg), eq(caterBacaMeter.thbl, thbl)))
        .limit(1);
      if (caterRowSama?.stml) {
        stmlLalu = Number(caterRowSama.stml);
      }
    }

    // Jika stmlLalu ditemukan dan wajar (stma >= stmlLalu):
    const estimasiPakaiM3 =
      stmlLalu !== null && stma >= stmlLalu
        ? stma - stmlLalu
        : stmlLalu !== null
          ? 0
          : 0;

    const id = existing ? existing.id : `mandiri-${targetThbl}-${nolg}`;

    // Standardisasi & Upload Cloudinary jika input adalah Base64 DataURL
    let processedFotoMeter = fotoMeterUrl;
    let processedFotoRumah = fotoRumahUrl;

    if (isCloudinaryConfigured()) {
      if (fotoMeterUrl && fotoMeterUrl.startsWith('data:image/')) {
        try {
          const res = await uploadToCloudinary({
            file: fotoMeterUrl,
            modul: 'mandiri',
            jenis: 'stand',
            identifier: nolg,
            thbl: targetThbl,
          });
          processedFotoMeter = res.secureUrl;
        } catch (err) {
          console.error('[CLOUDINARY_MANDIRI_METER_UPLOAD_ERR]', err);
        }
      }

      if (fotoRumahUrl && fotoRumahUrl.startsWith('data:image/')) {
        try {
          const res = await uploadToCloudinary({
            file: fotoRumahUrl,
            modul: 'mandiri',
            jenis: 'rumah',
            identifier: nolg,
            thbl: targetThbl,
          });
          processedFotoRumah = res.secureUrl;
        } catch (err) {
          console.error('[CLOUDINARY_MANDIRI_RUMAH_UPLOAD_ERR]', err);
        }
      }
    }

    if (existing) {
      // Perbarui laporan yang sebelumnya ditolak menjadi PENDING kembali dengan revisi foto/angka baru
      await db
        .update(caterMandiriPelanggan)
        .set({
          stma: String(stma),
          pakaiM3: String(estimasiPakaiM3),
          fotoMeterUrl: processedFotoMeter,
          fotoRumahUrl: processedFotoRumah,
          lokasiGps: longitude && latitude ? { x: longitude, y: latitude } : null,
          jarakDariRumahMeter: String(jarakMeter),
          isLokasiValid,
          channel,
          ipAddress,
          userAgent,
          statusVerifikasi: "PENDING",
          alasanPenolakan: null,
          updatedAt: new Date(),
        })
        .where(eq(caterMandiriPelanggan.id, id));
    } else {
      await db
        .insert(caterMandiriPelanggan)
        .values({
          id,
          thbl: targetThbl,
          nolg,
          stma: String(stma),
          pakaiM3: String(estimasiPakaiM3),
          fotoMeterUrl: processedFotoMeter,
          fotoRumahUrl: processedFotoRumah,
          lokasiGps: longitude && latitude ? { x: longitude, y: latitude } : null,
          jarakDariRumahMeter: String(jarakMeter),
          isLokasiValid,
          channel,
          ipAddress,
          userAgent,
          statusVerifikasi: "PENDING",
        });
    }

    return {
      id,
      thbl: targetThbl,
      nolg,
      stma,
      pakaiM3: estimasiPakaiM3,
      jarakDariRumahMeter: jarakMeter,
      isLokasiValid,
      statusVerifikasi: "PENDING",
      pesan:
        "Laporan meter mandiri berhasil diterima dan menunggu verifikasi petugas.",
    };
  }

  /**
   * Verifikasi Laporan Mandiri oleh Petugas / Supervisor
   * APPROVE: Memperbarui cater_baca_meter dan meng-override kode DK (2) menjadi STAND-KONSUMEN (Z)
   * REJECT: Menyimpan alasan penolakan
   */
  async verifikasiLaporanMandiri(input: VerifikasiMandiriInput) {
    const { mandiriId, action, standDilaporkan, alasanPenolakan, userId } =
      input;

    const [mandiri] = await db
      .select()
      .from(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.id, mandiriId));

    if (!mandiri) {
      throw new Error(`Data laporan mandiri ${mandiriId} tidak ditemukan.`);
    }

    const stmaMandiri = standDilaporkan ?? Number(mandiri.stma);

    if (action === "REJECT") {
      if (!alasanPenolakan) {
        throw new Error(
          "Alasan penolakan wajib disertakan saat menolak laporan mandiri.",
        );
      }
      await db.transaction(async (tx) => {
        await tx
          .update(caterMandiriPelanggan)
          .set({
            statusVerifikasi: "REJECTED",
            alasanPenolakan,
            verifiedBy: userId,
            verifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(caterMandiriPelanggan.id, mandiriId));

        // Bila sebelumnya pernah disetujui, putuskan tautan di cater_baca_meter dan bersihkan foto jika bersumber dari mandiri
        await tx
          .update(caterBacaMeter)
          .set({
            caterMandiriId: null,
            fotoMeterUrl: sql`CASE WHEN ${caterBacaMeter.sumberCatat} IN ('MANDIRI_WEB', 'MANDIRI_APP') THEN NULL ELSE ${caterBacaMeter.fotoMeterUrl} END`,
            fotoRumahUrl: sql`CASE WHEN ${caterBacaMeter.sumberCatat} IN ('MANDIRI_WEB', 'MANDIRI_APP') THEN NULL ELSE ${caterBacaMeter.fotoRumahUrl} END`,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.caterMandiriId, mandiriId));
      });

      return {
        mandiriId,
        statusVerifikasi: "REJECTED",
        alasanPenolakan,
        message: "Laporan mandiri telah ditolak.",
      };
    }

    // Aksi: APPROVE -> Integrasikan ke cater_baca_meter
    const defaultCaterId = `cater-${mandiri.thbl}-${mandiri.nolg}`;
    let finalCaterId = defaultCaterId;

    await db.transaction(async (tx) => {
      // 1. Ambil data pembacaan eksisting bila ada untuk mendapatkan stand meter lalu (stml)
      const [existingCater] = await tx
        .select()
        .from(caterBacaMeter)
        .where(
          and(
            eq(caterBacaMeter.nolg, mandiri.nolg),
            eq(caterBacaMeter.thbl, mandiri.thbl)
          )
        );

      if (existingCater) {
        if (existingCater.statusVerifikasi === "LOCKED_BILLING") {
          throw new Error(
            `Periode ${mandiri.thbl} untuk pelanggan ${mandiri.nolg} sudah terkunci dalam penetapan tagihan resmi (LOCKED_BILLING). Penimpaan mandiri dilarang.`
          );
        }
        if (existingCater.statusVerifikasi === "APPROVED_FINAL") {
          throw new Error(
            `Pembacaan meter pelanggan ${mandiri.nolg} periode ${mandiri.thbl} sudah disahkan secara final (V3). Batalkan/reopen pembacaan terlebih dahulu untuk menggantinya dengan laporan mandiri.`
          );
        }
      }

      const previousPetugasNote =
        existingCater &&
        existingCater.sumberCatat !== "MANDIRI_WEB" &&
        existingCater.sumberCatat !== "MANDIRI_APP"
          ? `[PREV_PETUGAS:${existingCater.sumberCatat}:STMA=${existingCater.stma}:STML=${existingCater.stml}:PAKAI=${existingCater.pakaiM3}:TMSS=${existingCater.tmss}]`
          : null;

      const overrideCatatan = [
        "[Override Mandiri] Disahkan dari hasil foto kiriman pelanggan",
        previousPetugasNote,
      ]
        .filter(Boolean)
        .join(" | ");

      let stml = existingCater?.stml ? Number(existingCater.stml) : null;
      if (stml === null) {
        // Fallback: Cari stand akhir dari periode pembacaan sebelumnya
        const [prevCater] = await tx
          .select({ stma: caterBacaMeter.stma })
          .from(caterBacaMeter)
          .where(
            and(
              eq(caterBacaMeter.nolg, mandiri.nolg),
              lt(caterBacaMeter.thbl, mandiri.thbl)
            )
          )
          .orderBy(desc(caterBacaMeter.thbl))
          .limit(1);
        if (prevCater?.stma) {
          stml = Number(prevCater.stma);
        }
      }
      if (stml === null) {
        stml = 0;
      }

      const pakaiM3 = stmaMandiri >= stml ? stmaMandiri - stml : 0;
      finalCaterId = existingCater?.id ?? defaultCaterId;

      // 2. Update status laporan mandiri beserta stand yang diverifikasi & kalkulasi pemakaian m3
      await tx
        .update(caterMandiriPelanggan)
        .set({
          statusVerifikasi: "APPROVED",
          stma: String(stmaMandiri),
          pakaiM3: String(pakaiM3),
          alasanPenolakan: null,
          verifiedBy: userId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(caterMandiriPelanggan.id, mandiriId));

      // 3. Simpan / Perbarui transaksi utama baca meter (Override DK -> Stand Konsumen)
      const { rules, maps, versi } = await aturanAnomaliService.getCachedEngineContext();
      const evalRes = evaluasiAnomaliBaris(
        {
          stml: Number(stml),
          stma: Number(stmaMandiri),
          pakaiM3: Number(pakaiM3),
          pakaiLalu: null,
          kodeTmss: "Z",
        },
        rules,
        maps,
        versi
      );

      await tx
        .insert(caterBacaMeter)
        .values({
          id: finalCaterId,
          thbl: mandiri.thbl,
          nolg: mandiri.nolg,
          stml: String(stml),
          stma: String(stmaMandiri),
          pakaiM3: String(pakaiM3),
          pakaiTagih: String(pakaiM3),
          tmss: "Z", // STAND-KONSUMEN
          ketCatat: "STAND-KONSUMEN",
          metodeCatat: "OFFSITE",
          sumberCatat:
            mandiri.channel === "MOBILE_APP" ? "MANDIRI_APP" : "MANDIRI_WEB",
          caterMandiriId: mandiri.id,
          fotoMeterUrl: mandiri.fotoMeterUrl,
          fotoRumahUrl: mandiri.fotoRumahUrl,
          statusVerifikasi: "VERIFIED_L1",
          isAnomali: evalRes.isAnomali,
          kodeAnomaliUtama: evalRes.kodeUtama,
          kodeAnomaliList: evalRes.kodeList,
          aturanVersi: versi,
          catatan: overrideCatatan,
        })
        .onConflictDoUpdate({
          target: caterBacaMeter.id,
          set: {
            stml: String(stml),
            stma: String(stmaMandiri),
            pakaiM3: String(pakaiM3),
            pakaiTagih: String(pakaiM3),
            tmss: "Z",
            ketCatat: "STAND-KONSUMEN",
            sumberCatat:
              mandiri.channel === "MOBILE_APP" ? "MANDIRI_APP" : "MANDIRI_WEB",
            caterMandiriId: mandiri.id,
            fotoMeterUrl: mandiri.fotoMeterUrl,
            statusVerifikasi: "VERIFIED_L1",
            isAnomali: evalRes.isAnomali,
            kodeAnomaliUtama: evalRes.kodeUtama,
            kodeAnomaliList: evalRes.kodeList,
            aturanVersi: versi,
            catatan: overrideCatatan,
            updatedAt: new Date(),
          },
        });

      // 4. Catat ke audit trail verifikasi
      await tx.insert(caterVerifikasiLog).values({
        caterId: finalCaterId,
        userId,
        stage: "V1",
        action: "APPROVE",
        stmaSebelum: existingCater?.stma ?? null,
        stmaSesudah: String(stmaMandiri),
        pakaiSebelum: existingCater?.pakaiM3 ?? null,
        pakaiSesudah: String(pakaiM3),
        alasan:
          "Persetujuan laporan mandiri warga (Override kondisi DK/Kelainan fisik)",
      });
    });

    return {
      mandiriId,
      caterId: finalCaterId,
      statusVerifikasi: "APPROVED",
      stma: mandiri.stma,
      tmss: "Z",
      ketCatat: "STAND-KONSUMEN",
      message:
        "Laporan mandiri berhasil disetujui dan dialihkan ke transaksi baca meter.",
    };
  }
}

export const mandiriService = new MandiriService();
