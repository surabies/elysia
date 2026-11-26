/**
 * Service: Ganti Water Meter (Mutasi & Stand Angkat) & Grand Water Meter (Neraca Air)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 */

import { eq, and, sql, desc } from "drizzle-orm";
import {
  db,
  waterMeter,
  waterMeterMutasi,
  grandWaterMeter,
  gwmBacaMeter,
  caterBacaMeter,
  caterVerifikasiLog,
  daftarCatat,
  pelanggan,
  periodePenagihan,
  rekeningDrd,
  golonganTarif,
} from "@cater/db";
import type { AlasanGantiMeter } from "@cater/types";
import {
  hitungKubikasiGantiMeter,
  hitungKoreksiMbSusulan,
  hitungNeracaAir,
  type HasilNeracaAir,
} from "../../domain/gwm/gwm.engine";
import { evaluasiAnomaliBaris } from "../../domain/cater/anomali-evaluator";
import { aturanAnomaliService } from "../cater/aturan-anomali.service";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "../../lib/cloudinary";

export interface CatatMutasiGantiMeterInput {
  nolg: string;
  periode: number; // e.g. 202601
  alasan: AlasanGantiMeter;
  keterangan?: string;
  noMeterLama: string;
  /** Opsional: boleh menyusul dari Teknik (status DATA_METER_BELUM_LENGKAP). Wajib saat APPROVED. */
  standAngkat?: number | null;
  fotoStandAngkat?: string;
  /** Opsional: boleh menyusul dari Teknik (status DATA_METER_BELUM_LENGKAP). Wajib saat APPROVED. */
  noMeterBaru?: string | null;
  merkBaru?: string;
  ukuranBaru?: string;
  standPasang?: number;
  noSegelBaru?: string;
  fotoMeterBaru?: string;
  petugasPasang?: string;
}

export interface VerifikasiMutasiInput {
  mutasiId: string;
  action: "APPROVE" | "REJECT";
  standBacaBaru?: number; // Pembacaan meter baru bulan berjalan
  catatan?: string;
  userId: string;
}

export interface CatatDebitGwmInput {
  kodeGwm: string;
  periode: number;
  standAwal: number;
  standAkhir: number;
  petugasId?: string;
  fotoStand?: string;
  catatan?: string;
}

export class GwmService {
  async daftarMutasiGantiMeter(
    status?: "DATA_METER_BELUM_LENGKAP" | "PENDING" | "APPROVED" | "REJECTED",
  ) {
    const rows = await db
      .select({
        id: waterMeterMutasi.id,
        nolg: waterMeterMutasi.nolg,
        namaPelanggan: pelanggan.nama,
        alamatPelanggan: pelanggan.alamat,
        noMeterAktif: pelanggan.noMeter,
        periode: waterMeterMutasi.periode,
        alasan: waterMeterMutasi.alasan,
        keterangan: waterMeterMutasi.keterangan,
        noMeterLama: waterMeterMutasi.noMeterLama,
        standAngkat: waterMeterMutasi.standAngkat,
        noMeterBaru: waterMeterMutasi.noMeterBaru,
        merkBaru: waterMeterMutasi.merkBaru,
        ukuranBaru: waterMeterMutasi.ukuranBaru,
        standPasang: waterMeterMutasi.standPasang,
        statusVerifikasi: waterMeterMutasi.statusVerifikasi,
        catatanVerifikasi: waterMeterMutasi.catatanVerifikasi,
        standLaluLaporan: caterBacaMeter.stml,
        standAkhirLaporan: caterBacaMeter.stma,
      })
      .from(waterMeterMutasi)
      .innerJoin(pelanggan, eq(waterMeterMutasi.nolg, pelanggan.nolg))
      .leftJoin(
        caterBacaMeter,
        sql`${caterBacaMeter.id} = 'cater-' || ${waterMeterMutasi.periode}::text || '-' || ${waterMeterMutasi.nolg}`,
      )
      .where(status ? eq(waterMeterMutasi.statusVerifikasi, status) : undefined)
      .orderBy(desc(waterMeterMutasi.updatedAt))
      .limit(100);

    return rows;
  }

