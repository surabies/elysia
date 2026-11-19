# Panduan Database: Clean, Seed & Import Data

Dokumen panduan ringkas pengelolaan basis data **PDAM Cater (Tirtawening)**: mulai dari pembersihan, seeding master data awal, hingga import laporan pembacaan meter bulanan secara dinamis.

---

## 1. Ringkasan Arsitektur & Dataset

Sistem menggunakan **PostgreSQL 16+ (Neon Database)** dengan ekstensi geospasial **PostGIS** dan di-manage menggunakan **Drizzle ORM** (`packages/db`).

### Sumber Dataset Resmi (`packages/db/data/raw/`):
- **`ProgresCater-PW5.csv`** (85 kolom) : Sumber master pelanggan (22.524 data), nomor meter air fisik, golongan tarif, kecamatan/kelurahan, dan rute cater.
- **`PBPK.csv`** : Master pasang baru & sambungan kembali untuk DPM.
- **`Data_verifikasi.geojson`** : Hasil survei presisi tinggi mWater (koordinat GPS akurat 924 pelanggan).
- **`Area_layanan.geojson`** : Batas poligonal 21 kelurahan resmi Wilayah Pelayanan 5.
- **`lapdatametertes.csv`** : Laporan data hasil pembacaan meter bulanan (Januari). **Diimpor secara dinamis melalui Frontend**, bukan di seed awal.

---

## 2. Perintah CLI (Cheat Sheet)

Jalankan perintah ini dari terminal di folder utama proyek:

| Perintah | Fungsi | Keterangan |
|---|---|---|
| `bun run db:clean` | **Membersihkan Data** | Mengosongkan data transaksi, master pelanggan, dan aset meter. **Akun pengguna tetap aman**. |
| `bun run db:clean --all` | **Reset Total** | Mengosongkan seluruh tabel termasuk akun pengguna dan session auth. |
| `bun run db:migrate` | **Migrasi Skema** | Menerapkan seluruh file migrasi SQL Drizzle ke database. |
| `bun run db:seed` | **Seeding Master Data** | Mengisi 15 akun resmi, 23 master kondisi STI, 22.524 master pelanggan, aset meter, dan area layanan (`masterOnly`). |
| `bun run db:seed:accounts` | **Seed Akun Saja** | Memperbarui atau me-reset password 15 akun resmi tanpa mengubah data pelanggan. |
| `bun run db:studio` | **Buka GUI Database** | Membuka Drizzle Studio di browser untuk melihat isi tabel langsung. |

---

## 3. Alur Pengelolaan Data (Best Practice)

```
[1. Bersihkan Data] ──> [2. Seeding Master Data] ──> [3. Import Bulanan Dinamis]
  bun run db:clean           bun run db:seed             Menu Tools > Import Data
(Hapus data salah)     (Isi master pelanggan & aset)   (Upload lapdatameter CSV)
```

### Langkah A: Reset & Seeding Ulang
Jika ingin mereset dan mengulang data dari awal secara bersih:
```bash
# 1. Bersihkan data lama
bun run db:clean

# 2. Isi master data pelanggan & wilayah (transaksi catat meter dibiarkan bersih)
bun run db:seed
```

### Langkah B: Import Laporan Catat Meter Bulanan via Web UI
Data pembacaan meter bulanan (`lapdatameter`) tidak perlu di-seed di awal. Anda dapat mengimpornya kapan saja sesuai periode bulan berjalan:
1. Buka browser dan login ke dashboard (misal: `http://localhost:3000`).
2. Masuk ke menu sidebar **Tools > Import Data** (`/tools/import-data`).
3. Pilih / unggah berkas CSV laporan bulanan (misal `lapdatametertes.csv`).
4. Sistem otomatis memetakan nomor pelanggan (`nolg`), periode (`thbl`), stand awal (`stml`), stand akhir (`stma`), kubikasi pakai, dan petugas pencatat ke tabel `cater_baca_meter`.

---

## 4. Daftar Akun Pengguna Resmi (15 Akun)

Password default ditentukan oleh variabel lingkungan `SEED_DEFAULT_PASSWORD` (min. 12 karakter):

### A. Manajemen & Operasional Kantor
| Email | Nama Akun | Role RBAC | Fungsi Utama |
|---|---|---|---|
| `wiska.prayoga@gmail.com` | Super Admin PDAM | `SUPERADMIN` | Administrator penuh seluruh modul sistem |
| `staff.billing@pdam.co.id` | Staff Admin Billing | `STAFF_ADMIN_BILLING` | Penagihan, tarif, administrasi rute, closing |
| `verifikator1@pdam.co.id` | Supervisor Verifikator 1 | `VERIFIKATOR_1` | Verifikasi awal screening baca meter rute |
| `verifikator2@pdam.co.id` | Manager Verifikator 2 | `VERIFIKATOR_2` | Verifikasi lanjutan tingkat wilayah |
| `verifikator3@pdam.co.id` | Direksi Verifikator 3 | `VERIFIKATOR_3` | Otorisasi final penerbitan rekening DRD |
| `demo@example.com` | Demo User | Multi-Role | Akun testing seluruh hak akses |

### B. Petugas Pencatat Lapangan (Mobile Cater)
| Email | Petugas | ID Lapangan | Role |
|---|---|---|---|
| `dadang@cater.pdam.co.id` | Dadang | `DADANG` | `PENCATAT` |
| `periyadi@cater.pdam.co.id` | Periyadi | `PERIYADI` | `PENCATAT` |
| `omay@cater.pdam.co.id` | Omay | `OMAY` | `PENCATAT` |
| `iwan@cater.pdam.co.id` | Iwan | `IWAN` | `PENCATAT` |
| `agus@cater.pdam.co.id` | Agus | `AGUS` | `PENCATAT` |
| `didin@cater.pdam.co.id` | Didin | `DIDIN` | `PENCATAT` |
| `rudy@cater.pdam.co.id` | Rudy | `RUDY` | `PENCATAT` |
| `dani@cater.pdam.co.id` | Dani | `DANI` | `PENCATAT` |
| `edi@cater.pdam.co.id` | Edi | `EDI` | `PENCATAT` |

---

## 5. Kueri Verifikasi Database (Cek Cepat)

Jalankan kueri SQL ini untuk memverifikasi integritas data:

```sql
SELECT 
  (SELECT COUNT(*) FROM pelanggan) AS total_pelanggan,         -- Target: 22.524
  (SELECT COUNT(*) FROM water_meter) AS total_unit_meter,       -- Target: 22.051
  (SELECT COUNT(*) FROM area_layanan) AS total_kelurahan,       -- Target: 21
  (SELECT COUNT(*) FROM master_kondisi_catat) AS total_kondisi, -- Target: 23
  (SELECT COUNT(*) FROM "user") AS total_akun_pengguna,         -- Target: 15
  (SELECT COUNT(*) FROM cater_baca_meter) AS total_transaksi;   -- Target: 0 (Bersih, siap import bulanan)
```
