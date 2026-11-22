import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const rows = await db.execute(sql`
    SELECT 
      c.nolg, c.stml, c.stma, c.tmss, c.pakai_m3, c.pakai_lalu,
      c.kode_anomali_utama, c.kode_anomali_list
    FROM cater_baca_meter c
    WHERE c.thbl = '202611' AND c.kode_anomali_utama = 'ANOM_METER_MUNDUR'
  `);

  const byTmss: Record<string, number> = {};
  for (const r of rows) {
    byTmss[r.tmss] = (byTmss[r.tmss] || 0) + 1;
  }
  console.log('TMSS distribution of the 24 ANOM_METER_MUNDUR rows:');
  console.table(byTmss);

  // Check how many have secondary anomaly
  console.log('List of the 24 rows:');
  console.table(rows.map(r => ({
    nolg: r.nolg,
    tmss: r.tmss,
    stml: r.stml,
    stma: r.stma,
    pakai: r.pakai_m3,
    lalu: r.pakai_lalu,
    secondary: (r.kode_anomali_list as string[]).filter((x: string) => x !== 'ANOM_METER_MUNDUR')
  })));
}
main().catch(console.error);
