import fs from "fs";
import path from "path";
import readline from "readline";
import { sql, eq } from "drizzle-orm";
import { db } from "../client";
import {
  wilayahAdministrasi,
  kecamatan,
  kelurahan,
  zonaDistribusi,
  petugasCater,
  ruteCater,
  golonganTarif,
  waterMeter,
  pelanggan,
  daftarCatat,
  caterBacaMeter,
  rekeningDrd,
  periodePenagihan,
  masterKondisiCatat,
} from "../schema";
import {
  carryForwardPeriode,
  nextPeriode,
  resolveKondisiCatatWithPriority,
} from "../carry-forward";

interface ParsedCsvRow {
  rowNum: number;
  thbl: string;
  nolg: string;
  nprs: string | null;
  nama: string;
  almt: string;
  trp: string;
  namatrp: string;
  tmss: string;
  ketcatat: string;
  stml: number;
  stma: number;
  pakaiDrd: number;
  blokM3: number;
  jmlhargaair: string;
  beabeban: string;
  beaadmin: string;
  airkotor: string;
  lainlain: string;
  tjtg: string;
  pakailalu: number;
  wiladmkode: string;
  wiladmnama: string;
  kdkec: string;
  namakec: string;
  kdkel: string;
  namakel: string;
  rw: string | null;
  rt: string | null;
  caterseksikode: string | null;
  caterseksinama: string | null;
  ruteKode: string;
  pencatat: string | null;
  wildistkode: string | null;
  wildistnama: string | null;
  zonakode: string | null;
  zonanama: string | null;
  dmakode: string | null;
  ismbr: boolean;
  kdMerkMeter: string | null;
  ukMeter: string;
  noMeterRaw: string;
  noSegel: string | null;
  tglPasang: Date | null;
  tglPasangStr: string;
  umurThn: number;
  umurBln: number;
  noTelp: string | null;
  jmlreknunggak: number;
  tagnunggak: string;
  potensialPenagihan: string | null;
  potensialCater: string | null;
  mutasikode: string;
  mutasinama: string;
  metodeCatat: string;
  sumberCatat: string;
  tglCatat: Date;
}

const PLACEHOLDER_METERS = new Set([
  "",
  "-",
  "0",
  "00000000",
  "2018MBR",
  "2017MBR",
]);

/**
 * ETL Importer: STI ProgresCater to Modular Drizzle Schema
 * Idempoten, two-pass deduplication untuk water_meter, urutan rute deterministik,
 * serta menghasilkan Opening State (Periode Closed + Periode Open dengan Carry-Forward tunggal).
 */