  /**
   * Mencatat data berita acara penggantian meter air pelanggan (Ganti Water Meter)
   */
  async catatMutasiGantiMeter(input: CatatMutasiGantiMeterInput) {
    const {
      nolg,
      periode,
      alasan,
      keterangan,
      noMeterLama,
      standAngkat,
      fotoStandAngkat,
      noMeterBaru,
      merkBaru,
      ukuranBaru = "1/2",
      standPasang = 0,
      noSegelBaru,
      fotoMeterBaru,
      petugasPasang,
    } = input;

    const [cust] = await db
      .select({ nolg: pelanggan.nolg })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const id = `mutasi-${periode}-${nolg}`;
    const [mutasiTersimpan] = await db
      .select({ statusVerifikasi: waterMeterMutasi.statusVerifikasi })
      .from(waterMeterMutasi)
      .where(eq(waterMeterMutasi.id, id));

    if (mutasiTersimpan?.statusVerifikasi === "APPROVED") {
      throw new Error(
        "Mutasi ganti meter untuk pelanggan dan periode ini sudah disetujui.",
      );
    }

    // Standardisasi & Upload Cloudinary jika input adalah Base64 DataURL
    let processedFotoStandAngkat = fotoStandAngkat;
    let processedFotoMeterBaru = fotoMeterBaru;

    if (isCloudinaryConfigured()) {
      if (fotoStandAngkat && fotoStandAngkat.startsWith("data:image/")) {
        try {
          const res = await uploadToCloudinary({
            file: fotoStandAngkat,
            modul: "gwm",
            jenis: "angkat",
            identifier: nolg,
            thbl: String(periode),
          });
          processedFotoStandAngkat = res.secureUrl;
        } catch (err) {
          console.error("[CLOUDINARY_GWM_ANGKAT_UPLOAD_ERR]", err);
        }
      }

      if (fotoMeterBaru && fotoMeterBaru.startsWith("data:image/")) {
        try {
          const res = await uploadToCloudinary({
            file: fotoMeterBaru,
            modul: "gwm",
            jenis: "pasang",
            identifier: nolg,
            thbl: String(periode),
          });
          processedFotoMeterBaru = res.secureUrl;
        } catch (err) {
          console.error("[CLOUDINARY_GWM_PASANG_UPLOAD_ERR]", err);
        }
      }
    }

    const dataLengkap =
      standAngkat !== undefined &&
      standAngkat !== null &&
      !!noMeterBaru &&
      noMeterBaru.trim() !== "";
    const statusBaru = dataLengkap ? "PENDING" : "DATA_METER_BELUM_LENGKAP";

    await db
      .insert(waterMeterMutasi)
      .values({
        id,
        nolg,
        periode,
        alasan,
        keterangan,
        noMeterLama,
        standAngkat: standAngkat ?? null,
        fotoStandAngkat: processedFotoStandAngkat,
        noMeterBaru: noMeterBaru ?? null,
        merkBaru,
        ukuranBaru,
        standPasang,
        noSegelBaru,
        fotoMeterBaru: processedFotoMeterBaru,
        petugasPasang,
        statusVerifikasi: statusBaru,
      })
      .onConflictDoUpdate({
        target: waterMeterMutasi.id,
        set: {
          alasan,
          keterangan,
          noMeterLama,
          // Data yang menyusul dari Teknik tidak boleh tertimpa NULL oleh kiriman parsial
          standAngkat: sql`COALESCE(${standAngkat ?? null}::integer, ${waterMeterMutasi.standAngkat})`,
          fotoStandAngkat: processedFotoStandAngkat,
          noMeterBaru: sql`COALESCE(${noMeterBaru ?? null}::varchar, ${waterMeterMutasi.noMeterBaru})`,
          merkBaru,
          ukuranBaru,
          standPasang,
          noSegelBaru,
          fotoMeterBaru: processedFotoMeterBaru,
          petugasPasang,
          statusVerifikasi: sql`CASE WHEN COALESCE(${standAngkat ?? null}::integer, ${waterMeterMutasi.standAngkat}) IS NOT NULL AND COALESCE(${noMeterBaru ?? null}::varchar, ${waterMeterMutasi.noMeterBaru}) IS NOT NULL THEN 'PENDING' ELSE 'DATA_METER_BELUM_LENGKAP' END`,
          updatedAt: new Date(),
        },
      });

    const [tersimpan] = await db
      .select({
        statusVerifikasi: waterMeterMutasi.statusVerifikasi,
        standAngkat: waterMeterMutasi.standAngkat,
      })
      .from(waterMeterMutasi)
      .where(eq(waterMeterMutasi.id, id));

    return {
      id,
      nolg,
      periode,
      standAngkat: tersimpan?.standAngkat ?? null,
      standPasang,
      statusVerifikasi: tersimpan?.statusVerifikasi ?? statusBaru,
      pesan:
        (tersimpan?.statusVerifikasi ?? statusBaru) ===
        "DATA_METER_BELUM_LENGKAP"
          ? "Mutasi dicatat dengan status DATA_METER_BELUM_LENGKAP; no_meter_baru & stand_angkat menyusul dari Teknik (tidak memblokir pembacaan maupun closing)."
          : "Data mutasi ganti meter berhasil dicatat dan menunggu verifikasi supervisor.",
    };
  }

