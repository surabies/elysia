import { eq, desc, and, sql, or, ilike } from "drizzle-orm";
import {
  db,
  caterBacaMeter,
  caterVerifikasiLog,
  daftarCatat,
  pelanggan,
  golonganTarif,
  masterKondisiCatat,
  waterMeter,
  waterMeterMutasi,
} from "@cater/db";
import { evaluasiAnomaliBaris } from "@cater/backend/domain/cater/anomali-evaluator";
import { evaluasiGuardBacaanMeter } from "@cater/backend/domain/cater/guard-bacaan.engine";
import { aturanAnomaliService } from "./aturan-anomali.service";
import {
  hitungPemakaianDanRekonsiliasiTaksasi,
  type ModeHitungKondisiInput,
  type TagihanSaatKelebihanMode,
} from "@cater/backend/domain/tagihan/tagihan.engine";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "@cater/backend/lib/cloudinary";

export interface SubmitReadingInput {
  thbl: string;
  nolg: string;
  ruteKode?: string;
  petugasId?: string;
  stml: number;
  stma: number;
  pakaiM3Override?: number;
  /** Taksasi manual operator (menggantikan pakai_lalu). Wajib disertai alasanTaksasiManual & operatorUserId. */
  pakaiTaksasiManual?: number;
  alasanTaksasiManual?: string;
  operatorUserId?: string;
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

export interface ResolusiKreditTaksasiInput {
  caterId: string;
  action: "SET_KONDISI_KELEBIHAN" | "ADJUST_KREDIT_TAKSASI" | "CORRECT_STAND";
  akumulasiTaksasiBaru?: number;
  stmaKoreksi?: number;
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
      pakaiM3Override,
      pakaiTaksasiManual,
      alasanTaksasiManual,
      operatorUserId,
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

    // 1. Muat konfigurasi mode_hitung dari master_kondisi_catat, pemakaian_minimum_m3 dari golongan_tarif,
    //    serta stand_awal, pakai_lalu, dan akumulasi_taksasi_m3 dari daftar_catat (DPM)
    const [dpmRow, pelRow, kondisiRows, existingCaterRow] = await Promise.all([
      db
        .select({
          standAwal: daftarCatat.standAwal,
          pakaiLalu: daftarCatat.pakaiLalu,
          akumulasiTaksasiM3: daftarCatat.akumulasiTaksasiM3,
          akumulasiPerluVerifikasi: daftarCatat.akumulasiPerluVerifikasi,
        })
        .from(daftarCatat)
        .where(and(eq(daftarCatat.periode, thbl), eq(daftarCatat.nolg, nolg)))
        .limit(1),
      db
        .select({
          tarifKode: pelanggan.tarifKode,
          ukuranMeter: pelanggan.ukuranMeter,
          jumlahDigit: waterMeter.jumlahDigit,
          pemakaianMinimumM3: golonganTarif.pemakaianMinimumM3,
          tagihanSaatKelebihan: golonganTarif.tagihanSaatKelebihan,
        })
        .from(pelanggan)
        .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
        .leftJoin(waterMeter, eq(pelanggan.noMeter, waterMeter.noMeter))
        .where(eq(pelanggan.nolg, nolg))
        .limit(1),
      db
        .select({
          kodeTmss: masterKondisiCatat.kodeTmss,
          nama: masterKondisiCatat.nama,
          modeHitung: masterKondisiCatat.modeHitung,
        })
        .from(masterKondisiCatat),
      db
        .select()
        .from(caterBacaMeter)
        .where(and(eq(caterBacaMeter.thbl, thbl), eq(caterBacaMeter.nolg, nolg)))
        .limit(1),
    ]);

