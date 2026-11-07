# Standar Arsitektur, Modularisasi & Konvensi Kode (Coding Standards)

Dokumen ini adalah **pedoman baku (*single source of truth*)** untuk penulisan kode, penataan folder, konvensi penamaan (*naming conventions*), dan pemisahan tanggung jawab (*Separation of Concerns*) pada seluruh codebase aplikasi ini.

---

## 1. Prinsip Utama: Separation of Concerns (SoC)

Aplikasi dibangun di atas arsitektur berlapis 4 tingkat (*4-Tier Clean Layered Architecture*). Setiap baris kode **wajib** ditempatkan pada lapisan yang tepat sesuai tanggung jawabnya:

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. TRANSPORT / API LAYER (ElysiaJS Router & Schemas)                 │
│     - HTTP Method, URL Endpoint, Header, Cookie, Param, Query, Body    │
│     - Skema Validasi Input/Output via TypeBox (t.Object, t.String)     │
│     - RBAC Macro Guard (requireRole, requireAuth)                      │
│     - DILARANG: Menulis query database langsung (SELECT, INSERT, dll.) │
│     - DILARANG: Menulis rumus hitung matematis tarif/taksasi           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Memanggil
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  2. SERVICE / APPLICATION LAYER (Services)                            │
│     - Orkestrasi alur kerja (workflow) & transaksi (db.transaction)    │
│     - Menggabungkan data dari database dengan Domain Engine            │
│     - Pengecekan prasyarat bisnis (mis. Status Periode Closing)        │
│     - Menulis Audit Log & Event Notifikasi                             │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
                    ▼ Memanggil                     ▼ Memanggil
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│  3. DOMAIN ENGINE (Pure Logic)        │ │  4. DATA ACCESS LAYER        │
│     - 100% PURE FUNCTIONS             │ │     - Drizzle ORM Schema     │
│     - Zero I/O, Zero DB, Zero HTTP    │ │     - Query Builder          │
│     - Rumus matematis (Tarif Blok,    │ │     - PostGIS Spasial SQL    │
│       Taksasi Rata-3B, GWM Mutasi,   │ │     - Database Connection    │
│       Window Waktu 1-25 WIB)         │ │     - Lokasi: packages/db    │
│     - Deterministic & Fast Tests      │ │                              │
└───────────────────────────────────────┘ └──────────────────────────────┘
                                    ▲
                                    │
┌────────────────────────────────────────────────────────────────────────┐
│  SHARED CONTRACTS & TYPES (packages/types)                             │
│     - TypeScript Interfaces, DTOs, Discriminated Unions, Enums         │
│     - Tidak memiliki runtime logic, hanya definisi tipe                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Aturan Baku Penamaan (Strict Naming Conventions)

Untuk mencegah ketidakkonsistenan dan kode yang campur aduk, gunakan aturan penamaan berikut tanpa pengecualian:

| Elemen Kode | Format Penamaan | Contoh Benar | Contoh Salah (Dilarang) |
| :--- | :--- | :--- | :--- |
| **Nama Berkas & Folder** | `kebab-case.ts` | `cater-verifikasi.service.ts`<br>`tagihan-kalkulator.engine.ts` | `caterVerifikasi.ts`<br>`Tagihan_Kalkulator.ts` |
| **Tabel Database (SQL)** | `snake_case` | `water_meter_mutasi`<br>`cater_baca_meter` | `waterMeterMutasi`<br>`Water-Meter-Mutasi` |
| **Kolom Database (SQL)** | `snake_case` | `stand_angkat`<br>`total_debit_m3` | `standAngkat`<br>`Stand_Angkat` |
| **Tipe, Interface, Enum (TS)** | `PascalCase` | `WaterMeterMutasi`<br>`CaterVerificationStatus` | `water_meter_mutasi`<br>`caterVerificationStatus` |
| **Variabel, Objek, Fungsi (TS)**| `camelCase` | `hitungTotalTagihan()`<br>`isLokasiValid` | `Hitung_Total_Tagihan()`<br>`is_lokasi_valid` |
| **Drizzle Schema Instance** | `camelCase` | `waterMeterMutasi`<br>`caterBacaMeter` | `WaterMeterMutasi`<br>`water_meter_mutasi` |
| **Konstanta Global / Konfigurasi** | `UPPER_SNAKE_CASE` | `MAKS_JARAK_GEOFENCE_METER`<br>`ROLE_GROUPS` | `maksJarakGeofence`<br>`RoleGroups` |

