import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const r = await sql`
    SELECT thbl, is_anomali, count(*)::int as cnt 
    FROM cater_baca_meter 
    GROUP BY thbl, is_anomali 
    ORDER BY thbl, is_anomali
  `;
  console.table(r);
  await sql.end();
}

main().catch(console.error);
