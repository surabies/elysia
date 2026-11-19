# Security Hardening, RBAC & Pengamanan Pendaftaran Pelanggan

Dokumen ini merupakan acuan resmi pengamanan aplikasi **PERUMDA Tirtawening (M2C Baca Meter & Billing)** yang mengadopsi prinsip **Defense-in-Depth** dan **Default Deny** sesuai standar industri.

---

## 1. Referensi Standar Keamanan Otoritatif

| Standar / Sumber | Cakupan Utama yang Diterapkan |
| :--- | :--- |
| **OWASP Top 10 (A01 & A07)** | Pencegahan *Broken Access Control* (#1) & *Identification and Authentication Failures*. |
| **OWASP ASVS (v4.0.3 / v5.0)** | Bab Authentication (V2/Ch.6), Session Management (V3/Ch.7), dan Access Control / Authorization (V4/Ch.8). |
| **OWASP Cheat Sheet Series** | Authentication, Authorization, Access Control, Session Management, Input Validation, HTTP Security Headers. |
| **NIST SP 800-63B** | Kebijakan password modern, brute-force rate limiting, dan perlindungan kredensial. |
| **MITRE CWE** | Mitigasi `CWE-862` (Missing Authorization), `CWE-863` (Incorrect Authorization), `CWE-601` (Open Redirect), `CWE-307` (Brute Force). |
| **Next.js 16 Security & Auth Guide** | Defense-in-Depth: `proxy.ts` (Edge Gatekeeper) + Server Layout/Component Guard + Data Access Layer (DAL). |
| **Better Auth Security Docs** | `disableSignUp` pada OAuth, `databaseHooks.user.create.before`, `additionalFields`, dan `rateLimit`. |

---

## 2. Kebijakan Akses & Pendaftaran Akun

### A. Pendaftaran Akun Pelanggan (`/daftar`)
1. **Wajib Nomor Pelanggan (`nolg`) Terdaftar**:
   - Pelanggan yang mendaftar melalui `/daftar` **wajib** memasukkan Nomor Pelanggan (`nolg`).
   - Server (`databaseHooks.user.create.before` di `apps/web/src/lib/auth.ts`) memverifikasi langsung keberadaan `nolg` pada tabel `pelanggan`.
   - Jika `nolg` kosong atau tidak ditemukan di tabel `pelanggan`, pendaftaran **ditolak mentah-mentah (`400 Bad Request`)** di level server (tidak dapat di-bypass lewat Postman/curl).
2. **1 Nomor Pelanggan = 1 Akun Unik**:
   - Satu `nolg` hanya dapat terhubung ke satu akun `user` aktif untuk mencegah duplikasi dan pembajakan akun pelanggan.
3. **Google OAuth Khusus Staf Terdaftar**:
   - `socialProviders.google` mengaktifkan `disableSignUp: true` agar tidak ada yang bisa melewati validasi `nolg` dengan cara login Google.
4. **Role Default & Isolasi**:
   - Setiap pendaftaran mandiri otomatis hanya mendapatkan role `USER`.
   - Akun pegawai/internal hanya boleh dibuat oleh `SUPERADMIN` melalui panel manajemen pengguna internal.

### B. Navigasi & Pengalaman Setelah Login
- **Pelanggan (`USER`)**:
  - Setelah mendaftar atau login, selalu diarahkan ke **Beranda Publik (`/`)**.
  - Pada header publik (`SiteHeader` & `MobileMenu`), tombol **"Masuk/Daftar"** disembunyikan dan digantikan dengan **Avatar User Dropdown** yang hanya memuat menu layanan publik (`Cek Tagihan`, `Lapor Meter`, `Pengaduan Air`, `Info Gangguan`, dan `Keluar`).
  - Dilarang mutlak mengakses `(dashboard)/*`, `(fluid)/*`, maupun API internal mana pun.
- **Petugas / Staf Internal** (`SUPERADMIN`, `EXECUTIVE`, `VERIFIKATOR_1/2/3`, `STAFF_ADMIN_BILLING`, `PENCATAT`, `PELAKSANA`):
  - Setelah login diarahkan ke `/dashboard` (atau `callbackUrl` internal yang tervalidasi).
  - Pada header publik, Avatar Dropdown menyediakan pintasan ke **Dashboard Operasional (`/dashboard`)** serta tombol `Keluar`.

---

## 3. Arsitektur Pengamanan 5 Lapis (*Defense-in-Depth*)

1. **Lapis 1 — Autentikasi & Pendaftaran (`apps/web/src/lib/auth.ts`)**
   - Validasi server-side `nolg` di `databaseHooks.user.create.before`.
   - `disableSignUp: true` pada Google OAuth.
   - `rateLimit` aktif untuk endpoint autentikasi (`/api/auth/*`).
   - Sanitasi `callbackUrl` untuk mencegah Open Redirect (`CWE-601`).
   - `localhost` hanya diizinkan pada `trustedOrigins` saat `NODE_ENV !== 'production'`.
2. **Lapis 2 — Edge Gatekeeper (`apps/web/src/proxy.ts`)**
   - Meneruskan header internal `x-pathname` ke Server Components/Layouts.
   - Pengecekan cepat keberadaan cookie sesi pada route internal terproteksi (optimistic redirect ke `/login`).
3. **Lapis 3 — Pemetaan RBAC Halaman & DAL (`apps/web/src/lib/auth/access-control.ts`)**
   - Matriks terpusat *Route-to-Role* yang tersinkronisasi dengan `navigasi.ts`.
   - Prinsip **Default Deny**: route di dalam `(dashboard)` atau `(fluid)` yang tidak terdaftar di matriks hanya dapat diakses oleh `SUPERADMIN`.
   - Enforcement langsung di `(dashboard)/layout.tsx` dan `(fluid)/layout.tsx`:
     - Jika belum login → redirect `/login`.
     - Jika role hanya `USER` → redirect `/`.
     - Jika role tidak berhak atas `pathname` saat ini → redirect `/dashboard?error=forbidden`.
4. **Lapis 4 — Hardening Backend API Elysia (`apps/web/src/server/modules/**`)**
   - Seluruh endpoint internal wajib menggunakan `requireRole([...])` (bukan sekadar `requireAuth: true` atau tanpa auth).
   - Perbaikan bug *fail-open* pada `closing.router.ts`.
   - Penutupan celah tanpa auth pada `broadcast.router.ts` (mutasi & admin), `kpi.router.ts`, `master.router.ts`, dan `import.router.ts`.
5. **Lapis 5 — Security Headers (`apps/web/next.config.ts`)**
   - Penambahan `Strict-Transport-Security` (HSTS) dan `Content-Security-Policy` (CSP) di samping `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan `Permissions-Policy`.

---

## 4. Matriks Ringkas Akses Role ke Area Aplikasi

| Role | Halaman Publik (`/`, `/cek-tagihan`, dll.) | Dashboard & Modul Internal | Verifikasi (`(fluid)`) | Master User & RBAC | Closing & Import | KPI Eksekutif |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **USER (Pelanggan)** | Ya | **Ditolak** | **Ditolak** | **Ditolak** | **Ditolak** | **Ditolak** |
| **PENCATAT / PELAKSANA** | Ya | Terbatas (Cater & Progres) | **Ditolak** | **Ditolak** | **Ditolak** | **Ditolak** |
| **STAFF_ADMIN_BILLING** | Ya | Operasional & Billing | Ya | **Ditolak** | Ya | **Ditolak** |
| **VERIFIKATOR_1 / 2** | Ya | Monitoring & Verifikasi | Ya | **Ditolak** | Terbatas | **Ditolak** |
| **VERIFIKATOR_3** | Ya | Monitoring, Verifikasi & Audit | Ya | Lihat | Ya | **Ditolak** |
| **EXECUTIVE** | Ya | Monitoring, Analitik & KPI | Ya | Lihat | Ya | Ya |
| **SUPERADMIN** | Ya | Penuh | Penuh | Penuh | Penuh | Penuh |
