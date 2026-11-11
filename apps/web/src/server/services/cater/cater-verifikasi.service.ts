import { eq, desc } from "drizzle-orm";
import { db, caterBacaMeter, caterVerifikasiLog } from "@cater/db";
import { evaluasiPemakaianMeter } from "../../domain/cater/cater-anomali.engine";
import { isCloudinaryConfigured, uploadToCloudinary } from "../../lib/cloudinary";

export interface SubmitReadingInput {
  thbl: string;
  nolg: string;
  ruteKode?: string;
  petugasId?: string;
  stml: number;
  stma: number;
  pakaiLalu?: number;
  kondisiCatat?: string;
  metodeCatat?: string;
  sumberCatat?:
    | "PETUGAS_ONSITE"
    | "PETUGAS_OFFSITE"
    | "MANDIRI_WEB"
    | "MANDIRI_APP"
    | "MANUAL";
  fotoMeterUrl?: string;
  fotoRumahUrl?: string;
  durasiDetik?: number;
  catatan?: string;
  longitude?: number;
  latitude?: number;
}

export interface VerifyV1Input {
  caterId: string;
  action: "APPROVE" | "REQUEST_RESURVEY";
  catatan?: string;
}

export interface VerifyV2Input {
  caterId: string;
  action: "APPROVE" | "ADJUST_STAND" | "REQUEST_RESURVEY";
  stmaKoreksi?: number;
  catatan?: string;
}

export interface VerifyV3Input {
  caterId: string;
  catatan?: string;
}

export interface StaffCorrectionInput {
  caterId: string;
  stmaBaru: number;
  pakaiM3Baru: number;
  nomorTiketKomplain?: string;
  alasan: string;
}

export class CaterVerifikasiService {
  /**
   * Menyimpan / memperbarui pembacaan meter dari aplikasi mobile petugas
   * Menggunakan Domain Engine untuk evaluasi anomali
   */
  async submitReading(input: SubmitReadingInput) {
    const {
      thbl,
      nolg,
      ruteKode,
      petugasId,
      stml,
      stma,
      pakaiLalu,
      kondisiCatat,
      metodeCatat,
      sumberCatat,
      fotoMeterUrl,
      fotoRumahUrl,
      durasiDetik,
      catatan,
      longitude,
      latitude,
    } = input;

    // Evaluasi bisnis via Domain Engine murni
    const evaluasi = evaluasiPemakaianMeter({ stml, stma, pakaiLalu });
    const id = `cater-${thbl}-${nolg}`;
    const lokasiGps =
      longitude !== undefined && latitude !== undefined
        ? { x: longitude, y: latitude }
        : null;
    const catatanBaca = [
      catatan,
      evaluasi.isAnomali && evaluasi.pesan ? `[Anomali] ${evaluasi.pesan}` : null,
    ]
      .filter(Boolean)
      .join(' | ') || null;

    // Standardisasi & Upload Cloudinary jika input adalah Base64 DataURL
    let processedFotoMeter = fotoMeterUrl;
    let processedFotoRumah = fotoRumahUrl;

    if (isCloudinaryConfigured()) {
      if (fotoMeterUrl && fotoMeterUrl.startsWith('data:image/')) {
        try {
          const res = await uploadToCloudinary({
            file: fotoMeterUrl,
            modul: 'cater',
            jenis: 'stand',
            identifier: nolg,
            thbl,
          });
          processedFotoMeter = res.secureUrl;
        } catch (err) {
          console.error('[CLOUDINARY_CATER_METER_UPLOAD_ERR]', err);
        }
      }

      if (fotoRumahUrl && fotoRumahUrl.startsWith('data:image/')) {
        try {
          const res = await uploadToCloudinary({
            file: fotoRumahUrl,
            modul: 'cater',
            jenis: 'rumah',
            identifier: nolg,
            thbl,
          });
          processedFotoRumah = res.secureUrl;
        } catch (err) {
          console.error('[CLOUDINARY_CATER_RUMAH_UPLOAD_ERR]', err);
        }
      }
    }

    await db
      .insert(caterBacaMeter)
      .values({
        id,
        thbl,
        nolg,
        ruteKode,
        petugasId,
        stml: String(stml),
        stma: String(stma),
        pakaiLalu: pakaiLalu === undefined ? null : String(pakaiLalu),
        pakaiM3: String(evaluasi.pakaiM3),
        ketCatat: kondisiCatat || "Normal",
        metodeCatat: (metodeCatat as any) || "ONSITE",
        sumberCatat: sumberCatat || "PETUGAS_ONSITE",
        fotoMeterUrl: processedFotoMeter,
        fotoRumahUrl: processedFotoRumah,
        durasiDetik: durasiDetik || 0,
        statusVerifikasi: evaluasi.statusVerifikasi,
        catatan: catatanBaca,
        lokasiGps,
      })
      .onConflictDoUpdate({
        target: caterBacaMeter.id,
        set: {
          ruteKode,
          petugasId,
          stml: String(stml),
          stma: String(stma),
          pakaiLalu: pakaiLalu === undefined ? null : String(pakaiLalu),
          pakaiM3: String(evaluasi.pakaiM3),
          ketCatat: kondisiCatat || "Normal",
          metodeCatat: (metodeCatat as any) || "ONSITE",
          sumberCatat: sumberCatat || "PETUGAS_ONSITE",
          fotoMeterUrl: processedFotoMeter,
          fotoRumahUrl: processedFotoRumah,
          lokasiGps,
          durasiDetik: durasiDetik || 0,
          statusVerifikasi: evaluasi.statusVerifikasi,
          catatan: catatanBaca,
          updatedAt: new Date(),
        },
      });

    return {
      id,
      nolg,
      stml,
      stma,
      pakaiM3: evaluasi.pakaiM3,
      isAnomali: evaluasi.isAnomali,
      statusVerifikasi: evaluasi.statusVerifikasi,
    };
  }

