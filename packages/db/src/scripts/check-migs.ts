import { db } from '../client';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    const migs = await db.execute(sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 5`);
    console.table(migs);
  } catch (e: any) {
    console.log('Error:', e.message);
  }
  process.exit(0);
}
run();
