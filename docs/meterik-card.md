# Tugas: Ganti tampilan 4 kartu "Metrik Operasional Utama" agar sangat mirip sampel

Ada dua gambar terlampir:

- Gambar 1 = SAMPEL TARGET (4 kartu metrik). Hasil akhir harus sangat mirip.
- Gambar 2 = kondisi proyek SAAT INI. Header "Ringkasan Operasional" dan
  judul seksi "Metrik Operasional Utama" (beserta "126 Rute • 9 Petugas
  Aktif") TIDAK diubah. Yang diganti hanya isi dan tampilan 4 kartu di
  bawahnya. Grid 4 kolom dan jarak antar kartu (16px) dipertahankan.

Prioritas: kemiripan visual dengan Gambar 1 > kerapian kode > hal lain.
Jangan memperbaiki, mempercantik, atau menambah efek. Bila ragu, tiru gambar.
Semua ukuran/warna di bawah adalah perkiraan dari gambar; jika bertentangan
dengan gambar, GAMBAR YANG MENANG.

## Aturan proyek (wajib)

- Baca dan patuhi docs/STRUKTUR-KODE.md (folder semantik, file PascalCase,
  jangan memecah file berlebihan).
- UI memakai shadcn/ui dan ikon HugeIcons. Gaya sampel bernuansa Vercel/Geist;
  pakai token warna dan font yang sudah ada di dashboard, pilih yang terdekat.
- Komponen shadcn Card punya padding, gap, dan bayangan bawaan yang akan
  merusak kemiripan. Override semuanya sampai sesuai ukuran di bawah, atau
  pakai div biasa.
- Jangan menambah dependensi. Bar, pil, dan sparkline digambar dengan
  div/SVG biasa.
- Pisahkan: tipe data, data contoh, fungsi bantu (hitung lebar segmen, bentuk
  path sparkline), dan komponen tampilan.

## Langkah kerja (berurutan, jangan dilompati)

1. Baca struktur proyek, STRUKTUR-KODE.md, dan komponen kartu yang ada
   sekarang (pertahankan href/aksi tombolnya).
2. Tulis ulang dengan kata-katamu sendiri apa yang kamu lihat di tiap kartu
   Gambar 1 (elemen, urutan, perkiraan ukuran). Saya akan mengoreksi bila
   ada yang salah dibaca.
3. Bila memungkinkan, ambil warna asli dari Gambar 1 dengan sampling piksel
   (mis. Python PIL) daripada menebak. Bila tidak bisa, pakai estimasi di
   bawah.
4. Usulkan daftar file dan rancangan komponen, lalu TUNGGU persetujuan saya.
5. Implementasi.
6. Verifikasi visual (lihat bagian paling bawah). Jangan menyatakan selesai
   sebelum langkah ini dilakukan.

## 1. Anatomi kartu (dari Gambar 1)

Kartu: lebar mengikuti kolom grid (sekitar 386–393px pada viewport 1662px),
tinggi tetap 220px. Latar putih, border 1px abu-abu muda (#e5e5e5), radius
kecil (sekitar 6px), tanpa bayangan, overflow tersembunyi (footer mengikuti
sudut bawah kartu). Padding horizontal 16px.

Posisi vertikal, diukur dari tepi atas kartu (perkiraan):
| Bagian | Spesifikasi |
|---|---|
| Baris judul | pusat di y≈27. Kiri: ikon 16px abu-abu gelap (garis tipis 1.5) + jarak 8px + judul 15px/500 hitam (#171717). Kanan: label kecil 12.5px abu-abu (#8f8f8f), contoh "Now" |
| Baris nilai | pusat di y≈64. Angka besar 28px/600 hitam. Penyebut opsional (mis. "/13") 18px/400 abu-abu (#8f8f8f) tepat setelah angka. Lalu delta |
| Delta | jarak 8px dari angka. Ikon panah garis tipis 12px + jarak 4px + teks persen font monospace 12px/500. Warna: hijau (#12b76a) = baik, merah (#e5202e) = buruk, abu = netral. Arah panah = arah perubahan sebenarnya; WARNA = baik/buruk (dua prop terpisah) |
| Teks bantu | pusat di y≈90. 13px abu (#666) |
| Zona visual | y≈108 sampai 184. Isinya berbeda per varian (lihat bagian 2) |
| Footer | tinggi 36px, menempel di dasar kartu, latar #fafafa, garis atas 1px #ebebeb. Kiri: teks aksi 14px abu (#666). Kanan: ikon panah kanan 16px. Seluruh footer adalah satu area yang bisa diklik (link). Hover: teks dan panah sedikit lebih gelap, tanpa animasi besar |

## 2. Tiga varian zona visual

### Varian A: Bar segmen + legenda (kartu "Connection Health" dan "Linked Datasets")

- Bar: tinggi 8px, ujung segmen membulat penuh, jarak antar segmen 4px,
  top di y≈112. Lebar tiap segmen proporsional dengan nilainya (setelah
  dikurangi total jarak). Segmen dengan nilai > 0 minimal selebar 8px (jadi
  titik bulat). Nilai 0: segmen tidak digambar, tetapi barisnya tetap ada
  di legenda.
- Legenda: mulai y≈131, grid 2 kolom sama lebar dengan jarak antar kolom
  16px, tinggi baris 20px. Tiap item: titik bulat 8px + jarak 8px + label 13px
  (#525252), dan angka 13px (#171717, tabular-nums) rata kanan di tepi
  kolomnya. Urutan item mengisi baris dulu (kiri ke kanan), baru turun.
- Warna kategori: hijau #12b76a, kuning #f5a50a, merah #e5202e,
  abu #c9cdd2, ungu #8b5cf6.

### Varian B: Sparkline area (kartu "Rows Synced")

- Area setinggi 72px (y≈112 sampai 184), selebar penuh isi kartu.
- Garis 1.5px hijau (#12b76a), kurva halus (monotone). Skala Y TIDAK mulai
  dari nilai minimum: garis hanya menempati sepertiga atas area (kira-kira
  3px sampai 27px dari atas area), sisanya adalah isi gradien.
- Isi: gradien hijau dari sekitar 18% opasitas di garis sampai transparan di
  dasar area. Tanpa sumbu, tanpa gridline.
- Titik terakhir: lingkaran solid hijau 6px, dan dari titik itu ada garis
  putus-putus vertikal tipis (hijau pudar) sampai dasar area. Titik berada
  tepat di tepi kanan area.
- Hover (opsional): tooltip sederhana, tidak boleh mengubah tampilan diam.

### Varian C: Pil harian (kartu "Failed Syncs")

- 14 pil vertikal sejajar memenuhi lebar isi kartu, jarak antar pil 5px,
  tinggi trek 56px (y≈128 sampai 184), ujung membulat penuh, warna trek #f0f0f0.
- Isi pil menempel di dasar trek, membulat penuh. Tinggi isi =
  nilai ÷ nilai maksimum 14 hari × 56px (minimal 8px bila nilai > 0).
  Nilai 0 = hanya trek.
- Warna isi: hari-hari lama memakai warna nada pada opasitas 45% (merah
  pudar); pil TERAKHIR (hari terbaru) memakai warna nada penuh (solid).
- Nada (tone) bisa merah (masalah) atau netral abu gelap (bukan masalah).

## 3. Pemetaan 4 kartu proyek (isi tetap milik proyek, tampilan dari sampel)

Ikon dipindah dari kanan atas ke kiri judul seperti sampel. Tombol hitam
penuh diganti footer link (label dan tujuan lama dipertahankan). Dua baris
"label–nilai" lama diganti legenda atau visual. Angka delta di bawah hanya
contoh agar tampilan terlihat. Sambungkan ke data nyata atau sembunyikan
delta bila tidak ada pembanding.

| #   | Judul (ikon)                       | Label kanan | Nilai                                | Delta       | Teks bantu                         | Visual                                                                                                                                                          | Footer              |
| --- | ---------------------------------- | ----------- | ------------------------------------ | ----------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Total Pelanggan Aktif (users)      | Saat ini    | 22.549                               | ↑0.8% hijau | Sambungan Langganan (SL) terdaftar | Varian A, komposisi per wilayah: Wilayah 1 = 6.120, Wilayah 2 = 5.874, Wilayah 3 = 5.402, Wilayah 4 = 5.153. Warna 4 tingkat ungu (ini komposisi, bukan status) | Buka Data Pelanggan |
| 2   | Capaian Catat Meter (gauge)        | Saat ini    | 22.549 dengan penyebut "/22.549"     | ↑0.2% hijau | Progres 100% terbaca               | Varian A: Stand Normal 22.545 (hijau), Anomali / Kendala 4 (merah), Belum Terbaca 0 (abu)                                                                       | Monitor Catat Meter |
| 3   | Volume Air Terdistribusi (tetesan) | 14 hari     | 348.231 m³ (satuan "m³" lebih kecil) | ↑3.5% hijau | Total pemakaian air terbaca        | Varian B, 14 titik volume harian (ribu m³): 24.1, 25.3, 26.4, 26.0, 24.2, 23.1, 23.4, 25.0, 25.4, 24.6, 24.9, 25.2, 25.3, 25.3                                  | Produktivitas Cater |
| 4   | Rekening Tagihan (DRD) (kuitansi)  | 14 hari     | Rp 3.186.489.020                     | ↑2.1% hijau | Nilai tagihan periode Januari 2026 | Varian C nada netral, 14 nilai contoh: 0,1,0,0,2,1,0,1,0,3,2,0,2,7 (lembar terbit per hari)                                                                     | Lihat Rekap DRD     |

Catatan format: angka memakai pemisah titik ribuan gaya Indonesia, gunakan
tabular-nums. Pada kartu 4 (angka panjang) ukuran 28px tetap harus muat satu
baris.

## 4. Bentuk komponen yang diharapkan

- Satu komponen kartu generik (mis. MetricCard.tsx) dengan props: judul, ikon,
  label kanan, nilai, penyebut/satuan opsional, delta ({teks, arah, nada}),
  teks bantu, footer ({label, href}), dan visual (salah satu dari tiga varian
  beserta datanya).
- Tiga varian visual boleh berada di file yang sama atau terpisah, mana yang
  lebih ringkas sesuai STRUKTUR-KODE.md. Jangan memecah berlebihan.
- Data contoh dipisah dari komponen, agar mudah diganti data nyata.

## 5. Larangan

- Jangan menambah bayangan, gradien pada kartu, efek angkat saat hover, atau
  animasi masuk.
- Jangan mengubah font, grid, header halaman, atau judul seksi.
- Jangan memakai padding/gap bawaan shadcn Card.
- Jangan menyamakan arah panah dengan warna delta (keduanya terpisah).
- Jangan menambah elemen yang tidak ada di sampel.

## 6. Verifikasi visual (wajib sebelum menyatakan selesai)

1. Jalankan aplikasi dan ambil screenshot di lebar viewport 1662px (sama
   dengan Gambar 2). Bila ada browser tool (mis. Playwright), pakai itu.
   Bila tidak bisa menjalankan atau memotret, katakan terus terang dan minta
   saya mengirim screenshot.
2. Potong tiap kartu hasilnya, lalu bandingkan berdampingan dengan kartu
   padanannya di Gambar 1.
3. Buat tabel selisih: elemen | sampel | hasil | selisih. Periksa minimal:
   - tinggi kartu 220px dan tinggi footer 36px
   - posisi vertikal judul, nilai, teks bantu, bar/visual, legenda
   - ukuran dan bobot font judul, nilai, penyebut, delta, teks bantu
   - font monospace pada delta, dan warna delta (baik/buruk)
   - tinggi bar 8px, jarak segmen 4px, segmen kecil tampil sebagai titik
   - kolom legenda dan angka rata kanan
   - bentuk kurva, kemiringan gradien, dan titik + garis putus di ujung
   - 14 pil: lebar, jarak, tinggi isi proporsional, pil terakhir solid
   - warna border, latar footer, warna teks abu-abu
4. Perbaiki semua selisih lalu ulangi sampai tidak ada selisih yang terlihat
   (maksimal 3 putaran). Laporkan selisih yang tersisa dan alasannya.

## Hasil akhir yang diharapkan

Ringkas: file yang dibuat/diubah, tabel selisih terakhir, dan hal yang perlu
saya putuskan (misalnya: sumber data nyata untuk delta dan visual tiap kartu).s
