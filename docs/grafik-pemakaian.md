# Tugas: Buat kartu grafik "Pemakaian Air" untuk aplikasi baca meter

Gambar referensi terlampir (kartu monitoring "Checkout flow"). Tiru tata
letak, hierarki visual, dan perilaku interaksinya, tetapi isinya diganti ke
konteks baca meter perusahaan air minum di kota Bandung. Gunakan data contoh
di bawah.

## Aturan proyek (wajib)

- Baca dan patuhi docs/STRUKTUR-KODE.md (folder semantik, file PascalCase,
  jangan memecah file berlebihan).
- UI memakai shadcn/ui, ikon memakai HugeIcons. Warna selaras dengan dashboard
  yang sudah ada.
- Cek dulu apakah recharts atau komponen chart shadcn/ui sudah terpasang.
  Jika belum, tanyakan sebelum menambah dependensi; alternatifnya SVG murni.
- Pisahkan: tipe data, data contoh, fungsi perhitungan/status (murni, tanpa
  UI), dan komponen tampilan.

## Langkah kerja

1. Baca struktur proyek dan konvensi dulu.
2. Usulkan pendekatan chart (recharts atau SVG murni) dan daftar file, lalu
   tunggu persetujuan saya.
3. Implementasi, lalu ringkas hasilnya.

## 1. Struktur kartu (atas ke bawah)

### A. Header kartu

- Kiri: judul tebal "Pemakaian Air" dan subjudul abu-abu
  "Sambungan 01-048210 • Dibaca bulanan oleh petugas dan mandiri".
- Kanan: tombol dropdown "Semua Status" (ikon filter), tombol pengaturan,
  titik status berwarna (hijau = sehat), tombol muat ulang, tombol
  "jalankan deteksi anomali ulang" (ikon play), dan menu titik tiga.

### B. Strip 4 ringkasan (dipisah garis vertikal tipis)

Setiap sel: label kecil abu-abu, angka besar tebal, selisih kecil berwarna
dengan ikon tren, dan sparkline di sisi kanan sel.
| Sel | Label | Contoh angka | Selisih (contoh) |
|---|---|---|---|
| 1 | Tingkat Terbaca | 94.4% | ▼ -5.6 pts (merah) |
| 2 | Median Pemakaian | 20 m³ | — 0 m³ (abu-abu) |
| 3 | Pemakaian Tinggi (p95) | 39 m³ | ▲ +12 m³ (merah) |
| 4 | Di Atas Batas Wajar | 11.8% | ▲ +11.8 pts (merah) |
Aturan warna selisih: ditentukan oleh baik/buruk, bukan naik/turun.
Tingkat Terbaca turun = merah. Pemakaian tinggi naik = merah. Perubahan
netral = abu-abu. Hijau untuk perbaikan. Selisih dihitung terhadap periode
sebelumnya. Sparkline: garis tipis abu-abu, bagian terbaru lebih gelap.

### C. Baris detail bar terpilih (di atas area grafik)

- Kiri: badge status berwarna (ikon + teks, contoh "Anomali"), nomor meter
  dengan font monospace ("MTR-48210"), titik pemisah, waktu baca
  ("Okt 2026, dibaca 22 Okt 14:00 WIB"), dan dropdown filter ("Anomali").
- Kanan: rincian bar terpilih, satu angka per segmen dengan ikon pola
  segmennya, lalu total yang lebih tebal. Contoh:
  [pola titik] 10 m³ [pola garis miring] 10 m³ [pola garis datar] 32 m³ **52 m³**
- Default menampilkan bar terakhir. Saat bar di-hover atau diklik, baris ini
  berubah mengikuti bar tersebut.

### D. Area grafik

- Bar bertumpuk, satu bar per periode baca (bulan), 18 periode.
- Tiga segmen per bar (dari bawah): Blok 1, Blok 2, Blok 3 (blok tarif).
  Tiap segmen punya pola sendiri agar terbaca tanpa bergantung pada warna:
  Blok 1 = titik-titik, Blok 2 = garis miring, Blok 3 = garis datar.
  Pola dibuat dengan SVG pattern.
- Warna bar mengikuti status: hijau-teal (Normal), kuning (Melewati Batas),
  merah (Anomali). Isi bar = pola dengan warna status, latar sangat pudar.
- Periode tidak terbaca: bar kosong bergaris putus dengan tanda "–", tidak
  dihitung sebagai nol.
- Sumbu Y: gridline tipis dan label 0, 20, 40, 60 m³. Sumbu X: label bulan
  jarang-jarang (agar tidak berdesakan), contoh Mei 25, Agu 25, Nov 25, dst.
- Garis ambang horizontal putus-putus kuning di 30 m³ dengan label
  "Batas wajar 30 m³".
- Garis putus abu-abu tipis melewati bar sebagai rentang normal dari median
  sampai p95 riwayat pelanggan.
- Garis vertikal bertitik dengan label kecil di atasnya, contoh
  "Meter diganti" pada 12 Agu 2026 (penanda kejadian).
- Segitiga kecil hitam di atas bar yang outlier.
- Tooltip saat hover: periode, status, rincian per blok, total, dan selisih
  terhadap median.

### E. Legenda (baris bawah kartu)

- Kiri: ikon pola + "Blok 1", "Blok 2", "Blok 3".
- Kanan: "Rentang normal", segitiga "Outlier", titik tiga vertikal
  "Kejadian", garis putus kuning "Batas wajar".

## 2. Aturan status (satu fungsi bersama, mudah diubah)

Nilai di bawah adalah contoh, jadikan konstanta yang bisa disesuaikan dengan
aturan perusahaan:

- Normal: total ≤ batas wajar (30 m³, kira-kira 150% median).
- Melewati Batas: total di atas batas wajar sampai 2x median.
- Anomali: total di atas 2x median, atau pembacaan nol, atau angka meter
  mundur.
- Tidak Terbaca: tidak ada pembacaan pada periode itu.
- Outlier (penanda segitiga): menyimpang dari pola historis, berdiri
  sendiri dan bisa menempel pada status mana pun.

## 3. Rumus ringkasan (fungsi murni, mudah diuji)

- Tingkat Terbaca = periode terbaca ÷ seluruh periode.
- Median dan p95 dihitung dari pembacaan yang ada (abaikan tidak terbaca).
- Di Atas Batas Wajar = periode di atas batas ÷ periode terbaca.
- Selisih = nilai periode terbaru dikurangi periode sebelumnya.

## 4. Data contoh (gunakan persis ini)

Format: periode | Blok 1 | Blok 2 | Blok 3 | total (m³) | status

- Mei 25: 10, 8, 0 = 18 Normal
- Jun 25: 10, 9, 1 = 20 Normal
- Jul 25: 10, 8, 0 = 18 Normal
- Agu 25: 10, 10, 1 = 21 Normal
- Sep 25: 10, 9, 0 = 19 Normal
- Okt 25: 10, 10, 2 = 22 Normal
- Nov 25: 10, 8, 0 = 18 Normal
- Des 25: 10, 10, 1 = 21 Normal
- Jan 26: 10, 9, 1 = 20 Normal
- Feb 26: 10, 8, 0 = 18 Normal
- Mar 26: tidak terbaca
- Apr 26: 10, 10, 2 = 22 Normal
- Mei 26: 10, 9, 1 = 20 Normal
- Jun 26: 10, 9, 0 = 19 Normal
- Jul 26:
