import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// Hanya muat dotenv jika DATABASE_URL belum ada di process.env (misal saat standalone test/script)
// Mencegah spam stderr "◇ injected env (0)" di runtime Next.js dan Vercel Serverless Function
if (!process.env.DATABASE_URL) {
  try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    if (!process.env.DATABASE_URL) {
      dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    }
    if (!process.env.DATABASE_URL) {
      dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
      dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
    }
  } catch {
    // Abaikan jika berkas tidak ditemukan
  }
}

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/elysia_db';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

export const conn =
  globalForDb.conn ??
  postgres(databaseUrl, {
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
export type DB = typeof db;
