import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const tmss = await db.execute(sql`SELECT * FROM master_kondisi_catat WHERE kode_tmss = '4'`);
  console.log('TMSS 4:');
  console.table(tmss);

  const maps = await db.execute(sql`
    SELECT m.*, a.kode as aturan_kode, a.nama as aturan_nama, a.urutan
    FROM aturan_kondisi_meter_map m
    JOIN aturan_anomali a ON a.id = m.aturan_anomali_id
    WHERE m.kode_tmss = '4'
  `);
  console.log('Mapping for TMSS 4:');
  console.table(maps);
}
main().catch(console.error);
