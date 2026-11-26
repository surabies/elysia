import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const res = await sql`
    DELETE FROM cater_baca_meter 
    WHERE thbl = '202611' AND sumber_catat = 'MANUAL'
  `;
  console.log('Deleted rows:', res.count);

  const counts = await sql`
    SELECT thbl, count(*)::int as cnt 
    FROM cater_baca_meter 
    GROUP BY thbl 
    ORDER BY thbl
  `;
  console.table(counts);

  await sql.end();
}

main().catch(console.error);
