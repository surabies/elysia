import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  await sql`UPDATE periode_penagihan SET status = 'AKTIF' WHERE periode = '202611'`;
  const p = await sql`SELECT periode, status FROM periode_penagihan ORDER BY periode`;
  console.table(p);
  await sql.end();
}

main().catch(console.error);
