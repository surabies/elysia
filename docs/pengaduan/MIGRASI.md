# Panduan Migrasi Database Modul Pengaduan

Dokumen ini mendokumentasikan rincian perubahan skema database PostgreSQL (Drizzle ORM), dampaknya terhadap data historis, langkah verifikasi di lingkungan Development, prosedur rilis ke lingkungan Produksi, serta instruksi *rollback* manual darurat.

---

## 1. Daftar Migrasi Database

| File Migrasi | Sifat Perubahan | Komponen Database | Tujuan Perubahan |
| :--- | :---: | :--- | :--- |
| `packages/db/src/migrations/0020_cloudy_frog_thor.sql` | **Aditif (Non-Destruktif)** | Tabel Baru: `pengaduan_nomor_urut`<br>Kolom Baru: `riwayat_pengaduan.petugas_tujuan_id` | Menjamin penomoran tiket unik bebas *race condition* (B4) dan mencatat target penerima penugasan/eskalasi (B10) |

### Rincian Skrip SQL Migrasi

```sql
-- 1. Tabel counter nomor urut atomik per prefix tanggal & wilayah (B4)
CREATE TABLE IF NOT EXISTS "pengaduan_nomor_urut" (
	"prefix" varchar(30) PRIMARY KEY NOT NULL,
	"last_urut" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Kolom petugas tujuan pada riwayat linimasa pengaduan (B10)
ALTER TABLE "riwayat_pengaduan" ADD COLUMN IF NOT EXISTS "petugas_tujuan_id" text;

-- 3. Foreign key relasi petugas tujuan ke tabel user
DO $$ BEGIN
    ALTER TABLE "riwayat_pengaduan" 
    ADD CONSTRAINT "riwayat_pengaduan_petugas_tujuan_id_user_id_fk" 
    FOREIGN KEY ("petugas_tujuan_id") 
    REFERENCES "public"."user"("id") 
    ON DELETE SET NULL 
    ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

---

## 2. Dampak terhadap Data Historis

1. **Tabel `pengaduan`**: Tidak ada kolom yang diubah atau dihapus. Nomor tiket historis tetap utuh.
2. **Tabel `pengaduan_nomor_urut`**:
   - Merupakan tabel baru.
   - Saat pertama kali tiket baru dibuat pada hari berjalan, query atomik akan secara otomatis mengambil nilai maksimum nomor urut yang sudah ada di tabel `pengaduan` sebagai seed awal (`COALESCE(MAX(...), 0)`), sehingga urutan nomor tiket tidak pernah terulang atau melompat.
3. **Kolom `petugas_tujuan_id` di `riwayat_pengaduan`**:
   - Semua baris riwayat lama secara alami akan bernilai `NULL`.
   - Kode aplikasi pada `getDetailPengaduanFull` secara eksplisit menangani nilai `NULL` dengan mengembalikan `eskalasiKe: null` (tidak menampilkan supervisor palsu).

---

## 3. Status Eksekusi Lingkungan

- **Lingkungan Dev / Branch (`ep-bitter-wildflower-azaxnlz0`)**:
  - **STATUS**: **SUDAH DITERAPKAN & TERVERIFIKASI**
  - Diverifikasi dengan 52 tes integrasi berjalan mulus (termasuk tes pembuatan 20 tiket konkuren paralel pada satu milidetik).
- **Lingkungan Produksi (`ep-still-sun-azg726ne`)**:
  - **STATUS**: **BELUM DITERAPKAN (WAJIB PERSETUJUAN RILIS)**
  - Mengikuti aturan ketat keamanan data: database produksi tidak boleh disentuh selama fase perbaikan kode.

---

## 4. Prosedur Rilis ke Lingkungan Produksi

### Langkah 1: Cadangkan Database Produksi (Backup Wajib)
Sebelum menjalankan perintah migrasi apa pun pada database produksi, buat salinan cadangan lengkap menggunakan `pg_dump`:

```bash
# 1. Export backup snapshot lengkap sebelum rilis
pg_dump "postgres://<user>:<password>@ep-still-sun-azg726ne.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
  --format=custom \
  --file=backup_tirtawening_pre_fase2_$(date +%Y%m%d_%H%M%S).dump

# 2. Verifikasi ukuran file backup
ls -lh backup_tirtawening_pre_fase2_*.dump
```

### Langkah 2: Eksekusi Migrasi Drizzle
Pastikan file konfigurasi `.env` telah mengarah ke database produksi, lalu jalankan:

```bash
bun run db:migrate
```

### Langkah 3: Verifikasi Pasca Rilis
Periksa bahwa tabel dan kolom baru telah terbentuk dengan benar di PostgreSQL:

```sql
-- Cek keberadaan tabel pengaduan_nomor_urut
SELECT table_name FROM information_schema.tables WHERE table_name = 'pengaduan_nomor_urut';

-- Cek kolom petugas_tujuan_id pada riwayat_pengaduan
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'riwayat_pengaduan' AND column_name = 'petugas_tujuan_id';
```

---

## 5. Prosedur Rollback Manual Darurat

Jika tim operasional memutuskan untuk membatalkan perubahan skema database ini, jalankan skrip SQL berikut di database target:

```sql
-- 1. Hapus foreign key constraint
ALTER TABLE "riwayat_pengaduan" DROP CONSTRAINT IF EXISTS "riwayat_pengaduan_petugas_tujuan_id_user_id_fk";

-- 2. Hapus kolom petugas_tujuan_id
ALTER TABLE "riwayat_pengaduan" DROP COLUMN IF EXISTS "petugas_tujuan_id";

-- 3. Hapus tabel counter pengaduan_nomor_urut
DROP TABLE IF EXISTS "pengaduan_nomor_urut";

-- 4. Hapus catatan entry migrasi 0020 dari meta journal Drizzle (opsional jika menggunakan drizzle-orm)
DELETE FROM "__drizzle_migrations" WHERE "tag" = '0020_cloudy_frog_thor';
```
Semua data tiket dan riwayat utama tetap aman dan tidak mengalami kerusakan selama maupun setelah proses rollback.
