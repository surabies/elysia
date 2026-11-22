# DOKUMEN DISCOVERY — Halaman "Capaian Pencatatan"
**Aplikasi M2C Baca Meter Tirtawening**  
*Tanggal: 23 November 2026*

---

## 1. Temuan Skema Database & Data Tersedia

### 1.1 Tabel Pencatatan & Transaksi
- **Tabel Utama:** `cater_baca_meter` di skema Drizzle `@cater/db` (`packages/db/src/schema/cater.ts`).
- **Data Aktual di Database:**
  - `thbl = '202610'` (Oktober 2026): **22.524** SL tercatat, total pemakaian **330.209** m³ (rata-rata **14,66** m³/SL).
    > **Catatan Validasi:** Angka ini **identik 100%** dengan baris Oktober 2026 pada Lampiran Data Excel referensi:
    > - Realisasi SL Okt 2026 = `22.524`
    > - Realisasi M³ Okt 2026 = `330.209`
    > - Realisasi M³/SL = `14,66`
  - `thbl = '202611'` (November 2026): **14.238** SL tercatat (sedang berjalan / belum final).
  - Periode `202511` s.d. `202609`: Belum memiliki transaksi fisik di tabel `cater_baca_meter` (aplikasi baru aktif mencatat di database sejak Oktober 2026).

### 1.2 Konsep Wilayah Pelayanan
- Seluruh 22.524 sambungan langganan aktif di dataset operasional saat ini merupakan cakupan **Wilayah Pelayanan 5** (Wilayah CATER 5 / Unit Pelayanan 5 Tirtawening).
- Rute-rute pembacaan di lapangan (seperti `BD501`, `CD101`, `KC201`, `KD101`, `TA101`, `TC101`) dinaungi dalam seksi pembacaan meter.
- **Rancangan Selektor:** Sistem mendukung pemilihan wilayah (dengan default **Wilayah Pelayanan 5**) dan tahun (dengan default **2026**).

---

## 2. Definisi SL dan M³ yang Dipilih

### 2.1 Sambungan Langganan (SL)
- **Definisi:** Jumlah rekening pembacaan meter pada periode bersangkutan yang tercatat / aktif (`count(*)::int`).
- **Alasan:** Sesuai standar operasional PDAM Tirtawening, SL pada laporan capaian adalah jumlah pelanggan yang dibacakan meterannya pada bulan penagihan berjalan.

### 2.2 Volume Pemakaian Air (M³)
- **Definisi:** Akumulasi pemakaian volume air pelanggan dalam satuan meter kubik (`sum(pakai_m3::numeric)`).
- **Alasan:** Menggunakan nilai pemakaian terverifikasi dari `cater_baca_meter.pakai_m3` untuk menghitung konsumsi riil pelanggan.

### 2.3 Sumber Data Realisasi (Otomatis vs Manual)
- **OTOMATIS (Prioritas 1):** Dihitung langsung dari agregasi transaksi `cater_baca_meter` untuk periode yang datanya sudah ada di database (`202610`, `202611`).
- **MANUAL (Prioritas 2 / Fallback):** Untuk periode historis (`Desember 2025` s.d. `September 2026`) yang belum tercatat di database lokal, data diisikan melalui snapshot tabel `capaian_realisasi_bulanan` (berstatus `sumber = 'MANUAL'`) bersumber dari arsip resmi Excel referensi, dan dapat disesuaikan oleh role manajerial/SUPERADMIN.
- **Status "Belum Final":** Bulan penagihan aktif yang siklus pembacaannya masih berjalan (`202611`) ditandai dengan badge "Belum Final".

---

## 3. Rencana Penambahan Skema Database (`packages/db`)

Skema penambahan dirancang secara **aditif murni** (tanpa drop/rename tabel atau kolom lama):

