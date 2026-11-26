import postgres from 'postgres';
import fs from 'fs';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function inspectPoint2() {
  console.log('=== POINT 2: 22 BARIS BERUBAH ANOMALI -> NORMAL ===');
  // Check if snapshot table exists
  const snapshotTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name LIKE '%snapshot%' OR table_name LIKE '%backup%'
  `;
  console.log('Snapshot tables:', snapshotTables);

  const rawKandidat = fs.readFileSync('E:/Coding/elysia/scratch/kandidat_22.json', 'utf8');
  const kandidat = JSON.parse(rawKandidat);
  const nolgs = kandidat.map((k: any) => k.nolg);
  console.log('NOLG list (22):', nolgs);

  // Query cater_baca_meter for these 22 rows
  const currentRows = await sql`
    SELECT nolg, periode, stml, stma, pemakaian, pakai_lalu, kode_anomali_utama, is_anomali, kode_anomali_list, aturan_versi
    FROM cater_baca_meter
    WHERE periode = '202611' AND nolg = ANY(${nolgs})
    ORDER BY nolg ASC
  `;
  console.log('Current rows in cater_baca_meter:');
  console.table(currentRows);

  // If snapshot table exists, compare with snapshot!
  if (snapshotTables.length > 0) {
    for (const st of snapshotTables) {
      try {
        const snapRows = await sql`
          SELECT nolg, periode, is_anomali, kode_anomali_utama
          FROM ${sql(st.table_name)}
          WHERE periode = '202611' AND nolg = ANY(${nolgs})
        `;
        console.log(`Snapshot table ${st.table_name}:`, snapRows);
      } catch (e: any) {
        console.log(`Error reading ${st.table_name}:`, e.message);
      }
    }
  }

  // Also check legacy engine logic: how did legacy engine evaluate these 22 rows?
  // Let's inspect git diff or previous engine cater-anomali.engine.ts
  await sql.end();
}

inspectPoint2().catch(console.error);
