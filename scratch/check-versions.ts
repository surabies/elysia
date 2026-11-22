import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const [maxV] = await sql`SELECT MAX(versi) as max_versi FROM aturan_anomali_versi`;
  console.log('MAX(versi) in aturan_anomali_versi:', maxV.max_versi);

  const versis = await sql`SELECT DISTINCT aturan_versi, count(*)::int FROM cater_baca_meter GROUP BY aturan_versi`;
  console.table(versis);

  const [auditCnt] = await sql`SELECT count(*)::int as count FROM aturan_anomali_audit_log`;
  console.log('Audit log count:', auditCnt.count);

  await sql.end();
}

main().catch(console.error);
