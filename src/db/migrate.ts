import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const migrationClient = postgres(databaseUrl, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
  console.log('Applying database migrations...');
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('Migrations applied successfully!');
  } finally {
    await migrationClient.end();
  }
}

main().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
