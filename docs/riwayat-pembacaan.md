# Tugas: Buat kartu "Riwayat Pembacaan" (daftar rute + strip 20 sesi terakhir)

Gambar referensi terlampir (kartu "Check history"). Tiru tata letak,
hierarki visual, dan perilakunya, tetapi isinya diganti ke konteks baca
meter perusahaan air minum di kota Bandung. Gunakan data contoh di bawah.

## Aturan proyek (wajib)

- Baca dan patuhi docs/STRUKTUR-KODE.md (folder semantik, file PascalCase,
  jangan memecah file berlebihan).
- UI memakai shadcn/ui, ikon memakai HugeIcons. Warna selaras dengan dashboard
  yang sudah ada.
- Jika sudah ada konstanta/komponen warna status dari kartu "Pemakaian Air",
  pakai ulang. Jika belum, buat satu sumber warna status yang bisa dipakai
  bersama.
- Pil digambar dengan div/SVG biasa. Jangan menambah dependensi tanpa izin.
- Pisahkan: tipe data, data contoh, fungsi perhitungan (murni, tanpa UI), dan
  komponen tampilan.

## Langkah kerja

1. Baca struktur proyek dan konvensi dulu.
2. Usulkan daftar file yang akan dibuat/diubah, tunggu persetujuan saya.
3. Implementasi, lalu ringkas hasilnya.

## 1. Struktur kartu (atas ke bawah)

### A. Header kartu

- Kiri: judul tebal "Riwayat Pembacaan" dan subjudul abu-abu
  "8 rute • Per 10 Nov 2026, 14:00 WIB" (tanggal/jam dinamis).
- Kanan: dropdown dengan ikon filter "Semua rute" (pilihan: Semua rute,
  Bermasalah, Nonaktif, plus filter wilayah dan petugas), tombol pengaturan
  (rentang sesi dan urutan), dan menu titik tiga.

### B. Strip 4 ringkasan (dipisah garis vertikal tipis)

Setiap sel: label kecil abu-abu, angka besar tebal, teks bantu kecil.
| Sel | Label | Isi |
|---|---|---|
| 1 | Sesi Tuntas | 95.6%, di bawahnya "▼ 8.8 pts vs sesi sebelumnya" (merah) |
| 2 | Total Sesi | 160, di sampingnya bar tipis teal dengan titik kecil merah dan kuning di ujung, lalu teks "7 bermasalah" |
| 3 | Rute Bermasalah | "1 dari 8", teks bantu "Rangkaian terpanjang 5 sesi" |
| 4 | Sesi Terlama (p95) | "7j 30m", teks bantu "Rute 01 Coblong" |
Pada sel 2, bar teal selebar proporsi sesi tuntas; segmen merah (gagal) dan
kuning (terlambat) di ujung diberi lebar minimum agar tetap terlihat.

### C. Tabel (header kecil abu-abu, garis pemisah tipis antar baris)

Kolom: **Rute** | **Sesi terakhir** | **20 sesi terakhir** | **Tuntas**

- Rute: nama rute (tebal) dan di bawahnya subjudul font monospace abu-abu,
  contoh "coblong · 412 pelanggan · Asep S.". Subjudul panjang dipotong "…".
- Sesi terakhir: badge berwarna (Tuntas hijau muda, Gagal merah muda,
  Terlambat kuning muda, Dilewati ungu muda) dan di bawahnya
  "1 jam lalu • 12m" (waktu sejak sesi selesai dan durasinya).
- 20 sesi terakhir: strip 20 pil sejajar tegak, urut dari terlama (kiri)
  ke terbaru (kanan). Di header kolom ini ada label kecil kanan
  "Terlama ke terbaru". Seluruh baris menyejajarkan pil pada posisi x yang
  sama, jadi sesi pada tanggal yang sama berada satu kolom vertikal.
- Tuntas: persen (tebal, rata kanan) dan di bawahnya "p95 7j 30m" (abu-abu).

### D. Aturan pil (bagian terpenting)

- **Tinggi pil = durasi sesi.** Skalanya **per baris**, dinormalisasi terhadap
  durasi terpanjang di baris itu, dengan tinggi minimum agar sesi singkat
  tetap tampak sebagai titik kecil. Jadi lonjakan terlihat menonjol di dalam
  barisnya sendiri.
- Warna dan bentuk mengikuti status:
  - Tuntas = hijau-teal, bulat panjang
  - Terlambat = kuning, biasanya tinggi karena durasinya panjang
  - Gagal = merah, biasanya pendek (titik) karena berhenti cepat
  - Dilewati = lavender, tinggi tetap kecil
- Hover pil: tooltip berisi tanggal, status, durasi, meter terbaca/total,
  dan nama petugas. Klik pil membuka detail sesi (cukup panggil callback;
  panel detail tidak perlu dibuat sekarang).
- Baris Nonaktif: nama rute dipudarkan dengan badge kecil "Nonaktif" di
  sebelahnya, semua pil dipudarkan (opacity sekitar 40%).

### E. Legenda (baris bawah kartu)

- Kiri: titik berwarna + "Tuntas", "Gagal", "Terlambat", "Dilewati".
- Kanan: "Tinggi pil adalah durasi sesi".

## 2. Aturan status sesi (satu fungsi bersama, mudah diubah)

Nilai contoh, jadikan konstanta yang bisa disesuaikan:

- Tuntas: semua meter terjadwal terbaca dan terkirim, durasi ≤ target (6 jam).
- Terlambat: durasi melewati target, atau meter terjadwal belum semua terbaca
  saat tenggat.
