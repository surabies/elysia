import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const rows = await db.execute(sql`
    SELECT 
      c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_lalu, c.tmss,
      c.is_anomali, c.kode_anomali_utama, c.kode_anomali_list
    FROM cater_baca_meter c
    WHERE c.thbl = '202611' 
      AND c.pakai_lalu = '5.00' 
      AND c.pakai_m3 = '0.00'
    ORDER BY c.nolg
  `);

  console.log(`Ditemukan ${rows.length} baris dengan pakai_lalu = 5 dan pakai_m3 = 0:`);
  console.table(rows);
}

main().catch(console.error);
