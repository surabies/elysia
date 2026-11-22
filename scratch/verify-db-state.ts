import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const r1 = await db.execute(sql`SELECT thbl, count(*) as cnt FROM cater_baca_meter GROUP BY thbl ORDER BY thbl`);
  console.log('cater_baca_meter by thbl:', JSON.stringify(r1, null, 2));
  
  const r2 = await db.execute(sql`SELECT periode, status, count(*) as cnt FROM daftar_catat GROUP BY periode, status ORDER BY periode, status`);
  console.log('daftar_catat:', JSON.stringify(r2, null, 2));
  
  const r3 = await db.execute(sql`SELECT count(*) as cnt FROM aturan_anomali`);
  console.log('aturan_anomali count:', JSON.stringify(r3, null, 2));
  
  const r4 = await db.execute(sql`SELECT count(*) as cnt FROM "user"`);
  console.log('user count:', JSON.stringify(r4, null, 2));
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
