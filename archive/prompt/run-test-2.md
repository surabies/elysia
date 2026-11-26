Keputusan saya setelah membaca laporan run-test (versi diperbarui):

## 1. Riwayat taksasi sebelum Oktober (prioritas tertinggi)

- Data November membuktikan akumulasi lama sering lebih dari 1 bulan: 107 dari 377 pelanggan St AWAL bergeser (28 + 33 + 46) punya taksasi berturut-turut sebelum Oktober. Seed yang hanya membawa pakai Oktober akan memberi kredit terlalu kecil dan menagih lebih pada bacaan fisik pertama.
- Sumber riwayat: aplikasi terpisah bernama infolang menyimpan riwayat pemakaian pelanggan per tahun (dipakai verifikator untuk memeriksa pemakaian tidak wajar). Saya akan mengusahakan ekspor 12 bulan (nolg, periode, stand awal, stand akhir, pakai, kondisi catat). Rancang ETL generik untuk file riwayat seperti itu (pemetaan kolom lewat konfigurasi), simpan di tabel riwayat pemakaian, dan hitung akumulasi taksasi sejak bacaan fisik terakhir untuk DPM periode pembuka.
- Selama file riwayat belum ada:
  (a) Hitung perkiraan pelanggan di DPM 202611 yang berisiko akumulasi kurang.
  (b) Beri flag `akumulasi_perlu_verifikasi` di daftar_catat untuk pelanggan yang riwayatnya tidak bisa dipastikan. Saat bacaan fisik masuk, verifikator wajib memeriksa kredit sebelum tagihan terbit.
  (c) Uji jalur produksi: database kosong → seed 202610 → import progrescater closing 202611 di atas database yang sama → 202612 terbuka. Jelaskan bagaimana akumulasi 202611 hasil seed Oktober diperlakukan saat file 202611 closed diimpor (diganti atau dijumlahkan) dan buktikan tidak terhitung ganda. Sebelum file November asli ada, pakai data sintetis dari hasil simulasi.

## 2. Pemetaan kondisi dan replay

- Tampilkan tabel replay LENGKAP semua kondisi (DK, TTB, MB, dll.). Tabel sebelumnya hanya menjelaskan 781 dari 971 selisih.
- STAND TEMPEL (N) cocok 78% dan STAND-KONSUMEN (Z) 65%. Cari dari data aturan yang menjelaskan pakai CSV untuk kedua kondisi ini, lalu perbaiki mode_hitung-nya. Jangan menyebut "rata-rata 3 bulan" tanpa bukti.
- Bacaan Normal dengan stand akhir = stand awal: jangan ubah mode Normal. Tandai SUBMITTED dengan flag STAND_TETAP agar verifikator memutuskan. Laporkan jumlahnya (di sampel ±341).
- Untuk 96 pelanggan Normal 1–4 m³: dari 1.966 pelanggan yang kena minimum, berapa persen punya pakailalu < 5? Laporkan angkanya.

## 3. Kelebihan angka meter (kode M | KELEBIHAN)

Makna dari pihak perusahaan: stand di sistem lebih tinggi dari angka meter fisik (contoh: sistem 1000, terbaca 900), umumnya pada DK, BMB, RK, dan TTB. Di model kita ini adalah kasus kredit taksasi > selisih fisik (contoh (c)).

- Tambahkan kondisi `M | KELEBIHAN` ke master_kondisi_catat dengan mode baru `KREDIT_TAKSASI`:
  - stand fisik tersimpan apa adanya (stml tidak digeser dan tidak mundur);
  - pakai_tagih mengikuti konfigurasi `tagihan_saat_kelebihan` (NOL | MINIMUM; seed sementara MINIMUM sampai Penagihan memutuskan);
  - akumulasi_taksasi dikurangi selisih fisik dan sisanya dibawa ke periode berikutnya.
- Alur: bacaan dengan kredit > selisih fisik berstatus ANOMALY (ANOMALI_KREDIT_TAKSASI). Verifikator memeriksa riwayat, lalu menetapkan kondisi M. Setelah itu perhitungan berjalan otomatis sesuai mode, tanpa koreksi manual tiap bulan. Semua penetapan tercatat di log audit (siapa, kapan, nilai sebelum/sesudah).
- Pisahkan jelas dari meter mundur (F), ganti meter (MB), dan salah baca (ANOMALY_NEGATIVE). Jelaskan kriteria pembeda.
- Opsi koreksi lain untuk verifikator: hapus/kurangi sebagian kredit dengan alasan wajib, atau koreksi bacaan.
- ETL: periksa kolom "St Akhir Catat" (angka mentah petugas, terisi pada 289 baris) terhadap St AWAL efektif. Laporkan berapa baris yang angka mentahnya lebih kecil dari St AWAL efektif, per kondisi. Untuk baris seperti itu dan baris berkondisi M, usulkan pemetaan: stand fisik = angka mentah, akumulasi_taksasi = stand efektif − angka mentah. Buktikan dengan baris M di data (00901000288) dan contoh lain. Jika data tidak mendukung, jelaskan.
- Tes tambahan: sistem 1000, fisik 900, kredit 100 → bulan berikutnya fisik 920 (kredit tersisa 80) → fisik 1010 (kredit habis, pakai_tagih = 1010 − 1000 = 10 jika konsisten dengan prinsip total ditagih = pemakaian fisik).

## 4. Hal yang tidak diputuskan agent sendiri

- 26 baris kode/nama silang: setuju dengan usulan prioritas, dengan catatan audit di cater_baca_meter.catatan.
- Ganti meter (MB): rancang agar alur aplikasi baru menerima stand angkat dan nomor meter baru yang menyusul (tidak memblokir pencatatan dan tidak menghalangi closing), dengan status "data meter belum lengkap". Jelaskan alurnya sebelum implementasi.

## 5. Keamanan

- Pastikan akun seed wajib ganti password saat login pertama. Jika belum, jelaskan cara termudah menambahkannya.
