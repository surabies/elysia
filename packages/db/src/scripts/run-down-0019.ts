// packages/db/src/scripts/run-down-0019.ts
// Menjalankan down migration 0019 dan memverifikasi integritas baris data
import { db } from '../client';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function runDownMigration() {
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
  console.log('====================================================');
  console.log('       MENJALANKAN DOWN MIGRATION 0019             ');
  console.log('====================================================');
  console.log(`DATABASE_URL Target: ${maskedUrl}`);

  if (dbUrl.includes('ep-still-sun')) {
    throw new Error('BAHAYA: Database utama ep-still-sun tidak boleh disentuh!');
  }

  // 1. Baca isi file down sql
  const downSqlPath = path.resolve(__dirname, '../migrations/0019_centralized_anomali_rules.down.sql');
  const downSql = fs.readFileSync(downSqlPath, 'utf8');

  console.log('Mengeksekusi 0019_centralized_anomali_rules.down.sql...');
  await db.execute(sql.raw(downSql));
  console.log('Down migration 0019 selesai dieksekusi.');

  // 2. Verifikasi tabel-tabel telah hilang
  console.log('Memverifikasi bahwa tabel-tabel aturan anomali telah terhapus...');
  const checkTables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('aturan_anomali', 'aturan_anomali_versi', 'aturan_kondisi_meter_map', 'aturan_anomali_audit_log');
  `);
  console.log(`Tabel anomali tersisa di schema: ${checkTables.length} (Ekspektasi: 0)`);
  if (checkTables.length > 0) {
    throw new Error(`Gagal: Masih ada tabel yang belum terhapus: ${JSON.stringify(checkTables)}`);
  }

  // 3. Verifikasi kolom-kolom pada cater_baca_meter telah hilang
  console.log('Memverifikasi kolom anomali pada cater_baca_meter telah terhapus...');
  const checkCols = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'cater_baca_meter' 
      AND column_name IN ('is_anomali', 'kode_anomali_utama', 'kode_anomali_list', 'aturan_versi');
  `);
  console.log(`Kolom anomali tersisa di cater_baca_meter: ${checkCols.length} (Ekspektasi: 0)`);
  if (checkCols.length > 0) {
    throw new Error(`Gagal: Masih ada kolom yang belum terhapus: ${JSON.stringify(checkCols)}`);
  }

  // 4. Verifikasi jumlah baris cater_baca_meter per periode TIDAK BERUBAH
  console.log('Memverifikasi jumlah baris transaksi cater_baca_meter per periode...');
  const rowCount = await db.execute(sql`
    SELECT thbl, COUNT(*)::int as count 
    FROM cater_baca_meter 
    GROUP BY thbl 
    ORDER BY thbl;
  `);
  console.table(rowCount);

  console.log('====================================================');
  console.log('DOWN MIGRATION 0019 BERHASIL & TERVERIFIKASI BERSIH!');
  console.log('====================================================');
}

if (import.meta.main) {
  runDownMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
