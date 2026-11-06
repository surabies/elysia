# Panduan Lengkap Setup & Seeding Database PDAM Cater

Dokumen ini adalah referensi definitif mengenai arsitektur basis data, proses seeding data awal, akun otentikasi/RBAC, dan perintah eksekusi agar tidak ada keraguan dalam pengelolaan database.

---

## 1. Arsitektur Basis Data & Persyaratan

Sistem menggunakan **PostgreSQL 16+** dengan ekstensi **PostGIS** dan di-manage menggunakan **Drizzle ORM** pada package `@cater/db` (`packages/db`).

### Konfigurasi Environment (`.env` / `.env.local`)
Pastikan variabel lingkungan berikut terdefinisi pada root folder:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/elysia_db
BETTER_AUTH_SECRET=supersecretkeyforproductionmustbelongenough123456
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Struktur Data & Integrasi Riil (Dataset CSV)

Data awal diimpor langsung dari arsip riil PDAM STI: `packages/db/data/jan/ProgresCater-PW5.csv` (22.549 baris).

### Entitas yang Dibuat Saat Seeding:
1. **Wilayah Administrasi**: 4 Wilayah, 7 Kecamatan, 21 Kelurahan.
2. **Rute Catat Meter**: 126 Rute cater (contoh: `CD104`, `KC207`, dll.).
3. **Golongan Tarif**: 13 Golongan tarif (`2A1`, `2A2`, dll.) lengkap dengan bea beban, administrasi, dan air kotor.
4. **Master Kondisi Catat Meter STI**: 22 Kode kondisi resmi PDAM (lihat tabel kondisi di bawah).
5. **Petugas Pencatat**: 9 Petugas lapangan resmi.
6. **Water Meter (Aset Fisik)**: 22.078 Unit meter air unik.
7. **Pelanggan**: 22.549 Sambungan pelanggan aktif.
8. **Catat Meter & DRD Tagihan**: 22.549 Rekod pembacaan meter dan tagihan rekening bulan berjalan.
9. **Spasial PostGIS**: Titik koordinat pelanggan dan landmark perkotaan.

> [!NOTE]
> **Mengapa tabel `water_meter` ada 22.078 sedangkan `pelanggan` ada 22.549?**
> Di tabel `water_meter`, kolom `no_meter` adalah **Primary Key (aset alat fisik unik)**.
> Pada data riil PDAM:
> - **462 pelanggan** menggunakan nomor meter bersama/kolektif (misal kode `"2018MBR"` untuk 131+ pelanggan program MBR 2018, atau 1 meter induk untuk beberapa pintu sewa).
> - **9 pelanggan** belum terpasang meter (`no_meter` bernilai NULL/strip).
> Normalisasi ini memastikan aset fisik alat meter tercatat akurat tanpa duplikasi aset, sementara seluruh 22.549 kontrak pelanggan tetap tersimpan 100% utuh.

---

## 3. Daftar Akun Pengguna & Kredensial Resmi (15 Akun)

Semua akun menggunakan password standar untuk lingkungan pengembangan:
> **Password Default**: `Password123!`

### A. 5 Akun Manajemen, Administrasi & Verifikasi

| Email | Nama | Role RBAC | Fungsi & Otoritas |
|---|---|---|---|
| `superadmin@pdam.co.id` | Super Admin PDAM | `SUPERADMIN` | Akses penuh seluruh modul & konfigurasi sistem |
| `staff.billing@pdam.co.id` | Staff Admin Billing | `STAFF_ADMIN_BILLING` | Administrasi rute, tarif, koreksi pasca-verifikasi, closing |
| `verifikator1@pdam.co.id` | Supervisor Verifikator 1 | `VERIFIKATOR_1` | Verifikasi awal (screening) pembacaan meter tingkat rute |
| `verifikator2@pdam.co.id` | Manager Verifikator 2 | `VERIFIKATOR_2` | Verifikasi lanjutan tingkat cabang / area |
| `verifikator3@pdam.co.id` | Direksi Verifikator 3 | `VERIFIKATOR_3` | Approval final pengesahan penerbitan tagihan DRD |
| `demo@example.com` | Demo Admin | Multi-Role (V1-V3, Staff, Superadmin) | Akun testing cepat untuk seluruh fitur |

### B. 9 Akun Petugas Pencatat Lapangan (Mobile / Cater)

