# LAPORAN AKHIR PERBAIKAN & PENYEMPURNAAN MODUL PENGADUAN
## Perumda Tirtawening (mytirta)

> **Status Penyelesaian:** SELESAI 100% (Semua Fase 0–7 + Ekstensi RBAC Dinamis 6 Tingkat Jabatan & Kebijakan Dinamis Berversi)  
> **Tanggal Selesai:** 22 November 2026  
> **Lingkungan Teruji:** Development (`ep-bitter-wildflower-azaxnlz0`) — **Database Produksi Tidak Disentuh**  
> **Hasil Pengujian:** 43/43 Tests Passing (100% Hijau) & Typecheck `@cater/web` Exited 0  

---

## 1. Tabel Status Temuan (B1–B15 & K1–K8)

Seluruh 23 temuan (15 bug kode dan 8 konsep alur bisnis) telah diselesaikan secara tuntas dan dibuktikan dengan tes otomatis:

| ID | Kategori | Ringkasan Masalah | Status | File Utama Perbaikan | Pengujian yang Membuktikan |
| :---: | :---: | :--- | :---: | :--- | :--- |
| **B1** | Bug | Kebocoran data pribadi (PII) pelapor di endpoint peta publik | **SELESAI** | `pengaduan.service.ts` | `tests/peta-pengaduan.test.ts` |
| **B2** | Bug | Injeksi koordinat palsu (`TITIK_BANDUNG`) pada tiket tanpa GPS | **SELESAI** | `pengaduan.service.ts` | `tests/peta-pengaduan.test.ts` |
| **B3** | Bug | Petugas pengaduan memuat mock `usr-1`..`usr-4` saat kosong/error | **SELESAI** | `pengaduan.service.ts` | `tests/integritas-pengaduan.test.ts` |
| **B4** | Bug | *Race condition* penomoran tiket akibat `count(*) + 1` | **SELESAI** | `pengaduan.service.ts`, `schema/pengaduan.ts` | `tests/integritas-pengaduan.test.ts` (20 paralel) |
| **B5** | Bug | Nomor langganan fiktif memicu PostgreSQL FK violation mentah | **SELESAI** | `pengaduan.service.ts` | `tests/integritas-pengaduan.test.ts` |
| **B6** | Bug | Otorisasi role absen (semua staf internal bebas ubah status) | **SELESAI** | `alur-pengaduan.engine.ts`, `pengaduan.service.ts` | `tests/alur-pengaduan-fase3.test.ts` |
| **B7** | Bug | Ubah status langsung ke `DITUGASKAN` tanpa `ditugaskanKeId` | **SELESAI** | `pengaduan.service.ts` | `tests/integritas-pengaduan.test.ts` |
| **B8** | Bug | *Lost updates* & *race condition* status tanpa *optimistic locking* | **SELESAI** | `pengaduan.service.ts` | `tests/integritas-pengaduan.test.ts` |
| **B9** | Bug | Formula `ringkasSla` bias pada tiket selesai terlambat & ditolak | **SELESAI** | `alur-pengaduan.engine.ts` | `tests/alur-pengaduan-fase3.test.ts` |
| **B10** | Bug | `eskalasiKe` membaca pelaku eskalasi bukan petugas target | **SELESAI** | `pengaduan.service.ts`, `schema/pengaduan.ts` | `tests/integritas-pengaduan.test.ts` |
| **B11** | Bug | Statistik memuat seluruh baris ke memori dan salah hitung SLA | **SELESAI** | `pengaduan.service.ts` | `tests/peta-pengaduan.test.ts` |
| **B12** | Bug | Catatan/chat/eskalasi diizinkan pada tiket yang sudah `DITUTUP` | **SELESAI** | `pengaduan.service.ts` | `tests/peta-pengaduan.test.ts` |
| **B13** | Bug | Validasi skema longgar (`t.String()`) dan error generik 400 | **SELESAI** | `pengaduan.schema.ts`, `pengaduan.router.ts` | `tests/publik-pengaduan-integrasi.test.ts` |
| **B14** | Bug | Panggilan upload Cloudinary berada di dalam transaksi DB | **SELESAI** | `pengaduan.service.ts` | `tests/integritas-pengaduan.test.ts` |
| **B15** | Bug | String base64 `data:image` disimpan mentah ke kolom teks DB | **SELESAI** | `pengaduan.service.ts` | `tests/integritas-pengaduan.test.ts` |
| **K1** | Konsep | Alur tagihan rekening tidak lewat verifikasi sebelum ke lapangan | **SELESAI** | `alur-pengaduan.engine.ts`, `pengaduan.service.ts` | `tests/alur-pengaduan-fase3.test.ts` |
| **K2** | Konsep | Prioritas default tidak otomatis berdasarkan jenis insiden | **SELESAI** | `alur-pengaduan.engine.ts`, `pengaduan.config.ts` | `tests/alur-pengaduan-fase3.test.ts` |
| **K3** | Konsep | Jeda SLA (*freeze timer*) tidak aktif saat `MENUNGGU_PELANGGAN` | **SELESAI** | `alur-pengaduan.engine.ts`, `pengaduan.service.ts` | `tests/alur-pengaduan-fase3.test.ts` |
| **K4** | Konsep | Transisi otomatis `SELESAI` $\rightarrow$ `DITUTUP` tidak memiliki pemicu | **SELESAI** | `pengaduan.service.ts`, `scripts/tutup-pengaduan...` | `tests/alur-pengaduan-fase3.test.ts` |
| **K5** | Konsep | Reopen tiket tidak membatasi kuota, tidak reset SLA | **SELESAI** | `alur-pengaduan.engine.ts`, `pengaduan.service.ts` | `tests/alur-pengaduan-fase3.test.ts` |
| **K6** | Konsep | Kanal publik warga tidak memverifikasi kepemilikan laporan | **SELESAI** | `publik.router.ts`, `pengaduan.service.ts` | `tests/publik-pengaduan-integrasi.test.ts` |
| **K7** | Konsep | Tidak ada deteksi laporan kebocoran duplikat berulang | **SELESAI** | `pengaduan.service.ts` (PostGIS `ST_DWithin`) | `tests/alur-pengaduan-fase3.test.ts` |
| **K8** | Konsep | Penolakan pengaduan (`DITOLAK`) tidak mewajibkan alasan | **SELESAI** | `alur-pengaduan.engine.ts`, `pengaduan.service.ts` | `tests/kebijakan-pengaduan.test.ts` |