    const existingCater = existingCaterRow[0];
    if (existingCater) {
      if (existingCater.statusVerifikasi === "LOCKED_BILLING") {
        throw new Error(
          `Periode ${thbl} untuk pelanggan ${nolg} sudah terkunci dalam penetapan tagihan resmi (LOCKED_BILLING). Penimpaan dilarang.`
        );
      }
      if (existingCater.statusVerifikasi === "APPROVED_FINAL") {
        throw new Error(
          `Pembacaan meter pelanggan ${nolg} periode ${thbl} sudah disahkan secara final (V3). Untuk mengubah nilai, lakukan alur reopen/koreksi resmi.`
        );
      }
    }

    const dpm = dpmRow[0];
    const pemakaianMinimumM3 = Number(pelRow[0]?.pemakaianMinimumM3 ?? 0);
    const tagihanSaatKelebihan =
      (pelRow[0]?.tagihanSaatKelebihan as TagihanSaatKelebihanMode) ||
      "MINIMUM";
    const akumulasiTaksasiM3 = Number(dpm?.akumulasiTaksasiM3 ?? 0);
    const akumulasiPerluVerifikasi = Boolean(
      dpm?.akumulasiPerluVerifikasi ?? false,
    );
    const pakaiLaluEfektif =
      pakaiLalu !== undefined
        ? pakaiLalu
        : dpm?.pakaiLalu !== undefined && dpm?.pakaiLalu !== null
          ? Number(dpm.pakaiLalu)
          : null;

    const rawKondisi = (kondisiCatat || "Normal").trim();
    const matchKondisi =
      kondisiRows.find(
        (k) =>
          k.nama.trim().toUpperCase() === rawKondisi.toUpperCase() ||
          k.kodeTmss.trim().toUpperCase() === rawKondisi.toUpperCase(),
      ) || kondisiRows.find((k) => k.nama === "Normal");

    const kodeTmssFinal = matchKondisi?.kodeTmss ?? " ";
    const namaKondisiFinal = matchKondisi?.nama ?? rawKondisi;
    const modeHitung = (matchKondisi?.modeHitung ??
      "SELISIH_FISIK") as ModeHitungKondisiInput;

    // 2. Hitung pemakaian & rekonsiliasi akumulasi_taksasi_m3 via Domain Engine generik
    // 1b. Data mutasi MB (jika ada) untuk periode ini: stand angkat/pasang dari Teknik
    const [mutasiMb] =
      modeHitung === "METER_BARU"
        ? await db
            .select()
            .from(waterMeterMutasi)
            .where(eq(waterMeterMutasi.id, `mutasi-${thbl}-${nolg}`))
            .limit(1)
        : [undefined];

    const hasilMode = hitungPemakaianDanRekonsiliasiTaksasi({
      stml,
      stma: modeHitung === "NOL" ? stml : stma,
      modeHitung,
      pakaiLalu: pakaiLaluEfektif,
      pemakaianMinimumM3,
      akumulasiTaksasiM3,
      akumulasiPerluVerifikasi,
      tagihanSaatKelebihan,
      standAngkat: mutasiMb?.standAngkat ?? null,
      standPasang: mutasiMb?.standPasang ?? 0,
      ukuranMeter: pelRow[0]?.ukuranMeter ?? null,
      jumlahDigitAset: pelRow[0]?.jumlahDigit ?? null,
    });

    // 2b. Taksasi manual operator: nilai sendiri (bukan hanya pakai_lalu), alasan wajib + audit log
    const adaTaksasiManual = pakaiTaksasiManual !== undefined;
    if (adaTaksasiManual) {
      if (!alasanTaksasiManual || alasanTaksasiManual.trim().length < 5) {
        throw new Error(
          "Taksasi manual wajib disertai alasan (minimal 5 karakter).",
        );
      }
      if (!operatorUserId) {
        throw new Error(
          "Taksasi manual wajib dicatat atas nama pengguna yang login (audit).",
        );
      }
      if (pakaiTaksasiManual < 0) {
        throw new Error("Nilai taksasi manual tidak boleh negatif.");
      }
      if (hasilMode.alasanTaksir !== "TAKSIRAN_BULAN_LALU") {
        throw new Error(
          "Taksasi manual hanya berlaku untuk bacaan bertaksasi (stand akhir = stand awal pada kondisi taksasi).",
        );
      }
      hasilMode.pakaiTagihM3 = pakaiTaksasiManual;
      hasilMode.akumulasiTaksasiBerikutnya =
        akumulasiTaksasiM3 + pakaiTaksasiManual;
      hasilMode.alasanTaksir = "OVERRIDE_MANUAL";
    }

