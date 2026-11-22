import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const maps = await db.execute(sql`
    SELECT m.kode_tmss, a.kode as aturan_kode, a.nama as aturan_nama, a.urutan, m.is_baseline_normal, m.aktif
    FROM aturan_kondisi_meter_map m
    JOIN aturan_anomali a ON a.id = m.aturan_anomali_id
    WHERE m.kode_tmss IN ('4', 'P', 'H', '-', '8')
    ORDER BY m.kode_tmss, a.urutan
  `);
  console.table(maps);
}
main().catch(console.error);
