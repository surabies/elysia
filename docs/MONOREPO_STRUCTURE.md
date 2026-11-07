# Dokumentasi Struktur Monorepo (Cater Baca Meter)

Proyek ini menggunakan arsitektur **Monorepo modern berbasis Bun Workspaces** (`apps/*` dan `packages/*`). Arsitektur ini dirancang untuk memisahkan logika antarmuka Web, aplikasi Mobile lapangan, basis data modular Drizzle ORM, serta tipe/DTO bersama tanpa duplikasi kode.

---

## 1. Peta Direktori Monorepo

```text
elysiajs/ (Root Monorepo)
├── apps/
│   ├── web/                     # @cater/web: Aplikasi Web Fullstack (Next.js 16 + Elysia)
│   │   ├── src/                 # Seluruh source code aplikasi web
│   │   │   ├── app/             # Next.js App Router
│   │   │   │   ├── (auth)/      # Halaman autentikasi
│   │   │   │   ├── (dashboard)/ # Halaman dashboard
│   │   │   │   ├── api/         # Route Handler Elysia & Better Auth
│   │   │   │   └── globals.css  # Vercel Geist Design System Tokens
│   │   │   ├── components/      # UI bersama, layout, shared, dan shadcn/reui
│   │   │   ├── features/        # UI domain dan kode per fitur
│   │   │   │   └── dashboard/
│   │   │   │       ├── overview/components/       # Ringkasan dashboard
│   │   │   │       ├── analytics/components/      # Grafik dan tabel analitik
│   │   │   │       ├── verifikasi/
│   │   │   │       │   ├── components/
│   │   │   │       │   ├── hooks/
│   │   │   │       │   ├── lib/
│   │   │   │       │   └── types/
│   │   │   │       └── shared/                    # Utilitas yang dipakai lintas modul
│   │   │   │           ├── api/
│   │   │   │           ├── data-grid/
│   │   │   │           ├── hooks/
│   │   │   │           └── icons/
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Client utils, auth, env validation
│   │   │   └── server/          # Backend Elysia Engine
│   │   │       ├── app.ts       # Main Elysia app instance (/api prefix)
│   │   │       ├── modules/     # cater, auth, geo (PostGIS), echo, health
│   │   │       └── plugins/     # authPlugin, corsPlugin, errorHandler
│   │   ├── components.json      # Konfigurasi shadcn/ui
│   │   ├── next.config.ts       # Konfigurasi Next.js 16
│   │   ├── postcss.config.mjs   # PostCSS + Tailwind v4
│   │   ├── package.json         # Dependencies terisolasi untuk Web
│   │   └── tsconfig.json        # Path alias (@/*, @cater/db, @cater/types)
│   │
│   └── mobile/                  # @cater/mobile: Starter App Lapangan Petugas
│       ├── src/index.ts         # Reading submission & offline sync handler
│       ├── package.json         # Dependencies terisolasi untuk Mobile (Expo/React Native)
│       └── tsconfig.json
│
├── packages/
│   ├── db/                      # @cater/db: Core Database & Drizzle ORM Modular
│   │   ├── data/jan/            # Dataset produksi STI PDAM (CSV 22.550 baris)
│   │   │   ├── ProgresCater-PW5.csv
│   │   │   ├── PBPK.csv
│   │   │   └── lapdatametertes.csv
│   │   ├── src/
│   │   │   ├── client.ts        # Database connection pool (PostgreSQL + PostGIS)
│   │   │   ├── index.ts         # Export db client dan seluruh schema
│   │   │   ├── migrate.ts       # Runner migrasi SQL
│   │   │   ├── seed.ts          # Seed data awal
│   │   │   ├── etl/             # Script import streaming CSV berkecepatan tinggi
│   │   │   │   └── import-progres-cater.ts
│   │   │   ├── migrations/      # File SQL migration versi terkelola (0000, 0001)
│   │   │   └── schema/          # Domain Schemas Modular (8 Modul):
│   │   │       ├── wilayah.ts   # Wilayah Adm, Kecamatan, Kelurahan, Zona, Rute, Petugas
│   │   │       ├── tarif.ts     # Golongan Tarif (2A1..3B), Beban, Admin, Air Kotor
│   │   │       ├── meter.ts     # Aset Water Meter (No Seri, Merk, Ukuran, Umur, Kondisi)
│   │   │       ├── pelanggan.ts # Pelanggan + PostGIS Point (titik_lokasi)
│   │   │       ├── cater.ts     # Transaksi Catat Meter (stml, stma, pakai, GPS, foto)
│   │   │       ├── billing.ts   # DRD & Piutang Rekening (jmlHargaAir, tunggakan)
│   │   │       ├── auth.ts      # Better Auth (user, session, account, verification)
│   │   │       └── geo.ts       # Places spatial demo
│   │   ├── drizzle.config.ts    # Konfigurasi Drizzle Kit tunggal (Single Source of Truth)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── types/                   # @cater/types: Kontrak Tipe & DTO Bersama
│       ├── src/index.ts         # Pelanggan, CaterBacaMeterInput, BillingDrd, Enums
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                        # Dokumentasi Proyek
│   ├── MONOREPO_STRUCTURE.md    # Panduan ini
│   ├── VERCEL_GEIST_GUIDE.md    # Panduan Vercel Geist Tokens & Typography
│   ├── DECISIONS.md             # Architecture Decision Records
│   └── FEATURES.md              # Feature Traceability Matrix
│
├── tests/                       # Automated Test Suites (Bun Test)
│   ├── api-core.test.ts         # Health, metadata, echo
│   ├── auth.test.ts             # Proteksi endpoint & session
│   ├── cater-api.test.ts        # Stats, rute download offline, submit baca, anomali
│   ├── cater-schema.test.ts     # Verifikasi integritas skema modular Drizzle
│   ├── geo.test.ts              # PostGIS ST_DWithin & Haversine distance
│   └── migration.test.ts        # Verifikasi file migrasi & PostGIS extension
│
├── .env                         # Environment variables (Database URL, Secrets)
├── .env.example
├── .gitignore
├── docker-compose.yml           # Kontainer Postgres 16/17 + PostGIS
├── eslint.config.mjs            # Linter rules
├── package.json                 # Monorepo Workspace Root Manager
├── bun.lock                     # Bun lockfile
└── tsconfig.json                # Base TypeScript configuration
```