---

## 3. Tata Letak Direktori Frontend (`apps/web/src/`)

Source code Next.js dipusatkan di `src/`, sedangkan konfigurasi proyek, `.env`, dan `public/` tetap di root `apps/web/`.

```text
apps/web/src/
├── app/                           # Route, layout, dan file konvensi Next.js saja
├── components/                    # Komponen lintas fitur
│   ├── ui/                        # Primitive shadcn/ui dan ReUI
│   ├── layout/                    # Shell, navigasi, dan layout bersama
│   └── shared/                    # Komponen visual generik
├── features/                      # UI dan kode yang dimiliki domain/fitur
│   ├── auth/components/
│   └── dashboard/
│       ├── overview/components/   # Ringkasan dashboard
│       ├── analytics/components/  # Analitik
│       ├── verifikasi/            # Modul mandiri: components, hooks, lib, types
│       └── shared/                # API, hooks, ikon, dan data-grid lintas modul
├── hooks/                         # Hook lintas fitur
├── lib/                           # Utilitas lintas fitur
└── server/                        # Backend Elysia
```

Komponen khusus halaman yang dimiliki satu domain ditempatkan pada `features/<domain>/components`, bukan di dalam `app/`. Route Next hanya mengimpor dan merangkai fitur. Jalankan shadcn dari `apps/web`; alias `@/components` mengarah ke `src/components`. Opsi `--path src/components/reui` tersedia untuk meng-override target registry bila diperlukan.

Subfolder di dalam modul dibuat sesuai kebutuhan, bukan diseragamkan dengan folder kosong. Kode yang hanya digunakan satu modul tinggal di modul tersebut; utilitas yang digunakan beberapa modul dashboard berada di `features/dashboard/shared/`.

## 4. Tata Letak Direktori Backend (`apps/web/src/server/`)

Setiap fitur dikelompokkan secara modular berdasarkan fungsinya:

```text
apps/web/src/server/
├── app.ts                         # Assembly utama Elysia (prefix: /api)
├── plugins/                       # Cross-cutting concerns & middleware
│   ├── auth.ts                    # RBAC macro guard & session resolver
│   ├── cors.ts                    # Cross-Origin configuration
│   └── error-handler.ts           # Global exception mapper
│
├── domain/                        # Pure Business Logic (Bebas dari DB & Web)
│   ├── tagihan/
│   │   ├── tagihan.engine.ts      # Rumus tarif progresif, biaya tetap, denda
│   │   └── tagihan.test.ts        # Unit test murni fungsi matematis
│   ├── taksasi/
│   │   ├── taksasi.engine.ts      # Logika Rata-3B, ganti meter, rollover
│   │   └── taksasi.test.ts
│   ├── mandiri/
│   │   ├── mandiri.engine.ts      # Jendela lapor 1-25 WIB & evaluasi jarak
│   │   └── mandiri.test.ts
│   └── gwm/
│       ├── gwm.engine.ts          # Rumus kubikasi stand angkat & Neraca Air NRW
│       └── gwm.test.ts
│
├── services/                      # Application Orchestration & DB Transactions
│   ├── cater/
│   │   ├── cater-kueri.service.ts       # Query pembacaan meter, filter rute, riwayat
│   │   └── cater-verifikasi.service.ts  # Workflow verifikasi V1-V3 & koreksi staff
│   ├── closing/
│   │   ├── closing.service.ts           # Validasi prasyarat & batch DRD generation
│   │   └── bulan-baru.service.ts        # Roll-forward saldo & inisialisasi periode
│   ├── mandiri/
│   │   └── mandiri.service.ts           # Ingest hasil mandiri & approval override DK
│   └── gwm/
│       └── gwm.service.ts               # Mutasi ganti meter & input debit GWM induk
│
└── modules/                       # Elysia Routes & TypeBox Validation
    ├── cater/
    │   ├── cater.router.ts        # HTTP Handler (/api/cater/*)
    │   ├── cater.schema.ts        # TypeBox schema parameter, query, body
    │   └── index.ts               # Re-export module
    ├── closing/
    │   ├── closing.router.ts      # HTTP Handler (/api/closing/*)
    │   ├── closing.schema.ts
    │   └── index.ts
    ├── mandiri/
    │   ├── mandiri.router.ts      # HTTP Handler (/api/cater/mandiri/*)
    │   ├── mandiri.schema.ts
    │   └── index.ts
    └── gwm/
        ├── gwm.router.ts          # HTTP Handler (/api/cater/gwm/*)
        ├── gwm.schema.ts
        └── index.ts
```

