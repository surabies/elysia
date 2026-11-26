import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const p = await sql`SELECT periode, status FROM periode_penagihan ORDER BY periode`;
  console.table(p);
  await sql.end();
}

main().catch(console.error);
