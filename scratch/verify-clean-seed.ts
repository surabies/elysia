import postgres from 'postgres';
import { execSync } from 'child_process';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  console.log('--- RESETTING ATURAN TABLES TO TEST CLEAN SEED & BACKFILL ---');
  await sql`TRUNCATE TABLE aturan_anomali_audit_log CASCADE`;
  await sql`TRUNCATE TABLE aturan_anomali_versi CASCADE`;
  await sql`TRUNCATE TABLE aturan_kondisi_meter_map CASCADE`;
  await sql`TRUNCATE TABLE aturan_anomali CASCADE`;

  console.log('Tables truncated.');
  await sql.end();

  console.log('Running seeder: seed-aturan-only.ts...');
  execSync('bun run packages/db/src/scripts/seed-aturan-only.ts', { stdio: 'inherit' });

  const sql2 = postgres(url);
  const [maxV] = await sql2`SELECT MAX(versi) as max_versi FROM aturan_anomali_versi`;
  console.log('MAX(versi) after fresh seed:', maxV.max_versi);

  const [auditCnt] = await sql2`SELECT COUNT(*)::int as cnt FROM aturan_anomali_audit_log`;
  console.log('Audit log count after fresh seed:', auditCnt.cnt);

  console.log('Running backfill: backfill-anomali-massal.ts...');
  execSync('bun run packages/db/src/scripts/backfill-anomali-massal.ts', { stdio: 'inherit' });

  const versiDist = await sql2`
    SELECT aturan_versi, COUNT(*)::int as cnt 
    FROM cater_baca_meter 
    GROUP BY aturan_versi
  `;
  console.log('aturan_versi distribution in cater_baca_meter:');
  console.table(versiDist);

  await sql2.end();
}

main().catch(console.error);
