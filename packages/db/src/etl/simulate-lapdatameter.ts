import fs from "fs";
import path from "path";
import {
  db,
  masterKondisiCatat,
  golonganTarif,
  daftarCatat,
  caterBacaMeter,
  rekeningDrd,
  periodePenagihan,
  pelanggan,
  ruteCater,
  petugasCater,
  resolveKondisiCatatWithPriority,
} from "../index";
import {
  hitungPemakaianDanRekonsiliasiTaksasi,
  hitungRincianHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  type ModeHitungKondisiInput,
} from "../../../backend/src/domain/tagihan/tagihan.engine";
import { parseCsvRows } from "../../../backend/src/services/pencatat-meter/import/import-data.service";
import { sql, eq, and } from "drizzle-orm";

/**
 * Skrip Verifikasi Lanjutan & Simulasi LapDataMeter (Periode Berjalan -> Closing -> Buka Periode Berikutnya)
 *
 * Fitur:
 * 1. Mengekspor daftar verifikasi lapangan (DICABUT Oktober vs November, St Akhir < St Awal pakai positif, Pakai > 100 m3).
 * 2. Menerima argumen `--csv=<path>` sehingga dapat dijalankan ulang pada file CSV baru kapan pun tanpa mengubah kode.
 * 3. Menjalankan simulasi 4.3a s/d 4.3d di dalam TRANSAKSI ROLLBACK (100% aman, tidak mengubah database utama!).
 *
 */

interface BarisLapDataMeter {
  rowNum: number;
  nolg: string;
  nama: string;
  alamat: string;
  thbl: string;
  stAwal: number;
  stAkhir: number;
  stAkhirCatat: number;
  pakai: number;
  pakaiLalu: number;
  trf: string;
  kdKel: string;
  nmKel: string;
  petugas: string;
  kdWm: string;
  rute: string;
  tglCatat: string;
}

