#!/usr/bin/env bun
/**
 * Skrip Cron Penutupan Otomatis Pengaduan Selesai (Fase 5 / K4, K6)
 *
 * Menutup tiket pengaduan yang berstatus SELESAI jika telah melewati batas waktu konfirmasi (konfirmasiBatasAt).
 * Penggunaan:
 *   bun run scripts/tutup-pengaduan-otomatis.ts
 *   bun run scripts/tutup-pengaduan-otomatis.ts --dry-run
 */

import { pengaduanService } from '../apps/web/src/server/services/pengaduan/pengaduan.service';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log('====================================================');
console.log(' CRON JOB: PENUTUPAN OTOMATIS TIKET PENGADUAN');
console.log(` Waktu Eksekusi : ${new Date().toISOString()}`);
console.log(` Mode           : ${isDryRun ? 'DRY-RUN (Simulasi)' : 'LIVE (Eksekusi Nyata)'}`);
console.log('====================================================');

async function main() {
  try {
    const hasil = await pengaduanService.tutupOtomatisKedaluwarsa({ dryRun: isDryRun });

    if (hasil.dryRun) {
      console.log(`[DRY-RUN] Tiket kedaluwarsa ditemukan: ${hasil.totalDitemukan}`);
      if (hasil.tiketKedaluwarsa && hasil.tiketKedaluwarsa.length > 0) {
        console.table(
          hasil.tiketKedaluwarsa.map((t) => ({
            'ID Tiket': t.id,
            'Nomor Tiket': t.nomorTiket,
            'Batas Konfirmasi': t.konfirmasiBatasAt ? new Date(t.konfirmasiBatasAt).toISOString() : '-',
          }))
        );
      } else {
        console.log('Tidak ada tiket SELESAI yang melewati batas konfirmasi saat ini.');
      }
    } else {
      console.log(`[LIVE] Total tiket kedaluwarsa : ${hasil.totalDitemukan}`);
      console.log(`[LIVE] Berhasil ditutup otomatis : ${hasil.berhasilDitutup}`);
    }

    console.log('----------------------------------------------------');
    console.log(' Eksekusi selesai dengan sukses.');
    process.exit(0);
  } catch (err) {
    console.error(' Terjadi kesalahan saat menjalankan penutupan otomatis:', err);
    process.exit(1);
  }
}

main();