---

## 2. Fitur Tambahan Strategis (Permintaan Pengembangan Khusus)

1. **RBAC Dinamis 6 Tingkat Jabatan & Kustom Hak Akses Perorangan ("Si A"):**
   - Penambahan 6 tingkatan hierarki struktural resmi: `DIREKSI`, `SENIOR_MANAGER`, `MANAGER`, `SUPERVISOR`, `STAFF`, dan `PELAKSANA`.
   - Tabel `role_permissions` dan tabel baru `user_permission_overrides` untuk kustomisasi per user.
   - Frontend: Komponen [MatriksHakAkses.tsx](file:///E:/Coding/elysia/apps/web/src/features/dashboard/master/components/MatriksHakAkses.tsx) (Matriks 6 Role) dan [KelolaManajemenUser.tsx](file:///E:/Coding/elysia/apps/web/src/features/dashboard/master/components/KelolaManajemenUser.tsx) (Tab Kustom Hak Akses User).
   - Pengujian: [tests/matriks-rbac.test.ts](file:///E:/Coding/elysia/tests/matriks-rbac.test.ts) (4 tests pass).

2. **Kebijakan Pengaduan Dinamis Berversi (*Policy as Data*):**
   - Menghapus konstanta SOP kaku di kode dan memindahkannya ke tabel database `kebijakan_pengaduan`.
   - Snapshot versi terikat pada setiap tiket melalui kolom `pengaduan.kebijakan_versi`.
   - RESTful API di `/api/v1/pengaduan/kebijakan/*` (`aktif`, `riwayat`, `draft`, `terbitkan`, `rollback`).
   - Frontend UI: Komponen [PengaturanPengaduanView.tsx](file:///E:/Coding/elysia/apps/web/src/features/dashboard/pengaturan/components/PengaturanPengaduanView.tsx) di menu `/pengaturan/pengaduan`.
   - Pengujian: [tests/kebijakan-pengaduan.test.ts](file:///E:/Coding/elysia/tests/kebijakan-pengaduan.test.ts) (6 tests pass).

3. **Instrumen Kuesioner SOP v2.0:**
   - Format wawancara terbuka per divisi kerja di [docs/pengaduan/PERTANYAAN-SOP.md](file:///E:/Coding/elysia/docs/pengaduan/PERTANYAAN-SOP.md).

---

## 3. Daftar Perubahan Skema Database (Semua Aditif & Non-Destruktif)

```sql
-- 1. Counter nomor tiket atomik (B4)
CREATE TABLE IF NOT EXISTS "pengaduan_nomor_urut" (
    "prefix" varchar(30) PRIMARY KEY NOT NULL,
    "last_urut" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Petugas target eskalasi/penugasan (B10)
ALTER TABLE "riwayat_pengaduan" ADD COLUMN IF NOT EXISTS "petugas_tujuan_id" text REFERENCES "user"("id") ON DELETE SET NULL;

-- 3. RBAC Dinamis 6 Role Jabatan
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "direksi" boolean DEFAULT false NOT NULL;
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "senior_manager" boolean DEFAULT false NOT NULL;
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "manager" boolean DEFAULT false NOT NULL;
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "supervisor" boolean DEFAULT false NOT NULL;
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "staff" boolean DEFAULT false NOT NULL;
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "pelaksana" boolean DEFAULT false NOT NULL;

-- 4. User Permission Overrides (Hak Akses Spesifik Si A)
CREATE TABLE IF NOT EXISTS "user_permission_overrides" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "modul_key" varchar(50) NOT NULL,
    "diizinkan" boolean NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "updated_by" text REFERENCES "user"("id") ON DELETE SET NULL
);

-- 5. Kebijakan Pengaduan Dinamis Berversi (Policy as Data)
DO $$ BEGIN
    CREATE TYPE status_kebijakan_enum AS ENUM ('DRAFT', 'AKTIF', 'ARSIP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "kebijakan_pengaduan" (
    "id" text PRIMARY KEY,
    "versi" integer NOT NULL UNIQUE,
    "status" status_kebijakan_enum NOT NULL DEFAULT 'DRAFT',
    "nomor_sk" varchar(100),
    "alasan_perubahan" text,
    "tanggal_berlaku" timestamp NOT NULL DEFAULT now(),
    "config" jsonb NOT NULL,
    "dibuat_oleh" text REFERENCES "user"("id") ON DELETE SET NULL,
    "disetujui_oleh" text REFERENCES "user"("id") ON DELETE SET NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 6. Snapshot versi kebijakan pada tiket pengaduan
ALTER TABLE "pengaduan" ADD COLUMN IF NOT EXISTS "kebijakan_versi" integer DEFAULT 1;
```

---

## 4. Ringkasan Pengujian Sistem

Seluruh 43 pengujian integrasi dan domain berjalan sukses 100% hijau:
```bash
bun test tests/alur-pengaduan-fase3.test.ts \
         tests/integritas-pengaduan.test.ts \
         tests/kebijakan-pengaduan.test.ts \
         tests/peta-pengaduan.test.ts \
         tests/publik-pengaduan-integrasi.test.ts \
         tests/matriks-rbac.test.ts
```
**Hasil:**
- `tests/alur-pengaduan-fase3.test.ts`: 6 pass
- `tests/integritas-pengaduan.test.ts`: 5 pass
- `tests/kebijakan-pengaduan.test.ts`: 6 pass
- `tests/peta-pengaduan.test.ts`: 9 pass
- `tests/publik-pengaduan-integrasi.test.ts`: 13 pass
- `tests/matriks-rbac.test.ts`: 4 pass
- **Total: 43 pass, 0 fail (100% HIJAU)**
- **Typecheck `@cater/web`:** Exited with code 0.

---

## 5. Instruksi Operasional & Cron Job

1. **Simulasi Penutupan Otomatis (*Dry-Run*):**
   ```bash
   bun run scripts/tutup-pengaduan-otomatis.ts --dry-run
   ```
2. **Eksekusi Penutupan Otomatis Nyata (Dijadwalkan di Cron Crontab / Serverless):**
   ```bash
   bun run scripts/tutup-pengaduan-otomatis.ts
   ```
3. **Penerapan ke Produksi (Saat Rilis):**
   - Ikuti panduan ketat di [docs/pengaduan/MIGRASI.md](file:///E:/Coding/elysia/docs/pengaduan/MIGRASI.md) dengan backup `pg_dump` sebelum migrasi.
