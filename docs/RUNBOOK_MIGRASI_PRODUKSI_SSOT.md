# Runbook Eksekusi Migrasi Produksi: SSOT Aturan Anomali & Deviasi

Dokumen ini adalah panduan operasional langkah-demi-langkah untuk mengeksekusi migrasi skema dan backfill data ke **Database Produksi Utama** secara aman, terkontrol, dan dapat dipulihkan sewaktu-waktu.

> [!CAUTION]
> **JANGAN JALANKAN DOKUMEN INI SEBELUM MENDAPAT PERSETUJUAN RESMI USER.**
> Eksekusi ke database utama membutuhkan bendera lingkungan eksplisit `ALLOW_PRODUCTION_RUN=true` dan konfirmasi parameter `--confirm=ep-still-sun-azg726ne`.

---

## 1. Titik Pemulihan Neon (PITR Snapshot)

Sebelum melakukan perubahan apa pun pada database produksi, buat branch cadangan atau catat LSN/timestamp titik pemulihan (*restore point*) di Neon.

### Menggunakan Neon CLI (`neonctl`)
> [!IMPORTANT]
> Gunakan **Project ID** dan **Branch Name / ID nyata** yang diperoleh langsung dari perintah `neonctl branches list`. Jangan pernah menggunakan ID endpoint (`ep-...`) atau berasumsi menggunakan `br-main` bila branch produksi memiliki nama atau ID berbeda (misalnya `main` atau `br-quiet-water-...`).

```bash
# 1. Pastikan terotentikasi ke akun Neon
npx neonctl auth

# 2. Dapatkan Project ID produksi
npx neonctl projects list

# 3. Dapatkan daftar cabang nyata dan temukan nama/ID branch produksi utama
npx neonctl branches list --project-id <project_id>
# Perhatikan kolom "id" (contoh: br-silent-sun-...) dan "name" (contoh: main)

# 4. Buat snapshot branch cadangan instan menggunakan ID/Nama cabang parent nyata
npx neonctl branches create \
  --project-id <project_id> \
  --name backup-pre-ssot-$(date +%Y%m%d%H%M%S) \
  --parent <nama_atau_id_branch_utama_dari_langkah_3>
```

### Menggunakan Neon Web Console
1. Buka console Neon: https://console.neon.tech
2. Pilih project produksi (`<project_name>`).
3. Masuk ke menu **Branches** -> klik **New Branch**.
4. Beri nama: `backup-pre-ssot-0019`, pilih parent branch: branch utama yang aktif (misal `main`).
5. Klik **Create Branch**. Cabang ini menyimpan 100% kondisi data tepat sebelum migrasi (*Zero Data Loss*).

---

## 2. Urutan Deployment & Perilaku Transisi (Zero Downtime)

Migrasi 0019 dirancang dengan prinsip **Additive Backward-Compatible**:
1. Penambahan tabel baru (`aturan_anomali`, `aturan_anomali_versi`, dll.) tidak memengaruhi tabel transaksi lama.
2. Penambahan kolom pada `cater_baca_meter` (`is_anomali`, `kode_anomali_utama`, `kode_anomali_list`, `aturan_versi`) bersifat *nullable* dengan nilai default (`false`, `NULL`, `[]`).
3. Kode lama yang belum membaca kolom baru tetap dapat melakukan `SELECT`, `INSERT`, dan `UPDATE` tanpa error sama sekali.

### Urutan Eksekusi yang Wajib Diikuti:
1. **Langkah 1: Migrasi Skema DB (0019)**
   Menambahkan tabel-tabel master aturan dan kolom-kolom klasifikasi baru di `cater_baca_meter`.
2. **Langkah 2: Seed Master Aturan SSOT v1**
   Mengisi 12 master aturan dasar dan pemetaan TMSS serta menerbitkan versi 1 (`aturan_anomali_versi = 1`).
3. **Langkah 3: Backfill Data Massal**
   Menjalankan skrip batch UPDATE untuk mengklasifikasi 36.762 baris historis yang belum terisi.
4. **Langkah 4: Deploy Kode Aplikasi Baru (Next.js & API Elysia)**
   Deploy aplikasi versi baru ke server produksi sehingga seluruh penulisan data baru (catat mobile, import, koreksi verifikasi) mulai diarahkan menggunakan SSOT Evaluator.
