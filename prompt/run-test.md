Keputusan saya:

## 1. Aturan taksasi → Setuju, dengan penyesuaian

- Tambahkan `mode_hitung` (SELISIH_FISIK | NOL | TAKSASI_HISTORI) di master_kondisi_catat. Isi awal mengikuti bukti data: TIDAK ADA AIR dan DICABUT → NOL; kondisi kendala (DK, RUMAH KOSONG, TIDAK DIPAKAI, MTA, TTB, METER RUSAK, TERHALANG, BMK/BMB, MATI ADA AIR, ADA ANJING) → TAKSASI_HISTORI; Normal → SELISIH_FISIK.
- TAKSASI_HISTORI = pakai_lalu (bukan rata-rata), sesuai praktik aplikasi lama (82–100% data).
- Pemakaian minimum dibuat konfigurasi generik (default nonaktif; seed Tirtawening = 5 m³, sesuai bukti 96,1%). Jangan menaruhnya di tabel pengaturan_konten bila itu tabel konten/CMS. Pakai tabel/kolom konfigurasi tagihan yang semantik.
- Jelaskan 96 pelanggan Normal yang ditagih 1–4 m³ tanpa minimum. Jika dijelaskan oleh golongan tarif, ukuran meter, atau kondisi lain, jadikan konfigurasi (mis. minimum per golongan). Jika tidak, laporkan sebagai anomali data lama.
- Taksasi tetap dijalankan eksplisit oleh operator (alasan + pencatat) dan melewati alur verifikasi. Tidak ada taksasi otomatis.

## 2. Rekonsiliasi taksasi → Setuju akumulasi_taksasi_m3, dengan aturan

- Satu mekanisme saja: `akumulasi_taksasi_m3` di daftar_catat. Jangan buat `stml_revisi`. `stml` tetap angka meter asli. Pergeseran St AWAL aplikasi lama diterjemahkan menjadi akumulasi.
- Akumulasi bersifat **kumulatif**: taksasi berturut-turut dijumlahkan sejak bacaan fisik terakhir, dan di-reset saat bacaan fisik terverifikasi. Prinsip: total yang ditagih sepanjang rentang = pemakaian fisik riil.
- Hasil negatif (kredit > selisih fisik) → status ANOMALY dan koreksi manual, tidak dipotong otomatis.
- Tentukan dan dokumentasikan urutan penerapan minimum vs kredit taksasi. Sertakan 3 contoh angka di tes: (a) taksasi 5, selisih fisik 7; (b) taksasi 27, selisih fisik 54; (c) taksasi 27, selisih fisik 20. Jika hasil salah satu contoh melanggar prinsip total ditagih = pemakaian fisik, berhenti dan laporkan sebelum implementasi.
- Cek dari data Oktober–November: apakah aplikasi lama menggeser St AWAL hanya sebesar taksasi bulan lalu atau akumulatif? Jika tidak bisa dibuktikan dari data, tulis sebagai pertanyaan untuk Bagian Penagihan.

## 3. Analisis lanjutan data November (read-only)

- 157 pelanggan (377 − 220) dengan St AWAL ≠ stma Oktober yang tidak cocok rumus stma + pakai_drd: klasifikasikan hubungan angkanya, kondisinya, dan beri contoh.
- 17 pelanggan DICABUT Oktober yang muncul di export November, 3 pelanggan baru berstatus DI CABUT, dan 4 pelanggan aktif yang di November tercatat DI CABUT: export daftar (nolg, nama, kondisi Oktober vs November, pakai). Jangan ubah status apa pun.
- 14 pelanggan MB (meter baru): jelaskan apa yang bisa dipetakan ke GwmService (stand angkat, stand pasang, nomor meter baru) dan apa yang tidak ada di CSV.
- Kode kondisi M | KELEBIHAN dan 26 baris kode/nama tidak sinkron: usulkan pemetaan, jangan tambahkan ke master sebelum saya putuskan.
- Baris export November yang tidak punya DPM aktif.
- 3 baris stand akhir < stand awal dengan pakai positif dan 27 baris pakai > 100 m³: export untuk verifikasi.

## 4. Jalur go-live → Opsi A: go-live Desember dari progrescater hasil closing November di aplikasi lama

Data lapdatametertes.csv (November, sampai 20 Nov pukul 14.00, ±63%) hanya dipakai sebagai **bahan uji**. JANGAN diimpor ke database utama. Produksi dimulai dari progrescater November hasil closing nanti.

Tugas:

1. Pastikan ETL menerima progrescater periode 202611 (closed) dan membuka 202612 tanpa perubahan kode. Periode dibaca dari data.
2. Turunkan `akumulasi_taksasi_m3` dari data closing November untuk pelanggan yang ditaksir (kondisi taksasi, stma = stml, pakai_drd > 0). Jelaskan keterbatasannya jika ada taksasi sebelum November yang tidak tercatat di data.
3. Uji simulasi memakai lapdatametertes.csv di **database salinan/branch saja**:
   a. Replay aturan hitung: terapkan mode*hitung + minimum ke tiap baris dan bandingkan pakai hasil hitung dengan kolom Pakai di CSV. Laporkan selisih per kondisi.
   b. Laporkan cakupan data per rute dan per petugas, untuk menilai apakah sampelnya bias.
   c. Impor lewat service normal (status SUBMITTED/ANOMALY*\*) dan laporkan jumlah anomali yang tertandai.
   d. Uji guard closing: konfirmasi closing ditolak saat DPM BELUM_DICATAT > 0, lalu selesaikan sisa pelanggan dengan taksasi eksplisit (fitur yang sama dengan operator), jalankan closing, dan buka Desember. Periksa carry-forward dan akumulasi_taksasi_m3.
   e. Pastikan seluruh skrip bisa dijalankan ulang dengan file CSV baru tanpa mengubah kode.
4. Catatan: file ini tidak punya komponen tagihan, jadi tidak ada perbandingan total tagihan. Replay tagihan November dilakukan nanti dengan progrescater November hasil closing.

## 5. Pengamanan tambahan

- Seed akun: pastikan password akun produksi tidak bisa memakai nilai bawaan walaupun NODE_ENV tidak di-set (mis. wajib SEED_DEFAULT_PASSWORD dengan panjang minimum, dan wajib ganti password saat login pertama).
- Perbarui runbook dan tes regresi untuk poin 1 dan 2.
