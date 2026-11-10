# Tugas: Buat sheet dialog "Add KPI" untuk halaman Strategy Scorecard

Gambar referensi terlampir. Saat tombol "+ Add KPI" di toolbar scorecard
diklik, muncul panel (sheet) yang meluncur dari sisi kanan layar. Tiru tata
letaknya semirip mungkin.

## Aturan proyek (wajib)

- Baca dan patuhi docs/STRUKTUR-KODE.md (folder semantik, file PascalCase,
  jangan memecah file berlebihan).
- Pakai komponen shadcn/ui (Sheet, Input, Select, Label, Button) dan ikon
  HugeIcons. Jangan menambah dependensi baru tanpa izin saya.
- Pisahkan: tipe data, fungsi validasi (murni), dan komponen tampilan.

## Langkah kerja

1. Lihat dulu komponen scorecard yang sudah ada (tipe KPI, data, fungsi
   hitung) dan komponen shadcn/ui yang sudah terpasang.
2. Usulkan daftar file yang akan dibuat/diubah, tunggu persetujuan saya.
3. Implementasi, lalu ringkas hasilnya.

## 1. Kerangka sheet

- Muncul dari kanan, tinggi penuh, lebar sekitar 520px (di layar kecil
  hampir selebar layar). Di belakangnya ada overlay gelap tipis.
- Tiga bagian vertikal:
  1. Header (tetap di atas)
  2. Isi (scroll sendiri bila panjang)
  3. Footer aksi (tetap di bawah, latar abu-abu sangat muda, garis atas tipis)

### Header

- Judul besar "Add KPI".
- Di bawahnya teks abu-abu kecil: "Scored from Sep 2026 on."
  (periode mengikuti periode yang sedang dipilih di toolbar scorecard,
  jadi harus dinamis, bukan teks tetap).
- Tombol tutup (ikon X) di kanan atas.
- Garis pemisah tipis di bawah header.

### Isi: dua kartu bertingkat

Setiap kartu punya border tipis, kepala kartu berlatar abu-abu muda berisi
judul tebal + deskripsi kecil, lalu badan kartu putih berisi form.

**Kartu 1: "Definition"**
Deskripsi: "Where the KPI sits and who owns it."
| Field | Jenis | Isi/Placeholder | Teks bantu |
|---|---|---|---|
| Name | input teks | placeholder "Dashboards Shared per Team" | - |
| Objective | select | contoh nilai "Grow Recurring Revenue" | - |
| Owner | select | contoh "Nick Bold" | - |
| Unit | select | contoh "Percent" | - |
| Weight | input angka, akhiran "%" | kosong | "Share of its objective's score." |
Owner dan Unit berdampingan dalam satu baris dua kolom. Field lain selebar
penuh. Label di atas input, ukuran kecil dan tebal sedang.

**Kartu 2: "Plan"**
Deskripsi: "Progress runs from baseline to target."
| Field | Jenis | Isi/Placeholder | Teks bantu |
|---|---|---|---|
| Baseline | input angka, akhiran unit | kosong | "Where the year started." |
| Year End Target | input angka, akhiran unit | kosong | "Below baseline scores lower as better." |
| Actual, Sep 2026 | input angka, akhiran unit | placeholder "Not reported" | "Leave blank until the month closes." |
Baseline dan Year End Target berdampingan. Actual selebar penuh.
Label "Actual, Sep 2026" memakai periode terpilih (dinamis).

### Footer

- Kanan: tombol "Cancel" (outline, latar putih) dan tombol hitam
  "+ Add KPI" (ikon plus).

### Gaya visual

- Latar putih, border abu-abu tipis, sudut hampir tajam (radius kecil),
  tipografi sans-serif bersih, teks bantu abu-abu kecil.
- Input fokus memiliki border lebih gelap (lihat field Name di gambar).
- Sejajar dengan gaya halaman scorecard dan warna dashboard yang sudah ada.

## 2. Perilaku dan logika

**Pilihan Objective**

- Daftar diambil dari objektif yang ada di scorecard, dikelompokkan per
  perspektif (Financial, Customer, dst.).
