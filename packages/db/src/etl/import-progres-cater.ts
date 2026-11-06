import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { db } from '../client';
import {
  wilayahAdministrasi,
  kecamatan,
  kelurahan,
  petugasCater,
  ruteCater,
  golonganTarif,
  waterMeter,
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
} from '../schema';

/**
 * ETL Importer: STI ProgresCater & PBPK to Modular Drizzle Schema
 * Parses and normalizes flat 85-column CSV into domain relational models.
 */
export async function importProgresCater(options: {
  csvPath?: string;
  pbpkPath?: string;
  limit?: number;
} = {}) {
  const rootDir = path.resolve(__dirname, '../../../');
  const defaultCsv = path.resolve(__dirname, '../../data/jan/ProgresCater-PW5.csv');
  const fallbackCsv = path.resolve(rootDir, 'src/db/jan/ProgresCater-PW5.csv');
  const csvFile = options.csvPath || (fs.existsSync(defaultCsv) ? defaultCsv : fallbackCsv);

  const defaultPbpk = path.resolve(__dirname, '../../data/jan/PBPK.csv');
  const fallbackPbpk = path.resolve(rootDir, 'src/db/jan/PBPK.csv');
  const pbpkFile = options.pbpkPath || (fs.existsSync(defaultPbpk) ? defaultPbpk : fallbackPbpk);

  console.log('=== STARTING CATER ETL IMPORT ===');
  console.log('Source CSV:', csvFile);
  if (!fs.existsSync(csvFile)) {
    throw new Error(`CSV file not found at: ${csvFile}`);
  }

  // 1. Read optional coordinates from PBPK if available
  const pbpkMap = new Map<string, { lon?: number; lat?: number; penghuni?: number }>();
  if (fs.existsSync(pbpkFile)) {
    console.log('Reading PBPK coordinates & metadata from:', pbpkFile);
    const pbpkStream = fs.createReadStream(pbpkFile);
    const pbpkRl = readline.createInterface({ input: pbpkStream, crlfDelay: Infinity });
    let pbpkHeader = true;
    for await (const line of pbpkRl) {
      if (pbpkHeader) { pbpkHeader = false; continue; }
      const cols = line.split(';');
      if (cols.length < 20) continue;
      const nolg = cols[0]?.trim();
      const lon = parseFloat(cols[18]?.trim() || '');
      const lat = parseFloat(cols[19]?.trim() || '');
      const penghuni = parseInt(cols[9]?.trim() || '0', 10);
      if (nolg) {
        pbpkMap.set(nolg, {
          lon: !isNaN(lon) ? lon : undefined,
          lat: !isNaN(lat) ? lat : undefined,
          penghuni: !isNaN(penghuni) ? penghuni : 0,
        });
      }
    }
    console.log(`Loaded ${pbpkMap.size} records from PBPK.`);
  }

  // 2. Stream ProgresCater-PW5.csv
  const fileStream = fs.createReadStream(csvFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  let rowCount = 0;
  const maxRows = options.limit || Infinity;

  // Caches for master data to insert first
  const wiladmMap = new Map<string, { kode: string; nama: string }>();
  const kecMap = new Map<string, { kode: string; nama: string; wiladmKode: string }>();
  const kelMap = new Map<string, { kode: string; nama: string; kecamatanKode: string }>();
  const petugasMap = new Map<string, { id: string; nama: string }>();
  const ruteMap = new Map<string, { kode: string; seksiKode?: string; seksiNama?: string; pencatatDefault?: string }>();
  const tarifMap = new Map<string, { kode: string; nama: string; beaBeban: string; beaAdmin: string; airKotor: string; lainLain: string }>();
  
  const meterBatch: any[] = [];
  const pelangganBatch: any[] = [];
  const caterBatch: any[] = [];
  const billingBatch: any[] = [];

  const seenMeters = new Set<string>();
  const seenPelanggan = new Set<string>();

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    if (rowCount >= maxRows) break;

    const cols = line.split(';');
    if (cols.length < 50) continue;

    rowCount++;

    // Attributes extraction
    const thbl = cols[0]?.trim() || '202601';
    const nolg = cols[1]?.trim();
    if (!nolg) continue;

    const nprs = cols[2]?.trim() || null;
    const nama = cols[3]?.trim() || 'PELANGGAN';
    const almt = cols[4]?.trim() || '-';
    const trp = cols[5]?.trim() || '2A1';
    const namatrp = cols[6]?.trim() || 'TARIF ' + trp;
    const ketcatat = cols[9]?.trim() || 'Normal';
    const stml = parseFloat(cols[10]?.trim() || '0') || 0;
    const stma = parseFloat(cols[11]?.trim() || '0') || 0;
    const pakaiDrd = parseFloat(cols[12]?.trim() || '0') || 0;
    const blokM3 = parseInt(cols[13]?.trim() || '1', 10) || 1;
    const jmlhargaair = cols[14]?.trim() || '0';
    const beabeban = cols[15]?.trim() || '0';
    const beaadmin = cols[16]?.trim() || '0';
    const airkotor = cols[17]?.trim() || '0';
    const lainlain = cols[18]?.trim() || '0';
    const tjtg = cols[19]?.trim() || '0';
    const pakailalu = parseFloat(cols[20]?.trim() || '0') || 0;

    const wiladmkode = cols[22]?.trim();
    const wiladmnama = cols[23]?.trim();
    const kdkec = cols[24]?.trim();
    const namakec = cols[25]?.trim();
    const kdkel = cols[26]?.trim();
    const namakel = cols[27]?.trim();
    const rw = cols[28]?.trim() || null;
    const rt = cols[29]?.trim() || null;
    const caterseksikode = cols[30]?.trim() || null;
    const caterseksinama = cols[31]?.trim() || null;
    const ruteKode = cols[32]?.trim();
    const pencatat = cols[33]?.trim() || 'PETUGAS';

    const ismbr = cols[47]?.trim()?.toLowerCase() === 't';
    const kdMerkMeter = cols[48]?.trim() || null;
    const ukMeter = cols[49]?.trim() || '1/2';
    const noMeter = cols[50]?.trim() || null;
    const noSegel = cols[51]?.trim() || null;
    const tglPasangStr = cols[52]?.trim();
    const tglPasang = tglPasangStr && !tglPasangStr.startsWith('0000') ? new Date(tglPasangStr) : null;
    const umurThn = parseInt(cols[53]?.trim() || '0', 10) || 0;
    const umurBln = parseInt(cols[54]?.trim() || '0', 10) || 0;
    const noTelp = cols[58]?.trim() || null;

    const durasi = parseInt(cols[61]?.trim() || '0', 10) || 0;
    const jmlreknunggak = parseInt(cols[67]?.trim() || '0', 10) || 0;
    const tagnunggak = cols[68]?.trim() || '0';
    const potensialPenagihan = cols[59]?.trim() || null;
    const potensialCater = cols[60]?.trim() || null;
    const kategorialnama = cols[83]?.trim() || 'PELANGGAN AKTIF';
    const tglCatatStr = cols[84]?.trim();
    const tglCatat = tglCatatStr ? new Date(tglCatatStr) : new Date();

    // Cache master entities
    if (wiladmkode && wiladmnama && !wiladmMap.has(wiladmkode)) {
      wiladmMap.set(wiladmkode, { kode: wiladmkode, nama: wiladmnama });
    }
    if (kdkec && namakec && !kecMap.has(kdkec)) {
      kecMap.set(kdkec, { kode: kdkec, nama: namakec, wiladmKode: wiladmkode });
    }
    if (kdkel && namakel && !kelMap.has(kdkel)) {
      kelMap.set(kdkel, { kode: kdkel, nama: namakec ? namakel : kdkel, kecamatanKode: kdkec });
    }
    if (pencatat && !petugasMap.has(pencatat)) {
      petugasMap.set(pencatat, { id: pencatat, nama: pencatat });
    }
    if (ruteKode && !ruteMap.has(ruteKode)) {
      ruteMap.set(ruteKode, {
        kode: ruteKode,
        seksiKode: caterseksikode || undefined,
        seksiNama: caterseksinama || undefined,
        pencatatDefault: pencatat || undefined,
      });
    }
    if (trp && !tarifMap.has(trp)) {
      tarifMap.set(trp, {
        kode: trp,
        nama: namatrp,
        beaBeban: beabeban,
        beaAdmin: beaadmin,
        airKotor: airkotor,
        lainLain: lainlain,
      });
    }

    // Water meter
    if (noMeter && !seenMeters.has(noMeter)) {
      seenMeters.add(noMeter);
      meterBatch.push({
        noMeter,
        merk: kdMerkMeter,
        ukuran: ukMeter,
        noSegel,
        tglPasang,
        umurTahun: umurThn,
        umurBulan: umurBln,
        kondisi: 'Normal',
      });
    }

    // Pelanggan
    if (!seenPelanggan.has(nolg)) {
      seenPelanggan.add(nolg);
      const pbpkData = pbpkMap.get(nolg);
      pelangganBatch.push({
        nolg,
        nprs,
        nama,
        alamat: almt,
        rt,
        rw,
        noTelp,
        jmlPenghuni: pbpkData?.penghuni || 0,
        isMbr: ismbr,
        status: kategorialnama,
        tarifKode: trp,
        kelurahanKode: kdkel,
        ruteKode: ruteKode || null,
        noMeter: noMeter || null,
        titikLokasi: pbpkData?.lon && pbpkData?.lat ? { x: pbpkData.lon, y: pbpkData.lat } : null,
      });
    }

    // Transaksi Catat Meter
    caterBatch.push({
      id: `cater-${thbl}-${nolg}`,
      thbl,
      nolg,
      ruteKode: ruteKode || null,
      petugasId: pencatat || null,
      stml: String(stml),
      stma: String(stma),
      pakaiM3: String(pakaiDrd),
      pakaiLalu: String(pakailalu),
      ketCatat: ketcatat,
      metodeCatat: 'ONSITE',
      tglCatat,
      durasiDetik: durasi,
      statusVerifikasi: 'VERIFIED',
    });

    // Rekening DRD
    billingBatch.push({
      id: `drd-${thbl}-${nolg}`,
      thbl,
      nolg,
      pakaiM3: String(pakaiDrd),
      blokM3,
      jmlHargaAir: jmlhargaair,
      beaBeban: beabeban,
      beaAdmin: beaadmin,
      airKotor: airkotor,
      lainLain: lainlain,
      totalTagihan: tjtg,
      jmlRekNunggak: jmlreknunggak,
      tagNunggak: tagnunggak,
      potensialPenagihan: potensialPenagihan,
      potensialCater: potensialCater,
      statusLunas: false,
    });
  }

  console.log(`Parsed ${rowCount} records from CSV.`);

  // 3. Insert Master Data first
  console.log('Inserting Master Wilayah Administrasi...');
  if (wiladmMap.size > 0) {
    await db.insert(wilayahAdministrasi).values(Array.from(wiladmMap.values())).onConflictDoNothing();
  }
  console.log('Inserting Master Kecamatan...');
  if (kecMap.size > 0) {
    await db.insert(kecamatan).values(Array.from(kecMap.values())).onConflictDoNothing();
  }
  console.log('Inserting Master Kelurahan...');
  if (kelMap.size > 0) {
    await db.insert(kelurahan).values(Array.from(kelMap.values())).onConflictDoNothing();
  }
  console.log('Inserting Master Petugas Cater...');
  if (petugasMap.size > 0) {
    await db.insert(petugasCater).values(Array.from(petugasMap.values())).onConflictDoNothing();
  }
  console.log('Inserting Master Rute Cater...');
  if (ruteMap.size > 0) {
    await db.insert(ruteCater).values(Array.from(ruteMap.values())).onConflictDoNothing();
  }
  console.log('Inserting Master Golongan Tarif...');
  if (tarifMap.size > 0) {
    await db.insert(golonganTarif).values(Array.from(tarifMap.values())).onConflictDoNothing();
  }

  // 4. Batch Insert Assets, Pelanggan, Transaksi, Billing
  const BATCH_SIZE = 500;

  console.log(`Inserting ${meterBatch.length} Water Meter assets...`);
  for (let i = 0; i < meterBatch.length; i += BATCH_SIZE) {
    const chunk = meterBatch.slice(i, i + BATCH_SIZE);
    await db.insert(waterMeter).values(chunk).onConflictDoNothing();
  }

  console.log(`Inserting ${pelangganBatch.length} Pelanggan records...`);
  for (let i = 0; i < pelangganBatch.length; i += BATCH_SIZE) {
    const chunk = pelangganBatch.slice(i, i + BATCH_SIZE);
    await db.insert(pelanggan).values(chunk).onConflictDoNothing();
  }

  console.log(`Inserting ${caterBatch.length} Transaksi Catat Meter records...`);
  for (let i = 0; i < caterBatch.length; i += BATCH_SIZE) {
    const chunk = caterBatch.slice(i, i + BATCH_SIZE);
    await db.insert(caterBacaMeter).values(chunk).onConflictDoNothing();
  }

  console.log(`Inserting ${billingBatch.length} Rekening DRD Billing records...`);
  for (let i = 0; i < billingBatch.length; i += BATCH_SIZE) {
    const chunk = billingBatch.slice(i, i + BATCH_SIZE);
    await db.insert(rekeningDrd).values(chunk).onConflictDoNothing();
  }

  console.log('=== ETL IMPORT COMPLETED SUCCESSFULLY! ===');
  return {
    rowsProcessed: rowCount,
    wilayahCount: wiladmMap.size,
    kecamatanCount: kecMap.size,
    kelurahanCount: kelMap.size,
    petugasCount: petugasMap.size,
    ruteCount: ruteMap.size,
    tarifCount: tarifMap.size,
    meterCount: meterBatch.length,
    pelangganCount: pelangganBatch.length,
    caterCount: caterBatch.length,
    billingCount: billingBatch.length,
  };
}

// Allow running directly via CLI: bun packages/db/src/etl/import-progres-cater.ts
if (import.meta.main) {
  const isFull = process.argv.includes('--all');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : isFull ? undefined : 2000;

  importProgresCater({ limit })
    .then((stats) => {
      console.log('Result Stats:', stats);
      process.exit(0);
    })
    .catch((err) => {
      console.error('ETL Import Error:', err);
      process.exit(1);
    });
}
