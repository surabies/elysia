import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const r = await sql`
    SELECT sumber_catat, status_verifikasi, count(*)::int as cnt
    FROM cater_baca_meter
    WHERE thbl = '202611'
    GROUP BY sumber_catat, status_verifikasi
  `;
  console.table(r);
  await sql.end();
}

main().catch(console.error);