---

## 5. Relevansi & Alasan Penempatan Fungsi

Mengapa struktur ini diterapkan dan apa keuntungannya?

### 1. Mengapa Domain Engine Dipisahkan dari Service & Router?
* **Alasan Relevansi**: Rumus tarif air PDAM (blok progresif), taksasi (RATA-3B), dan perhitungan ganti meter adalah **aturan bisnis murni (*business rules*)**. Aturan ini tidak peduli apakah data disimpan di Postgres, SQLite, atau dikirim lewat Web HTTP maupun WebSocket.
* **Keuntungan**:
  1. **Uji Cepat (Fast Feedback)**: Pengujian unit test domain berjalan dalam hitungan milidetik tanpa perlu mock database atau koneksi internet.
  2. **Dapat Digunakan Ulang (*Reusability*)**: Kode domain yang sama dapat di-import langsung oleh aplikasi mobile offline (di `apps/mobile`) untuk menghitung estimasi tagihan di ponsel petugas sebelum sinyal internet tersedia.

### 2. Mengapa Router Hanya Berisi Validasi & Delegasi?
* **Alasan Relevansi**: Router Elysia bertanggung jawab atas **protokol HTTP** (status code 200, 400, 401, 404), serialisasi data, dan penegakan izin pengguna (RBAC macro).
* **Keuntungan**:
  1. File router tetap ringkas ($< 150$ baris per file).
  2. Jika suatu saat framework web diganti atau ditambahkan interface CLI / gRPC, logika bisnis di service dan domain **tidak perlu disentuh sama sekali**.

### 3. Mengapa Transaksi Database Terpusat di Service?
* **Alasan Relevansi**: Satu proses bisnis (misal *Closing Bulan* atau *Verifikasi Stand Angkat*) melibatkan pembaruan beberapa tabel sekaligus (`water_meter_mutasi`, `cater_baca_meter`, `rekening_drd`, `cater_verifikasi_log`).
* **Keuntungan**:
  1. Atomic: Jika salah satu tabel gagal diperbarui, seluruh transaksi dibatalkan (*rollback*) otomatis lewat `db.transaction(...)`.
  2. Integritas data keuangan PDAM terlindungi 100%.

---

## 6. Pedoman Menulis Kode Semantik & Idiomatik

1. **Gunakan TypeBox `t` untuk Validasi Elysia**:
   ```typescript
   // cater.schema.ts
   import { t } from 'elysia';

   export const verifyV1Schema = {
     body: t.Object({
       caterId: t.String({ format: 'uuid', description: 'ID transaksi pembacaan meter' }),
       action: t.Union([t.Literal('APPROVE'), t.Literal('REQUEST_RESURVEY'), t.Literal('ADJUST_STAND')]),
       stmaKoreksi: t.Optional(t.Number({ minimum: 0 })),
       catatan: t.Optional(t.String()),
     }),
   };
   ```

2. **Gunakan Elysia Macro untuk RBAC Guard**:
   ```typescript
   // cater.router.ts
   caterRouter.post('/verify/v1', ({ body, user }) => {
     return caterVerifikasiService.verifikasiV1(body, user.id);
   }, {
     requireRole: 'VERIFIKATOR_1',
     schema: verifyV1Schema,
   });
   ```

3. **Hindari Primitive Obsession & Loose Any**:
   - Seluruh fungsi domain harus menerima dan mengembalikan objek terstruktur dengan tipe yang dideklarasikan di `@cater/types`.
   - Dilarang keras menggunakan tipe `any` yang meloloskan kesalahan compile-time.