- Bila sheet dibuka dari tombol "+" kecil di baris objektif tertentu,
  Objective langsung terisi dengan objektif itu. Bila dibuka dari tombol
  "+ Add KPI" di toolbar, Objective kosong atau default objektif pertama
  (usulkan mana yang lebih baik).

**Pilihan Owner**

- Daftar pemilik dari data yang ada, tampil dengan avatar kecil + nama.

**Unit mengatur akhiran input**

- Percent = akhiran "%", Currency = awalan/akhiran mata uang, Number = tanpa
  akhiran. Ganti Unit, maka akhiran di Baseline, Year End Target, dan Actual
  ikut berubah. Weight selalu "%".
- Daftar Unit mengikuti format angka yang sudah dipakai di tabel scorecard
  (persen, uang, angka biasa). Jangan membuat format baru.

**Arah KPI tidak diinput, melainkan diturunkan**

- Jika Year End Target lebih besar dari Baseline, maka makin tinggi makin
  baik (panah ↑ di tabel).
- Jika Year End Target lebih kecil dari Baseline, maka makin rendah makin
  baik (panah ↓ di tabel).
- Tampilkan petunjuk kecil di bawah field target saat arah sudah terdeteksi
  (misalnya "Lower is better"), agar operator paham.

**Validasi**

- Wajib: Name, Objective, Owner, Unit, Weight, Baseline, Year End Target.
- Weight: angka 0 sampai 100.
- Target tidak boleh sama dengan Baseline (menyebabkan pembagian nol pada
  rumus progress).
- Actual boleh kosong (artinya "no actual": tampil "-" di tabel dan tidak
  dihitung dalam skor).
- Tampilkan pesan error kecil berwarna merah di bawah field yang salah,
  dengan bahasa yang jelas. Tombol "+ Add KPI" boleh aktif terus dan
  memvalidasi saat diklik, atau nonaktif sampai valid (pilih satu dan
  konsisten, jelaskan pilihanmu).
- Tolak huruf pada field angka.

**Saat disimpan**

1. Validasi ulang dengan fungsi validasi yang sama (bukan hanya di UI).
2. Tambahkan KPI ke objektif yang dipilih.
3. Hitung ulang seluruh turunan di scorecard (progress KPI, objektif,
   perspektif, ringkasan, footer total) memakai fungsi hitung yang sudah ada.
4. Tutup sheet, tampilkan toast singkat "KPI added", dan beri sorotan
   sebentar pada baris baru (opsional).
5. Cegah klik ganda: tombol nonaktif selama proses.

**Menutup sheet (guard data)**

- Cancel, tombol X, klik overlay, dan tombol Esc menutup sheet.
- Bila form sudah diisi dan belum disimpan, tampilkan konfirmasi singkat
  "Discard changes?" sebelum menutup. Bila form masih kosong, langsung tutup.
- Saat dibuka, fokus otomatis ke field Name. Tab berpindah berurutan.
- Form di-reset setiap sheet dibuka ulang.

## 3. Struktur kode yang diharapkan

- Satu komponen utama untuk sheet (mis. AddKpiSheet.tsx), field dikelompokkan
  dalam dua kartu. Boleh ada satu komponen kecil bersama untuk "kartu bagian
  form" bila dipakai dua kali.
- Tipe input (mis. NewKpiInput) dan fungsi validasi dipisah dari tampilan.
- Fungsi penurunan arah KPI (dari baseline dan target) dan fungsi akhiran unit
  dipisah supaya mudah diuji.
- State buka/tutup sheet dikelola di halaman scorecard, termasuk objektif
  yang di-preselect.

## 4. Jangan lakukan

- Jangan menjadikan arah KPI (higher/lower is better) sebagai input terpisah.
- Jangan menyimpan data bila validasi gagal.
- Jangan mengubah tampilan tabel di luar penambahan baris baru.
- Jangan memecah menjadi banyak file kecil.

## Hasil akhir yang diharapkan

Ringkas: file yang dibuat/diubah, cara membuka sheet, dan hal yang perlu saya
putuskan.
