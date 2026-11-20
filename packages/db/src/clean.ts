import { db } from './client';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Helper to safely truncate tables only if they exist in the database.
 */
async function truncateIfExists(tables: string[]) {
  const tableListStr = tables.map((t) => `'${t}'`).join(', ');
  const existingRows = await db.execute(sql.raw(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (${tableListStr})
  `));
  const existingTables = (existingRows as any[]).map((r: any) => `"${r.table_name}"`);
  if (existingTables.length > 0) {
    await db.execute(sql.raw(`TRUNCATE TABLE ${existingTables.join(', ')} CASCADE;`));
  }
}

/**
 * Script Pembersihan Database PDAM Cater
 * 
 * Penggunaan:
 * - Membersihkan data operasional & master (akun auth tetap utuh):
 *     bun run db:clean
 * - Pembersihan total termasuk seluruh akun auth/user:
 *     bun run db:clean --all
 */
async function cleanDatabase() {
  const isCleanAll = process.argv.includes('--all') || process.env.CLEAN_ALL === 'true';

  console.log('====================================================');
  console.log('       PDAM CATER - PEMBERSIHAN DATABASE            ');
  console.log('====================================================');
  console.log(`Mode: ${isCleanAll ? 'TOTAL CLEAN (Semua Data + Akun Pengguna)' : 'DATA CLEAN (Master & Transaksi, Akun Tetap Ada)'}`);
  console.log('Menghubungkan ke database...');

  try {
    // 1. Bersihkan Tabel Transaksional Pembacaan Meter, Tagihan, Periode, & KPI
    console.log('\n[1/3] Menghapus data transaksional...');
    await truncateIfExists([
      'cater_verifikasi_log',
      'cater_baca_meter',
      'cater_mandiri_pelanggan',
      'rekening_drd',
      'daftar_catat',
      'gwm_baca_meter',
      'water_meter_mutasi',
      'riwayat_pengaduan',
      'pengaduan',
      'periode_penagihan',
      'kpi_realisasi',
      'kpi_indikator',
      'kpi_objektif',
      'kpi_perspektif',
      'broadcast',
      'pengaturan_konten',
    ]);
    console.log('  ✓ Tabel pembacaan meter, penagihan DRD, periode, pengaduan, dan KPI berhasil dikosongkan.');

    // 2. Bersihkan Tabel Master Data Pelanggan, Aset, Wilayah, Pipa, & Tempat
    console.log('\n[2/3] Menghapus master data pelanggan & wilayah...');
    await truncateIfExists([
      'pelanggan',
      'water_meter',
      'grand_water_meter',
      'rute_cater',
      'petugas_cater',
      'kelurahan',
      'kecamatan',
      'wilayah_administrasi',
      'golongan_tarif',
      'biaya_tetap',
      'tarif_blok',
      'master_kondisi_catat',
      'area_layanan',
      'places',
      'sumber_air',
      'pipa_jaringan',
    ]);
    console.log('  ✓ Tabel pelanggan, water meter, rute, tarif, area layanan, dan pipa jaringan berhasil dikosongkan.');

    // 3. Bersihkan Akun Auth jika mode --all aktif
    if (isCleanAll) {
      console.log('\n[3/3] Mode --all aktif: Menghapus seluruh akun pengguna & RBAC...');
      await truncateIfExists([
        'user_rute_assignment',
        'user_wilayah_scope',
        'user_roles',
        'session',
        'account',
        'verification',
        'user',
      ]);
      console.log('  ✓ Seluruh tabel akun pengguna, sesi, dan roles berhasil dikosongkan.');
    } else {
      console.log('\n[3/3] Akun pengguna & RBAC dipertahankan (gunakan --all jika ingin menghapus akun juga).');
    }

    console.log('\n====================================================');
    console.log('✓ PEMBERSIHAN SELESAI!');
    console.log('Database kini bersih dan siap untuk proses seeding ulang.');
    console.log('Jalankan perintah berikut untuk mengimpor data kembali:');
    console.log('  bun run db:seed');
    console.log('====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat membersihkan database:', error);
    process.exit(1);
  }
}

cleanDatabase();