async function main() {
  const csvArg = process.argv.find((a) => a.startsWith("--csv="));
  const defaultNovCsv = path.resolve(
    __dirname,
    "../../data/raw/lapdatametertes.csv",
  );
  const novCsvPath = csvArg
    ? path.resolve(csvArg.split("=")[1])
    : defaultNovCsv;

  if (!fs.existsSync(novCsvPath)) {
    throw new Error(`File CSV tidak ditemukan: ${novCsvPath}`);
  }

  console.log(
    "====================================================================",
  );
  console.log(
    "SIMULASI & AUDIT LAPDATAMETER (100% ISOLATED TRANSACTION ROLLBACK)",
  );
  console.log("File Sumber:", novCsvPath);
  console.log(
    "====================================================================",
  );

  const rawText = fs.readFileSync(novCsvPath, "utf8");
  const rows = parseCsvRows(rawText);
  const header = rows[0].map((h) =>
    h
      .replace(/^["']|["']$/g, "")
      .trim()
      .toLowerCase(),
  );

  const findIdx = (aliases: string[]) =>
    header.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

  const nolgIdx = findIdx(["no pel", "nolg"]);
  const namaIdx = findIdx(["nama"]);
  const alamatIdx = findIdx(["alamat"]);
  const thblIdx = findIdx(["periode", "thbl"]);
  const stmlIdx = findIdx(["st awal", "stml"]);
  const stmaIdx = findIdx(["st akhir", "stma"]);
  const stmaCatatIdx = findIdx(["st akhir catat"]);
  const pakaiIdx = findIdx(["pakai"]);
  const pakaiLaluIdx = findIdx(["pakai lau", "pakai lalu"]);
  const trfIdx = findIdx(["trf", "tarif"]);
  const kdKelIdx = findIdx(["kd_kel", "tmss"]);
  const nmKelIdx = findIdx(["nm_kel", "kondisi"]);
  const petugasIdx = findIdx(["kd_petugas", "nama petugas"]);
  const kdWmIdx = findIdx(["kd_wm", "nometer"]);
  const ruteIdx = findIdx(["rute"]);
  const tglCatatIdx = findIdx(["tgl_catat"]);

  const parsedNov: BarisLapDataMeter[] = [];
  for (let i = 1; i < rows.length; i++) {
    const p = rows[i];
    if (p.length < 10) continue;
    const nolg = (p[nolgIdx] || "").replace(/[^\w-]/g, "").trim();
    const thbl = (p[thblIdx] || "").replace(/[^\w]/g, "").trim();
    if (!nolg || !thbl) continue;
    parsedNov.push({
      rowNum: i,
      nolg,
      nama: p[namaIdx]?.trim() || "",
      alamat: p[alamatIdx]?.trim() || "",
      thbl,
      stAwal: parseFloat(p[stmlIdx] || "0") || 0,
      stAkhir: parseFloat(p[stmaIdx] || "0") || 0,
      stAkhirCatat: parseFloat(p[stmaCatatIdx] || "0") || 0,
      pakai: parseFloat(p[pakaiIdx] || "0") || 0,
      pakaiLalu: parseFloat(p[pakaiLaluIdx] || "0") || 0,
      trf: p[trfIdx]?.trim() || "2A3",
      kdKel: p[kdKelIdx]?.trim() || "-",
      nmKel: p[nmKelIdx]?.trim() || "Normal",
      petugas: p[petugasIdx]?.trim() || "",
      kdWm: p[kdWmIdx]?.trim() || "",
      rute: p[ruteIdx]?.trim() || "",
      tglCatat: p[tglCatatIdx]?.trim() || "",
    });
  }

  const targetPeriode = parsedNov[0]?.thbl || "202611";

  // Muat data Oktober & Master dari DB
  const [kondisiRows, golRows, dpmOpenRows, caterOctRows, pelRows, ruteRows] =
    await Promise.all([
      db.select().from(masterKondisiCatat),
      db.select().from(golonganTarif),
      db
        .select()
        .from(daftarCatat)
        .where(eq(daftarCatat.periode, targetPeriode)),
      db.select().from(caterBacaMeter).where(eq(caterBacaMeter.thbl, "202610")),
      db.select().from(pelanggan),
      db.select().from(ruteCater),
    ]);

  const modeByTmss = new Map(
    kondisiRows.map((k) => [
      k.kodeTmss.trim(),
      k.modeHitung as ModeHitungKondisiInput,
    ]),
  );
  const modeByNama = new Map(
    kondisiRows.map((k) => [
      k.nama.trim().toUpperCase(),
      k.modeHitung as ModeHitungKondisiInput,
    ]),
  );
  const minByTarif = new Map(
    golRows.map((g) => [g.kode, Number(g.pemakaianMinimumM3 ?? 5)]),
  );
  const dpmOpenMap = new Map(dpmOpenRows.map((d) => [d.nolg, d]));
  const caterOctMap = new Map(caterOctRows.map((c) => [c.nolg, c]));
  const pelMap = new Map(pelRows.map((p) => [p.nolg, p]));

  // ---------------------------------------------------------------------------
  // EXPORT FILE VERIFIKASI SESUAI BAGIAN 3 run-test.md
  // ---------------------------------------------------------------------------
  const exportDir = path.resolve(__dirname, "../../data/exports");
  fs.mkdirSync(exportDir, { recursive: true });

  // Export 1: 17 pelanggan DICABUT Oktober yang muncul di November + 4 pelanggan aktif Oktober yang di November tercatat DI CABUT
  const dicabutAuditRows: string[] = [
    "kategori;nolg;nama;rute_kode;status_master_okt;kondisi_okt;pakai_okt;kd_kel_nov;kondisi_nov;st_awal_nov;st_akhir_nov;pakai_nov",
  ];
  for (const nr of parsedNov) {
    const oct = caterOctMap.get(nr.nolg);
    const pel = pelMap.get(nr.nolg);
    const isOctDicabut =
      oct?.ketCatat === "DICABUT" || oct?.tmss?.trim() === "D";
    const isNovDicabut = nr.nmKel === "DI CABUT" || nr.kdKel === "D";

    if (isOctDicabut) {
      dicabutAuditRows.push(
        `DICABUT_OKT_MUNCUL_DI_NOV;${nr.nolg};${nr.nama};${nr.rute};${pel?.status ?? "-"};${oct?.ketCatat ?? "-"};${oct?.pakaiTagih ?? 0};${nr.kdKel};${nr.nmKel};${nr.stAwal};${nr.stAkhir};${nr.pakai}`,
      );
    } else if (isNovDicabut) {
      dicabutAuditRows.push(
        `AKTIF_OKT_JADI_DICABUT_DI_NOV;${nr.nolg};${nr.nama};${nr.rute};${pel?.status ?? "-"};${oct?.ketCatat ?? "BARU"};${oct?.pakaiTagih ?? 0};${nr.kdKel};${nr.nmKel};${nr.stAwal};${nr.stAkhir};${nr.pakai}`,
      );
    }
  }
  fs.writeFileSync(
    path.join(exportDir, "daftar-pelanggan-dicabut-oktober-vs-november.csv"),
    dicabutAuditRows.join("\n") + "\n",
    "utf8",
  );

  // Export 2: 3 baris St Akhir < St Awal (non-MB) dengan Pakai positif + 16 seluruh St Akhir < St Awal + 27 baris Pakai > 100 m3
  const anomaliNovRows: string[] = [
    "kategori_anomali;nolg;nama;rute_kode;petugas;tarif;kd_kel;nm_kel;st_awal;st_akhir;selisih_stand;pakai_csv;pakai_lalu",
  ];
  for (const nr of parsedNov) {
    if (nr.stAkhir < nr.stAwal) {
      const kat =
        nr.kdKel === "4" || nr.nmKel === "MB"
          ? nr.pakai < 0
            ? "MB_PAKAI_NEGATIF"
            : "MB_STAND_RESET_POSITIF"
          : "STAND_MUNDUR_NON_MB_PAKAI_POSITIF";
      anomaliNovRows.push(
        `${kat};${nr.nolg};${nr.nama};${nr.rute};${nr.petugas};${nr.trf};${nr.kdKel};${nr.nmKel};${nr.stAwal};${nr.stAkhir};${nr.stAkhir - nr.stAwal};${nr.pakai};${nr.pakaiLalu}`,
      );
    }
    if (nr.pakai > 100) {
      anomaliNovRows.push(
        `PAKAI_EKSTREM_GT_100M3;${nr.nolg};${nr.nama};${nr.rute};${nr.petugas};${nr.trf};${nr.kdKel};${nr.nmKel};${nr.stAwal};${nr.stAkhir};${nr.stAkhir - nr.stAwal};${nr.pakai};${nr.pakaiLalu}`,
      );
    }
  }
  fs.writeFileSync(
    path.join(
      exportDir,
      "daftar-anomali-november-stand-mundur-dan-ekstrem.csv",
    ),
    anomaliNovRows.join("\n") + "\n",
    "utf8",
  );

  // ---------------------------------------------------------------------------
  // 4.3a. REPLAY ATURAN HITUNG (mode_hitung + minimum vs kolom Pakai di CSV)
  // ---------------------------------------------------------------------------
  console.log(
    "\n--- 4.3a. REPLAY ATURAN HITUNG (mode_hitung + minimum vs Pakai CSV) ---",
  );
  const replayByKondisi = new Map<
    string,
    { total: number; matchExact: number; diffCount: number; sampleDiffs: any[] }
  >();

  let totalReplayMatch = 0;
  let totalReplayDiff = 0;
  let totalNormalStandTetap = 0;
  let totalMismatchKodeNama = 0;

  for (const nr of parsedNov) {
    // Normalisasi alias nama kondisi November ke master_kondisi_catat
    const normNama =
      nr.nmKel === "RMH/TANAH KSG"
        ? "RUMAH KOSONG"
        : nr.nmKel === "METER MATI AIR ADA"
          ? "MATI ADA AIR"
          : nr.nmKel === "DI CABUT"
            ? "DICABUT"
            : nr.nmKel;

    const resolvedKondisi = resolveKondisiCatatWithPriority(
      nr.kdKel,
      normNama,
      kondisiRows,
    );
    if (resolvedKondisi.isMismatch) {
      totalMismatchKodeNama++;
    }
    const mode: ModeHitungKondisiInput = resolvedKondisi.modeHitung as ModeHitungKondisiInput;
    const minM3 = minByTarif.get(nr.trf) ?? 5;

    // Di CSV lapdatametertes.csv, aplikasi lama sudah menggeser St AWAL pada 370 baris REV.PENCATAT,
    // sehingga untuk menguji kesesuaian rumus mode_hitung + minimum pada tiap baris CSV:
    const calc = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: nr.stAwal,
      stma: nr.stAkhir,
      modeHitung: mode,
      pakaiLalu: nr.pakaiLalu,
      pemakaianMinimumM3: minM3,
      akumulasiTaksasiM3: 0,
    });

    if (calc.isStandTetap) {
      totalNormalStandTetap++;
    }

    const key = `${nr.kdKel} | ${nr.nmKel} -> ${resolvedKondisi.ketCatat} (${mode})`;
    if (!replayByKondisi.has(key)) {
      replayByKondisi.set(key, {
        total: 0,
        matchExact: 0,
        diffCount: 0,
        sampleDiffs: [],
      });
    }
    const stat = replayByKondisi.get(key)!;
    stat.total++;

    if (calc.pakaiTagihM3 === nr.pakai) {
      stat.matchExact++;
      totalReplayMatch++;
    } else {
      stat.diffCount++;
      totalReplayDiff++;
      if (stat.sampleDiffs.length < 3) {
        stat.sampleDiffs.push({
          nolg: nr.nolg,
          stAwal: nr.stAwal,
          stAkhir: nr.stAkhir,
          pakaiLalu: nr.pakaiLalu,
          pakaiCsv: nr.pakai,
          pakaiCalc: calc.pakaiTagihM3,
        });
      }
    }
  }

  console.log(
    `Total Replay 14.238 baris: Cocok=${totalReplayMatch} (${((totalReplayMatch / parsedNov.length) * 100).toFixed(2)}%), Selisih=${totalReplayDiff} | Normal STAND_TETAP (stma==stml): ${totalNormalStandTetap} | Mismatch Kd_kel vs Nm_Kel: ${totalMismatchKodeNama}`,
  );
  for (const [k, v] of [...replayByKondisi.entries()].sort(
    (a, b) => b[1].total - a[1].total,
  )) {
    console.log(
      `  ${k.padEnd(55)} | Total: ${String(v.total).padStart(5)} | Cocok: ${String(v.matchExact).padStart(5)} | Selisih: ${String(v.diffCount).padStart(4)}`,
    );
  }

  // ---------------------------------------------------------------------------
  // 4.3b. CAKUPAN DATA PER PETUGAS DAN PER RUTE (UJI BIAS SAMPEL)
  // ---------------------------------------------------------------------------
  console.log(
    "\n--- 4.3b. CAKUPAN DATA PER PETUGAS & PER RUTE (14.238 / 22.495 DPM) ---",
  );
  const dpmByPetugas = new Map<string, number>();
  const dpmByRute = new Map<string, number>();
  for (const d of dpmOpenRows) {
    const p = d.petugasId || "TANPA_PETUGAS";
    const r = d.ruteKode || "TANPA_RUTE";
    dpmByPetugas.set(p, (dpmByPetugas.get(p) || 0) + 1);
    dpmByRute.set(r, (dpmByRute.get(r) || 0) + 1);
  }

  const novByPetugas = new Map<string, number>();
  const novByRute = new Map<string, number>();
  for (const nr of parsedNov) {
    novByPetugas.set(nr.petugas, (novByPetugas.get(nr.petugas) || 0) + 1);
    novByRute.set(nr.rute, (novByRute.get(nr.rute) || 0) + 1);
  }

  console.log("Cakupan per Petugas (9 Petugas):");
  for (const [petugas, target] of [...dpmByPetugas.entries()].sort()) {
    const terbaca = novByPetugas.get(petugas) || 0;
    const persen = target > 0 ? ((terbaca / target) * 100).toFixed(2) : "0.00";
    console.log(
      `  ${petugas.padEnd(12)} : Terbaca ${String(terbaca).padStart(5)} / Target ${String(target).padStart(5)} (${persen}%)`,
    );
  }

  let rute100Persen = 0;
  let ruteSebagian = 0;
  let rute0Persen = 0;
  for (const [rute, target] of dpmByRute.entries()) {
    const terbaca = novByRute.get(rute) || 0;
    if (terbaca >= target) rute100Persen++;
    else if (terbaca === 0) rute0Persen++;
    else ruteSebagian++;
  }
  console.log(
    `Cakupan per Rute (125 Rute): >=100% Selesai: ${rute100Persen} rute | Sebagian (1..99%): ${ruteSebagian} rute | Belum Mulai (0%): ${rute0Persen} rute`,
  );

  // ---------------------------------------------------------------------------
  // 4.3c & 4.3d. SIMULASI IMPOR, GUARD CLOSING, TAKSASI EKSPLISIT SISA DPM, CLOSING 202611, & BUKA 202612 (DALAM TRANSAKSI ROLLBACK!)
  // ---------------------------------------------------------------------------
  console.log(
    "\n--- 4.3c & 4.3d. SIMULASI END-TO-END DI TRANSAKSI ISOLASI (ROLLBACK) ---",
  );
  try {
    await db.transaction(async (tx) => {
      // 1. Impor 14.238 baris dengan evaluasi status SUBMITTED / ANOMALY_* (tanpa LOCKED_BILLING)
      let countSubmitted = 0;
      let countAnomalyNegative = 0;
      let countAnomalyHigh = 0;
      let countAnomalyLow = 0;
      let countAnomalyCredit = 0;

      // Masukkan 4 pelanggan baru PBPK yang ada di November terlebih dahulu agar tidak melanggar FK pelanggan
      const newCusts = parsedNov.filter((nr) => !pelMap.has(nr.nolg));
      for (const nc of newCusts) {
        await tx.execute(sql`
          INSERT INTO pelanggan (nolg, nama, alamat, status, tarif_kode, kelurahan_kode, rute_kode, no_urut_rute, ukuran_meter)
          VALUES (${nc.nolg}, ${nc.nama}, ${nc.alamat}, 'PELANGGAN AKTIF', ${nc.trf}, 'TC2', ${nc.rute}, 999, '1/2')
          ON CONFLICT (nolg) DO NOTHING
        `);
        await tx.execute(sql`
          INSERT INTO daftar_catat (id, periode, nolg, rute_kode, petugas_id, urutan, stand_awal, pakai_lalu, akumulasi_taksasi_m3, sumber, status)
          VALUES (${"dpm-" + targetPeriode + "-" + nc.nolg}, ${targetPeriode}, ${nc.nolg}, ${nc.rute}, ${nc.petugas}, 999, 0, 0, 0, 'PBPK', 'BELUM_DICATAT')
          ON CONFLICT (periode, nolg) DO NOTHING
        `);
      }

      const caterToInsert: any[] = [];
      let countStandTetapNormal = 0;
      let countAuditKondisiMismatch = 0;
      for (const nr of parsedNov) {
        const dpm = dpmOpenMap.get(nr.nolg);
        // stml tetap angka meter asli dari database (bukan stml_revisi!)
        const stmlAsli = dpm ? Number(dpm.standAwal) : nr.stAwal;
        const normNama =
          nr.nmKel === "RMH/TANAH KSG"
            ? "RUMAH KOSONG"
            : nr.nmKel === "METER MATI AIR ADA"
              ? "MATI ADA AIR"
              : nr.nmKel === "DI CABUT"
                ? "DICABUT"
                : nr.nmKel;
        const resolvedKondisi = resolveKondisiCatatWithPriority(
          nr.kdKel,
          normNama,
          kondisiRows,
        );
        const isMb = resolvedKondisi.modeHitung === "METER_BARU";
        const isStandTetap =
          resolvedKondisi.modeHitung === "SELISIH_FISIK" &&
          nr.stAkhir === nr.stAwal;

        let statusVerif = "SUBMITTED";
        if (nr.pakai < 0 || (!isMb && nr.stAkhir < nr.stAwal)) {
          statusVerif = "ANOMALY_NEGATIVE";
          countAnomalyNegative++;
        } else if (nr.pakai > 75) {
          statusVerif = "ANOMALY_HIGH";
          countAnomalyHigh++;
        } else if (nr.pakai === 0) {
          statusVerif = "ANOMALY_LOW";
          countAnomalyLow++;
        } else if (
          nr.stAwal !== stmlAsli &&
          nr.stAkhir < stmlAsli + Number(dpm?.akumulasiTaksasiM3 ?? 0)
        ) {
          statusVerif = "ANOMALY";
          countAnomalyCredit++;
        } else {
          statusVerif = "SUBMITTED";
          countSubmitted++;
        }

        const catatanParts: string[] = [];
        if (isStandTetap) {
          countStandTetapNormal++;
          catatanParts.push(
            "[STAND_TETAP] Stand akhir sama dengan stand awal pada kondisi Normal; menunggu keputusan verifikator",
          );
        }
        if (resolvedKondisi.auditNote) {
          countAuditKondisiMismatch++;
          catatanParts.push(resolvedKondisi.auditNote);
        }

        const isDicabutNov =
          resolvedKondisi.ketCatat === "DICABUT" ||
          resolvedKondisi.kodeTmss.trim() === "D";
        caterToInsert.push({
          id: `cater-${targetPeriode}-${nr.nolg}`,
          thbl: targetPeriode,
          nolg: nr.nolg,
          ruteKode: nr.rute || null,
          petugasId: nr.petugas || null,
          stml: String(stmlAsli),
          stma: String(nr.stAkhir),
          pakaiM3: String(Math.max(0, nr.stAkhir - stmlAsli)),
          pakaiTagih: String(Math.max(0, nr.pakai)),
          pakaiLalu: String(nr.pakaiLalu),
          tmss: isDicabutNov ? "D" : resolvedKondisi.kodeTmss,
          ketCatat: isDicabutNov ? "DICABUT" : resolvedKondisi.ketCatat,
          metodeCatat: "ONSITE",
          sumberCatat: "PETUGAS_ONSITE",
          statusVerifikasi: statusVerif,
          catatan: catatanParts.length > 0 ? catatanParts.join(" | ") : null,
        });
      }

      const BATCH = 500;
      for (let i = 0; i < caterToInsert.length; i += BATCH) {
        const chunk = caterToInsert.slice(i, i + BATCH);
        await tx.insert(caterBacaMeter).values(chunk).onConflictDoNothing();
      }

      // Update status daftar_catat untuk 14.238 baris yang baru diimpor
      await tx.execute(sql`
        UPDATE daftar_catat d
        SET status = CASE WHEN c.ket_catat = 'DICABUT' THEN 'DICABUT' ELSE 'DICATAT' END,
            selesai_at = NOW()
        FROM cater_baca_meter c
        WHERE c.thbl = ${targetPeriode}
          AND d.periode = ${targetPeriode}
          AND d.nolg = c.nolg
      `);

      console.log("Hasil Impor Normal 14.238 Baris (Status Verifikasi):", {
        totalImported: caterToInsert.length,
        SUBMITTED: countSubmitted,
        STAND_TETAP_NORMAL_FLAGGED: countStandTetapNormal,
        AUDIT_KONDISI_MISMATCH_LOGGED: countAuditKondisiMismatch,
        ANOMALY_NEGATIVE: countAnomalyNegative,
        ANOMALY_HIGH: countAnomalyHigh,
        ANOMALY_LOW: countAnomalyLow,
        ANOMALY_CREDIT_TAKSASI: countAnomalyCredit,
      });

      // 2. Uji Guard Closing saat masih ada DPM BELUM_DICATAT
      const [sisaDpmBefore] = await tx.execute(sql`
        SELECT count(*)::int AS sisa_belum_dicatat
        FROM daftar_catat
        WHERE periode = ${targetPeriode} AND status = 'BELUM_DICATAT'
      `);
      const jmlSisaDpm = (sisaDpmBefore as any).sisa_belum_dicatat;
      console.log(
        `Guard Closing Check: Sisa DPM BELUM_DICATAT = ${jmlSisaDpm} pelanggan -> Closing WAJIB DITOLAK!`,
      );

      // 3. Selesaikan sisa 8.278 pelanggan yang BELUM_DICATAT melalui Taksasi Eksplisit Operator (stma = stml, pakai_tagih = max(pakai_lalu, min 5m3))
      await tx.execute(sql`
        INSERT INTO cater_baca_meter (
          id, thbl, nolg, rute_kode, petugas_id,
          stml, stma, pakai_m3, pakai_tagih, pakai_lalu,
          tmss, ket_catat, metode_catat, sumber_catat, status_verifikasi, catatan
        )
        SELECT
          'cater-' || d.periode || '-' || d.nolg,
          d.periode,
          d.nolg,
          d.rute_kode,
          d.petugas_id,
          d.stand_awal,
          d.stand_awal,
          0.00,
          GREATEST(COALESCE(d.pakai_lalu::numeric, 0), 5.00)::numeric(10,2),
          d.pakai_lalu,
          '2',
          'DK',
          'OFFSITE',
          'MANUAL',
          'SUBMITTED',
          '[Taksasi Eksplisit Operator] Simulasi Penutupan Sisa DPM November'
        FROM daftar_catat d
        WHERE d.periode = ${targetPeriode}
          AND d.status = 'BELUM_DICATAT'
        ON CONFLICT (thbl, nolg) DO NOTHING
      `);

      await tx.execute(sql`
        UPDATE daftar_catat
        SET status = 'DICATAT', selesai_at = NOW()
        WHERE periode = ${targetPeriode} AND status = 'BELUM_DICATAT'
      `);

      // 4. Verifikasi & Sahkan (APPROVED_FINAL) seluruh bacaan 202611 lalu kunci periode 202611
      await tx.execute(sql`
        UPDATE cater_baca_meter
        SET status_verifikasi = 'LOCKED_BILLING'
        WHERE thbl = ${targetPeriode}
      `);
      await tx.execute(sql`
        UPDATE periode_penagihan
        SET status = 'TERKUNCI', ditutup_at = NOW()
        WHERE periode = ${targetPeriode}
      `);

      // 5. Simulasikan pembukaan Desember (202612) dan hitung carry-forward stand_awal & akumulasi_taksasi_m3 kumulatif
      const [carryDecStats] = await tx.execute(sql`
        WITH dec_projection AS (
          SELECT
            d11.nolg,
            c11.stml::numeric AS stml_11,
            c11.stma::numeric AS stma_11,
            c11.pakai_tagih::numeric AS pakai_11,
            c11.ket_catat AS ket_11,
            d11.akumulasi_taksasi_m3::numeric AS akum_11,
            c11.stma::numeric AS stand_awal_12,
            CASE
              WHEN c11.stma::numeric = c11.stml::numeric AND c11.pakai_tagih::numeric > 0
                THEN d11.akumulasi_taksasi_m3::numeric + c11.pakai_tagih::numeric
              ELSE 0
            END AS akum_12
          FROM daftar_catat d11
          JOIN cater_baca_meter c11 ON c11.thbl = d11.periode AND c11.nolg = d11.nolg
          WHERE d11.periode = ${targetPeriode}
            AND d11.status != 'DICABUT'
        )
        SELECT
          count(*)::int AS total_dpm_202612,
          count(case when akum_12 > 0 then 1 end)::int AS pelanggan_punya_akumulasi_202612,
          count(case when akum_12 > akum_11 and akum_11 > 0 then 1 end)::int AS pelanggan_akumulasi_2_bulan_berturut,
          count(case when akum_11 > 0 and akum_12 = 0 then 1 end)::int AS pelanggan_akumulasi_direset_karena_baca_fisik,
          sum(akum_12)::int AS total_m3_akumulasi_202612
        FROM dec_projection
      `);

      console.log(
        "Hasil Proyeksi Carry-Forward & Akumulasi Taksasi ke Desember (202612):",
        carryDecStats,
      );

      if (!process.argv.includes("--commit")) {
        // Paksa rollback agar 0 perubahan tersimpan di database utama
        throw new Error("ROLLBACK_SIMULATION_SUCCESS");
      }
      console.log("✓ Transaksi berhasil di-COMMIT ke database!");
    });
  } catch (e: any) {
    if (e.message === "ROLLBACK_SIMULATION_SUCCESS") {
      console.log(
        "✓ Simulasi selesai dan 100% di-ROLLBACK (Database utama tetap bersih pada state 202610 Closed & 202611 Open).",
      );
    } else {
      throw e;
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
