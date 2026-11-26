import postgres from 'postgres';
import { execSync } from 'child_process';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  console.log('Setting pakai_m3 = pakai_tagih for 202611 in cater_baca_meter...');
  await sql`
    UPDATE cater_baca_meter 
    SET pakai_m3 = pakai_tagih 
    WHERE thbl = '202611' AND pakai_tagih IS NOT NULL
  `;

  await sql.end();

  console.log('Running backfill-anomali-massal.ts...');
  execSync('bun run packages/db/src/scripts/backfill-anomali-massal.ts', { stdio: 'inherit' });

  const sql2 = postgres(url);
  const counts202611 = await sql2`
    SELECT 
      COALESCE(kode_anomali_utama, 'NORMAL_BERSIH') AS kode,
      is_anomali,
      COUNT(*)::int AS cnt
    FROM cater_baca_meter
    WHERE thbl = '202611'
    GROUP BY kode_anomali_utama, is_anomali
    ORDER BY cnt DESC
  `;
  console.table(counts202611);

  const [anomTotal] = await sql2`
    SELECT count(*)::int as total 
    FROM cater_baca_meter 
    WHERE thbl = '202611' AND is_anomali = true
  `;
  console.log('Total Anomali 202611:', anomTotal.total);

  await sql2.end();
}

main().catch(console.error);
