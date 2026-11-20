# TUGAS: Inspeksi, Analisis, dan Rancang Skema + Seed Data Awal Produksi

## 1. Konteks

Aplikasi baca meter air untuk Perumda Tirtawening Kota Bandung sedang disiapkan masuk produksi. Data **progrescater** adalah data matang hasil export aplikasi lama: sudah lengkap dengan stand meter awal, stand meter akhir, pemakaian, dan data pelanggan. Data ini merupakan hasil **closing tutup-buka bulan Oktober**.

Peran progrescater: **data master awal (data pembuka)** untuk mengisi tabel-tabel database agar aplikasi bisa langsung berjalan. Setelah seed selesai, aplikasi **tidak boleh bergantung lagi** pada file/tabel progrescater.

Kondisi proyek saat ini: logika masih banyak bug dan sering bolak-balik diperbaiki. Karena itu, **jangan menambal gejala**. Cari akar masalah di desain skema dan alur datanya.

## 2. Tujuan Akhir

1. Progrescater menjadi titik awal produksi: pelanggan, meter, rute pencatatan, dan data pendukung lain terisi benar lewat seed.
2. Aplikasi bisa melanjutkan pencatatan **bulan berikutnya (November) dan seterusnya** tanpa error.
3. Aplikasi **dinamis terhadap periode**. Dijalankan dengan data periode kapan pun, perilakunya tetap benar dan tidak mengacu pada bulan tertentu. Kondisi aplikasi ditentukan oleh data di database (hasil seed + proses berjalan), bukan oleh konstanta di kode.

## 3. Prinsip Wajib (jangan dilanggar)

- **Tidak ada hardcode periode.** Larang string/angka seperti "Oktober", `month === 10`, atau tahun tetap di logika bisnis, query, dan seed. Periode harus berupa data (mis. tanggal awal periode atau pasangan tahun+bulan) dan perpindahan Desember → Januari harus aman.
- **Pisahkan 3 lapisan data:**
  1. _Referensi_: golongan/kelompok tarif, wilayah/zona, status meter, status pelanggan, dan sejenisnya.
  2. _Master_: pelanggan, meter, rute/urutan pencatatan, penugasan petugas ke rute (jika ada di skema).
  3. _Transaksi periode_: periode, pembacaan meter (stand awal, stand akhir, pemakaian), status verifikasi, status closing.
- **Opening state = hasil closing yang sah.** Seed harus menghasilkan kondisi yang sama dengan yang dihasilkan proses closing normal:
  - Periode Oktober: berstatus _closed_, pembacaannya tersimpan utuh sebagai riwayat.
  - Periode berikutnya (November): berstatus _open_, **stand awal tiap meter = stand akhir Oktober** (carry-forward), belum ada pembacaan.
  - Mekanisme carry-forward untuk seed harus **satu logika yang sama** dengan yang dipakai proses closing di aplikasi, jangan dibuat dua jalur berbeda.
- **Seed harus idempoten**: dijalankan berulang tidak membuat duplikat dan tidak merusak data. Pakai kunci alami yang stabil (mis. nomor pelanggan / nomor meter) untuk upsert.
- **Satu sumber kebenaran per fakta.** Pemakaian sebaiknya diturunkan dari stand akhir − stand awal. Jika disimpan, harus ada aturan konsistensi dan validasi yang jelas.
- **Jangan menghapus atau menimpa data yang sudah ada** tanpa persetujuan eksplisit saya.

## 4. Cara Kerja (ikuti urutan, jangan loncat)

### Fase A. Inspeksi (baca saja, belum ubah kode)

1. Petakan struktur proyek: skema database/ORM, migrasi, file seed yang ada, dan lokasi/format data progrescater.
2. Baca setiap kolom progrescater: nama, tipe, contoh nilai, jumlah baris, kolom kosong/duplikat.
3. Daftar semua tempat di kode yang **menentukan atau mengasumsikan periode** (hardcode bulan/tahun, "periode aktif", filter tanggal, proses closing, pembuatan pembacaan baru).
4. Daftar semua tempat yang membaca stand awal, stand akhir, dan pemakaian, serta bagaimana nilainya dihitung.

