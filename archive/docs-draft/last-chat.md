 Dokumentasi telah dicatat secara lengkap, dan penjelasan untuk kedua berkas tersebut telah dirangkum di bawah ini. Seluruh perubahan juga telah di-commit dan di-push ke repositori.
  ──────
  1. Dokumentasi yang Telah Dicatat

  Telah dibuat dokumen acuan teknis di docs/STANDAR_API_CLIENT_DAN_MIGRASI.md dan diperbarui pada docs/ROADMAP_TRACKING.md:

  • Selesai Dimigrasi (Fase 1):
      1. Modul Rute (features/dashboard/rute/api.ts → ruteApi)
      2. Modul Master Data (features/dashboard/master/api.ts → masterApi)
      3. Modul Pelanggan & Manual ADD (features/dashboard/pelanggan/api.ts → manualAddApi)
      4. Modul Capaian Pencatatan (features/dashboard/cater/capaian/api.ts → capaianApi)
      5. Modul KPI Scorecard (features/dashboard/kpi/api.ts → kpiApi)
  • Daftar Antrean Migrasi Berikutnya (Fase 2):
      • Modul Pengaturan Sistem & Profil (features/dashboard/pengaturan/)
      • Modul Progres & Monitoring Lapangan (features/dashboard/progres/)
      • Modul Laporan & Evaluasi (features/dashboard/laporan/)
      • Modul Setting Landing Page CMS (features/dashboard/setting-landing/)
      • Modul Meter & GIS (meter/, gis/, gwm/)

  ──────
  2. Penjelasan Berkas: verifikasi-legacy.router.ts

  Lokasi: apps/web/src/server/modules/verifikasi-legacy.router.ts
  • Peran: Ini adalah router backend ElysiaJS yang mengelola seluruh endpoint dengan awalan /api/v1/* untuk fitur verifikasi pembacaan meter dan laporan harian petugas.
  • Mengapa Diberi Nama "Legacy"?:
  Router ini dirancang untuk mempertahankan kompatibilitas dengan kontrak data v1 dari sistem sebelumnya (misalnya format envelope { success, data, meta: { total, totalPages } }), sehingga antarmuka
  tabel TanStack Table / Data Grid tidak perlu dirombak saat migrasi dari stack lama.
  • Tanggung Jawab Utama:
      1. Laporan Harian Petugas (/api/v1/laporan-harian): Menyajikan data grid tak hingga (infinite scroll / pagination) untuk hasil baca meter di lapangan, filter anomali, status rute, dan pencarian
      pelanggan.
      2. Laporan Baca Mandiri (/api/v1/laporan-mandiri): Mengelola data meter yang dilaporkan mandiri oleh pelanggan (termasuk foto bukti meter dan validasi geofencing PostGIS GPS ≤ 50 meter).
      3. Aksi Verifikasi Berjenjang: Menangani logika persetujuan (approve), penolakan (reject), instruksi cek ulang ke petugas lapangan, serta koreksi angka stand meter.
      4. Keamanan: Dilindungi oleh plugin autentikasi (authPlugin) dan macro guard requireRole (STAFF_ADMIN_BILLING, VERIFIKATOR_1, VERIFIKATOR_2, VERIFIKATOR_3, EXECUTIVE, SUPERADMIN).

  ──────
  3. Penjelasan Berkas: ApiDashboard.ts
  Lokasi: apps/web/src/features/dashboard/api/ApiDashboard.ts (mere-export apps/web/src/features/dashboard/shared/api/api-dashboard.ts)
  • Peran: Ini adalah pustaka pembantu HTTP Client tingkat rendah (low-level fetcher) di sisi frontend khusus untuk komponen yang menggunakan data grid interaktif (TanStack Table, AG Grid, panel
  verifikasi, dan modul pengaduan).
  • Fungsi-Fungsi di Dalamnya:
      1. ApiError: Kelas kustom turunan Error yang otomatis menyimpan kode error (code) dan kode status HTTP (status), memudahkan komponen UI menampilkan notifikasi toast yang spesifik.
      2. ambilList<T>(path, params): Pembungkus fetch untuk mengambil data berbentuk array/tabel dari /api/v1<path>. Fungsi ini otomatis membuang parameter bernilai null/kosong dan mengembalikan objek
      { rows: T[], total: number }.
      3. ambilSatu<T>(path, params): Pembungkus fetch untuk mengambil 1 objek tunggal (misal detail tiket pengaduan atau ringkasan KPI).
      4. kirimJson<T>(path, method, body): Pembungkus mutasi data JSON via method POST, PUT, PATCH, atau DELETE.
      5. kirimForm<T>(path, form): Pembungkus mutasi FormData untuk upload berkas (misal foto meter atau berkas lampiran pengaduan) tanpa menulis header Content-Type manual agar boundary multipart
      browser tetap valid.

  ──────
  Hubungan Antara Kedua Berkas Tersebut

  Kedua berkas ini bekerja sebagai pasangan langsung (client-server pair):

    [Browser / Komponen TanStack Table / DataGrid]
                            │
                            ▼ memanggil
    [ApiDashboard.ts  (ambilList / ambilSatu / kirimJson)]
                            │
                            ▼ request HTTP ke `/api/v1/*`
    [verifikasi-legacy.router.ts  (Backend ElysiaJS)]
                            │
                            ▼ memproses
    [verifikasiGridService & PostgreSQL Database]
  ──────
  4. Laporan Status Repositori

  • Typecheck: tsc --noEmit lolos tanpa error.
  • Unit Tests: 11 pengujian rute lolos 100%.
  • Git Commit & Push: Dokumentasi dan seluruh perubahan telah terdorong ke remote main (commit a7a1add).
