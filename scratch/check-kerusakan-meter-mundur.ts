import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const r = await db.execute(sql`
    SELECT id, nolg, stml, stma, tmss, pakai_m3, pakai_lalu, kode_anomali_utama, kode_anomali_list
    FROM cater_baca_meter
    WHERE thbl = '202611' AND stma < stml AND tmss IN ('2', '3', '7', 'C', 'D', 'F', 'O', 'T')
  `);
  console.log('Row with stma < stml and TMSS kerusakan:');
  console.table(r);
}
main().catch(console.error);