  /**
   * Verifikasi Penggantian Water Meter oleh Supervisor
   * APPROVE: Menghitung kubikasi gabungan (Stand Angkat - Stand Lalu) + (Stand Baru - Stand Pasang)
   * dan mencatatnya ke cater_baca_meter dengan kode MB (4)
   */
  async verifikasiMutasiGantiMeter(input: VerifikasiMutasiInput) {
    const { mutasiId, action, standBacaBaru, catatan, userId } = input;

    const [mutasi] = await db
      .select()
      .from(waterMeterMutasi)
      .where(eq(waterMeterMutasi.id, mutasiId));

    if (!mutasi) {
      throw new Error(`Data mutasi ganti meter ${mutasiId} tidak ditemukan.`);
    }

    if (action === "REJECT") {
      await db
        .update(waterMeterMutasi)
        .set({
          statusVerifikasi: "REJECTED",
          catatanVerifikasi: catatan || "Ditolak oleh supervisor",
          verifikatorId: userId,
          tglVerifikasi: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(waterMeterMutasi.id, mutasiId));

      return {
        mutasiId,
        statusVerifikasi: "REJECTED",
        message: "Pengajuan ganti water meter ditolak.",
      };
    }

    // Aksi: APPROVE
    const periodeStr = String(mutasi.periode);
    const caterId = `cater-${periodeStr}-${mutasi.nolg}`;

    if (
      mutasi.standAngkat === null ||
      mutasi.standAngkat === undefined ||
      !mutasi.noMeterBaru ||
      mutasi.noMeterBaru.trim() === ""
    ) {
      throw new Error(
        "Mutasi belum dapat disetujui: no_meter_baru dan stand_angkat wajib terisi (status masih DATA_METER_BELUM_LENGKAP).",
      );
    }

    const [periodeRow] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));
    if (periodeRow?.status === "TERKUNCI") {
      throw new Error(
        `Periode ${periodeStr} sudah TERKUNCI. Pemakaian meter lama tidak boleh ditambahkan ke bulan berikutnya; koreksi atas bulan kejadian memerlukan mekanisme koreksi DRD (menunggu persetujuan). Gunakan pratinjauKoreksiMbSusulan untuk melihat selisih.`,
      );
    }

    if (standBacaBaru === undefined) {
      throw new Error(
        "Stand baca meter baru wajib diisi sebelum mutasi disetujui.",
      );
    }