| Email | Nama Petugas | Role RBAC | ID Petugas Lapangan |
|---|---|---|---|
| `dadang@cater.pdam.co.id` | Dadang (Pencatat) | `PENCATAT` | `DADANG` |
| `periyadi@cater.pdam.co.id` | Periyadi (Pencatat) | `PENCATAT` | `PERIYADI` |
| `omay@cater.pdam.co.id` | Omay (Pencatat) | `PENCATAT` | `OMAY` |
| `iwan@cater.pdam.co.id` | Iwan (Pencatat) | `PENCATAT` | `IWAN` |
| `agus@cater.pdam.co.id` | Agus (Pencatat) | `PENCATAT` | `AGUS` |
| `didin@cater.pdam.co.id` | Didin (Pencatat) | `PENCATAT` | `DIDIN` |
| `rudy@cater.pdam.co.id` | Rudy (Pencatat) | `PENCATAT` | `RUDY` |
| `dani@cater.pdam.co.id` | Dani (Pencatat) | `PENCATAT` | `DANI` |
| `edi@cater.pdam.co.id` | Edi (Pencatat) | `PENCATAT` | `EDI` |

---

## 4. Perintah Eksekusi (CLI Cheat Sheet)

Jalankan perintah ini dari root direktori proyek `E:\Coding\elysia`:

### 1. Eksekusi Seed Tunggal Terpadu (Direkomendasikan)
Menjalankan seluruh tahapan seed sekaligus: Akun Pengguna (15 akun) -> Tempat Geospasial -> 22 Master Kondisi -> Impor 22.549 Data CSV (jika tabel masih kosong):
```bash
bun run db:seed
```

### 2. Seeding Akun Pengguna Saja
Jika Anda hanya ingin memperbarui atau me-reset 15 akun pengguna tanpa menyentuh data pelanggan/meter:
```bash
bun run db:seed:accounts
```

### 3. Seeding 22 Master Kondisi Catat STI Saja
```bash
bun --filter "@cater/db" db:seed:kondisi
```

### 4. Eksekusi Ulang Impor Data Pelanggan & Catat Meter dari CSV
Jika ingin me-refresh seluruh 22.549 rekod dari file CSV `ProgresCater-PW5.csv`:
```bash
bun run cater:import
```

### 5. Menjalankan Migrasi Skema Basis Data
```bash
bun run db:migrate
```

### 6. Membuka Drizzle Studio (Database GUI Viewer)
```bash
bun run db:studio
```

---

## 5. Master 22 Kondisi Catat Meter STI (Standar Resmi)

| Kode TMSS | Keterangan Kondisi | Kategori Anomali / Aksi Sistem |
|---|---|---|
| `01` / `NORMAL` | Normal | Standar terbaca wajar |
| `02` / `DK` | Pagar Dikunci | Taksasi rata-rata pemakaian bulan lalu |
| `03` / `RK` | Rumah Kosong | Taksasi minimum 5 m³ |
| `04` / `MT` | Meter Tertimbun | Perlu resurvey / tindakan teknis |
| `05` / `MB` | Meter Buram / Rusak | Jadwalkan Ganti Water Meter (GWM) |
| `06` / `KM` | Kran Rusak / Los | Peringatan kebocoran persil |
| `07` / `MA` | Meter Hilang / Angkat | Verifikasi pemakaian fisik |
| `08` / `TA` | Tidak Ada Air | Validasi kontinuitas aliran jaringan |
| `09` / `SM` | Stand Minus (Rollover / Mundur) | Deteksi rollover 9999->0001 atau indikasi balik meter |
| `10` / `SK` | Segel Rusak / Lepas | Audit fisik oleh pengawas |
| `11` / `TU` | Meter Terbalik | Perintah balik posisi instalasi |
| `12` / `LS` | Langsung Tanpa Meter | Pelanggaran / sambungan liar |
| `13` | Meter Mati Ada Aliran Air | Taksasi metode 3-Tertinggi |
| `14` s/d `22` | Kondisi Khusus Wilayah / Non-Aktif | Evaluasi administrasi penagihan |

---

## 6. Kueri Verifikasi Data (Cek Cepat di DB)

Untuk memastikan seluruh data telah masuk dengan benar, jalankan kueri SQL berikut:

```sql
-- Cek jumlah pelanggan dan unit meter air
SELECT 
  (SELECT COUNT(*) FROM pelanggan) AS total_pelanggan,
  (SELECT COUNT(*) FROM water_meter) AS total_unit_meter,
  (SELECT COUNT(*) FROM cater_baca_meter) AS total_pembacaan_meter,
  (SELECT COUNT(*) FROM drd_billing) AS total_tagihan_drd,
  (SELECT COUNT(*) FROM "user") AS total_akun_pengguna,
  (SELECT COUNT(*) FROM master_kondisi_catat) AS total_master_kondisi;

-- Cek akun dan role yang aktif
SELECT u.name, u.email, ur.role 
FROM "user" u 
JOIN user_roles ur ON u.id = ur.user_id 
ORDER BY ur.role, u.name;
```

Hasil yang diharapkan:
- `total_pelanggan`: **22.549**
- `total_unit_meter`: **22.078**
- `total_pembacaan_meter`: **22.549**
- `total_tagihan_drd`: **22.549**
- `total_master_kondisi`: **22** (atau 23 termasuk varian)
- `total_akun_pengguna`: **15**
