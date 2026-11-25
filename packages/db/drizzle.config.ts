import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

if (!process.env.DATABASE_URL) {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../../.env.local'), quiet: true });
    if (!process.env.DATABASE_URL) {
      dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
    }
  } catch {
    // Abaikan
  }
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/elysia_db',
  },
  extensionsFilters: ['postgis'],
  tablesFilter: ['!spatial_ref_sys', '!geometry_columns', '!geography_columns'],
  verbose: true,
  strict: true,
});
