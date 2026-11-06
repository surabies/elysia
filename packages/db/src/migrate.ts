import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/elysia_db';
const migrationClient = postgres(databaseUrl, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
  console.log('Applying database migrations...');
  try {
    await migrate(db, { migrationsFolder: path.resolve(__dirname, 'migrations') });
    console.log('Migrations applied successfully!');
  } finally {
    await migrationClient.end();
  }
}

main().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
