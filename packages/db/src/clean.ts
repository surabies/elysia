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
  // Guard 1: Wajib cek ALLOW_RESET_DB cocok persis dengan nama database aktif di PostgreSQL
  const [dbInfo] = await db.execute(sql`SELECT current_database() AS db_name`);
  const currentDbName = String((dbInfo as any).db_name || '');
  const allowedResetDb = (process.env.ALLOW_RESET_DB || '').trim();

  if (!allowedResetDb || allowedResetDb !== currentDbName) {
    console.error(
      `❌ [SECURITY GUARD] Reset database DITOLAK! Nama database target adalah '${currentDbName}', tetapi env ALLOW_RESET_DB='${allowedResetDb || '(kosong)'}'. Untuk mengizinkan reset, Anda WAJIB menyetel ALLOW_RESET_DB=${currentDbName} secara eksplisit.`
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_DB_RESET !== 'true') {
    console.error(
      '❌ [SECURITY GUARD] Pembersihan/reset database DILARANG saat NODE_ENV=production! Jika ini benar-benar disengaja, set ALLOW_PRODUCTION_DB_RESET=true.'
    );
    process.exit(1);
  }

  // Guard 2: Tolak jika periode yang sedang OPEN (BERJALAN) sudah memiliki pembacaan meter (kecuali FORCE_CLEAN_OPEN_READINGS=true)
  try {
    const openReadings = await db.execute(sql`
      SELECT p.periode, count(c.id)::int AS cnt
      FROM periode_penagihan p
      JOIN cater_baca_meter c ON c.thbl = p.periode
      WHERE p.status = 'BERJALAN'
      GROUP BY p.periode
    `);
    if ((openReadings as any[]).length > 0 && process.env.FORCE_CLEAN_OPEN_READINGS !== 'true') {
      const info = (openReadings as any[]).map((r) => `${r.periode} (${r.cnt} bacaan)`).join(', ');
      console.error(
        `❌ [SECURITY GUARD] Reset database DITOLAK karena periode open sudah memiliki pembacaan aktif: [${info}]. Set FORCE_CLEAN_OPEN_READINGS=true jika ingin memaksa penghapusan.`
      );
      process.exit(1);
    }
  } catch {
    // Abaikan jika tabel belum ada
  }

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
      'zona_distribusi',
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