1. **`capaian_target_bulanan`**:
   - `id`: `text` (UUID) primary key
   - `wilayah`: `varchar(20)` NOT NULL (e.g. `'5'`)
   - `tahun`: `integer` NOT NULL (e.g. `2026`)
   - `bulan`: `integer` NOT NULL (1–12)
   - `target_sl`: `integer` NULLABLE
   - `target_m3`: `numeric(12, 2)` NULLABLE
   - `versi`: `integer` NOT NULL DEFAULT 1 (optimistic concurrency 409)
   - `updated_by`: `varchar(100)`
   - `updated_at`: `timestamp` NOT NULL DEFAULT now()
   - `created_at`: `timestamp` NOT NULL DEFAULT now()
   - *Index / Constraint:* `UNIQUE(wilayah, tahun, bulan)`

2. **`capaian_realisasi_bulanan`**:
   - `id`: `text` (UUID) primary key
   - `wilayah`: `varchar(20)` NOT NULL
   - `tahun`: `integer` NOT NULL
   - `bulan`: `integer` NOT NULL (1–12)
   - `sl`: `integer` NULLABLE
   - `m3`: `numeric(12, 2)` NULLABLE
   - `hari_periode`: `integer` NULLABLE
   - `sumber`: `varchar(20)` NOT NULL DEFAULT 'OTOMATIS' (`OTOMATIS` / `MANUAL`)
   - `dihitung_at`: `timestamp` NOT NULL DEFAULT now()
   - `updated_by`: `varchar(100)`
   - *Index / Constraint:* `UNIQUE(wilayah, tahun, bulan)`

3. **`capaian_pengaturan`**:
   - `id`: `text` (UUID) primary key
   - `wilayah`: `varchar(20)` NOT NULL
   - `tahun`: `integer` NOT NULL
   - `hari_acuan_lps`: `integer` NOT NULL DEFAULT 31
   - *Index / Constraint:* `UNIQUE(wilayah, tahun)`

4. **`capaian_riwayat`** (Audit Trail):
   - `id`: `text` (UUID) primary key
   - `entitas`: `varchar(50)` NOT NULL (`TARGET`, `REALISASI`, `HARI_PERIODE`, `PENGATURAN`)
   - `wilayah`: `varchar(20)` NOT NULL
   - `tahun`: `integer` NOT NULL
   - `bulan`: `integer` NULLABLE
   - `kolom`: `varchar(50)` NOT NULL
   - `nilai_lama`: `text`
   - `nilai_baru`: `text`
   - `oleh`: `varchar(100)` NOT NULL
   - `at`: `timestamp` NOT NULL DEFAULT now()

---

## 4. Lokasi File Baru yang Akan Dibuat

1. **Skema DB:** `packages/db/src/schema/capaian.ts` (diekspor di `packages/db/src/schema/index.ts`).
2. **Domain Engine (Pure Functions):** `apps/web/src/server/domain/capaian/capaian.engine.ts` dan tes unit `capaian.test.ts`.
3. **Service Layer:** `apps/web/src/server/services/cater/capaian.service.ts`.
4. **Backend Elysia Router:** `apps/web/src/server/modules/capaian/capaian.router.ts`, `capaian.schema.ts`, dan `index.ts`.
5. **Frontend UI Components:** `apps/web/src/features/dashboard/cater/capaian/`:
   - `CapaianPencatatanView.tsx` (komponen orkestrator utama)
   - `CapaianHeader.tsx` (header, selector wilayah & tahun, parameter LPS)
   - `CapaianSummaryCards.tsx` (4 kartu ringkas metrik)
   - `TabelTargetRealisasi.tsx` (Tabel 2: Target vs Realisasi dengan inline editing & bulk paste)
   - `TabelProgresBulanan.tsx` (Tabel 1: Progres Bulanan, M³/SL/hari, delta presisi penuh)
   - `CapaianChartsSection.tsx` (5 grafik visualisasi Recharts)
   - `RiwayatPerubahanSheet.tsx` (audit trail drawer)
6. **Halaman App Router:** `apps/web/src/app/(dashboard)/cater/capaian/page.tsx`.
7. **Navigasi Sidebar:** Mendaftarkan menu "Capaian Pencatatan" di `apps/web/src/config/navigasi.ts` di bawah "Monitoring Baca" (`/cater`).