- Gagal: sesi berakhir tanpa hasil baca (sinkron gagal, aplikasi error,
  tidak dikerjakan).
- Dilewati: sesi tidak dijadwalkan (libur atau ditunda). Tidak dihitung
  sebagai berhasil maupun gagal.

## 3. Rumus ringkasan (fungsi murni, mudah diuji)

- Tuntas per rute = sesi Tuntas ÷ sesi yang tidak Dilewati.
- Sesi Tuntas (ringkasan) = total sesi Tuntas ÷ total sesi yang tidak Dilewati
  di semua baris yang tampil.
- Selisih "vs sesi sebelumnya" = tingkat tuntas 10 sesi terbaru dikurangi
  tingkat tuntas 10 sesi sebelumnya.
- Rute Bermasalah = rute yang sesi terakhirnya bukan Tuntas.
- Rangkaian terpanjang = deret terpanjang sesi berturut-turut yang bukan
  Tuntas di antara semua rute.
- p95 per rute dari durasi 20 sesi; Sesi Terlama = p95 tertinggi antar rute,
  tampilkan nama rutenya.
- Urutan baris default: rute dengan sesi terakhir bermasalah di atas, lalu
  rute normal, lalu rute Nonaktif di paling bawah.

## 4. Data contoh (angka ringkasan sengaja dibuat sama dengan gambar agar

mudah dicek)
Kode sesi (terlama ke terbaru, 20 huruf): U = Tuntas, T = Terlambat,
G = Gagal, S = Dilewati.
Durasi tuntas tipikal sekitar 3j; Terlambat 7j sampai 8j; Gagal 5 sampai 15 menit.

| Rute                  | Subjudul                                | Sesi                 | Tuntas | p95    | Sesi terakhir                          |
| --------------------- | --------------------------------------- | -------------------- | ------ | ------ | -------------------------------------- |
| Rute 01 Coblong       | coblong · 412 pelanggan · Asep S.       | UUUUUUUUUUUUUUUTGTGG | 75%    | 7j 30m | Gagal, 1 jam lalu, 12m                 |
| Rute 02 Cicendo       | cicendo · 380 pelanggan · Dede R.       | UUUUUUUUUUUUUUUUUTUU | 95%    | 3j 20m | Tuntas, 2 jam lalu, 3j 10m             |
| Rute 03 Lengkong      | lengkong · 355 pelanggan · Yayan K.     | UUUUUUUUUUUUUUUUUUUU | 100%   | 3j 05m | Tuntas, 2 jam lalu, 3j 00m             |
| Rute 04 Buahbatu      | buahbatu · 440 pelanggan · Euis N.      | UUUUUUUUUUUUUUUUUUUU | 100%   | 2j 50m | Tuntas, 3 jam lalu, 2j 45m             |
| Rute 05 Antapani      | antapani · 398 pelanggan · Ujang M.     | UUUUUUUUUUUUUUUUUUUU | 100%   | 3j 30m | Tuntas, 1 jam lalu, 3j 20m             |
| Rute 06 Sukajadi      | sukajadi · 365 pelanggan · Rina W.      | UUUUUUUUUUUUUUUUUUUU | 100%   | 4j 10m | Tuntas, 12 jam lalu, 4j 00m            |
| Rute 07 Bandung Kulon | bandung kulon · 410 pelanggan · Budi H. | UUUUUUUUUUUUUUUTUUUU | 95%    | 3j 55m | Tuntas, 14 jam lalu, 3j 40m            |
| Rute 08 Cibiru        | cibiru · 372 pelanggan · Neneng S.      | UUUUUUUUUUUUUUUUUUUU | 100%   | 3j 20m | Tuntas, 3 hari lalu, 3j 15m (Nonaktif) |

Hasil ringkasan yang harus cocok: 160 sesi, 153 tuntas (95.6%), 7
bermasalah, 1 dari 8 rute bermasalah, rangkaian terpanjang 5 sesi,
selisih -8.8 pts.

## 5. Keadaan dan aksesibilitas

- Loading (skeleton baris), kosong ("Belum ada riwayat pembacaan"), dan error
  ("Gagal memuat data" dengan tombol coba lagi).
- Status tidak hanya dibedakan lewat warna: badge selalu memakai teks, dan
  setiap pil punya label teks (tanggal, status, durasi).
- Navigasi keyboard: Tab ke baris, panah kiri/kanan berpindah antar pil,
  Enter membuka detail sesi.
- Responsif: kolom Sesi terakhir boleh disembunyikan pada layar sempit, dan
  strip pil boleh scroll horizontal.

## 6. Komponen yang diharapkan

- Satu komponen kartu (mis. RiwayatPembacaan.tsx) berisi header, ringkasan,
  tabel, dan legenda.
- Komponen kecil bersama: sel ringkasan, satu baris rute, dan strip pil.
- Komponen dibuat generik: menerima daftar item (rute/petugas/proses sistem),
  daftar sesi per item, dan label kolom lewat props, supaya tampilan lain
  bisa memakainya tanpa mengubah komponen.

## 7. Jangan lakukan

- Jangan menormalisasi tinggi pil secara global (harus per baris).
- Jangan menaruh batas status (target 6 jam, dsb.) langsung di komponen.
- Jangan menghitung sesi Dilewati sebagai berhasil atau gagal.
- Jangan menambah dependensi tanpa izin saya.
- Jangan memecah menjadi puluhan file kecil.

## Hasil akhir yang diharapkan

Ringkas: file yang dibuat, cara melihat komponen, dan hal yang perlu saya
putuskan (misalnya: sumber data asli dan target durasi resmi).