    const stmaEfektif = hasilMode.stmaEfektif;
    const isMundur =
      modeHitung !== "METER_BARU" &&
      modeHitung !== "MUDA_KEMBALI" &&
      modeHitung !== "KREDIT_TAKSASI" &&
      stml > stmaEfektif;
    const isMbBelumLengkap =
      modeHitung === "METER_BARU" &&
      (mutasiMb?.standAngkat === null || mutasiMb?.standAngkat === undefined);

    // Pertahankan nilai minus riil ketika isMundur agar indikator pemakaian minus (-) tampil terang-benderang di UI & ditahan Guard
    const pakaiM3Fisik = isMundur
      ? hasilMode.selisihFisikM3
      : Math.max(0, hasilMode.selisihFisikM3);
    const pakaiTagihFinal = isMundur
      ? null
      : pakaiM3Override !== undefined
        ? pakaiM3Override
        : hasilMode.pakaiTagihM3;

    const isExistingMandiri =
      existingCater &&
      (existingCater.caterMandiriId != null ||
        existingCater.sumberCatat === "MANDIRI_WEB" ||
        existingCater.sumberCatat === "MANDIRI_APP");

    let isDiscrepancyMandiri = false;
    let discrepancyNote: string | null = null;

    if (isExistingMandiri) {
      const standMandiri = Number(existingCater.stma);
      const standPetugas = Number(stmaEfektif);
      if (standMandiri !== standPetugas) {
        isDiscrepancyMandiri = true;
        discrepancyNote = `[BEDA_STAND_MANDIRI_PETUGAS] Petugas Lapangan input Stand ${standPetugas} (Laporan Mandiri sebelumnya: ${standMandiri}). Memerlukan keputusan supervisor.`;
      } else {
        discrepancyNote = `[KONFIRMASI_ONSITE] Stand Petugas Lapangan (${standPetugas}) cocok dengan Laporan Mandiri Konsumen.`;
      }
    }

    const statusVerifikasiFinal = isDiscrepancyMandiri
      ? "ANOMALY"
      : hasilMode.isAnomaliKreditTaksasi
        ? "ANOMALY"
        : isMbBelumLengkap
          ? "ANOMALY_NEGATIVE"
          : hasilMode.isStandTetap
            ? "SUBMITTED"
            : isMundur
              ? "ANOMALY_NEGATIVE"
              : "SUBMITTED";

