Keputusan bisnis saya:

## 1. Pelanggan DICABUT → Opsi A, dengan syarat

- Pelanggan DICABUT tetap ada di master `pelanggan` (jangan dihapus), statusnya `DICABUT`.
- Riwayat pembacaan 202610 mereka tetap utuh di `daftar_catat(202610)`.
- Mereka tidak diterbitkan di DPM 202611 selama statusnya DICABUT.
- Harus ada jalur resmi untuk mengaktifkan kembali (sambung kembali). Saat status berubah jadi aktif, pelanggan masuk DPM periode yang sedang open dengan stand awal = stand akhir terakhir yang tercatat.
- Sebelum eksekusi, jelaskan selisih angka 29 (ketcatat='DICABUT'/tmss='D') vs 9 (tupsp/tupsm + DICABUT). Tampilkan daftar 20 pelanggan selisihnya dan apa status pelanggan mereka, supaya saya bisa memastikan tidak ada yang salah terlewat.

## 2. Nomor meter kosong/placeholder → Setuju, diperluas

- `-` dan `00000000` → `pelanggan.no_meter = NULL`, tanpa baris `water_meter`.
- Untuk `2018MBR` dan `2017MBR`: cek apakah nilai itu dipakai lebih dari satu pelanggan. Jika ya, jangan di-upsert dengan `nometer` sebagai kunci unik, karena beberapa pelanggan akan tergabung ke satu meter. Laporkan jumlahnya dan usulkan penanganannya.
- Pastikan unique constraint `water_meter.nometer` tidak membuat seed gagal atau menggabungkan meter berbeda secara diam-diam.
- Buat daftar pelanggan tanpa nomor meter valid agar bisa dilengkapi lewat UI nanti.

## 3. Urutan rute → Setuju, dengan aturan tambahan

- Urutan awal 1..N per `rute_kode` berdasarkan `nprs ASC, nolg ASC`.
- Periksa dulu apakah urutan baris di CSV asli lebih mencerminkan urutan jalan petugas di aplikasi lama. Kalau ya, pakai urutan CSV.
- `no_urut_rute` disimpan permanen di master. Jangan dihitung ulang tiap closing.
- DPM periode baru mewarisi urutan dari master.
- Petugas harus bisa mengubah urutan lewat aplikasi nantinya, dan perubahan itu tidak tertimpa seed berikutnya.

## 4. Biaya tetap saat closing → Setuju, dengan syarat

- Sumber: `golongan_tarif` milik pelanggan. Hapus fallback 15.000 / 5.000 / 0.
- Jika golongan tarif pelanggan tidak ada atau komponennya kosong, closing harus **gagal dengan pesan jelas**, jangan diam-diam pakai angka default.
- Nilai bea_beban, bea_admin, dan air_kotor harus **disalin (snapshot) ke data periode saat closing**. Periode yang sudah closed tidak boleh berubah kalau tarif diubah di kemudian hari.
- Buktikan klaim "cocok 100%" dengan angka: berapa pelanggan di ProgresCater-PW5.csv yang komponennya berbeda dari `golongan_tarif` (targetnya 0), lalu tampilkan contoh jika ada.

## 5. Eksekusi → Setuju dengan pengaman

- Reset hanya boleh di database lokal/dev. Konfirmasikan dulu koneksi mana yang dipakai. Backup atau sdump database sebelum reset.
- Jalankan seed 2x. Bandingkan jumlah baris tiap tabel di antara run pertama dan kedua, harus identik tanpa duplikat.
- Simulasi 202611 → 202612 → 202701 dijalankan di database salinan atau dalam transaksi yang di-rollback.
- State akhir database yang ditinggalkan: **202610 closed, 202611 open**, belum ada pembacaan November.

## Laporan yang saya minta setelah eksekusi

1. Rekonsiliasi: jumlah pelanggan/meter/rute vs CSV, FK yatim = 0, stand awal 202611 = stand akhir 202610 untuk semua pelanggan aktif.
2. Total pemakaian dan total tagihan 202610 di database cocok dengan CSV.
3. Hasil uji skenario: pelanggan baru muncul di bulan berikutnya, meter diganti (stand reset), pelanggan DICABUT disambung kembali, bulan terlewat (tidak ada pembacaan), pergantian tahun.
4. Daftar langkah yang gagal atau diasumsikan.
