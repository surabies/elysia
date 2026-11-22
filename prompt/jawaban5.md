Angka dry-run saya terima (13,6% di 202611, 12,5% di 202610). Lanjutkan eksekusi DDL + seed + backfill dalam satu transaksi di branch Neon.

Sebelum atau saat eksekusi:

1. Berikan rincian jumlah baris pemakaian 0 per kode TMSS untuk 202611 dan 202610. Saya akan memutuskan apakah ANOM_PEMAKAIAN_NOL dikecualikan untuk kondisi tertentu (mis. H, R). Jangan mengubah aturan sebelum saya putuskan.
2. Pastikan urutan prioritas kode_anomali_utama dibaca dari database (kolom urutan/tingkat keparahan), bukan konstanta di kode. Tunjukkan lokasi kodenya.
3. Pastikan ada uji yang memverifikasi kode ' ' (spasi) dan '-' sama-sama dipetakan NORMAL, dan lookup ke master_kondisi_catat memakai nilai asli.

Setelah eksekusi di branch, laporkan hasil dari database branch (bukan dari memori):
a. Jumlah per kategori (anomali / peringatan / normal) dan per kode*anomali_utama untuk 202611 dan 202610, total harus sama dengan total baris periode (36.762 seluruhnya).
b. Query yang bisa saya jalankan ulang untuk memverifikasi: is_anomali = true sama dengan baris yang kode_anomali_utama bukan NULL dan bukan WARN*.
c. Jumlah baris dengan aturan_versi NULL (harus 0).
d. Bukti skrip rollback (down) sudah diuji di branch.

Jangan menyentuh database utama. Setelah laporan itu disetujui, buat rencana eksekusi ke database utama (termasuk titik pemulihan). Pastikan .env.local dikembalikan ke database utama setelah selesai, dan tidak ada proses yang berjalan terhadap branch tanpa sepengetahuan saya.
