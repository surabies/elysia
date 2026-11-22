# Panduan Migrasi & Skema Database Capaian Pencatatan

Dokumen ini menjelaskan struktur 4 tabel aditif pada skema PostgreSQL `@cater/db` untuk modul **Capaian Pencatatan**.

---

## 1. Definisi Tabel

### 1.1 `capaian_target_bulanan`
Menyimpan target jumlah sambungan langganan (SL) dan volume kubikasi ($M^3$) per wilayah dan periode bulan/tahun.
- `id` (VARCHAR(50), PRIMARY KEY): Kombinasi `${wilayah_id}-${tahun}-${bulan}`.
- `wilayah_id` (VARCHAR(20), NOT NULL): Kode wilayah pelayanan (contoh `'5'`).
- `tahun` (INTEGER, NOT NULL): Periode tahun (contoh `2026`).
- `bulan` (INTEGER, NOT NULL): Bulan 1 s.d. 12.
- `target_sl` (INTEGER, NOT NULL, DEFAULT 0): Target jumlah SL aktif.
- `target_m3` (NUMERIC(14, 2), NOT NULL, DEFAULT 0): Target volume kubikasi air.
- `versi` (INTEGER, NOT NULL, DEFAULT 1): Nomor versi untuk optimistic locking (mencegah overwrite konkurensi).
- `catatan` (TEXT, NULL): Catatan revisi manajerial.
- `diubah_oleh` (VARCHAR(100), NOT NULL, DEFAULT 'SYSTEM'): User yang melakukan perubahan.
- `created_at`, `updated_at` (TIMESTAMP, NOT NULL, DEFAULT NOW()).
- **Unique Constraint**: `(wilayah_id, tahun, bulan)`.

### 1.2 `capaian_realisasi_bulanan`
Menyimpan realisasi SL dan $M^3$ bulanan.
- `id` (VARCHAR(50), PRIMARY KEY): Kombinasi `${wilayah_id}-${tahun}-${bulan}`.
- `bulan` = `0`: Menyimpan snapshot baseline **Desember Tahun Lalu** yang menjadi acuan awal perhitungan pergerakan delta Januari.
- `bulan` = `1..12`: Menyimpan realisasi bulan berjalan.
- `sumber` (VARCHAR(20), NOT NULL, DEFAULT 'OTOMATIS'): `'OTOMATIS'` (diagregasikan langsung dari transaksi lapangan `cater_baca_meter`) atau `'MANUAL'` (input historis/override).
- `dikunci` (BOOLEAN, NOT NULL, DEFAULT FALSE): Jika true, proses sinkronisasi otomatis tidak akan menimpa baris ini.
- `versi` (INTEGER, NOT NULL, DEFAULT 1).
- **Unique Constraint**: `(wilayah_id, tahun, bulan)`.

### 1.3 `capaian_pengaturan`
Menyimpan konfigurasi parameter dinamis per wilayah dan tahun.
- `id` (VARCHAR(50), PRIMARY KEY): `${wilayah_id}-${tahun}`.
- `hari_acuan_lps` (INTEGER, NOT NULL, DEFAULT 30): Parameter hari acuan untuk perhitungan debit LPS.
- **Unique Constraint**: `(wilayah_id, tahun)`.

### 1.4 `capaian_riwayat`
Audit log setiap aksi mutasi data target atau realisasi.
- `id` (VARCHAR(50), PRIMARY KEY): UUID string.
- `aksi` (VARCHAR(50), NOT NULL): `'UPDATE_TARGET'`, `'BULK_UPDATE_TARGET'`, `'UPDATE_REALISASI'`, `'SYNC_OTOMATIS'`.
- `data_sebelum` (JSONB, NULL): Snapshot sebelum diubah.
- `data_sesudah` (JSONB, NULL): Snapshot setelah diubah.
- `diubah_oleh` (VARCHAR(100), NOT NULL): Akun pengguna / operator.
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT NOW()).

---

## 2. Optimistic Locking & Pencegahan Konflik Konkurensi

Saat operator melakukan perubahan target melalui inline editing pada Tabel 2:
1. Frontend mengirim payload beserta parameter `versi` saat ini.
2. Backend memverifikasi `existing.versi === input.versi`.
3. Jika berbeda, backend mengembalikan status HTTP `409 Conflict` dengan pesan informatif agar frontend melakukan sinkronisasi ulang.
4. Jika cocok, backend menambah `versi = versi + 1` dan mencatat snapshot ke `capaian_riwayat`.