### Fase B. Analisis

1. **Tabel pemetaan**: kolom progrescater → tabel.kolom tujuan (tipe, transformasi, nullable, aturan). Tandai kolom yang tidak punya tujuan dan tujuan yang tidak punya sumber.
2. **Daftar celah dan bug akar masalah** antara skema/logika sekarang dan prinsip di bagian 3. Urutkan dari dampak terbesar, sebutkan file dan fungsi terkait.
3. **Audit kualitas data progrescater** (laporkan angka, jangan diam-diam diperbaiki):
   - stand_akhir ≥ stand_awal? Pemakaian = akhir − awal?
   - Kasus meter ganti/reset/putar balik (stand akhir < stand awal).
   - Pelanggan tanpa meter, meter tanpa pelanggan, meter dipakai ganda.
   - Pelanggan tanpa rute, rute tanpa urutan, urutan duplikat.
   - Duplikat nomor pelanggan/meter, nilai kosong, format tidak seragam.
   - Pelanggan nonaktif/putus/tutup: ikut di-seed atau tidak, dan bagaimana ditandai.
4. Jelaskan bagaimana tiap skenario ini berjalan di desain baru: bulan berikutnya normal, pelanggan baru muncul, meter diganti, pelanggan nonaktif, lompat periode (ada bulan terlewat), pergantian tahun.

### Fase C. Rancangan (berikan sebagai usulan, tunggu persetujuan saya)

1. **Skema final**: tabel, kolom, tipe, PK/FK, unique constraint, index, dan enum status. Tampilkan diagram relasi (teks/mermaid).
2. **Model periode**: bagaimana periode aktif ditentukan dari data, status siklusnya (mis. open → closed), dan aturan transisi.
3. **Rencana seed bertahap** dan urutannya (referensi → master → periode closed → periode open dengan carry-forward), termasuk transaksi/transaksi atomik dan rollback jika gagal.
4. **Validasi pasca-seed** (query rekonsiliasi): jumlah pelanggan/meter/rute cocok dengan sumber, tidak ada FK yatim, stand awal periode open = stand akhir periode closed, total pemakaian periode closed cocok dengan sumber.
5. **Dampak ke proses closing**: pastikan logika closing, pembuatan periode berikutnya, dan seed memakai fungsi carry-forward yang sama.

### Fase D. Implementasi (hanya setelah rencana disetujui)

- Kerjakan per langkah kecil yang bisa diuji. Setiap langkah: apa yang berubah, kenapa, cara memverifikasi.
- Ikuti konvensi di `/docs/STRUKTUR-KODE.md` (folder semantik, PascalCase, tidak memecah file berlebihan).
- Tambahkan tes/skrip verifikasi: seed dijalankan dua kali hasilnya sama, simulasi closing November → Desember → Januari tidak error, aplikasi berjalan dengan periode awal yang berbeda (uji dengan data seed periode lain).

## 5. Format Keluaran

Untuk Fase A–C kirim satu laporan terstruktur berisi:

1. Ringkasan temuan (maks 10 baris).
2. Tabel pemetaan progrescater → database.
3. Daftar bug/celah akar masalah, berurutan menurut prioritas.
4. Hasil audit kualitas data (dengan angka).
5. Usulan skema + model periode + rencana seed.
6. **Daftar pertanyaan/asumsi** yang butuh keputusan saya.

## 6. Aturan Perilaku

- Jika ada hal ambigu (arti kolom, aturan bisnis tarif/tagihan, penanganan meter ganti), **tanyakan atau tulis sebagai asumsi eksplisit**. Jangan menebak diam-diam.
- Jangan mengubah kode atau data sebelum Fase C disetujui.
- Jangan menambah fitur di luar lingkup ini.
- Jika menemukan bug di luar lingkup, catat saja di bagian terpisah.
