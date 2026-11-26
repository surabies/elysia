import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const [r] = await db.execute(sql`SELECT current_database() AS db_name`);
  console.log('Database name:', (r as any).db_name);
}
main().catch(console.error);