export async function importProgresCater(
  options: {
    csvPath?: string;
    pbpkPath?: string;
    limit?: number;
    masterOnly?: boolean;
    exportAuditCsv?: boolean;
  } = {},
  database: typeof db = db,
) {
  const rootDir = path.resolve(__dirname, "../../../");
  const defaultCsv = path.resolve(
    __dirname,
    "../../data/raw/ProgresCater-PW5.csv",
  );
  const fallbackCsv = path.resolve(
    rootDir,
    "packages/db/data/raw/ProgresCater-PW5.csv",
  );
  const legacyCsv = path.resolve(
    __dirname,
    "../../data/jan/ProgresCater-PW5.csv",
  );
  const csvFile =
    options.csvPath ||
    (fs.existsSync(defaultCsv)
      ? defaultCsv
      : fs.existsSync(fallbackCsv)
        ? fallbackCsv
        : legacyCsv);

  console.log("=== STARTING IDEMPOTENT CATER ETL IMPORT ===");
  console.log("Source CSV:", csvFile);
  if (!fs.existsSync(csvFile)) {
    throw new Error(`CSV file not found at: ${csvFile}`);
  }

  const fileStream = fs.createReadStream(csvFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let rowCount = 0;
  const maxRows = options.limit || Infinity;

  const parsedRows: ParsedCsvRow[] = [];
  const wiladmMap = new Map<string, { kode: string; nama: string }>();
  const kecMap = new Map<
    string,
    { kode: string; nama: string; wiladmKode: string }
  >();
  const kelMap = new Map<
    string,
    { kode: string; nama: string; kecamatanKode: string }
  >();
  const zonaMap = new Map<
    string,
    {
      kode: string;
      nama: string;
      wildistKode: string | null;
      wildistNama: string | null;
      dmaKode: string | null;
    }
  >();
  const petugasMap = new Map<string, { id: string; nama: string }>();
  const ruteMap = new Map<
    string,
    {
      kode: string;
      seksiKode?: string;
      seksiNama?: string;
      pencatatDefault?: string;
    }
  >();
  const tarifMap = new Map<
    string,
    {
      kode: string;
      nama: string;
      beaBeban: string;
      beaAdmin: string;
      airKotor: string;
      lainLain: string;
    }
  >();

  // Pass 1: Baca seluruh baris CSV untuk mendeteksi frekuensi nomor meter & urutan rute
  const meterFreq = new Map<string, ParsedCsvRow[]>();

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    if (rowCount >= maxRows) break;

    const cols = line.split(";");
    if (cols.length < 50) continue;

    rowCount++;

    const thbl = cols[0]?.trim();
    if (!thbl || thbl.length !== 6) {
      throw new Error(
        `Baris ${rowCount}: Kolom thbl tidak valid ('${cols[0]}').`,
      );
    }
    const nolg = cols[1]?.trim();
    if (!nolg) continue;

    const nprs = cols[2]?.trim() || null;
    const nama = cols[3]?.trim() || "PELANGGAN";
    const almt = cols[4]?.trim() || "-";
    const trp = cols[5]?.trim() || "2A1";
    const namatrp = cols[6]?.trim() || "TARIF " + trp;
    const tmssRaw = cols[8]?.trim() || "";
    const tmss = tmssRaw.length > 0 ? tmssRaw : " ";
    const ketcatat = cols[9]?.trim() || "Normal";
    const stml = parseFloat(cols[10]?.trim() || "0") || 0;
    const stma = parseFloat(cols[11]?.trim() || "0") || 0;
    const pakaiDrd = parseFloat(cols[12]?.trim() || "0") || 0;
    const blokM3 = parseInt(cols[13]?.trim() || "1", 10) || 1;
    const jmlhargaair = cols[14]?.trim() || "0";
    const beabeban = cols[15]?.trim() || "0";
    const beaadmin = cols[16]?.trim() || "0";
    const airkotor = cols[17]?.trim() || "0";
    const lainlain = cols[18]?.trim() || "0";
    const tjtg = cols[19]?.trim() || "0";
    const pakailalu = parseFloat(cols[20]?.trim() || "0") || 0;

    const wiladmkode = cols[22]?.trim() || "";
    const wiladmnama = cols[23]?.trim() || "";
    const kdkec = cols[24]?.trim() || "";
    const namakec = cols[25]?.trim() || "";
    const kdkel = cols[26]?.trim() || "";
    const namakel = cols[27]?.trim() || "";
    const rw = cols[28]?.trim() || null;
    const rt = cols[29]?.trim() || null;
    const caterseksikode = cols[30]?.trim() || null;
    const caterseksinama = cols[31]?.trim() || null;
    const ruteKode = cols[32]?.trim() || "";
    const pencatatRaw = cols[33]?.trim() || "";
    const pencatat = pencatatRaw && pencatatRaw !== "-" ? pencatatRaw : null;

    const wildistkodeRaw = cols[34]?.trim() || "";
    const wildistkode =
      wildistkodeRaw && wildistkodeRaw !== "-" ? wildistkodeRaw : null;
    const wildistnama = cols[35]?.trim() || null;
    const zonakode = cols[38]?.trim() || null;
    const zonanama = cols[39]?.trim() || null;
    const dmakodeRaw = cols[79]?.trim() || "";
    const dmakode = dmakodeRaw && dmakodeRaw !== "-" ? dmakodeRaw : null;

    const ismbr = cols[47]?.trim()?.toLowerCase() === "t";
    const kdMerkMeter = cols[48]?.trim() ? cols[48].trim().toUpperCase() : null;
    const ukMeter = cols[49]?.trim() || "1/2";
    const noMeterRaw = cols[50]?.trim() || "";
    const noSegelRaw = cols[51]?.trim() || "";
    const noSegel = noSegelRaw && noSegelRaw !== "-" ? noSegelRaw : null;
    const tglPasangStr = cols[52]?.trim() || "";
    const tglPasang =
      tglPasangStr && !tglPasangStr.startsWith("0000")
        ? new Date(tglPasangStr)
        : null;
    const umurThn = parseInt(cols[53]?.trim() || "0", 10) || 0;
    const umurBln = parseInt(cols[54]?.trim() || "0", 10) || 0;
    const noTelpRaw = cols[58]?.trim() || "";
    const noTelp = noTelpRaw && noTelpRaw !== "-" ? noTelpRaw : null;

    const jmlreknunggak = parseInt(cols[67]?.trim() || "0", 10) || 0;
    const tagnunggak = cols[68]?.trim() || "0";
    const potensialPenagihan = cols[59]?.trim() || null;
    const potensialCater = cols[60]?.trim() || null;
    const mutasikode = cols[80]?.trim() || "";
    const mutasinama = cols[81]?.trim() || "PELANGGAN AKTIF";
    const metodeCatatRaw = cols[83]?.trim() || "";
    const metodeCatat = metodeCatatRaw === "ONSITE" ? "ONSITE" : "OFFSITE";
    const sumberCatat =
      metodeCatat === "ONSITE" ? "PETUGAS_ONSITE" : "PETUGAS_OFFSITE";
    const tglCatatStr = cols[84]?.trim() || "";
    const tglCatat = tglCatatStr ? new Date(tglCatatStr) : new Date();

    const parsed: ParsedCsvRow = {
      rowNum: rowCount,
      thbl,
      nolg,
      nprs,
      nama,
      almt,
      trp,
      namatrp,
      tmss,
      ketcatat,
      stml,
      stma,
      pakaiDrd,
      blokM3,
      jmlhargaair,
      beabeban,
      beaadmin,
      airkotor,
      lainlain,
      tjtg,
      pakailalu,
      wiladmkode,
      wiladmnama,
      kdkec,
      namakec,
      kdkel,
      namakel,
      rw,
      rt,
      caterseksikode,
      caterseksinama,
      ruteKode,
      pencatat,
      wildistkode,
      wildistnama,
      zonakode,
      zonanama,
      dmakode,
      ismbr,
      kdMerkMeter,
      ukMeter,
      noMeterRaw,
      noSegel,
      tglPasang,
      tglPasangStr,
      umurThn,
      umurBln,
      noTelp,
      jmlreknunggak,
      tagnunggak,
      potensialPenagihan,
      potensialCater,
      mutasikode,
      mutasinama,
      metodeCatat,
      sumberCatat,
      tglCatat,
    };

    parsedRows.push(parsed);

    if (!meterFreq.has(noMeterRaw)) {
      meterFreq.set(noMeterRaw, []);
    }
    meterFreq.get(noMeterRaw)!.push(parsed);

    if (wiladmkode && wiladmnama && !wiladmMap.has(wiladmkode)) {
      wiladmMap.set(wiladmkode, { kode: wiladmkode, nama: wiladmnama });
    }
    if (kdkec && namakec && !kecMap.has(kdkec)) {
      kecMap.set(kdkec, { kode: kdkec, nama: namakec, wiladmKode: wiladmkode });
    }
    if (kdkel && namakel && !kelMap.has(kdkel)) {
      kelMap.set(kdkel, { kode: kdkel, nama: namakel, kecamatanKode: kdkec });
    }
    if (zonakode && !zonaMap.has(zonakode)) {
      zonaMap.set(zonakode, {
        kode: zonakode,
        nama: zonanama || zonakode,
        wildistKode: wildistkode,
        wildistNama: wildistnama,
        dmaKode: dmakode,
      });
    }
    if (pencatat && !petugasMap.has(pencatat)) {
      petugasMap.set(pencatat, { id: pencatat, nama: pencatat });
    }
    if (ruteKode) {
      const existingRute = ruteMap.get(ruteKode);
      if (!existingRute) {
        ruteMap.set(ruteKode, {
          kode: ruteKode,
          seksiKode: caterseksikode || undefined,
          seksiNama: caterseksinama || undefined,
          pencatatDefault: pencatat || undefined,
        });
      } else {
        if (!existingRute.seksiKode && caterseksikode)
          existingRute.seksiKode = caterseksikode;
        if (!existingRute.seksiNama && caterseksinama)
          existingRute.seksiNama = caterseksinama;
        if (!existingRute.pencatatDefault && pencatat)
          existingRute.pencatatDefault = pencatat;
      }
    }
    if (trp && !tarifMap.has(trp)) {
      tarifMap.set(trp, {
        kode: trp,
        nama: namatrp,
        beaBeban: "7000",
        beaAdmin: beaadmin,
        airKotor: airkotor,
        lainLain: lainlain,
      });
    }
  }

  console.log(`Parsed ${parsedRows.length} records from CSV.`);

  // Normalisasi rute yatim secara GENERIK dari data (tanpa hardcode kode rute atau nama petugas):
  // Jika suatu baris memiliki pencatat kosong ('-') dan rute_kode tersebut tidak punya pencatat di baris manapun,
  // periksa apakah prefix 5 karakter NPRS merujuk pada rute valid yang memiliki pencatat di dataset.
  for (const r of parsedRows) {
    if (!r.pencatat && r.nprs && r.nprs.length >= 5) {
      const candidateRute = r.nprs.slice(0, 5);
      const targetRuteInfo = ruteMap.get(candidateRute);
      const currentRuteInfo = ruteMap.get(r.ruteKode);
      if (
        targetRuteInfo?.pencatatDefault &&
        !currentRuteInfo?.pencatatDefault
      ) {
        ruteMap.delete(r.ruteKode);
        r.ruteKode = candidateRute;
        r.pencatat = targetRuteInfo.pencatatDefault;
      }
    }
  }

  // Hitung urutan rute deterministik: 1..N per rute_kode berdasarkan nprs ASC, nolg ASC
  const rowsByRute = new Map<string, ParsedCsvRow[]>();
  for (const r of parsedRows) {
    if (!rowsByRute.has(r.ruteKode)) rowsByRute.set(r.ruteKode, []);
    rowsByRute.get(r.ruteKode)!.push(r);
  }
  const urutanByNolg = new Map<string, number>();
  for (const [, list] of rowsByRute.entries()) {
    const sorted = [...list].sort((a, b) => {
      const nprsA = a.nprs || "";
      const nprsB = b.nprs || "";
      const cmp = nprsA.localeCompare(nprsB);
      if (cmp !== 0) return cmp;
      return a.nolg.localeCompare(b.nolg);
    });
    sorted.forEach((item, index) => {
      urutanByNolg.set(item.nolg, index + 1);
    });
  }

  // Klasifikasi nomor meter: Unik Valid vs Placeholder / Kosong / Duplikat
  const validMeterBatch: any[] = [];
  const invalidMeterAuditList: Array<{
    nolg: string;
    nama: string;
    ruteKode: string;
    noMeterAsli: string;
    merkMeter: string;
    ukuranMeter: string;
    tglPasangMeter: string;
    alasan: "KOSONG" | "PLACEHOLDER" | "DUPLIKAT";
    jumlahPemakai: number;
    prioritasBedaAtribut: "PRIORITAS_TINGGI" | "NORMAL";
    keterangan: string;
  }> = [];

  const dicabutSelisih20List: Array<{
    nolg: string;
    nprs: string;
    nama: string;
    ruteKode: string;
    mutasinama: string;
    ketcatat: string;
    tmss: string;
    stml: number;
    stma: number;
    pakaiDrd: number;
    totalTagihan: string;
  }> = [];

  const tupsVerifikasi6List: Array<{
    nolg: string;
    nprs: string;
    nama: string;
    ruteKode: string;
    mutasinama: string;
    ketcatat: string;
    tmss: string;
    stml: number;
    stma: number;
    pakaiDrd: number;
    totalTagihan: string;
    catatanVerifikasi: string;
  }> = [];

  const kondisiRows = await database
    .select({
      kodeTmss: masterKondisiCatat.kodeTmss,
      nama: masterKondisiCatat.nama,
      modeHitung: masterKondisiCatat.modeHitung,
    })
    .from(masterKondisiCatat);

  const pelangganBatch: any[] = [];
  const dpmClosedBatch: any[] = [];
  const caterBatch: any[] = [];
  const billingBatch: any[] = [];

  for (const r of parsedRows) {
    const freqList = meterFreq.get(r.noMeterRaw) || [];
    const isKosong = r.noMeterRaw === "" || r.noMeterRaw === "-";
    const isPlaceholder =
      !isKosong &&
      (PLACEHOLDER_METERS.has(r.noMeterRaw) ||
        r.noMeterRaw.toUpperCase().includes("MBR"));
    const isDuplikat = !isKosong && !isPlaceholder && freqList.length > 1;

    const isValidUniqueMeter = !isKosong && !isPlaceholder && !isDuplikat;
    const validNoMeter = isValidUniqueMeter ? r.noMeterRaw : null;

    if (isValidUniqueMeter) {
      validMeterBatch.push({
        noMeter: r.noMeterRaw,
        merk: r.kdMerkMeter,
        ukuran: r.ukMeter,
        noSegel: r.noSegel,
        tglPasang: r.tglPasang,
        umurTahun: r.umurThn,
        umurBulan: r.umurBln,
        kondisi: "Normal",
      });
    } else {
      // Cek apakah pasangan duplikat memiliki merk atau tglPasang berbeda
      let bedaAtribut = false;
      if (isDuplikat && freqList.length > 1) {
        const first = freqList[0];
        bedaAtribut = freqList.some(
          (item) =>
            item.kdMerkMeter !== first.kdMerkMeter ||
            item.tglPasangStr !== first.tglPasangStr,
        );
      }
      const alasan = isKosong
        ? "KOSONG"
        : isPlaceholder
          ? "PLACEHOLDER"
          : "DUPLIKAT";
      const prioritas = bedaAtribut ? "PRIORITAS_TINGGI" : "NORMAL";
      const ket = isKosong
        ? "Nomor meter kosong / tanda strip (-)"
        : isPlaceholder
          ? `Nomor meter placeholder (${r.noMeterRaw}) dipakai ${freqList.length} pelanggan`
          : bedaAtribut
            ? `PRIORITAS: Nomor meter duplikat (${r.noMeterRaw}) dipakai ${freqList.length} pelanggan dengan merk/tgl pasang BERBEDA`
            : `Nomor meter duplikat (${r.noMeterRaw}) dipakai ${freqList.length} pelanggan`;

      invalidMeterAuditList.push({
        nolg: r.nolg,
        nama: r.nama,
        ruteKode: r.ruteKode,
        noMeterAsli: r.noMeterRaw,
        merkMeter: r.kdMerkMeter || "",
        ukuranMeter: r.ukMeter,
        tglPasangMeter: r.tglPasangStr,
        alasan,
        jumlahPemakai: freqList.length,
        prioritasBedaAtribut: prioritas,
        keterangan: ket,
      });
    }

    // Aturan Status Pelanggan & Flag Verifikasi:
    // 1. Jika ketcatat == 'DICABUT' atau tmss == 'D' (29 pelanggan): status = 'DICABUT'
    // 2. Jika mutasinama in ('tupsp','tupsm') tetapi ketcatat != 'DICABUT' (6 pelanggan):
    //    tetap aktif di DPM 202611, tetapi diberi flag perluVerifikasi = true
    const isDicabut = r.ketcatat === "DICABUT" || r.tmss === "D";
    const isTupsNonDicabut = !isDicabut && r.mutasinama !== "PELANGGAN AKTIF";

    if (isDicabut && r.mutasinama === "PELANGGAN AKTIF") {
      dicabutSelisih20List.push({
        nolg: r.nolg,
        nprs: r.nprs || "",
        nama: r.nama,
        ruteKode: r.ruteKode,
        mutasinama: r.mutasinama,
        ketcatat: r.ketcatat,
        tmss: r.tmss,
        stml: r.stml,
        stma: r.stma,
        pakaiDrd: r.pakaiDrd,
        totalTagihan: r.tjtg,
      });
    }

    const catatanReasons: string[] = [];
    if (isTupsNonDicabut) {
      const msg = `Perlu verifikasi lapangan: status mutasi '${r.mutasinama}' tetapi bacaan Oktober '${r.ketcatat}' (${r.pakaiDrd} m3)`;
      catatanReasons.push(msg);
      tupsVerifikasi6List.push({
        nolg: r.nolg,
        nprs: r.nprs || "",
        nama: r.nama,
        ruteKode: r.ruteKode,
        mutasinama: r.mutasinama,
        ketcatat: r.ketcatat,
        tmss: r.tmss,
        stml: r.stml,
        stma: r.stma,
        pakaiDrd: r.pakaiDrd,
        totalTagihan: r.tjtg,
        catatanVerifikasi: msg,
      });
    }
    if (!isValidUniqueMeter) {
      const lastAudit = invalidMeterAuditList[invalidMeterAuditList.length - 1];
      catatanReasons.push(
        `Perlu verifikasi nomor meter: ${lastAudit.keterangan}`,
      );
    }

    const statusMaster = isDicabut ? "DICABUT" : r.mutasinama;
    const perluVerifikasi = isTupsNonDicabut || !isValidUniqueMeter;
    const catatanVerifikasi =
      catatanReasons.length > 0 ? catatanReasons.join(" | ") : null;
    const noUrut = urutanByNolg.get(r.nolg) ?? 1;

    pelangganBatch.push({
      nolg: r.nolg,
      nprs: r.nprs,
      nama: r.nama,
      alamat: r.almt,
      rt: r.rt,
      rw: r.rw,
      noTelp: r.noTelp,
      jmlPenghuni: 0,
      isMbr: r.ismbr,
      status: statusMaster,
      tarifKode: r.trp,
      kelurahanKode: r.kdkel?.trim() ? r.kdkel.trim().toUpperCase() : (r.ruteKode && r.ruteKode.length >= 3 ? r.ruteKode.slice(0, 3).toUpperCase() : null),
      ruteKode: r.ruteKode || null,
      noUrutRute: noUrut,
      noMeter: validNoMeter,
      noMeterAsli: r.noMeterRaw || null,
      ukuranMeter: r.ukMeter,
      merkMeter: r.kdMerkMeter,
      tglPasangMeter: r.tglPasang,
      perluVerifikasi,
      catatanVerifikasi,
      titikLokasi: null,
    });

    // DPM Periode Closed (202610)
    dpmClosedBatch.push({
      id: `dpm-${r.thbl}-${r.nolg}`,
      periode: r.thbl,
      nolg: r.nolg,
      ruteKode: r.ruteKode || null,
      petugasId: r.pencatat || null,
      urutan: noUrut,
      standAwal: String(r.stml),
      pakaiLalu: String(r.pakailalu),
      sumber: "CARRY_OVER",
      status: isDicabut ? "DICABUT" : "DICATAT",
      selesaiAt: r.tglCatat,
      catatan: isDicabut ? "Pelanggan DICABUT pada periode ini" : null,
    });

    const resolvedKondisi = resolveKondisiCatatWithPriority(
      r.tmss,
      r.ketcatat,
      kondisiRows,
    );

    // Transaksi Catat Meter Periode Closed (LOCKED_BILLING)
    caterBatch.push({
      id: `cater-${r.thbl}-${r.nolg}`,
      thbl: r.thbl,
      nolg: r.nolg,
      ruteKode: r.ruteKode || null,
      petugasId: r.pencatat || null,
      stml: String(r.stml),
      stma: String(r.stma),
      pakaiM3: String(r.pakaiDrd),
      pakaiTagih: String(r.pakaiDrd),
      pakaiLalu: String(r.pakailalu),
      tmss: resolvedKondisi.kodeTmss,
      ketCatat: resolvedKondisi.ketCatat,
      metodeCatat: r.metodeCatat,
      sumberCatat: r.sumberCatat,
      tglCatat: r.tglCatat,
      durasiDetik: 0,
      statusVerifikasi: "LOCKED_BILLING",
      catatan: resolvedKondisi.auditNote,
    });

    // Rekening DRD Periode Closed
    billingBatch.push({
      id: `drd-${r.thbl}-${r.nolg}`,
      thbl: r.thbl,
      nolg: r.nolg,
      pakaiM3: String(r.pakaiDrd),
      blokM3: r.blokM3,
      jmlHargaAir: r.jmlhargaair,
      beaBeban: r.beabeban,
      beaAdmin: r.beaadmin,
      airKotor: r.airkotor,
      lainLain: r.lainlain,
      totalTagihan: r.tjtg,
      jmlRekNunggak: r.jmlreknunggak,
      tagNunggak: r.tagnunggak,
      potensialPenagihan: r.potensialPenagihan,
      potensialCater: r.potensialCater,
      statusLunas: false,
    });
  }

  // Simpan file export audit sesuai permintaan di konfirmasi.md
  if (options.exportAuditCsv !== false) {
    const exportDir = path.resolve(__dirname, "../../data/exports");
    fs.mkdirSync(exportDir, { recursive: true });

    // 1. Export 686 pelanggan tanpa nomor meter valid
    const meterCsvHeader =
      "nolg;nama;rute_kode;no_meter_asli;merk_meter;ukuran_meter;tgl_pasang_meter;alasan;jumlah_pemakai;prioritas;keterangan\n";
    const meterCsvBody = invalidMeterAuditList
      .map(
        (x) =>
          `${x.nolg};${x.nama};${x.ruteKode};${x.noMeterAsli};${x.merkMeter};${x.ukuranMeter};${x.tglPasangMeter};${x.alasan};${x.jumlahPemakai};${x.prioritasBedaAtribut};${x.keterangan}`,
      )
      .join("\n");
    fs.writeFileSync(
      path.join(exportDir, "daftar-686-pelanggan-tanpa-meter-valid.csv"),
      meterCsvHeader + meterCsvBody + "\n",
      "utf8",
    );

    // 2. Export 20 pelanggan selisih (mutasinama PELANGGAN AKTIF tapi ketcatat DICABUT)
    const dicabut20Header =
      "nolg;nprs;nama;rute_kode;mutasinama;ketcatat;tmss;stml;stma;pakai_drd;total_tagihan\n";
    const dicabut20Body = dicabutSelisih20List
      .map(
        (x) =>
          `${x.nolg};${x.nprs};${x.nama};${x.ruteKode};${x.mutasinama};${x.ketcatat};${x.tmss};${x.stml};${x.stma};${x.pakaiDrd};${x.totalTagihan}`,
      )
      .join("\n");
    fs.writeFileSync(
      path.join(exportDir, "daftar-20-pelanggan-selisih-dicabut.csv"),
      dicabut20Header + dicabut20Body + "\n",
      "utf8",
    );

    // 3. Export 6 pelanggan tupsp/tupsm (MTA / RUMAH KOSONG) yang perlu verifikasi lapangan
    const tups6Header =
      "nolg;nprs;nama;rute_kode;mutasinama;ketcatat;tmss;stml;stma;pakai_drd;total_tagihan;catatan_verifikasi\n";
    const tups6Body = tupsVerifikasi6List
      .map(
        (x) =>
          `${x.nolg};${x.nprs};${x.nama};${x.ruteKode};${x.mutasinama};${x.ketcatat};${x.tmss};${x.stml};${x.stma};${x.pakaiDrd};${x.totalTagihan};${x.catatanVerifikasi}`,
      )
      .join("\n");
    fs.writeFileSync(
      path.join(exportDir, "daftar-6-pelanggan-tups-verifikasi-lapangan.csv"),
      tups6Header + tups6Body + "\n",
      "utf8",
    );
  }

  // Upsert Referensi & Master Data (Idempoten dengan onConflictDoUpdate)
  console.log("Upserting Master Wilayah Administrasi...");
  if (wiladmMap.size > 0) {
    await database
      .insert(wilayahAdministrasi)
      .values(Array.from(wiladmMap.values()))
      .onConflictDoUpdate({
        target: wilayahAdministrasi.kode,
        set: { nama: sql`EXCLUDED.nama` },
      });
  }

  console.log("Upserting Master Kecamatan...");
  if (kecMap.size > 0) {
    await database
      .insert(kecamatan)
      .values(Array.from(kecMap.values()))
      .onConflictDoUpdate({
        target: kecamatan.kode,
        set: {
          nama: sql`EXCLUDED.nama`,
          wiladmKode: sql`EXCLUDED.wiladm_kode`,
        },
      });
  }

  console.log("Upserting Master Kelurahan...");
  if (kelMap.size > 0) {
    await database
      .insert(kelurahan)
      .values(Array.from(kelMap.values()))
      .onConflictDoUpdate({
        target: kelurahan.kode,
        set: {
          nama: sql`EXCLUDED.nama`,
          kecamatanKode: sql`EXCLUDED.kecamatan_kode`,
        },
      });
  }

  console.log("Upserting Master Zona Distribusi...");
  if (zonaMap.size > 0) {
    await database
      .insert(zonaDistribusi)
      .values(Array.from(zonaMap.values()))
      .onConflictDoUpdate({
        target: zonaDistribusi.kode,
        set: {
          nama: sql`EXCLUDED.nama`,
          wildistKode: sql`EXCLUDED.wildist_kode`,
          wildistNama: sql`EXCLUDED.wildist_nama`,
          dmaKode: sql`EXCLUDED.dma_kode`,
        },
      });
  }

  console.log("Upserting Master Petugas Cater...");
  if (petugasMap.size > 0) {
    await database
      .insert(petugasCater)
      .values(Array.from(petugasMap.values()))
      .onConflictDoUpdate({
        target: petugasCater.id,
        set: { nama: sql`EXCLUDED.nama`, aktif: true },
      });
  }

  console.log("Upserting Master Rute Cater...");
  if (ruteMap.size > 0) {
    await database
      .insert(ruteCater)
      .values(Array.from(ruteMap.values()))
      .onConflictDoUpdate({
        target: ruteCater.kode,
        set: {
          seksiKode: sql`COALESCE(EXCLUDED.seksi_kode, ${ruteCater.seksiKode})`,
          seksiNama: sql`COALESCE(EXCLUDED.seksi_nama, ${ruteCater.seksiNama})`,
          pencatatDefault: sql`COALESCE(EXCLUDED.pencatat_default, ${ruteCater.pencatatDefault})`,
        },
      });
  }

  console.log("Upserting Master Golongan Tarif...");
  if (tarifMap.size > 0) {
    await database
      .insert(golonganTarif)
      .values(Array.from(tarifMap.values()))
      .onConflictDoUpdate({
        target: golonganTarif.kode,
        set: {
          beaAdmin: sql`EXCLUDED.bea_admin`,
          airKotor: sql`EXCLUDED.air_kotor`,
          lainLain: sql`EXCLUDED.lain_lain`,
        },
      });
  }

  const BATCH_SIZE = 500;

  console.log(
    `Upserting ${validMeterBatch.length} Valid Unique Water Meter assets...`,
  );
  for (let i = 0; i < validMeterBatch.length; i += BATCH_SIZE) {
    const chunk = validMeterBatch.slice(i, i + BATCH_SIZE);
    await database
      .insert(waterMeter)
      .values(chunk)
      .onConflictDoUpdate({
        target: waterMeter.noMeter,
        set: {
          merk: sql`EXCLUDED.merk`,
          ukuran: sql`EXCLUDED.ukuran`,
          noSegel: sql`EXCLUDED.no_segel`,
          tglPasang: sql`EXCLUDED.tgl_pasang`,
          umurTahun: sql`EXCLUDED.umur_tahun`,
          umurBulan: sql`EXCLUDED.umur_bulan`,
        },
      });
  }

  console.log(
    `Upserting ${pelangganBatch.length} Pelanggan records (preserving custom no_urut_rute)...`,
  );
  for (let i = 0; i < pelangganBatch.length; i += BATCH_SIZE) {
    const chunk = pelangganBatch.slice(i, i + BATCH_SIZE);
    await database
      .insert(pelanggan)
      .values(chunk)
      .onConflictDoUpdate({
        target: pelanggan.nolg,
        set: {
          nprs: sql`EXCLUDED.nprs`,
          nama: sql`EXCLUDED.nama`,
          alamat: sql`EXCLUDED.alamat`,
          rt: sql`EXCLUDED.rt`,
          rw: sql`EXCLUDED.rw`,
          noTelp: sql`EXCLUDED.no_telp`,
          isMbr: sql`EXCLUDED.is_mbr`,
          status: sql`EXCLUDED.status`,
          tarifKode: sql`EXCLUDED.tarif_kode`,
          kelurahanKode: sql`EXCLUDED.kelurahan_kode`,
          ruteKode: sql`EXCLUDED.rute_kode`,
          // Jangan menimpa no_urut_rute jika sudah > 0 di database (hasil ubahan aplikasi)
          noUrutRute: sql`CASE WHEN ${pelanggan.noUrutRute} > 0 THEN ${pelanggan.noUrutRute} ELSE EXCLUDED.no_urut_rute END`,
          noMeter: sql`EXCLUDED.no_meter`,
          noMeterAsli: sql`EXCLUDED.no_meter_asli`,
          ukuranMeter: sql`EXCLUDED.ukuran_meter`,
          merkMeter: sql`EXCLUDED.merk_meter`,
          tglPasangMeter: sql`EXCLUDED.tgl_pasang_meter`,
          perluVerifikasi: sql`EXCLUDED.perlu_verifikasi`,
          catatanVerifikasi: sql`EXCLUDED.catatan_verifikasi`,
          updatedAt: new Date(),
        },
      });
  }

  const periodeSumber = parsedRows[0]?.thbl;
  const periodeBerikutnya = periodeSumber ? nextPeriode(periodeSumber) : "";
  let carryForwardStats: any = null;

  if (options.masterOnly) {
    console.log("Mode masterOnly aktif: Melewatkan seeding transaksi periode.");
  } else if (periodeSumber) {
    console.log(
      `Upserting ${dpmClosedBatch.length} DPM (daftar_catat) records for closed period ${periodeSumber}...`,
    );
    for (let i = 0; i < dpmClosedBatch.length; i += BATCH_SIZE) {
      const chunk = dpmClosedBatch.slice(i, i + BATCH_SIZE);
      await database
        .insert(daftarCatat)
        .values(chunk)
        .onConflictDoUpdate({
          target: [daftarCatat.periode, daftarCatat.nolg],
          set: {
            ruteKode: sql`EXCLUDED.rute_kode`,
            petugasId: sql`EXCLUDED.petugas_id`,
            urutan: sql`CASE WHEN ${daftarCatat.urutan} > 0 THEN ${daftarCatat.urutan} ELSE EXCLUDED.urutan END`,
            standAwal: sql`EXCLUDED.stand_awal`,
            pakaiLalu: sql`EXCLUDED.pakai_lalu`,
            status: sql`EXCLUDED.status`,
            selesaiAt: sql`EXCLUDED.selesai_at`,
            catatan: sql`EXCLUDED.catatan`,
            updatedAt: new Date(),
          },
        });
    }

    console.log(
      `Upserting ${caterBatch.length} Transaksi Catat Meter (LOCKED_BILLING) for ${periodeSumber}...`,
    );
    for (let i = 0; i < caterBatch.length; i += BATCH_SIZE) {
      const chunk = caterBatch.slice(i, i + BATCH_SIZE);
      await database
        .insert(caterBacaMeter)
        .values(chunk)
        .onConflictDoUpdate({
          target: [caterBacaMeter.thbl, caterBacaMeter.nolg],
          set: {
            ruteKode: sql`EXCLUDED.rute_kode`,
            petugasId: sql`EXCLUDED.petugas_id`,
            stml: sql`EXCLUDED.stml`,
            stma: sql`EXCLUDED.stma`,
            pakaiM3: sql`EXCLUDED.pakai_m3`,
            pakaiTagih: sql`EXCLUDED.pakai_tagih`,
            pakaiLalu: sql`EXCLUDED.pakai_lalu`,
            tmss: sql`EXCLUDED.tmss`,
            ketCatat: sql`EXCLUDED.ket_catat`,
            metodeCatat: sql`EXCLUDED.metode_catat`,
            sumberCatat: sql`EXCLUDED.sumber_catat`,
            tglCatat: sql`EXCLUDED.tgl_catat`,
            statusVerifikasi: "LOCKED_BILLING",
            catatan: sql`COALESCE(EXCLUDED.catatan, ${caterBacaMeter.catatan})`,
            updatedAt: new Date(),
          },
        });
    }

    console.log(
      `Upserting ${billingBatch.length} Rekening DRD Billing records for ${periodeSumber}...`,
    );
    for (let i = 0; i < billingBatch.length; i += BATCH_SIZE) {
      const chunk = billingBatch.slice(i, i + BATCH_SIZE);
      await database
        .insert(rekeningDrd)
        .values(chunk)
        .onConflictDoUpdate({
          target: [rekeningDrd.thbl, rekeningDrd.nolg],
          set: {
            pakaiM3: sql`EXCLUDED.pakai_m3`,
            blokM3: sql`EXCLUDED.blok_m3`,
            jmlHargaAir: sql`EXCLUDED.jml_harga_air`,
            beaBeban: sql`EXCLUDED.bea_beban`,
            beaAdmin: sql`EXCLUDED.bea_admin`,
            airKotor: sql`EXCLUDED.air_kotor`,
            lainLain: sql`EXCLUDED.lain_lain`,
            totalTagihan: sql`EXCLUDED.total_tagihan`,
            jmlRekNunggak: sql`EXCLUDED.jml_rek_nunggak`,
            tagNunggak: sql`EXCLUDED.tag_nunggak`,
            potensialPenagihan: sql`EXCLUDED.potensial_penagihan`,
            potensialCater: sql`EXCLUDED.potensial_cater`,
            updatedAt: new Date(),
          },
        });
    }

    // Hitung agregat resmi dari tabel rekening_drd untuk snapshot periode_penagihan(periodeSumber)
    const [drdAgg] = await database
      .select({
        totalSl: sql<number>`count(*)::int`,
        totalM3: sql<string>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::numeric(12,2)::text`,
        totalTagihan: sql<string>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric(15,2)::text`,
      })
      .from(rekeningDrd)
      .where(eq(rekeningDrd.thbl, periodeSumber));

    const yearNum = parseInt(periodeSumber.slice(0, 4), 10);
    const monthNum = parseInt(periodeSumber.slice(4, 6), 10);
    const jatuhTempoClosed = new Date(
      Date.UTC(yearNum, monthNum - 1, 20, 0, 0, 0),
    );
    const ditutupAtClosed = new Date(
      Date.UTC(yearNum, monthNum - 1, 28, 17, 0, 0),
    );

    console.log(
      `Locking closed period ${periodeSumber} with verified snapshot (${drdAgg.totalSl} SL, ${drdAgg.totalM3} m3, Rp ${drdAgg.totalTagihan})...`,
    );
    await database
      .insert(periodePenagihan)
      .values({
        periode: periodeSumber,
        status: "TERKUNCI",
        tanggalJatuhTempo: jatuhTempoClosed,
        ditutupAt: ditutupAtClosed,
        ditutupById: null,
        jumlahSl: drdAgg.totalSl,
        totalM3: drdAgg.totalM3,
        totalTagihan: drdAgg.totalTagihan,
      })
      .onConflictDoUpdate({
        target: periodePenagihan.periode,
        set: {
          status: "TERKUNCI",
          tanggalJatuhTempo: jatuhTempoClosed,
          ditutupAt: ditutupAtClosed,
          jumlahSl: drdAgg.totalSl,
          totalM3: drdAgg.totalM3,
          totalTagihan: drdAgg.totalTagihan,
          updatedAt: new Date(),
        },
      });

    // Buka Periode Berikutnya (N+1) menggunakan fungsi carryForwardPeriode yang SAMA dengan proses closing
    console.log(
      `Opening next period ${periodeBerikutnya} via shared carryForwardPeriode(${periodeSumber} -> ${periodeBerikutnya})...`,
    );
    carryForwardStats = await carryForwardPeriode(
      {
        periodeLalu: periodeSumber,
        periodeBaru: periodeBerikutnya,
        userId: null,
      },
      database,
    );
    console.log(
      `✓ Next period ${periodeBerikutnya} opened: ${carryForwardStats.totalDpmDiterbitkan} active DPM rows (${carryForwardStats.dilewatiDicabut} DICABUT skipped).`,
    );
  }

  console.log("=== ETL IMPORT COMPLETED SUCCESSFULLY! ===");
  return {
    rowsProcessed: parsedRows.length,
    periodeClosed: periodeSumber,
    periodeOpen: periodeBerikutnya,
    wilayahCount: wiladmMap.size,
    kecamatanCount: kecMap.size,
    kelurahanCount: kelMap.size,
    zonaCount: zonaMap.size,
    petugasCount: petugasMap.size,
    ruteCount: ruteMap.size,
    tarifCount: tarifMap.size,
    validMeterCount: validMeterBatch.length,
    invalidMeterCount: invalidMeterAuditList.length,
    pelangganCount: pelangganBatch.length,
    dicabutTotalCount: dicabutSelisih20List.length + 9,
    dicabutSelisih20Count: dicabutSelisih20List.length,
    tupsVerifikasi6Count: tupsVerifikasi6List.length,
    caterClosedCount: caterBatch.length,
    billingClosedCount: billingBatch.length,
    carryForwardStats,
  };
}

if (import.meta.main) {
  const isFull = process.argv.includes("--all");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg
    ? parseInt(limitArg.split("=")[1], 10)
    : isFull
      ? undefined
      : undefined;

  importProgresCater({ limit })
    .then((stats) => {
      console.log("Result Stats:", stats);
      process.exit(0);
    })
    .catch((err) => {
      console.error("ETL Import Error:", err);
      process.exit(1);
    });
}
