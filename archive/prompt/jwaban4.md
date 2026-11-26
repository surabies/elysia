Pemetaan TMSS (acuan: Kategori Master), pakai ini untuk seed dan backfill:

- NORMAL: spasi, -, H, Z, P, 4, U, 0, K, M
- ANOM_KERUSAKAN_METER (anomali): 7, 3, 6, O, F, T, D, 9
- WARN_KENDALA_AKSES (peringatan): R, N, 2, 5, E, Q, AA, 8

Tambahan:

1. Seed pemetaan dibuat dari kolom kategori master_kondisi_catat, bukan daftar kode yang ditulis manual. Kode baru otomatis mengikuti kategori master, dan operator bisa menimpanya lewat UI. Kode tanpa pemetaan tampil di tab "Belum Terpetakan".
2. Normalkan kode kondisi Normal (spasi vs "-") menjadi satu kode. Jelaskan dampaknya pada data lama dan jangan ubah data transaksi tanpa persetujuan.
3. Trigger immutable harus idempoten (DROP TRIGGER IF EXISTS sebelum CREATE) dan skrip down menghapus trigger dan fungsinya.
4. Perbaiki ekspektasi uji: persen=-50%, acuan=9 diklasifikasikan ANOM_DEVIASI_RING2 (hanya ANOM_PENURUNAN_PERSEN yang tidak berlaku).
5. Setelah pemetaan ini, jalankan ulang dry-run di branch Neon dan laporkan: total anomali, peringatan, normal, serta rincian per kode utama untuk 202611 dan 202610. Saya akan menilai angkanya sebelum KPI dipindah.

Branch Neon: sudah siap di env.local aku hanya menulis DATABASE_URL saja
Jangan jalankan ke database utama.