    const [existingCater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    const [existingDpm] = await db
      .select()
      .from(daftarCatat)
      .where(
        and(
          eq(daftarCatat.periode, periodeStr),
          eq(daftarCatat.nolg, mutasi.nolg),
        ),
      );

    // Jika caterBacaMeter bulan berjalan belum ada, ambil standLalu dari daftar_catat.stand_awal atau bacaan terakhir
    let standLaluStr = existingCater?.stml ?? existingDpm?.standAwal ?? null;
    let pakaiLaluStr =
      existingCater?.pakaiLalu ?? existingDpm?.pakaiLalu ?? "0";
    let ruteKodeVal = existingCater?.ruteKode ?? existingDpm?.ruteKode ?? null;
    let petugasIdVal =
      existingCater?.petugasId ?? existingDpm?.petugasId ?? null;

    if (standLaluStr === null) {
      const [lastReading] = await db
        .select({
          stma: caterBacaMeter.stma,
          stmaRevisi: caterBacaMeter.stmaRevisi,
          pakaiTagih: caterBacaMeter.pakaiTagih,
          pakaiM3: caterBacaMeter.pakaiM3,
          ruteKode: caterBacaMeter.ruteKode,
          petugasId: caterBacaMeter.petugasId,
        })
        .from(caterBacaMeter)
        .where(
          and(
            eq(caterBacaMeter.nolg, mutasi.nolg),
            sql`${caterBacaMeter.thbl} < ${periodeStr}`,
          ),
        )
        .orderBy(desc(caterBacaMeter.thbl))
        .limit(1);

      standLaluStr = String(
        lastReading?.stmaRevisi ?? lastReading?.stma ?? "0",
      );
      pakaiLaluStr = String(
        lastReading?.pakaiTagih ?? lastReading?.pakaiM3 ?? "0",
      );
      ruteKodeVal = ruteKodeVal ?? lastReading?.ruteKode ?? null;
      petugasIdVal = petugasIdVal ?? lastReading?.petugasId ?? null;
    }

    const standLalu = Number(standLaluStr);
    const bacaBaru = standBacaBaru;

    const kalkulasi = hitungKubikasiGantiMeter({
      standLalu,
      standAngkat: mutasi.standAngkat,
      standPasang: mutasi.standPasang,
      standBacaBaru: bacaBaru,
    });

    if (!kalkulasi.isValid) {
      throw new Error(kalkulasi.pesanError);
    }

    await db.transaction(async (tx) => {
      // 1. Update status dokumen mutasi ganti meter
      await tx
        .update(waterMeterMutasi)
        .set({
          statusVerifikasi: "APPROVED",
          verifikatorId: userId,
          catatanVerifikasi: catatan || "Disetujui oleh Supervisor",
          tglVerifikasi: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(waterMeterMutasi.id, mutasiId));

      // 1b. Buat/update aset water_meter baru dan tautkan ke master pelanggan (mendukung pelanggan yang awalnya no_meter = NULL)
      if (mutasi.noMeterBaru && mutasi.noMeterBaru.trim() !== "-") {
        const cleanMeterBaru = mutasi.noMeterBaru.trim();
        const ukuranBaru = mutasi.ukuranBaru || "1/2";
        await tx
          .insert(waterMeter)
          .values({
            noMeter: cleanMeterBaru,
            merk: mutasi.merkBaru ?? null,
            ukuran: ukuranBaru,
            noSegel: mutasi.noSegelBaru ?? null,
            tglPasang: mutasi.tglGanti ?? new Date(),
            kondisi: "Normal",
          })
          .onConflictDoUpdate({
            target: waterMeter.noMeter,
            set: {
              merk: mutasi.merkBaru ?? null,
              ukuran: ukuranBaru,
              noSegel: mutasi.noSegelBaru ?? null,
              tglPasang: mutasi.tglGanti ?? new Date(),
            },
          });

        await tx
          .update(pelanggan)
          .set({
            noMeter: cleanMeterBaru,
            ukuranMeter: ukuranBaru,
            merkMeter: mutasi.merkBaru ?? null,
            tglPasangMeter: mutasi.tglGanti ?? new Date(),
            perluVerifikasi: false,
            updatedAt: new Date(),
          })
          .where(eq(pelanggan.nolg, mutasi.nolg));
      }

      // 2. Simpan / Perbarui transaksi pembacaan meter utama
      const { rules, maps, versi } = await aturanAnomaliService.getCachedEngineContext();
      const evalRes = evaluasiAnomaliBaris(
        {
          stml: Number(standLaluStr),
          stma: Number(bacaBaru),
          pakaiM3: Number(kalkulasi.totalPemakaianM3),
          pakaiLalu: pakaiLaluStr ? Number(pakaiLaluStr) : null,
          kodeTmss: "4",
        },
        rules,
        maps,
        versi
      );

      await tx
        .insert(caterBacaMeter)
        .values({
          id: caterId,
          thbl: periodeStr,
          nolg: mutasi.nolg,
          ruteKode: ruteKodeVal,
          petugasId: petugasIdVal,
          stml: standLaluStr,
          stma: String(bacaBaru),
          pakaiM3: String(kalkulasi.totalPemakaianM3),
          pakaiTagih: String(kalkulasi.totalPemakaianM3),
          pakaiLalu: pakaiLaluStr,
          tmss: "4", // Kode STI '4 - MB'
          ketCatat: "MB",
          waterMeterMutasiId: mutasi.id,
          statusVerifikasi: "VERIFIED_L1",
          isAnomali: evalRes.isAnomali,
          kodeAnomaliUtama: evalRes.kodeUtama,
          kodeAnomaliList: evalRes.kodeList,
          aturanVersi: versi,
          catatan: `[Ganti Meter/MB] Stand Angkat: ${mutasi.standAngkat} | Stand Pasang: ${mutasi.standPasang}`,
        })
        .onConflictDoUpdate({
          target: [caterBacaMeter.thbl, caterBacaMeter.nolg],
          set: {
            stml: standLaluStr,
            stma: String(bacaBaru),
            pakaiM3: String(kalkulasi.totalPemakaianM3),
            pakaiTagih: String(kalkulasi.totalPemakaianM3),
            pakaiLalu: pakaiLaluStr,
            tmss: "4",
            ketCatat: "MB",
            waterMeterMutasiId: mutasi.id,
            statusVerifikasi: "VERIFIED_L1",
            isAnomali: evalRes.isAnomali,
            kodeAnomaliUtama: evalRes.kodeUtama,
            kodeAnomaliList: evalRes.kodeList,
            aturanVersi: versi,
            catatan: `[Ganti Meter/MB] Stand Angkat: ${mutasi.standAngkat} | Stand Pasang: ${mutasi.standPasang}`,
            updatedAt: new Date(),
          },
        });

      // 2b. Tandai DPM periode berjalan sebagai DICATAT
      await tx
        .update(daftarCatat)
        .set({
          status: "DICATAT",
          selesaiAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            eq(daftarCatat.nolg, mutasi.nolg),
          ),
        );

      // 3. Catat di audit log verifikasi
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: "V1",
        action: "APPROVE",
        stmaSebelum: existingCater?.stma ?? null,
        stmaSesudah: String(bacaBaru),
        pakaiSebelum: existingCater?.pakaiM3 ?? null,
        pakaiSesudah: String(kalkulasi.totalPemakaianM3),
        alasan: `Pengesahan Berita Acara Ganti Water Meter (${mutasi.alasan}). Total tagihan: ${kalkulasi.totalPemakaianM3} m3`,
      });
    });

