import { db } from './client';
import { places, pelanggan, caterBacaMeter } from './schema';
import { seedAccounts, FALLBACK_SEED_PASSWORD } from './seed-accounts';
import { seedMasterKondisi } from './seed-kondisi';
import { seedMasterTarif } from './seed-tarif';
import { importProgresCater } from './etl/import-progres-cater';
import { syncAreaLayanan21Kelurahan, seedDataVerifikasi } from './seed-data-verifikasi';
import { count } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seed() {
  console.log('=== STARTING UNIFIED DATABASE SEED ===');
  try {
    const seedPassword = process.env.SEED_DEFAULT_PASSWORD || FALLBACK_SEED_PASSWORD;

    const userId = 'seed-user-1';

    // 1. Seed Official Accounts (5 Management Roles + 9 Pencatat Lapangan + Demo)
    console.log('1. Seeding User Accounts & RBAC Roles...');
    await seedAccounts(seedPassword);

    // 2. Insert sample places
    console.log('2. Seeding Sample Places...');
    await db
      .insert(places)
      .values([
        {
          id: 'place-monas',
          name: 'National Monument (Monas)',
          description: 'Iconic tower in Central Jakarta',
          location: { x: 106.827153, y: -6.175392 }, // lon, lat
          userId,
        },
        {
          id: 'place-istiqlal',
          name: 'Istiqlal Mosque',
          description: 'Largest mosque in Southeast Asia',
          location: { x: 106.831389, y: -6.170278 }, // lon, lat
          userId,
        },
        {
          id: 'place-katedral',
          name: 'Jakarta Cathedral',
          description: 'Neo-gothic Roman Catholic cathedral',
          location: { x: 106.833056, y: -6.169167 }, // lon, lat
          userId,
        },
      ])
      .onConflictDoNothing();

    // 3. Seed Master Kondisi Catat (22 Kode STI Resmi PDAM)
    console.log('3. Seeding Master Kondisi Catat...');
    await seedMasterKondisi();

    // 3b. Seed Master Tarif & Blok Konsumsi Progresif
    console.log('3b. Seeding Master Golongan & Blok Tarif...');
    await seedMasterTarif();

    // 4. Seed Master Pelanggan & Transaksi Catat Meter (jika tabel masih kosong)
    console.log('4. Checking Pelanggan & Cater Dataset...');
    const [existingPelanggan] = await db.select({ total: count() }).from(pelanggan);
    const [existingCater] = await db.select({ total: count() }).from(caterBacaMeter);
    if (!existingPelanggan || existingPelanggan.total === 0 || !existingCater || existingCater.total === 0) {
      const masterOnly = process.env.SEED_MASTER_ONLY === 'true';
      console.log(`Populating dataset from CSV (masterOnly: ${masterOnly})...`);
      await importProgresCater({ masterOnly });
    } else {
      console.log(`Pelanggan (${existingPelanggan.total}) and Cater (${existingCater.total}) already populated. Skipping ETL.`);
    }

    // 5. Sync Area Layanan (7 Kecamatan, 21 Kelurahan Resmi)
    console.log('5. Syncing Area Layanan (7 Kecamatan, 21 Kelurahan)...');
    await syncAreaLayanan21Kelurahan();

    // 6. Update Koordinat Pelanggan dari Data Verifikasi Survei Lapangan mWater
    console.log('6. Seeding Data Verifikasi Spasial mWater...');
    await seedDataVerifikasi();

    console.log('=== SEEDING COMPLETED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
