import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  // Find rows where pakai_m3 != (stma - stml) or where pakai_tagih differs
  const diffs = await db.execute(sql`
    SELECT 
      c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_tagih, c.pakai_lalu, c.tmss,
      c.kode_anomali_utama, c.kode_anomali_list
    FROM cater_baca_meter c
    WHERE c.thbl = '202611' 
      AND c.pakai_m3 != (c.stma - c.stml)
      AND c.tmss NOT IN ('4')
    ORDER BY c.nolg
    LIMIT 30
  `);
  console.log(`Found ${diffs.length} rows with discrepancy:`);
  console.table(diffs);
}
main().catch(console.error);