    return {
      mutasiId,
      caterId,
      statusVerifikasi: "APPROVED",
      pakaiMeterLama: kalkulasi.pakaiMeterLama,
      pakaiMeterBaru: kalkulasi.pakaiMeterBaru,
      totalPemakaianM3: kalkulasi.totalPemakaianM3,
      message:
        "Ganti water meter berhasil disahkan dan tagihan dihitung presisi.",
    };
  }

  /**
   * READ-ONLY. Pratinjau koreksi MB yang datanya menyusul setelah periode closed.
   * Tidak menulis apa pun (mekanisme koreksi/tagihan susulan DRD belum ada; menunggu persetujuan).
   */
  async pratinjauKoreksiMbSusulan(mutasiId: string) {
    const [m] = await db
      .select()
      .from(waterMeterMutasi)
      .where(eq(waterMeterMutasi.id, mutasiId));
    if (!m) throw new Error(`Mutasi ${mutasiId} tidak ditemukan.`);
    if (m.standAngkat === null) throw new Error("stand_angkat belum terisi.");
    const periodeStr = String(m.periode);
    const [row] = await db
      .select({
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        pakaiDrd: rekeningDrd.pakaiM3,
        minimum: golonganTarif.pemakaianMinimumM3,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(pelanggan.nolg, caterBacaMeter.nolg))
      .leftJoin(golonganTarif, eq(golonganTarif.kode, pelanggan.tarifKode))
      .leftJoin(
        rekeningDrd,
        and(
          eq(rekeningDrd.thbl, caterBacaMeter.thbl),
          eq(rekeningDrd.nolg, caterBacaMeter.nolg),
        ),
      )
      .where(
        and(
          eq(caterBacaMeter.thbl, periodeStr),
          eq(caterBacaMeter.nolg, m.nolg),
        ),
      );
    if (!row) throw new Error("Bacaan bulan kejadian tidak ditemukan.");
    return hitungKoreksiMbSusulan({
      standLalu: Number(row.stml),
      standAngkat: m.standAngkat,
      standPasang: m.standPasang,
      standBacaBaru: Number(row.stma),
      pemakaianMinimumM3: Number(row.minimum ?? 0),
      pakaiTagihTerbit: Number(row.pakaiDrd ?? row.pakaiTagih ?? 0),
    });
  }
  /**
   * Mencatat debit rutin Grand Water Meter (Meter Induk Zona DMA)
   */
  async catatDebitGwm(input: CatatDebitGwmInput) {
    const {
      kodeGwm,
      periode,
      standAwal,
      standAkhir,
      petugasId,
      fotoStand,
      catatan,
    } = input;

    const [gwm] = await db
      .select({ id: grandWaterMeter.id, zonaKode: grandWaterMeter.zonaKode })
      .from(grandWaterMeter)
      .where(eq(grandWaterMeter.kodeGwm, kodeGwm));

    if (!gwm) {
      throw new Error(
        `Grand Water Meter dengan kode ${kodeGwm} tidak ditemukan.`,
      );
    }

    const totalDebitM3 = Math.max(0, standAkhir - standAwal);
    const id = `gwm-baca-${periode}-${kodeGwm}`;

    await db
      .insert(gwmBacaMeter)
      .values({
        id,
        gwmId: gwm.id,
        periode,
        standAwal,
        standAkhir,
        totalDebitM3,
        petugasId,
        fotoStand,
        catatan,
      })
      .onConflictDoNothing();

    return {
      id,
      kodeGwm,
      periode,
      totalDebitM3,
      message: "Pencatatan debit Grand Water Meter berhasil disimpan.",
    };
  }

  /**
   * Menghitung Neraca Air (Water Balance) & Tingkat Kehilangan Air (NRW) untuk Zona Tertentu
   */
  async hitungNeracaAirZona(
    zonaKode: string,
    periode: number,
  ): Promise<HasilNeracaAir> {
    const periodeStr = String(periode);

    // 1. Akumulasi debit masuk seluruh GWM induk di zona ini
    const debitGwmRows = await db
      .select({
        totalDebit: sql<number>`COALESCE(SUM(${gwmBacaMeter.totalDebitM3}), 0)::int`,
      })
      .from(gwmBacaMeter)
      .innerJoin(grandWaterMeter, eq(gwmBacaMeter.gwmId, grandWaterMeter.id))
      .where(
        and(
          eq(grandWaterMeter.zonaKode, zonaKode),
          eq(gwmBacaMeter.periode, periode),
        ),
      );

    const totalDebitGwmM3 = debitGwmRows[0]?.totalDebit ?? 0;

    // 2. Akumulasi pemakaian air pelanggan yang terjual di rute yang masuk zona ini
    const pemakaianPelangganRows = await db
      .select({
        totalPakai: sql<number>`COALESCE(SUM(${caterBacaMeter.pakaiTagih}::float), SUM(${caterBacaMeter.pakaiM3}::float), 0)::float`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, periodeStr));

    const totalPemakaianPelangganM3 = Math.round(
      pemakaianPelangganRows[0]?.totalPakai ?? 0,
    );

    return hitungNeracaAir({
      totalDebitGwmM3,
      totalPemakaianPelangganM3,
    });
  }
}

export const gwmService = new GwmService();
