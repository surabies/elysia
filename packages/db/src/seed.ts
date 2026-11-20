import { db } from './client';
import { periodePenagihan, caterBacaMeter } from './schema';
import { seedMasterKondisi } from './seed-kondisi';
import { seedMasterTarif } from './seed-tarif';
import { importProgresCater } from './etl/import-progres-cater';
import { syncAreaLayanan21Kelurahan, seedDataVerifikasi } from './seed-data-verifikasi';
import { seedPeriode } from './seeds/modules/06-periode';
import { seedBroadcast } from './seeds/modules/07-broadcast';
import { seedPengaturan } from './seeds/modules/08-pengaturan';
import { seedKpi } from './seeds/modules/09-kpi';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Unified Data Seed (Dipisahkan dari Seed Akun — jalankan `bun run db:seed:accounts` untuk akun pengguna).
 *
 * PENGAMAN (SECURITY GUARDS):
 * 1. Memeriksa nama database target terhadap allowlist eksplisit (`ALLOW_SEED_DB` atau default dev `neondb`/`elysia_db`).
 * 2. Menolak dijalankan apabila periode yang sedang open (`status = 'BERJALAN'`) sudah memiliki data pembacaan di `cater_baca_meter`
 *    (kecuali `FORCE_SEED_OVER_OPEN_READINGS=true`).
 */
async function seed() {
  console.log('=== STARTING UNIFIED DATABASE DATA SEED ===');
  try {
    // Guard 1: Verifikasi nama database target terhadap allowlist eksplisit
    const [dbInfo] = await db.execute(sql`SELECT current_database() AS db_name`);
    const currentDbName = String((dbInfo as any).db_name || '');
    const allowedSeedDbs = (process.env.ALLOW_SEED_DB || 'neondb,elysia_db')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!allowedSeedDbs.includes(currentDbName)) {
      console.error(
        `❌ [SECURITY GUARD] Database target '${currentDbName}' TIDAK ADA di allowlist ALLOW_SEED_DB ([${allowedSeedDbs.join(', ')}]). Seed dibatalkan.`
      );
      process.exit(1);
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
      console.error(
        '❌ [SECURITY GUARD] Menjalankan seed pada NODE_ENV=production diblokir. Set ALLOW_PRODUCTION_SEED=true dan ALLOW_SEED_DB=<nama_db> hanya saat cut-over awal Go-Live.'
      );
      process.exit(1);
    }

    // Guard 2: Tolak jika periode yang sedang OPEN (BERJALAN) sudah memiliki pembacaan meter
    const openPeriods = await db
      .select({ periode: periodePenagihan.periode })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.status, 'BERJALAN'));

    for (const op of openPeriods) {
      const [readingCount] = await db
        .select({ cnt: sql<number>`count(*)::int` })
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.thbl, op.periode));

      if ((readingCount?.cnt ?? 0) > 0 && process.env.FORCE_SEED_OVER_OPEN_READINGS !== 'true') {
        console.error(
          `❌ [SECURITY GUARD] Periode open '${op.periode}' sudah memiliki ${readingCount.cnt} data pembacaan meter! Seed ditolak agar tidak mengganggu operasional yang sedang berjalan.`
        );
        process.exit(1);
      }
    }

    // 1. Seed Master Kondisi Catat
    console.log('1. Seeding Master Kondisi Catat...');
    await seedMasterKondisi();

    // 2. Seed Master Tarif, Blok Konsumsi Progresif, & Biaya Tetap Ukuran Meter
    console.log('2. Seeding Master Golongan, Blok Tarif, & Biaya Tetap...');
    await seedMasterTarif();

    // 3. Seed Master Pelanggan & Transaksi Catat Meter + Carry-Forward Periode Berikutnya (Idempoten)
    console.log('3. Running Idempotent ProgresCater ETL & Carry-Forward...');
    const masterOnly = process.env.SEED_MASTER_ONLY === 'true';
    await importProgresCater({ masterOnly });

    // 4. Sync Area Layanan (Kecamatan & Kelurahan)
    console.log('4. Syncing Area Layanan...');
    await syncAreaLayanan21Kelurahan();

    // 5. Update Koordinat Pelanggan dari Data Verifikasi Spasial
    console.log('5. Seeding Data Verifikasi Spasial...');
    await seedDataVerifikasi();

    // 6. Sinkronisasi Periode Penagihan dari Data Transaksi
    console.log('6. Syncing Periode Penagihan...');
    await seedPeriode();

    // 7. Seed Broadcast Banners & Informasi Publik
    console.log('7. Seeding Broadcast Banners...');
    await seedBroadcast();

    // 8. Seed Pengaturan Toleransi & Running Text
    console.log('8. Seeding Pengaturan Sistem...');
    await seedPengaturan();

    // 9. Seed Balanced Scorecard KPI
    console.log('9. Seeding KPI Balanced Scorecard...');
    await seedKpi();

    console.log('=== DATA SEEDING COMPLETED SUCCESSFULLY! ===');
    console.log('Catatan: Untuk membuat/menyinkronkan akun pengguna login, jalankan: bun run db:seed:accounts');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