    const id = `cater-${thbl}-${nolg}`;
    const mutasiIdTarget =
      modeHitung === "METER_BARU"
        ? (mutasiMb?.id ?? `mutasi-${thbl}-${nolg}`)
        : null;
    const lokasiGps =
      longitude !== undefined && latitude !== undefined
        ? { x: longitude, y: latitude }
        : null;
    const catatanBaca =
      [
        catatan,
        discrepancyNote,
        hasilMode.isStandTetap
          ? "[STAND_TETAP] Stand akhir sama dengan stand awal pada kondisi Normal; menunggu keputusan verifikator"
          : null,
        hasilMode.perluReviewVerifikatorAkumulasi && akumulasiTaksasiM3 > 0
          ? `[VERIFIKASI_AKUMULASI] Riwayat taksasi sebelum Oktober belum terverifikasi infolang (akumulasi tercatat: ${akumulasiTaksasiM3} m³); verifikator wajib memeriksa sebelum tagihan diputuskan`
          : null,
        hasilMode.pesanAnomali
          ? `[Anomali Kredit Taksasi] ${hasilMode.pesanAnomali}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ") || null;

    // Standardisasi & Upload Cloudinary jika input adalah Base64 DataURL
    let processedFotoMeter = fotoMeterUrl;
    let processedFotoRumah = fotoRumahUrl;

    if (isCloudinaryConfigured()) {
      if (fotoMeterUrl && fotoMeterUrl.startsWith("data:image/")) {
        try {
          const res = await uploadToCloudinary({
            file: fotoMeterUrl,
            modul: "cater",
            jenis: "stand",
            identifier: nolg,
            thbl,
          });
          processedFotoMeter = res.secureUrl;
        } catch (err) {
          console.error("[CLOUDINARY_CATER_METER_UPLOAD_ERR]", err);
        }
      }

      if (fotoRumahUrl && fotoRumahUrl.startsWith("data:image/")) {
        try {
          const res = await uploadToCloudinary({
            file: fotoRumahUrl,
            modul: "cater",
            jenis: "rumah",
            identifier: nolg,
            thbl,
          });
          processedFotoRumah = res.secureUrl;
        } catch (err) {
          console.error("[CLOUDINARY_CATER_RUMAH_UPLOAD_ERR]", err);
        }
      }
    }

    const isDicabut = kodeTmssFinal === "D" || namaKondisiFinal === "DICABUT";

    // Evaluasi anomali terpusat (SSOT)
    const { rules, maps, versi } = await aturanAnomaliService.getCachedEngineContext();
    const evalRes = evaluasiAnomaliBaris(
      {
        stml: Number(stml),
        stma: Number(stmaEfektif),
        pakaiM3: Number(pakaiM3Fisik),
        pakaiLalu: pakaiLaluEfektif === null ? null : Number(pakaiLaluEfektif),
        kodeTmss: kodeTmssFinal,
      },
      rules,
      maps,
      versi
    );

    if (isDiscrepancyMandiri) {
      evalRes.isAnomali = true;
      if (!evalRes.kodeList) evalRes.kodeList = [];
      if (!evalRes.kodeList.includes("BEDA_STAND_MANDIRI_PETUGAS")) {
        evalRes.kodeList.push("BEDA_STAND_MANDIRI_PETUGAS");
      }
      if (!evalRes.kodeUtama) {
        evalRes.kodeUtama = "BEDA_STAND_MANDIRI_PETUGAS";
      }
    }

    if (isMbBelumLengkap) {
      evalRes.isAnomali = true;
      if (!evalRes.kodeList) evalRes.kodeList = [];
      if (!evalRes.kodeList.includes("MB_BUTUH_STAND_ANGKAT")) {
        evalRes.kodeList.unshift("MB_BUTUH_STAND_ANGKAT");
      }
      evalRes.kodeUtama = "MB_BUTUH_STAND_ANGKAT";
    }

    await db.transaction(async (tx) => {
      // Kondisi MB tanpa data Teknik: buat draft mutasi lebih dulu agar FK waterMeterMutasiId selalu tertaut
      if (modeHitung === "METER_BARU" && !mutasiMb && mutasiIdTarget) {
        const [pel] = await tx
          .select({
            noMeter: pelanggan.noMeter,
            noMeterAsli: pelanggan.noMeterAsli,
          })
          .from(pelanggan)
          .where(eq(pelanggan.nolg, nolg));
        await tx
          .insert(waterMeterMutasi)
          .values({
            id: mutasiIdTarget,
            nolg,
            periode: Number(thbl),
            alasan: "LAINNYA",
            keterangan:
              "Draft otomatis dari pembacaan kondisi 4 | MB; menunggu konfirmasi Stand Angkat / Override operator",
            noMeterLama: pel?.noMeterAsli ?? pel?.noMeter ?? "-",
            standAngkat: null,
            noMeterBaru: null,
            standPasang: 0,
            statusVerifikasi: "DATA_METER_BELUM_LENGKAP",
          })
          .onConflictDoNothing();
      }

      await tx
        .insert(caterBacaMeter)
        .values({
          id,
          thbl,
          nolg,
          ruteKode,
          petugasId,
          stml: String(stml),
          stma: String(stmaEfektif),
          pakaiLalu:
            pakaiLaluEfektif === null ? null : String(pakaiLaluEfektif),
          pakaiM3: String(pakaiM3Fisik),
          pakaiTagih: pakaiTagihFinal === null ? null : String(pakaiTagihFinal),
          alasanTaksir: hasilMode.alasanTaksir,
          tmss: kodeTmssFinal,
          ketCatat: namaKondisiFinal,
          waterMeterMutasiId: mutasiIdTarget,
          mbTanpaStandAngkat: false,
          metodeCatat: (metodeCatat as any) || "ONSITE",
          sumberCatat: sumberCatat || "PETUGAS_ONSITE",
          fotoMeterUrl: processedFotoMeter,
          fotoRumahUrl: processedFotoRumah,
          durasiDetik: durasiDetik || 0,
          statusVerifikasi: statusVerifikasiFinal,
          isAnomali: evalRes.isAnomali,
          kodeAnomaliUtama: evalRes.kodeUtama,
          kodeAnomaliList: evalRes.kodeList,
          aturanVersi: versi,
          catatan: catatanBaca,
          lokasiGps,
        })
        .onConflictDoUpdate({
          target: [caterBacaMeter.thbl, caterBacaMeter.nolg],
          set: {
            ruteKode,
            petugasId,
            stml: String(stml),
            stma: String(stmaEfektif),
            pakaiLalu:
              pakaiLaluEfektif === null ? null : String(pakaiLaluEfektif),
            pakaiM3: String(pakaiM3Fisik),
            pakaiTagih: pakaiTagihFinal === null ? null : String(pakaiTagihFinal),
            alasanTaksir: hasilMode.alasanTaksir,
            tmss: kodeTmssFinal,
            ketCatat: namaKondisiFinal,
            waterMeterMutasiId: mutasiIdTarget,
            mbTanpaStandAngkat: false,
            metodeCatat: (metodeCatat as any) || "ONSITE",
            sumberCatat: sumberCatat || "PETUGAS_ONSITE",
            caterMandiriId: null,
            fotoMeterUrl: processedFotoMeter,
            fotoRumahUrl: processedFotoRumah,
            lokasiGps,
            durasiDetik: durasiDetik || 0,
            statusVerifikasi: statusVerifikasiFinal,
            isAnomali: evalRes.isAnomali,
            kodeAnomaliUtama: evalRes.kodeUtama,
            kodeAnomaliList: evalRes.kodeList,
            aturanVersi: versi,
            catatan: catatanBaca,
            updatedAt: new Date(),
          },
        });

      await tx
        .update(daftarCatat)
        .set({
          status: isDicabut ? "DICABUT" : "DICATAT",
          selesaiAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(daftarCatat.periode, thbl), eq(daftarCatat.nolg, nolg)));

      if (adaTaksasiManual && operatorUserId) {
        await tx.insert(caterVerifikasiLog).values({
          caterId: id,
          userId: operatorUserId,
          stage: "INPUT",
          action: "TAKSASI_MANUAL",
          stmaSebelum: String(stml),
          stmaSesudah: String(stmaEfektif),
          pakaiSebelum: String(
            Math.max(pakaiLaluEfektif ?? 0, pemakaianMinimumM3),
          ),
          pakaiSesudah: String(pakaiTagihFinal),
          alasan: `[Taksasi manual operator] pakai_lalu=${pakaiLaluEfektif ?? 0} -> ${pakaiTagihFinal} m3 | ${alasanTaksasiManual!.trim()}`,
        });
      }

      if (isDicabut) {
        await tx
          .update(pelanggan)
          .set({
            status: "DICABUT",
            updatedAt: new Date(),
          })
          .where(eq(pelanggan.nolg, nolg));
      }
    });

    return {
      id,
      nolg,
      stml,
      stma: stmaEfektif,
      pakaiM3: pakaiTagihFinal,
      pakaiM3Fisik,
      akumulasiTaksasiDikurangkan: hasilMode.akumulasiTaksasiDikurangkan,
      isAnomali: evalRes.isAnomali || Boolean(hasilMode.isAnomaliKreditTaksasi),
      statusVerifikasi: statusVerifikasiFinal,
    };
  }

  /**
   * Guard terpusat sebelum persetujuan V1 / V2 / V3 agar baris MB belum lengkap,
   * Muda Kembali tidak wajar, maupun kubikasi negatif mustahil lolos verifikasi langsung/massal.
   */
  private async assertLolosGuardPersetujuan(caterId: string) {
    const [detail] = await db
      .select({
        cater: caterBacaMeter,
        ukuranMeter: pelanggan.ukuranMeter,
        jumlahDigit: waterMeter.jumlahDigit,
        standAngkatMutasi: waterMeterMutasi.standAngkat,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(waterMeter, eq(pelanggan.noMeter, waterMeter.noMeter))
      .leftJoin(
        waterMeterMutasi,
        eq(caterBacaMeter.waterMeterMutasiId, waterMeterMutasi.id),
      )
      .where(eq(caterBacaMeter.id, caterId));

    if (!detail) {
      throw new Error("Data baca meter tidak ditemukan");
    }

    const row = detail.cater;
    const guard = evaluasiGuardBacaanMeter({
      stml: row.stml,
      stma: row.stma,
      stmlRevisi: row.stmlRevisi,
      stmaRevisi: row.stmaRevisi,
      pakaiM3: row.pakaiM3,
      pakaiM3Revisi: row.pakaiM3Revisi,
      pakaiTagih: row.pakaiTagih,
      tmss: row.tmss,
      ketCatat: row.ketCatat,
      ketCatatRevisi: row.ketCatatRevisi,
      standAngkatRevisi: row.standAngkatRevisi,
      standMeterBaruRevisi: row.standMeterBaruRevisi,
      standAngkatMutasi: detail.standAngkatMutasi,
      mbTanpaStandAngkat: row.mbTanpaStandAngkat,
      digitRollover: row.digitRollover,
      ukuranMeter: detail.ukuranMeter,
      jumlahDigitAset: detail.jumlahDigit,
      statusVerifikasi: row.statusVerifikasi,
    });

    if (!guard.lolosDataMurni) {
      throw new Error(
        guard.pesanBlokir ??
          "Bacaan meter belum memenuhi syarat validasi dan wajib dikoreksi terlebih dahulu.",
      );
    }

    return row;
  }

  /**
   * Verifikasi V1 - Supervisor Seksi / Rute
   */
  async verifikasiV1(input: VerifyV1Input, userId: string) {
    const { caterId, action, catatan } = input;

    let cater: typeof caterBacaMeter.$inferSelect | undefined;
    if (action === "APPROVE") {
      cater = await this.assertLolosGuardPersetujuan(caterId);
    } else {
      const [found] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));
      cater = found;
    }

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

    let cater: typeof caterBacaMeter.$inferSelect | undefined;
    if (action === "APPROVE") {
      cater = await this.assertLolosGuardPersetujuan(caterId);
    } else {
      const [found] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));
      cater = found;
    }

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

    let evalUpdates: any = {};
    if (action === "ADJUST_STAND") {
      const { rules, maps, versi } = await aturanAnomaliService.getCachedEngineContext();
      const evalRes = evaluasiAnomaliBaris(
        {
          stml: Number(cater.stml),
          stma: Number(stmaSesudah),
          pakaiM3: Number(pakaiSesudah),
          pakaiLalu: cater.pakaiLalu !== null ? Number(cater.pakaiLalu) : null,
          kodeTmss: cater.tmss,
        },
        rules,
        maps,
        versi
      );
      evalUpdates = {
        isAnomali: evalRes.isAnomali,
        kodeAnomaliUtama: evalRes.kodeUtama,
        kodeAnomaliList: evalRes.kodeList,
        aturanVersi: versi,
      };
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
          ...evalUpdates,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterId));

      if (action === "ADJUST_STAND") {
        await aturanAnomaliService.evaluasiUlangBarisDependen(cater.nolg, cater.thbl, tx);
      }
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

    const cater = await this.assertLolosGuardPersetujuan(caterId);

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

  /**
   * Resolusi Anomali Kredit Taksasi (kredit > selisih fisik) oleh Verifikator:
   * 1. SET_KONDISI_KELEBIHAN: Menetapkan kondisi M | KELEBIHAN (mode_hitung = 'KREDIT_TAKSASI')
   * 2. ADJUST_KREDIT_TAKSASI: Mengurangi/menghapus akumulasi_taksasi_m3 dengan alasan wajib
   * 3. CORRECT_STAND: Memperbaiki angka bacaan fisik stma apabila terjadi salah baca
   * Seluruh perubahan dicatat lengkap di `cater_verifikasi_log`.
   */
  async resolusiAnomaliKreditTaksasi(
    input: ResolusiKreditTaksasiInput,
    userId: string,
  ) {
    const { caterId, action, akumulasiTaksasiBaru, stmaKoreksi, alasan } =
      input;
    if (!alasan || alasan.trim().length < 5) {
      throw new Error(
        "Alasan wajib diisi minimal 5 karakter untuk audit verifikasi.",
      );
    }

    const [cater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    if (!cater) {
      throw new Error("Data baca meter tidak ditemukan");
    }

    const [dpmRow, pelRow, kondisiKelebihanRow] = await Promise.all([
      db
        .select({
          akumulasiTaksasiM3: daftarCatat.akumulasiTaksasiM3,
          akumulasiPerluVerifikasi: daftarCatat.akumulasiPerluVerifikasi,
        })
        .from(daftarCatat)
        .where(
          and(
            eq(daftarCatat.periode, cater.thbl),
            eq(daftarCatat.nolg, cater.nolg),
          ),
        )
        .limit(1),
      db
        .select({
          pemakaianMinimumM3: golonganTarif.pemakaianMinimumM3,
          tagihanSaatKelebihan: golonganTarif.tagihanSaatKelebihan,
        })
        .from(pelanggan)
        .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
        .where(eq(pelanggan.nolg, cater.nolg))
        .limit(1),
      db
        .select({
          kodeTmss: masterKondisiCatat.kodeTmss,
          nama: masterKondisiCatat.nama,
          modeHitung: masterKondisiCatat.modeHitung,
        })
        .from(masterKondisiCatat)
        .where(eq(masterKondisiCatat.modeHitung, "KREDIT_TAKSASI"))
        .limit(1),
    ]);

    const dpm = dpmRow[0];
    const pemakaianMinimumM3 = Number(pelRow[0]?.pemakaianMinimumM3 ?? 0);
    const tagihanSaatKelebihan =
      (pelRow[0]?.tagihanSaatKelebihan as TagihanSaatKelebihanMode) ||
      "MINIMUM";
    const akumulasiLama = Number(dpm?.akumulasiTaksasiM3 ?? 0);

    const stmlNum = Number(cater.stml);
    let stmaTarget = Number(cater.stma);
    let akumulasiTarget = akumulasiLama;
    let tmssTarget = cater.tmss;
    let ketCatatTarget = cater.ketCatat;
    let modeHitungTarget: ModeHitungKondisiInput = "SELISIH_FISIK";

    if (action === "SET_KONDISI_KELEBIHAN") {
      const kondisiM = kondisiKelebihanRow[0];
      tmssTarget = kondisiM?.kodeTmss ?? "M";
      ketCatatTarget = kondisiM?.nama ?? "KELEBIHAN";
      modeHitungTarget = "KREDIT_TAKSASI";
    } else if (action === "ADJUST_KREDIT_TAKSASI") {
      if (akumulasiTaksasiBaru === undefined || akumulasiTaksasiBaru < 0) {
        throw new Error(
          "akumulasiTaksasiBaru wajib diisi (>= 0) untuk penyesuaian kredit taksasi.",
        );
      }
      akumulasiTarget = akumulasiTaksasiBaru;
    } else if (action === "CORRECT_STAND") {
      if (stmaKoreksi === undefined || stmaKoreksi < stmlNum) {
        throw new Error(
          "stmaKoreksi wajib diisi dan >= stml untuk koreksi angka stand.",
        );
      }
      stmaTarget = stmaKoreksi;
    }

    const hasilMode = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: stmlNum,
      stma: stmaTarget,
      modeHitung: modeHitungTarget,
      pakaiLalu: cater.pakaiLalu !== null ? Number(cater.pakaiLalu) : null,
      pemakaianMinimumM3,
      akumulasiTaksasiM3: akumulasiTarget,
      akumulasiPerluVerifikasi: false,
      tagihanSaatKelebihan,
    });

    const nextStatus = hasilMode.isAnomaliKreditTaksasi
      ? "ANOMALY"
      : "VERIFIED_L1";
    const pakaiFisikBaru = Math.max(0, hasilMode.selisihFisikM3);
    const pakaiTagihBaru = hasilMode.pakaiTagihM3;

    await db.transaction(async (tx) => {
      if (action === "ADJUST_KREDIT_TAKSASI") {
        await tx
          .update(daftarCatat)
          .set({
            akumulasiTaksasiM3: akumulasiTarget.toFixed(2),
            akumulasiPerluVerifikasi: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(daftarCatat.periode, cater.thbl),
              eq(daftarCatat.nolg, cater.nolg),
            ),
          );
      }

      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: "V1",
        action,
        stmaSebelum: cater.stma,
        stmaSesudah: String(hasilMode.stmaEfektif),
        pakaiSebelum: cater.pakaiTagih ?? cater.pakaiM3,
        pakaiSesudah: String(pakaiTagihBaru),
        alasan: `[Resolusi Kredit Taksasi: ${action}] Kredit: ${akumulasiLama} -> ${akumulasiTarget} m³ (Sisa bulan depan: ${hasilMode.akumulasiTaksasiBerikutnya} m³) | ${alasan}`,
      });

      await tx
        .update(caterBacaMeter)
        .set({
          stma: String(hasilMode.stmaEfektif),
          pakaiM3: String(pakaiFisikBaru),
          pakaiTagih: String(pakaiTagihBaru),
          alasanTaksir: hasilMode.alasanTaksir,
          tmss: tmssTarget,
          ketCatat: ketCatatTarget,
          statusVerifikasi: nextStatus,
          catatan: `[RESOLUSI_KREDIT_TAKSASI:${action}] ${alasan}`,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterId));
    });

    return {
      caterId,
      action,
      tmss: tmssTarget,
      ketCatat: ketCatatTarget,
      stml: stmlNum,
      stma: hasilMode.stmaEfektif,
      pakaiFisikM3: pakaiFisikBaru,
      pakaiTagihM3: pakaiTagihBaru,
      akumulasiTaksasiDikurangkan: hasilMode.akumulasiTaksasiDikurangkan,
      akumulasiTaksasiBerikutnya: hasilMode.akumulasiTaksasiBerikutnya,
      statusVerifikasi: nextStatus,
    };
  }
}

export const caterVerifikasiService = new CaterVerifikasiService();