### Konvensi penempatan UI

- `src/app/` hanya berisi route, layout, dan file konvensi Next.js.
- `src/components/` berisi komponen lintas fitur seperti `ui/`, `layout/`, dan `shared/`.
- `src/features/<fitur>/components/` berisi UI yang hanya dimiliki fitur tersebut.
- Area dashboard dipisah menurut modul: `src/features/dashboard/overview/`, `analytics/`, dan `verifikasi/`; komponen umum dashboard berada di `shared/`.
- Komponen route ditempatkan pada modul pemiliknya (`overview/` atau `analytics/`), bukan di dalam `app/`.
- Jalankan shadcn dari `apps/web`; alias `@/components` sekarang secara eksplisit diarahkan ke `src/components`. Jika suatu item registry memilih target lain, `--path src/components/reui` dapat dipakai sebagai override.

---

## 2. Keuntungan Restrukturisasi Ini

1. **Root Directory Bersih**: Tidak ada lagi file source code aplikasi (`app`, `components`, `src`, `drizzle.config.ts`, `*.csv`) yang tercecer di root.
2. **Eliminasi Duplikasi**:
   - `src/db/` dihapus secara permanen; seluruh database terpusat di `packages/db`.
   - `drizzle.config.ts` di root dihapus; konfigurasi tunggal berada di `packages/db/drizzle.config.ts`.
   - Seluruh source code web, termasuk `app`, `components`, dan `features`, berada di `apps/web/src/`; konfigurasi, `.env`, dan `public/` tetap di root `apps/web/`.
   - File dataset CSV dipindahkan dari `src/db/jan` ke `packages/db/data/jan/`.
3. **Workspace Isolation**:
   - `@cater/web` dapat di-build atau di-deploy secara mandiri ke Vercel.
   - `@cater/mobile` menggunakan modul `@cater/types` tanpa perlu menarik dependensi React DOM / Next.js.
   - `@cater/db` dapat di-import oleh backend web maupun script migrasi / ETL CLI.

---

## 3. Daftar Perintah CLI (Root Commands)

Semua perintah dapat dijalankan langsung dari root repository:

### Development & Build
```bash
# Menjalankan server development Next.js + Elysia
bun run dev

# Menjalankan production build aplikasi web (Turbopack)
bun run build

# Menjalankan linter
bun run lint

# Menjalankan typecheck TypeScript di seluruh workspace
bun run typecheck
```

### Testing
```bash
# Menjalankan seluruh 24 unit & integration test
bun test
```

### Database & ETL Cater STI
```bash
# Generate file migrasi baru saat skema di packages/db diubah
bun run db:generate

# Menerapkan migrasi ke database PostgreSQL / PostGIS
bun run db:migrate

# Membuka Drizzle Studio visualizer
bun run db:studio

# Seeding data pengguna & tempat demo
bun run db:seed

# Menjalankan ETL Importer untuk mem-parsing 22.549 data ProgresCater & GPS PBPK
bun run cater:import
```

---

## 4. Hasil Verifikasi Quality Gates

| Metrik | Status | Bukti |
| :--- | :--- | :--- |
| **Unit & Integration Tests** | **PASS (24/24)** | `bun test` selesai dalam ~300 ms tanpa kegagalan |
| **TypeScript Typecheck** | **0 Errors** | `bun run typecheck` (`tsc --noEmit`) bersih |
| **Production Build** | **Success (8/8 routes)** | `bun run build` via Turbopack selesai dalam ~3.7 detik |
| **Database Migration** | **Active (16 tables)** | Seluruh tabel modular STI & PostGIS aktif di PostgreSQL |
| **Data Importer** | **22.549 Records** | Seluruh data produksi ProgresCater tersimpan di tabel relational |
