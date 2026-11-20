# Runbook: Seed Data Awal Produksi & Prosedur Go-Live

Dokumen ini menjelaskan arsitektur data pembuka (`ProgresCater-PW5.csv`), pemisahan seed data dan seed akun, prosedur seed idempoten, pengaman (security guard) database, dan langkah-langkah verifikasi sebelum aplikasi baca meter masuk ke produksi (Go-Live).

---

## 1. Arsitektur 3 Lapisan Data & Opening State

1. **Lapisan Referensi**:
   - `wilayah_administrasi` (4 wilayah), `kecamatan` (7 kecamatan), `kelurahan` (21 kelurahan), `zona_distribusi` (21 zona).
   - `golongan_tarif` (13 golongan tarif), `tarif_blok` (52 blok progresif dengan masa berlaku `berlaku_mulai` & `berlaku_sampai`), `biaya_tetap` (9 baris referensi `BEA_BEBAN` per ukuran meter `1/2"` s/d `4"`, `BEA_ADMIN`, dan `AIR_KOTOR`).
   - **Catatan Penting Tarif**: Angka `harga_per_m3` pada `tarif_blok` dan `nominal` pada `biaya_tetap` diekstrak secara matematis dari rekonsiliasi data produksi Oktober (`22.523` dari `22.524` baris cocok 100%, kecuali 1 pelanggan kesepakatan tarif khusus `00008001503`). **Wajib dicocokkan dengan SK Tarif Direksi resmi** apabila ada penyesuaian tarif.
   - `master_kondisi_catat` (25 kode kondisi STI resmi termasuk `'0' - REV.PENGADUAN` dan `'K' - STAN CICILAN`).
2. **Lapisan Master**:
   - `petugas_cater` (9 petugas lapangan).
   - `rute_cater` (125 rute pencatatan).
   - `water_meter` (`21.838` aset meter dengan nomor seri unik dan valid).
   - `pelanggan` (`22.524` pelanggan; `686` pelanggan yang di CSV memiliki nomor meter kosong/placeholder/duplikat diset `no_meter = NULL` dan disimpan nomor aslinya di `no_meter_asli` serta ukuran meternya di `ukuran_meter`).
   - `no_urut_rute` diinisialisasi `1..N` per `rute_kode` berdasarkan `nprs ASC, nolg ASC` dan **tidak akan tertimpa** oleh seed ulang apabila sudah diubah lewat aplikasi (`no_urut_rute > 0`).
3. **Lapisan Transaksi Periode (Opening State = Hasil Closing Sah)**:
   - **Periode Closed (`N`, dibaca dinamis dari kolom `thbl` CSV = `202610`)**:
     - `periode_penagihan('202610')`: `status = 'TERKUNCI'`, `jumlah_sl = 22.524`, `total_m3 = 330.209,00`, `total_tagihan = 2.983.083.540,00`.
     - `daftar_catat('202610')`: `22.524` baris (`22.495` `DICATAT`, `29` `DICABUT`).
     - `cater_baca_meter('202610')`: `22.524` baris dengan `status_verifikasi = 'LOCKED_BILLING'`.
     - `rekening_drd('202610')`: `22.524` baris tagihan historis. Saat proses closing periode berikutnya, sistem menyimpan snapshot `rincian_blok` (JSONB m³ dan tarif per blok) serta `bea_beban`, `bea_admin`, `air_kotor`, dan `lain_lain` ke `rekening_drd` agar periode yang sudah closed tidak pernah berubah meskipun tarif diubah di kemudian hari.
   - **Periode Open (`N+1 = nextPeriode(N)` = `202611`)**:
     - Dibuka otomatis oleh seed menggunakan fungsi `carryForwardPeriode` di `packages/db/src/carry-forward.ts` (fungsi yang **persis sama** dengan yang dipanggil `BulanBaruService.bukaBulanBaru` saat aplikasi berjalan).
     - `periode_penagihan('202611')`: `status = 'BERJALAN'`, `jumlah_sl = 22.495`, `total_m3 = NULL`, `total_tagihan = NULL`.
     - `daftar_catat('202611')`: `22.495` baris (`status = 'BELUM_DICATAT'`, `stand_awal(202611) = stma(202610)`, `pakai_lalu(202611) = pakai_tagih(202610)`, serta `akumulasi_taksasi_m3(202611)` yang terisi otomatis bagi `8.733` pelanggan yang pada periode closed mengalami taksasi `stma == stml, pakai > 0`).

---

## 1B. Aturan Taksasi (`mode_hitung`, `pemakaian_minimum_m3`) & Rekonsiliasi `akumulasi_taksasi_m3`

1. **`master_kondisi_catat.mode_hitung`**:
   - `'NOL'` (`TIDAK ADA AIR`, `DICABUT`): `stma = stml`, `pakai_tagih = 0 m³`.
   - `'TAKSASI_HISTORI'` (`DK`, `RUMAH KOSONG`, `TIDAK DIPAKAI`, `MTA`, `TTB`, `METER RUSAK`, `TERHALANG`, `BMK/BMB`, `MATI ADA AIR`, `ADA ANJING`, dll.): `stma = stml`, `pakai_tagih = Math.max(pakai_lalu, pemakaian_minimum_m3)`.
   - `'SELISIH_FISIK'` (`Normal`, `STAND TEMPEL`, `REV.PENCATAT`, dll.): `selisih_fisik = stma - stml`.
2. **`golongan_tarif.pemakaian_minimum_m3`**:
   - Default skema adalah `'0'` (nonaktif untuk perusahaan air yang tidak menerapkan minimum); pada seed Tirtawening diisi `'5.00'` (sesuai bukti 96,1% data).
