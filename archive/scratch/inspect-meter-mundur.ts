import { db } from '@cater/db';
import { sql } from 'drizzle-orm';
import { evaluasiAnomaliBaris } from '../apps/web/src/server/domain/cater/anomali-evaluator';
import { aturanAnomaliService } from '../apps/web/src/server/services/cater/aturan-anomali.service';

async function main() {
  const rows = await db.execute(sql`
    SELECT 
      c.id, c.nolg, c.thbl, c.tmss, c.stml, c.stma, c.pakai_m3, c.pakai_lalu,
      c.is_anomali, c.kode_anomali_utama, c.kode_anomali_list, c.aturan_versi
    FROM cater_baca_meter c
    WHERE c.thbl = '202611' AND c.kode_anomali_utama = 'ANOM_METER_MUNDUR'
    ORDER BY c.nolg
  `);

  console.log(`Ditemukan ${rows.length} baris dengan kode_anomali_utama = ANOM_METER_MUNDUR:`);
  for (const r of rows) {
    console.log(`nolg: ${r.nolg}, stml: ${r.stml}, stma: ${r.stma}, tmss: ${r.tmss}, pakai_m3: ${r.pakai_m3}, list: ${JSON.stringify(r.kode_anomali_list)}`);
  }
}

main().catch(console.error);
