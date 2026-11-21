Keputusan saya:

## 1. Alur MB → Setuju diterapkan, dengan syarat

- Enum DATA_METER_BELUM_LENGKAP dan kolom nullable seperti usulan. no_meter_baru dan stand_angkat wajib terisi saat status naik ke APPROVED. stand_pasang default 0 tetapi bisa diubah oleh teknik.
- Pratinjau closing menampilkan jumlah mutasi DATA_METER_BELUM_LENGKAP beserta umurnya sebagai peringatan (tidak memblokir).
- Pemakaian meter lama (stand_angkat − stml) yang baru diketahui setelah periode closed TIDAK boleh ditambahkan ke pemakaian bulan berikutnya. Hitung sebagai koreksi atas bulan kejadian: tagihan seharusnya (pemakaian gabungan bulan itu) dikurangi yang sudah terbit, lalu terbitkan selisihnya. Cek apakah DRD sudah punya mekanisme koreksi/tagihan susulan. Jika belum, jelaskan usulan dan tunggu persetujuan sebelum implementasi bagian ini.
- Tes: MB dengan stand angkat menyusul sebelum closing dan sesudah closing.

## 2. tagihan_saat_kelebihan

Biarkan MINIMUM sementara. Dokumentasikan sebagai keputusan yang menunggu Penagihan. Satu baris data M tidak cukup membedakan MINIMUM dari pakai_lalu.

## 3. Verifikasi dan penyempurnaan

- Baris MB "pakai negatif −1449" berbeda dari −86 (00704300190) di laporan sebelumnya. Jelaskan apakah baris yang sama dan dari mana angkanya.
- Selaraskan jumlah assertion tes (113 vs 102) dan tampilkan output tes terakhir.
- Pastikan wajib_ganti_password benar-benar ditegakkan: pengguna dialihkan ke halaman ganti password dan tidak bisa membuka halaman lain sebelum selesai. Jika belum, implementasikan.
- Pastikan operator dapat memasukkan nilai taksasi sendiri (bukan hanya pakai_lalu) dengan alasan wajib dan log audit, karena sekitar 2% bacaan data lama adalah taksasi manual.
- Pelanggan dengan akumulasi_perlu_verifikasi (8.733): sediakan antrean verifikasi terpisah yang bisa disaring dan diurutkan berdasarkan risiko (mis. selisih netto terhadap pemakaian bulan lalu), supaya tidak menumpuk di antrean biasa. Laporkan berapa tanda yang turun setelah file infolang diimpor.
- Uji ETL infolang dengan file sintetis berformat berbeda (delimiter dan nama header) untuk membuktikan pemetaan konfigurasi bekerja.

## 4. Jangan tambah fitur di luar daftar ini

Setelah poin 1–3 selesai, laporkan ringkas dan berhenti. Tidak ada aturan baru yang ditambahkan sebelum ada data nyata (ekspor infolang dan progrescater November hasil closing).

Perbaiki dua tes yang gagal dan perjelas status infolang. Tidak ada fitur baru.

1. **Infolang bukan sumber impor.** Infolang adalah halaman terpisah untuk melihat riwayat pemakaian pelanggan (dipakai verifikator memeriksa pemakaian tidak wajar). Tidak ada ekspor atau integrasi. Ubah komentar, dokumen (termasuk docs/SEED-DAN-GO-LIVE.md), dan teks UI yang menyiratkan impor dari infolang. Jelaskan bahwa ETL riwayat bersifat generik untuk file riwayat apa pun (mis. progrescater bulan-bulan sebelumnya). Jangan hapus atau ganti nama file/tabel sekarang.
2. **Alur flag akumulasi_perlu_verifikasi.** Pastikan verifikator dapat melihat kredit taksasi pelanggan dan mengoreksinya dengan alasan wajib, tercatat di log audit, dari antrean verifikasi terpisah. Laporkan apakah sudah ada atau belum. Jangan menambahkan integrasi ke infolang.
3. **Tes 8 dan 9 gagal karena timeout 5000ms.** Set timeout eksplisit (mis. 120_000 ms) pada keduanya dan ukur durasi tiap tahap (seed, import, carryForward) pada tes 8.
4. **Bukti rollback.** Jelaskan apakah importProgresCater dan ETL riwayat di tes 8 dan 9 memakai koneksi transaksi tes atau koneksi global. Jika global, tes ini menulis ke database sungguhan: ubah agar memakai transaksi tes atau database tes terpisah. Log menunjukkan periode 202611 dikunci dengan snapshot 2 SL dan 202612 dibuka.
5. **Penjaga kebersihan.** Snapshot jumlah baris tabel kunci (pelanggan, water_meter, periode_penagihan, daftar_catat, cater_baca_meter, rekening_drd, riwayat_pemakaian_historis) sebelum dan sesudah suite. Beda = tes gagal.
6. Hapus .tmp-test-progrescater-202611.csv di blok finally.
7. Tes hanya boleh berjalan di database yang ada di allowlist tes (mis. env TEST_DATABASE_URL).
8. Jalankan ulang suite di database tes terpisah dan tampilkan output lengkap: 10 tes harus hijau. Laporkan jumlah expect() akhir dan hasil snapshot jumlah baris. Jangan menyebut selesai sebelum semua hijau.