  /**
   * Verifikasi V1 - Supervisor Seksi / Rute
   */
  async verifikasiV1(input: VerifyV1Input, userId: string) {
    const { caterId, action, catatan } = input;

    const [cater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    if (!cater) {
      throw new Error("Data baca meter tidak ditemukan");
    }

    const nextStatus = action === "APPROVE" ? "VERIFIED_L1" : "NEED_RESURVEY";

    await db.transaction(async (tx) => {
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: "V1",
        action,
        stmaSebelum: cater.stma,
        stmaSesudah: cater.stma,
        pakaiSebelum: cater.pakaiM3,
        pakaiSesudah: cater.pakaiM3,
        alasan:
          catatan ||
          (action === "APPROVE"
            ? "Disetujui oleh Supervisor (V1)"
            : "Diminta cek ulang fisik lapangan"),
      });

      await tx
        .update(caterBacaMeter)
        .set({
          statusVerifikasi: nextStatus,
          catatan: catatan ? `[V1] ${catatan}` : cater.catatan,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterId));
    });

    return {
      caterId,
      statusVerifikasi: nextStatus,
      message: `Verifikasi V1 berhasil disimpan (${nextStatus})`,
    };
  }

  /**
   * Verifikasi V2 - Manager Cabang / Wilayah
   */
  async verifikasiV2(input: VerifyV2Input, userId: string) {
    const { caterId, action, stmaKoreksi, catatan } = input;

    const [cater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    if (!cater) {
      throw new Error("Data baca meter tidak ditemukan");
    }

    let stmaSesudah = cater.stma;
    let pakaiSesudah = cater.pakaiM3;
    let nextStatus = "VERIFIED_L2";

    if (action === "REQUEST_RESURVEY") {
      nextStatus = "NEED_RESURVEY";
    } else if (action === "ADJUST_STAND") {
      if (stmaKoreksi === undefined) {
        throw new Error(
          "stmaKoreksi wajib diisi untuk penyesuaian angka meter",
        );
      }
      stmaSesudah = String(stmaKoreksi);
      const stmlNum = Number(cater.stml);
      pakaiSesudah = String(stmaKoreksi - stmlNum);
    }

    await db.transaction(async (tx) => {
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: "V2",
        action,
        stmaSebelum: cater.stma,
        stmaSesudah,
        pakaiSebelum: cater.pakaiM3,
        pakaiSesudah,
        alasan: catatan || `Verifikasi V2 Cabang: ${action}`,
      });

      await tx
        .update(caterBacaMeter)
        .set({
          stma: stmaSesudah,
          pakaiM3: pakaiSesudah,
          statusVerifikasi: nextStatus,
          catatan: catatan ? `[V2] ${catatan}` : cater.catatan,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterId));
    });

    return {
      caterId,
      statusVerifikasi: nextStatus,
      stma: stmaSesudah,
      pakaiM3: pakaiSesudah,
      message: `Verifikasi V2 Cabang berhasil disimpan (${nextStatus})`,
    };
  }

  /**
   * Verifikasi V3 - Senior Manager / Direksi (Final Approval)
   */
  async verifikasiV3(input: VerifyV3Input, userId: string) {
    const { caterId, catatan } = input;

    const [cater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    if (!cater) {
      throw new Error("Data baca meter tidak ditemukan");
    }

    const nextStatus = "APPROVED_FINAL";

    await db.transaction(async (tx) => {
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: "V3",
        action: "APPROVE",
        stmaSebelum: cater.stma,
        stmaSesudah: cater.stma,
        pakaiSebelum: cater.pakaiM3,
        pakaiSesudah: cater.pakaiM3,
        alasan:
          catatan ||
          "Disahkan oleh Senior Manager / Direksi (V3 Final Release)",
      });

      await tx
        .update(caterBacaMeter)
        .set({
          statusVerifikasi: nextStatus,
          catatan: catatan ? `[V3] ${catatan}` : cater.catatan,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterId));
    });

    return {
      caterId,
      statusVerifikasi: nextStatus,
      message: "Pengesahan akhir V3 berhasil (APPROVED_FINAL)",
    };
  }

  /**
   * Koreksi Administratif Pasca-Verifikasi oleh Staff
   * Syarat: Data harus sudah memiliki histori verifikasi sebelumnya dan belum closing DRD
   */
  async koreksiStaff(input: StaffCorrectionInput, userId: string) {
    const { caterId, stmaBaru, pakaiM3Baru, nomorTiketKomplain, alasan } =
      input;

    const [cater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    if (!cater) {
      throw new Error("Data baca meter tidak ditemukan");
    }

    // Guard: Wajib memiliki minimal 1 histori log verifikasi
    const logs = await db
      .select({ id: caterVerifikasiLog.id })
      .from(caterVerifikasiLog)
      .where(eq(caterVerifikasiLog.caterId, caterId))
      .limit(1);

    if (!logs || logs.length === 0) {
      throw new Error(
        "Fitur tidak aktif: Data belum pernah diverifikasi oleh V1-V3. Koreksi oleh Staff tidak diizinkan sebelum verifikasi reguler.",
      );
    }

    // Guard: Cegah koreksi jika sudah terkunci tagihan closing DRD
    if (cater.statusVerifikasi === "LOCKED_BILLING") {
      throw new Error(
        "Data sudah terkunci dalam Rekening Tagihan (DRD). Wajib menggunakan prosedur Berita Acara Khusus.",
      );
    }

    await db.transaction(async (tx) => {
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: "STAFF_CORRECTION",
        action: "STAFF_POST_CORRECT",
        stmaSebelum: cater.stma,
        stmaSesudah: String(stmaBaru),
        pakaiSebelum: cater.pakaiM3,
        pakaiSesudah: String(pakaiM3Baru),
        nomorTiketKomplain,
        alasan,
      });

      await tx
        .update(caterBacaMeter)
        .set({
          stma: String(stmaBaru),
          pakaiM3: String(pakaiM3Baru),
          statusVerifikasi: "CORRECTED_POST_VERIF",
          catatan: `[Staff Correction] Tiket: ${nomorTiketKomplain ?? "-"} | ${alasan}`,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterId));
    });

    return {
      caterId,
      stmaBaru,
      pakaiM3Baru,
      statusVerifikasi: "CORRECTED_POST_VERIF",
      message: "Koreksi administratif pasca-verifikasi berhasil disimpan",
    };
  }
}

export const caterVerifikasiService = new CaterVerifikasiService();
