# Blueprint Arsitektur: Restrukturisasi Monorepo & Backend Shared Berbasis Struktur Organisasi Perusahaan

> **Dokumen Lengkap & Terperinci:**  
> Silakan merujuk ke dokumen induk di [RESTRUKTURISASI_FOLDER_DAN_SHARED_BACKEND.md](file:///C:/Users/DESKTOP/Documents/elysia/docs/RESTRUKTURISASI_FOLDER_DAN_SHARED_BACKEND.md).

### Ringkasan Strategi 2 Web + 1 Shared Serverless Core:
1. **Pemisahan 2 Web Saja (Bukan 6–8 Web):**
   * **`apps/web-publik`:** Khusus Landing page, Lapor Meter Mandiri, Cek Tagihan, Pengaduan Konsumen. Ringan, Edge Caching, nol biaya komputasi.
   * **`apps/web-internal`:** Dashboard Backoffice seluruh pegawai PDAM dalam 1 domain (`internal.pdam.co.id`) menggunakan Next.js Route Groups per bagian organisasi. Bebas kendala CORS & HttpOnly Cookie Better Auth bekerja sempurna.
2. **Shared Serverless Core (`packages/backend`):**
   * Menampung seluruh business logic, taksasi, anomali, dan endpoint dalam package `@cater/backend`.
   * Di-mount via Serverless Route Handler Next.js (`app.fetch`).
   * Modul & service dipisah menurut 8 bagian organisasi:
     - Pencatat Meter
     - Penagihan
     - Hubungan Langganan
     - Sub Zona & Distribusi
     - Rencana & Pengembangan Meter (RPM)
     - SDM & Kepegawaian
     - Satuan Pengawas Internal (SPI)
     - Eksekutif & Direksi
3. **Pemisahan Dead Code ke Root `archive/`:**
   * Seluruh komponen duplikat, modul lama, dan scratch diisolasi ke root `archive/`.
