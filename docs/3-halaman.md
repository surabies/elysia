Ketiga halaman ini (/pelanggan/mutasi, /pelanggan/pindah-tarif, dan /pelanggan/no-hp) berada di bawah satu payung besar: Pengelolaan Siklus Hidup Administrasi Pelanggan (Customer Lifecycle
  Management) di PDAM Tirtawening.
  Kabar baiknya: backend dasarnya (model tabel pelanggan, golonganTarif, dan pelangganService) sudah tersedia sekitar 70–80% di codebase.

  Berikut adalah panduan arah, cara kerja (user flow), dan arsitektur teknis agar ketiga halaman ini seragam dan selaras dengan sistem Elysia yang sudah ada:
  ──────
  1. Validasi Kontak Pelanggan (/pelanggan/no-hp)
  │ Rekomendasi Pengerjaan: Pertama (Paling siap & paling mudah dikerjakan)

  A. Arah & Tujuan Bisnis

  Di era digitalisasi PDAM, nomor handphone/WhatsApp pelanggan adalah aset krusial untuk:

  1. Notifikasi Rekening Air: Pengiriman info tagihan bulanan otomatis via WhatsApp.
  2. Verifikasi Mandiri & OTP: Verifikasi identitas saat warga melapor mandiri (/lapor-meter) atau membuat pengaduan publik.
  3. Broadcast Gangguan: Info kebocoran pipa atau pemeliharaan air ke pelanggan di wilayah terdampak.
  4. Masalah di Lapangan: Banyak data pelanggan lama nomor teleponnya kosong, salah format, atau nomor rumah PSTN mati.
  B. Cara Kerja (User Flow)
  1. Overview & Indikator:
      • Strip 3 KPI Card di atas:
          • Total Pelanggan Aktif
          • Kontak Tervalidasi (Nomor HP/WA valid)
          • Kontak Kosong / Perlu Validasi (nomor belum ada atau format salah)

  2. Daftar & Filter:
      • Data Grid / TanStack Table dengan filter cepat:
          • Semua | Belum Ada Kontak | Format Salah | Tervalidasi
          • Filter berdasarkan Rute / Cabang Wilayah.
          • Pencarian cepat (NOLG, Nama, Alamat).

  3. Aksi Pembaruan:
      • Inline Quick-Edit: Admin/staff bisa langsung klik cell nomor HP, ketik nomor baru (otomatis format 08xxx / +628xxx), lalu tekan Enter untuk menyimpan.
      • Modal Edit Terperinci: Untuk memperbarui nomor HP utama, nomor kontak alternatif, dan sumber update (misal: "Hasil Temuan Petugas Lapangan", "Laporan Loket").


  C. Ketersediaan Backend

  • Endpoint sudah tersedia di apps/web/src/server/modules/cater/cater.router.ts:436-453:
      • GET /api/cater/pelanggan/search
      • PATCH /api/cater/pelanggan/:nolg/kontak (dijalankan oleh pelangganService.updateKontak(nolg, noTelp)).

  ──────
  2. Pindah Tarif / Reklasifikasi (/pelanggan/pindah-tarif)

  │ Rekomendasi Pengerjaan: Kedua

  A. Arah & Tujuan Bisnis

  Setiap pelanggan memiliki Golongan Tarif (misal: 1A = Sosial, 2A1 = Rumah Tangga Sederhana, 3A = Niaga Kecil, 4A = Industri). Pindah Tarif diperlukan saat:

  1. Alih Fungsi Bangunan: Rumah tinggal berubah fungsi menjadi warung makan/kafe (reklasifikasi dari Rumah Tangga ke Niaga).
  2. Koreksi Data: Penyesuaian golongan tarif lama yang tidak sesuai kondisi ekonomi pelanggan saat ini.
  3. Dampak Billing: Perubahan tarif berpengaruh langsung pada perhitungan kubikasi air di modul penagihan (DRD) periode berikutnya.

  B. Cara Kerja (User Flow)

  1. Pencarian Pelanggan:
      • Form pencarian cepat NOLG / Nama pelanggan di bagian atas.
  2. Panel Status Saat Ini:
      • Menampilkan identitas pelanggan, golongan tarif aktif saat ini, dan grafik/riwayat pemakaian 3–6 bulan terakhir.
  3. Form Pindah Tarif:
      • Dropdown Tarif Baru: Memilih dari master golonganTarif.
      • Nomor SK / Berita Acara (BA): Nomor dokumen resmi dasar reklasifikasi (wajib untuk audit PDAM).
      • Tanggal Berlaku: Menentukan apakah berlaku mulai periode berjalan atau bulan penagihan berikutnya.
      • Alasan Mutasi: Misal: "Survei lapangan: bangunan beralih fungsi menjadi toko sembako".
  4. Simulasi Perkiraan (Fitur Unggulan):
      • Sistem menampilkan perbandingan instan:
          • Tagihan simulasi dengan Tarif Lama vs Tarif Baru berdasarkan rata-rata kubikasi pemakaian pelanggan.

  5. Riwayat Reklasifikasi:
      • Tabel riwayat di bagian bawah yang mencatat audit siapa yang mengubah tarif, tanggal perubahan, dan nomor SK.

  C. Ketersediaan Backend
  • Endpoint dasar sudah tersedia di apps/web/src/server/modules/cater/cater.router.ts:455-472:
      • PATCH /api/cater/pelanggan/:nolg/tarif (pelangganService.updateGolonganTarif).
  • Tambahan kecil yang diperlukan: Log pencatatan riwayat perubahan tarif ke tabel audit atau pbpkService.inputPerubahanKategori.
  ──────
  3. Mutasi Pelanggan (/pelanggan/mutasi)

  │ Rekomendasi Pengerjaan: Ketiga

  A. Arah & Tujuan Bisnis

  Ini adalah modul administrasi umum kepemilikan dan status fisik sambungan:

  1. Balik Nama (Perubahan Nama Kepemilikan): Rumah dijual/diwariskan, nama di rekening air dialihkan ke pemilik baru.
  2. Koreksi Alamat & GPS: Pembaruan RT/RW, nomor rumah, dan penyesuaian titik koordinat GIS PostGIS (titikLokasi).
  3. Mutasi Sambungan PB/PK:
      • PB (Pasang Baru): Pendaftaran sambungan baru pelanggan ke dalam DPM/rute.
      • PK (Penyambungan Kembali): Pelanggan yang sebelumnya disegel/diputus diaktifkan kembali.
      • Penutupan Sementara / Segel: Penghentian aliran atas permohonan sendiri atau karena penunggakan.


  B. Cara Kerja (User Flow)

  1. Master-Detail Layout (sama dengan pola Verifikasi atau Rute):
      • Sisi Kiri / Atas: Pencarian dan daftar antrean mutasi pelanggan.
      • Sisi Kanan / Modal Dialog: Form Wizard / Form Terstruktur dengan pilihan tab jenis mutasi:
          • Tab 1: Balik Nama (Nama Baru, NIK/KTP, No Telepon Baru, No Berita Acara).
          • Tab 2: Alamat & Spasial (Alamat Lengkap, RT/RW, pin point peta koordinat PostGIS).
          • Tab 3: Status Sambungan (Ubah status: PELANGGAN AKTIF, SEGEL, CABUT, atau SAMBUNG KEMBALI).

  2. Dokumen Persyaratan:
      • Input upload foto/scan KTP atau bukti kepemilikan bangunan (disimpan ke Cloudinary).
  3. Eksekusi & Sinkronisasi:
      • Sistem memperbarui tabel master pelanggan dan menyinkronkan status ke daftar catat meter (DPM) aktif.


  C. Ketersediaan Backend

  • Sudah ada fondasi di apps/web/src/server/services/closing/pbpk.service.ts (inputPasangBaru dan inputPerubahanKategori).
  • Perlu penambahan endpoint router: PATCH /api/cater/pelanggan/:nolg/mutasi-identitas.
  ──────
  Rekomendasi Urutan & Arsitektur Implementasi

  ┌───────────────────────────────────────┐   ┌───────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
  │                                       │   │                                           │   │                                         │
  │ 1. Validasi Kontak (/pelanggan/no-hp) ├──►│ 2. Pindah Tarif (/pelanggan/pindah-tarif) ├──►│ 3. Mutasi Pelanggan (/pelanggan/mutasi) │
  │                                       │   │                                           │   │                                         │
  └───────────────────────────────────────┘   └───────────────────────────────────────────┘   └─────────────────────────────────────────┘

   Halaman                                      │ Kesiapan Backend                             │ Kompleksitas UI                              │ Standar Komponen yang Dipakai
  ──────────────────────────────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────────────
   Validasi Kontak                              │ 95% Siap (updateKontak)                      │ Ringan (Tabel + Inline Edit)                 │ TanStack Table, Input Phone, Badges
   Pindah Tarif                                 │ 85% Siap (updateGolonganTarif)               │ Sedang (Form + Simulasi Tagihan)             │ Select Golongan Tarif, Metric Compare Card, Dialog Form
   Mutasi Pelanggan                             │ 70% Siap (Service PbpkService)               │ Menengah-Tinggi (Tabs Mutasi)                │ Master-Detail / Tabbed Form, PostGIS Map Picker

  Jika Anda ingin mulai membangun salah satu dari ketiga halaman ini, kita bisa mulai dari Validasi Kontak (/pelanggan/no-hp) karena endpoint backend-nya sudah siap digunakan dan hasilnya langsung
  dapat diuji coba di browser.

---
### Dokumen SOP & Bahan Presentasi Hasil Wawancara Operasional
Panduan operasional resmi, diagram alir komunikasi lintas departemen, dan matriks RBAC untuk ketiga alur kerja (Pemutusan 3 Pihak: Langganan-Zona-Manager, Pindah Tarif 3 Tahap, dan Balik Nama Otoritas Manager) didokumentasikan secara lengkap pada:
👉 **[SOP_MUTASI_DAN_PEMUTUSAN_PELANGGAN.md](file:///C:/Users/DESKTOP/Documents/elysia/docs/alurbisnis/SOP_MUTASI_DAN_PEMUTUSAN_PELANGGAN.md)**.
