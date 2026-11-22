import postgres from 'postgres';
import fs from 'fs';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  console.log('--- 1. ATURAN ANOMALI TABLE ---');
  const aturan = await sql`
    SELECT kode, nama, urutan, aktif 
    FROM aturan_anomali 
    ORDER BY urutan ASC
  `;
  console.table(aturan);

  console.log('--- 2. MAX(VERSI) ---');
  const maxVersi = await sql`SELECT MAX(versi) as max_versi FROM aturan_anomali_versi`;
  console.log(maxVersi);

  console.log('--- 3. AUDIT LOG ---');
  const auditLogs = await sql`
    SELECT id, aturan_id, aksi, diubah_oleh, alasan, waktu 
    FROM aturan_anomali_audit_log 
    ORDER BY waktu ASC
  `;
  console.table(auditLogs);

  console.log('--- 4. ATURAN_ANOMALI_VERSI ROWS ---');
  const versis = await sql`
    SELECT versi, diterbitkan_oleh, alasan, created_at 
    FROM aturan_anomali_versi 
    ORDER BY versi ASC
  `;
  console.table(versis);

  console.log('--- 5. CHECK SEEDER KODE VS TABLE KODE ---');
  // Read seeder file
  const seederContent = fs.readFileSync('packages/db/src/seeds/modules/10-anomali.ts', 'utf8');
  const matchedKodes = seederContent.match(/kode:\s*['"]([^'"]+)['"]/g);
  console.log('Seeder kodes:', matchedKodes);

  console.log('--- 6. CHECK 22 ROWS IN 202611 ---');
  const rawKandidat = fs.readFileSync('scratch/kandidat_22.json', 'utf8');
  const kandidat = JSON.parse(rawKandidat);
  const nolgs = kandidat.map((k: any) => k.nolg);

  const rows202611 = await sql`
    SELECT nolg, periode, stml, stma, pemakaian, pakai_lalu, kode_anomali_utama, is_anomali, kode_anomali_list, aturan_versi, keterangan_catat
    FROM cater_baca_meter 
    WHERE periode = '202611' AND nolg = ANY(${nolgs})
    ORDER BY nolg ASC
  `;
  console.log('22 rows count:', rows202611.length);
  console.table(rows202611.map(r => ({
    nolg: r.nolg,
    stml: r.stml,
    stma: r.stma,
    pemakaian: r.pemakaian,
    pakai_lalu: r.pakai_lalu,
    ket: r.keterangan_catat,
    is_anomali: r.is_anomali,
    kode_utama: r.kode_anomali_utama,
    kode_list: r.kode_anomali_list
  })));

  await sql.end();
}

main().catch(console.error);
