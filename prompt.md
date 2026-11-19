Kamu adalah front-end engineer senior. Buatkan bagian pembuka (preloader) dan halaman hero untuk website layanan publik "Perumda Tirtawening Kota Bandung" (perusahaan air minum Kota Bandung). Website ini punya tiga layanan utama: Cek Tagihan, Pengaduan Air, dan Lapor Meter.

## Langkah awal (wajib)

1. Baca struktur repo dulu: framework, library animasi, library UI, sistem styling, token warna, font, dan konvensi penamaan file/folder yang sudah ada.
2. Ikuti stack dan konvensi yang sudah ada. Jangan menambah library baru kalau yang ada sudah cukup. Kalau belum ada library animasi, pakai Framer Motion (React) atau GSAP, pilih satu saja.
3. Tulis rencana singkat (file apa yang dibuat/diubah) sebelum mulai coding.

## Referensi

Tiru POLA interaksinya dari https://www.pln.co.id/main. Jangan menyalin logo, teks, gambar, atau video milik PLN. Semua konten harus milik Tirtawening seperti di bawah.

## Bagian 1: Preloader (intro animation)

Layar penuh yang tampil saat halaman pertama dibuka, lalu terbuka (reveal) menuju hero.

- Latar solid biru tua (selaras dengan identitas air), teks putih, tipografi besar.
- Kata-kata berganti satu per satu (text rotator) dengan animasi naik dari bawah ke atas memakai mask (overflow hidden), urutannya:
  1. "Cek Tagihan"
  2. "Pengaduan Air"
  3. "Lapor Meter"
- Di pojok ada penanda urutan seperti "01 / 03", "02 / 03", "03 / 03" yang ikut berganti (padanan penanda "#1" di referensi).
- Tiap kata tampil sekitar 0,8–1 detik. Total preloader maksimal sekitar 3,5 detik.
- Setelah kata terakhir, tampilkan sebentar nama "Tirtawening", lalu preloader terangkat ke atas (curtain reveal / slide-up atau clip-path) sampai hero terlihat penuh.
- Hero harus sudah dirender di belakang preloader supaya transisinya mulus. Video dan poster hero harus mulai dimuat sejak awal.
- Preloader hanya tampil sekali per sesi (simpan flag di sessionStorage, dibungkus try/catch). Kunjungan berikutnya langsung ke hero.
- Sediakan tombol "Lewati" yang kecil dan jelas.
- Hormati `prefers-reduced-motion`: kalau aktif, lewati animasi kata dan cukup fade singkat atau langsung tampilkan hero.
- Saat preloader aktif, kunci scroll body, lalu kembalikan setelah selesai. Pastikan fokus keyboard tidak "bocor" ke konten di belakangnya (inert/aria-hidden).
- Tambahkan `aria-live="polite"` atau teks alternatif yang masuk akal untuk pembaca layar.

## Bagian 2: Hero (full-screen video background)

- Tinggi layar penuh (gunakan `100svh`, bukan `100vh`, supaya aman di mobile).
- Video latar: `<video autoplay muted loop playsinline>` dengan `poster`. Pakai aset lokal `/public/videos/hero-air.mp4` dan `/public/images/hero-poster.jpg`. Jika file belum ada, buat placeholder yang jelas (gradient biru + poster kosong) dan beri komentar TODO tempat mengganti aset. Jangan mengarang URL video eksternal.
- Di layar kecil atau saat `prefers-reduced-motion` aktif atau koneksi hemat data, tampilkan poster saja tanpa memutar video.
- Overlay gradient gelap di atas video agar teks tetap terbaca (kontras minimal WCAG AA).
- Navbar transparan di atas hero: logo (placeholder), menu "Beranda", "Layanan", "Informasi", "Kontak". Di mobile jadi menu hamburger.
- Konten utama (rata kiri):
  - Headline (h1): "Layanan Air Bersih, Lebih Dekat dengan Warga Bandung"
  - Subjudul: "Cek tagihan, sampaikan pengaduan, dan laporkan angka meter air Anda kapan saja, langsung dari ponsel."
  - Tombol utama: "Cek Tagihan". Tombol sekunder: "Lapor Meter".
- Di bagian bawah hero, tiga kartu layanan (padanan carousel 3 kartu di referensi):
  1. Cek Tagihan: "Lihat tagihan air bulan ini dan riwayat pembayaran."
  2. Pengaduan Air: "Laporkan air mati, keruh, kebocoran, atau gangguan lainnya."
  3. Lapor Meter: "Kirim angka meter air Anda secara mandiri."
     Tiap kartu berisi ikon, judul, deskripsi singkat, dan link ke rute layanan masing-masing. Gunakan link placeholder (`/cek-tagihan`, `/pengaduan`, `/lapor-meter`) jika rute belum ada. Di desktop tampil sejajar tiga kolom, di mobile bisa digeser horizontal (scroll-snap).
- Setelah preloader terbuka, konten hero muncul bertahap (stagger): headline, subjudul, tombol, lalu kartu.

## Gaya visual

- Nuansa air: biru tua, biru muda, dan putih. Warna aksen cukup satu. Pakai token warna yang sudah ada di proyek; kalau belum ada, definisikan sebagai CSS variables.
- Tipografi tegas dan bersih, ukuran headline responsif memakai `clamp()`.
- Jangan menambahkan statistik atau angka karangan (jumlah pelanggan, dsb.). Hanya pakai teks yang tertulis di prompt ini.

## Struktur kode

- Pisahkan jadi komponen kecil yang jelas, misalnya `Preloader`, `HeroSection`, `LayananCard`, `Navbar`. Jangan dipecah berlebihan.
- Konten teks (kata preloader, kartu layanan) disimpan sebagai data/konstanta terpisah dari komponen supaya mudah diubah.
- Kode rapi, semantik (`header`, `nav`, `main`, `section`, `h1`), tanpa warning di console.

## Kriteria selesai

- Preloader tampil sekali per sesi, urutannya benar, tombol "Lewati" berfungsi, dan transisi ke hero mulus tanpa kedipan.
- Hero tampil penuh di mobile (≈375px), tablet, dan desktop tanpa scroll horizontal.
- Mode reduced-motion berjalan tanpa animasi berat.
- Navigasi keyboard dan pembaca layar tidak terjebak di preloader.
- Lint dan build lolos. Di akhir, jelaskan secara singkat file apa yang dibuat/diubah dan aset apa yang masih perlu saya sediakan (logo, video, poster).