3. **Rekonsiliasi Kumulatif `daftar_catat.akumulasi_taksasi_m3` & Urutan Penerapan Minimum vs Kredit Taksasi**:
   - Satu mekanisme tunggal: `akumulasi_taksasi_m3` di `daftar_catat` (`stml` selalu angka meter asli).
   - Setiap kali pelanggan ditaksir (`stma == stml` dan `pakai_tagih > 0`), nilai `pakai_tagih` ditambahkan secara **kumulatif** ke `akumulasi_taksasi_m3` bulan berikutnya.
   - Saat bulan berikutnya meter terbaca fisik (`mode_hitung = 'SELISIH_FISIK'` dan `akumulasi_taksasi_m3 > 0`):
     - `netto = (stma - stml) - akumulasi_taksasi_m3`.
     - Jika `netto < 0` (kredit taksasi > selisih fisik): bacaan ditandai **`ANOMALY`** untuk koreksi manual (tidak dipotong otomatis).
     - Jika `netto >= 0`: `pakai_tagih = netto` (**tanpa** dikenakan minimum 5 m³ lagi atas `netto`, agar invarian **total yang ditagih sepanjang rentang == pemakaian fisik riil** terjaga 100%, mis. taksasi `5` + bacaan fisik `7` → ditagih `2`, total `5 + 2 = 7 m³`), lalu `akumulasi_taksasi_m3` di-reset ke `0` pada periode berikutnya.
4. **Jalur Go-Live Opsi A (Go-Live Desember dari `progrescater` Hasil Closing November)**:
   - ETL `importProgresCater` membaca periode langsung dari kolom `thbl` CSV. Saat file `progrescater` hasil closing November (`thbl = 202611`) dimasukkan, ETL otomatis mengunci `202611` (`TERKUNCI`), membuka `202612` (`BERJALAN`), dan menurunkan `akumulasi_taksasi_m3` ke `daftar_catat('202612')` tanpa perubahan kode.
   - Untuk menjalankan simulasi uji data lapangan berjalan (`lapdatameter`) di dalam transaksi rollback (tanpa menyentuh data utama):
     ```powershell
     bun packages/db/src/etl/simulate-lapdatameter.ts --csv=packages/db/data/raw/lapdatametertes.csv
     ```

---

## 2. Pengaman (Security Guards) Database & Pemisahan Seed Akun

1. **Guard `clean.ts` (`bun run db:clean`)**:
   - **Allowlist Nama Database Eksplisit**: Wajib menyetel variabel lingkungan `ALLOW_RESET_DB=<nama_database_target>` yang sama persis dengan `SELECT current_database()`. Tanpa `ALLOW_RESET_DB` yang cocok, `clean.ts` langsung berhenti dengan error.
   - **Blokir Periode Open Aktif**: Menolak melakukan reset apabila periode yang sedang `BERJALAN` sudah memiliki data pembacaan di `cater_baca_meter` (kecuali `FORCE_CLEAN_OPEN_READINGS=true`).
   - **Blokir `NODE_ENV=production`**: Menolak dijalankan di environment produksi kecuali `ALLOW_PRODUCTION_DB_RESET=true`.
2. **Guard `seed.ts` (`bun run db:seed`)**:
   - **Allowlist Database**: Memeriksa `current_database()` terhadap `ALLOW_SEED_DB`.
   - **Blokir Periode Open Aktif**: Menolak dijalankan apabila periode `BERJALAN` sudah memiliki pembacaan di `cater_baca_meter`.
   - **Dipisahkan dari Seed Akun**: `bun run db:seed` hanya menjalankan seed data referensi, master, dan transaksi pembuka.
3. **Prosedur Pembuatan Akun Pengguna (`bun run db:seed:accounts`)**:
   - Akun `demo@example.com` telah dihapus secara permanen.
   - Saat `NODE_ENV=production`, `seed-accounts.ts` menolak menggunakan password fallback default (`FALLBACK_SEED_PASSWORD`) dan mewajibkan `SEED_DEFAULT_PASSWORD` yang kuat (minimal 12 karakter).
   - **14 Akun Resmi yang Disediakan**:
     - `wiska.prayoga@gmail.com`: `SUPERADMIN` (memiliki akses penuh seluruh ring verifikasi & administrasi).
     - `staff.billing@pdam.co.id`: `STAFF_ADMIN_BILLING` (pengelolaan DRD, koreksi stand, & administrasi billing).
     - `verifikator1@pdam.co.id`: `VERIFIKATOR_1` (Supervisor — screening anomali Ring 1 & persetujuan ganti meter).
     - `verifikator2@pdam.co.id`: `VERIFIKATOR_2` (Manager — approval deviasi cabang Ring 2).
     - `verifikator3@pdam.co.id`: `VERIFIKATOR_3` (Direksi — pengesahan final billing DRD Ring 3).
     - 9 Akun Petugas Pencatat Lapangan (`dadang@cater.pdam.co.id`, `periyadi@...`, `omay@...`, `iwan@...`, `agus@...`, `didin@...`, `rudy@...`, `dani@...`, `edi@...`): `PENCATAT`.

---

## 3. Langkah Eksekusi Cut-Over Go-Live

1. **Backup Database**:
   ```powershell
   pg_dump "$DATABASE_URL_DIRECT" --no-owner --no-acl -f packages/db/backups/backup_pre_golive.sql
   ```
2. **Jalankan Migrasi Skema**:
   ```powershell
   cd packages/db
   bun run db:migrate
   ```
3. **Jalankan Seed Data & Seed Akun**:
   ```powershell
   cd packages/db
   bun run db:seed
   bun run db:seed:accounts
   ```
4. **Jalankan Tes Regresi & Replay Tagihan Otomatis (Read-Only)**:
   ```powershell
   cd packages/db
   bun test src/__tests__/VerifySeedAndScenarios.test.ts
   ```