5. **Langkah 5: Backfill Ulang (Catch-up: Hanya `aturan_versi IS NULL`)**
   Menjalankan ulang backfill dengan mode `--catchup` untuk menyapu secara cepat transaksi yang sempat tertulis oleh kode lama selama jendela deploy, **tanpa menulis ulang baris periode closing/terkunci**.
6. **Langkah 6: Pemeriksaan Integritas Data**
   Menjalankan audit nol pelanggaran, memastikan konsistensi total baris dan memverifikasi `aturan_versi IS NULL = 0`.

---

## 3. Langkah-Langkah Eksekusi di Terminal Produksi

Pastikan Anda berada di direktori root project `E:\Coding\elysia`.

### Tahap 0: Uji Simulasi (Dry-Run Tanpa Menulis)
```bash
# Jalankan simulasi kalkulasi terhadap database target (read-only)
bun run packages/db/src/scripts/backfill-anomali-massal.ts --dry-run
```
*Pastikan output melaporkan total baris dan statistik estimasi anomali/peringatan/normal tanpa error.*

### Langkah 1: Eksekusi Migrasi Skema (0019)
```bash
bun run packages/db/src/migrate.ts
```
*Verifikasi output: `Migrations applied successfully!`*

### Langkah 2: Eksekusi Seeder Aturan SSOT v1
```bash
bun run packages/db/src/scripts/seed-aturan-only.ts
```
*Verifikasi output: `Master Aturan Anomali SSOT v1 seeded successfully. (12 aturan, MAX(versi) = 1)`*

### Langkah 3: Eksekusi Backfill Massal
```bash
# Wajib menyertakan ALLOW_PRODUCTION_RUN dan parameter konfirmasi nama endpoint
ALLOW_PRODUCTION_RUN=true bun run packages/db/src/scripts/backfill-anomali-massal.ts --confirm=ep-still-sun-azg726ne
```
*Perhatikan progres batch 2.000 baris hingga selesai 100% (durasi: ~4-5 detik).*

### Langkah 4: Deploy Kode Aplikasi Baru
Lakukan proses build dan deploy container/proses aplikasi Next.js & Elysia ke server produksi:
```bash
# Contoh build & restart service
bun run build
pm2 reload all # atau perintah deployment orchestrator produksi yang digunakan
```

### Langkah 5: Backfill Ulang (Catch-up: Hanya `aturan_versi IS NULL`)
```bash
# Menyapu HANYA baris yang belum terklasifikasi (aturan_versi IS NULL) dan mengabaikan periode terkunci
ALLOW_PRODUCTION_RUN=true bun run packages/db/src/scripts/backfill-anomali-massal.ts --catchup --confirm=ep-still-sun-azg726ne
```
*Memastikan seluruh transaksi transisi terklasifikasi sempurna tanpa risiko mengubah data billing yang sudah closing.*

### Langkah 6: Pemeriksaan Integritas Data (Post-Execution Check)
```bash
bun run packages/db/src/scripts/verify-integrity.ts
```
*Kriteria Sukses Mutlak:*
- `is_anomali=true dengan kode kosong/WARN_%` : **0 pelanggaran**
- `kode ANOM_% tapi is_anomali=false`        : **0 pelanggaran**
- `aturan_versi IS NULL`                     : **0 pelanggaran**
- Konsistensi Total per Periode              : **100% Cocok (Anomali + Peringatan + Normal = Total Baris)**

---

## 4. Prosedur Rollback Cepat (Emergency Plan)

Jika terjadi kendala kritis pada sistem produksi:

1. **Rollback Aplikasi:**
   Kembalikan kode server aplikasi ke build versi sebelumnya.
2. **Rollback Skema & Data Database:**
   Gunakan cabang snapshot Neon yang dibuat pada Bagian 1:
   ```bash
   # Di Neon Web Console atau via CLI, arahkan endpoint produksi ke branch snapshot cadangan
   npx neonctl endpoints update ep-still-sun-azg726ne --branch-id <backup_branch_id>
   ```
   *Atau jalankan skrip migrasi turun:*
   ```bash
   bun run packages/db/src/scripts/rollback-0019.ts
   ```
