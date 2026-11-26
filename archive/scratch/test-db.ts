import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
console.log('Using URL:', url.replace(/:[^:@]+@/, ':***@'));
const sql = postgres(url);

async function main() {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  console.log('Tables:', tables.map(r => r.table_name));
  await sql.end();
}

main().catch(console.error);
