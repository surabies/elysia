# Laporan Hasil Eksekusi, Rekonsiliasi & Simulasi Siklus Periode (Fase D)

Seluruh instruksi dan syarat di [prompt.md](file:///E:/Coding/elysia/prompt.md), [alur-bisnis.md](file:///E:/Coding/elysia/alur-bisnis.md), dan [konfirmasi.md](file:///E:/Coding/elysia/konfirmasi.md) telah selesai dieksekusi, diuji, dan diverifikasi.

> [!NOTE]
> **File Backup Database Sebelum Reset**:
> Tersimpan utuh di [neondb_backup_before_reseed.sql](file:///E:/Coding/elysia/packages/db/backups/neondb_backup_before_reseed.sql) (`18.787.391` bytes, hasil `pg_dump` via koneksi direct non-pooler).

---

## 1. Laporan Rekonsiliasi Pasca-Seed (`ProgresCater-PW5.csv` vs Database)

### 1.1 Rekonsiliasi Master, Referensi, & Foreign Key Yatim (`0` Yatim)

| Metrik Rekonsiliasi                                                                                        | Nilai di CSV Sumber |   Nilai di Database | Selisih | Status             |
| ---------------------------------------------------------------------------------------------------------- | ------------------: | ------------------: | ------: | ------------------ |
| Total Master Pelanggan (`pelanggan`)                                                                       |              22.524 |          **22.524** |       0 | **COCOK 100%**     |
| Pelanggan dengan Nomor Meter Unik Valid (`no_meter IS NOT NULL`)                                           |              21.838 |          **21.838** |       0 | **COCOK 100%**     |
| Pelanggan Tanpa Nomor Meter Valid (`no_meter IS NULL`, `no_meter_asli` tersimpan)                          |                 686 |             **686** |       0 | **COCOK 100%**     |
| Total Aset Water Meter (`water_meter`)                                                                     |              21.838 |          **21.838** |       0 | **COCOK 100%**     |
| Total Rute Pencatatan (`rute_cater`, `KC308` dinormalisasi ke `KD308`)                                     |                 125 |             **125** |       0 | **COCOK 100%**     |
| Total Petugas Pencatat (`petugas_cater`)                                                                   |                   9 |               **9** |       0 | **COCOK 100%**     |
| Wilayah Administrasi / Kecamatan / Kelurahan / Zona                                                        |     4 / 7 / 21 / 21 | **4 / 7 / 21 / 21** |       0 | **COCOK 100%**     |
| Golongan Tarif / Blok Tarif / Biaya Tetap Ukuran Meter                                                     |         13 / 52 / 9 |     **13 / 52 / 9** |       0 | **COCOK 100%**     |
| Pelanggan dengan `ukuran_meter` kosong atau di luar tabel referensi `biaya_tetap`                          |                   0 |               **0** |       0 | **0 INVALID**      |
| Pelanggan dengan `no_urut_rute <= 0` atau `NULL`                                                           |                   0 |               **0** |       0 | **100% BERURUTAN** |
| FK Yatim (`rute`, `tarif`, `kelurahan`, `water_meter`, `daftar_catat`, `cater_baca_meter`, `rekening_drd`) |                   0 |               **0** |       0 | **0 FK YATIM**     |

### 1.2 Rekonsiliasi Periode Closed (`202610`) & Periode Open (`202611`)

| Pemeriksaan                                                                  | Nilai di CSV (`202610`) |                                        Nilai di Database |  Selisih | Status                   |
| ---------------------------------------------------------------------------- | ----------------------: | -------------------------------------------------------: | -------: | ------------------------ |
| Status `periode_penagihan('202610')`                                         |                  Closed |                                           **`TERKUNCI`** |        — | **SAH**                  |
| Jumlah `daftar_catat('202610')` (`DICATAT`: 22.495, `DICABUT`: 29)           |                  22.524 |                                               **22.524** |        0 | **COCOK 100%**           |
| Jumlah `cater_baca_meter('202610')` (`status_verifikasi = 'LOCKED_BILLING'`) |                  22.524 |                                               **22.524** |        0 | **COCOK 100%**           |
| Jumlah `rekening_drd('202610')`                                              |                  22.524 |                                               **22.524** |        0 | **COCOK 100%**           |
| Total Pemakaian `202610` (`SUM(pakai_m3)`)                                   |            `330.209 m³` |                                         **`330.209 m³`** |    **0** | **COCOK 100%**           |
| Total Tagihan DRD `202610` (`SUM(total_tagihan)`)                            |      `Rp 2.983.083.540` |                                   **`Rp 2.983.083.540`** | **Rp 0** | **COCOK 100%**           |
| Status `periode_penagihan('202611')`                                         |                    Open | **`BERJALAN`** (`total_m3: NULL`, `total_tagihan: NULL`) |        — | **SAH**                  |
| Jumlah DPM `daftar_catat('202611')` (`22.524 - 29 DICABUT`)                  |                  22.495 |                             **22.495** (`BELUM_DICATAT`) |        0 | **COCOK 100%**           |
| Pelanggan `no_meter IS NULL` yang aktif di DPM `202611` (`686 - 3 DICABUT`)  |                     683 | **683** (tidak ada yang hilang karena `no_meter = NULL`) |        0 | **TERBUKTI**             |
| `daftar_catat('202611').stand_awal == cater_baca_meter('202610').stma`       |                  22.495 |                           **22.495 cocok (`0` selisih)** |    **0** | **100% CARRY-FORWARD**   |
| Jumlah `cater_baca_meter('202611')` & `rekening_drd('202611')`               |                       0 |                                                    **0** |        0 | **BELUM ADA BACAAN NOV** |

---

## 2. Bukti Idempotensi Seed 2x (`Run #1` vs `Run #2` vs `Final Restored State`)

Perintah `bun run db:seed` dijalankan 2 kali berturut-turut. Berikut perbandingan jumlah baris seluruh tabel utama:

| Nama Tabel                                          | Jumlah Baris Run #1 | Jumlah Baris Run #2 | State Akhir Pasca-Simulasi | Selisih / Duplikat |
| --------------------------------------------------- | ------------------: | ------------------: | -------------------------: | -----------------: |
| `wilayah_administrasi`                              |                   4 |                   4 |                          4 |              **0** |
| `kecamatan`                                         |                   7 |                   7 |                          7 |              **0** |
| `kelurahan`                                         |                  21 |                  21 |                         21 |              **0** |
| `zona_distribusi`                                   |                  21 |                  21 |                         21 |              **0** |
| `petugas_cater`                                     |                   9 |                   9 |                          9 |              **0** |
| `rute_cater`                                        |                 125 |                 125 |                        125 |              **0** |
| `golongan_tarif`                                    |                  13 |                  13 |                         13 |              **0** |
| `tarif_blok`                                        |                  52 |                  52 |                         52 |              **0** |
| `biaya_tetap`                                       |                   9 |                   9 |                          9 |              **0** |
| `master_kondisi_catat`                              |                  25 |                  25 |                         25 |              **0** |
| `water_meter`                                       |              21.838 |              21.838 |                     21.838 |              **0** |
| `pelanggan`                                         |              22.524 |              22.524 |                     22.524 |              **0** |
| `periode_penagihan`                                 |                   2 |                   2 |                          2 |              **0** |
| `daftar_catat` (`202610`: 22.524, `202611`: 22.495) |              45.019 |              45.019 |                     45.019 |              **0** |
| `cater_baca_meter` (`202610`)                       |              22.524 |              22.524 |                     22.524 |              **0** |
| `rekening_drd` (`202610`)                           |              22.524 |              22.524 |                     22.524 |              **0** |
| `SUM(daftar_catat(202611).stand_awal)`              |     `41.839.109,00` |     `41.839.109,00` |            `41.839.109,00` |           **0,00** |

---

## 3. Hasil Uji Simulasi `202611` → `202612` → `202701` & 5 Skenario Bisnis

Simulasi dijalankan menggunakan service aplikasi aktual (`PelangganService`, `ClosingService`, `GwmService`, `BulanBaruService`) lalu dikembalikan ke state awal (`202610` closed, `202611` open):

1. **Skenario 1 — Pelanggan `DICABUT` Disambung Kembali (`sambungKembaliPelanggan`)**:
   - Pelanggan uji: `nolg = 00404800111` (TATTO SUTANTO, status `DICABUT`, stand akhir `202610` = `172`, tidak ada di DPM `202611`).
   - Saat dipanggil `pelangganService.sambungKembali('00404800111', '202611')`: status master berubah menjadi `'PELANGGAN AKTIF'`, otomatis masuk ke `daftar_catat('202611')` dengan **`stand_awal = 172`**.
   - Setelah dicatat `+10 m³` di November (`stma = 182`) dan closing `202611`, pada DPM `202612` terbukti `stand_awal = 182.00` dan `pakai_lalu = 10.00`.
2. **Skenario 2 — Pelanggan Baru Muncul / PBPK (`syncPelangganBaruKeDpm`)**:
   - Pelanggan baru `nolg = 99999999991` ditambahkan ke master `pelanggan` (tanpa baris `water_meter`, `ukuran_meter = '1/2'`, `tarif_kode = '2A3'`).
   - Saat `closingService.syncPelangganBaruKeDpm('202611')` dijalankan: pelanggan diinjeksi ke DPM `202611` dengan `sumber = 'PBPK'` dan **`stand_awal = 0`**.
   - Setelah dicatat `10 m³` di November (`stma = 10`) dan closing `202611`, pada DPM `202612` terbukti `stand_awal = 10.00` dan `pakai_lalu = 10.00`.
3. **Skenario 3 — Meter Diganti / Stand Reset pada Pelanggan Tanpa Baris `water_meter` (`GwmService`)**:
   - Pelanggan uji: `nolg = 00009004822` (IRMA LISMIATI, salah satu dari 686 pelanggan `2018MBR` yang memiliki `no_meter = NULL`, stand awal `202611` = `550`).
   - Dicatat mutasi ganti meter (`standAngkat = 970`, `noMeterBaru = 'MTR-BARU-9004822'`, `standPasang = 0`) dan disahkan dengan `standBacaBaru = 8`.
   - **Perilaku sistem**:
     - `GwmService` membuat baris baru di `water_meter` (`MTR-BARU-9004822`), menautkannya ke `pelanggan.no_meter`, menghitung pemakaian gabungan `(970 - 550) + (8 - 0) = 428 m³`, dan menyimpan **`stma = 8`** (stand meter baru) ke `cater_baca_meter('202611')`.
     - Saat carry-forward ke DPM `202612`, terbukti **`stand_awal('202612') = 8.00`** (mengikuti stand akhir meter baru) dan `pakai_lalu = 428.00`.
4. **Skenario 4 — Bulan Terlewat / Tidak Ada Pembacaan (`00009004590`)**:
   - Pelanggan `00009004590` (`stand_awal 202611 = 3909`, `pakai_lalu = 27`) sengaja dilewati (tidak ada baris di `cater_baca_meter('202611')`).
   - Saat `bukaBulanBaru('202611' -> '202612')` dijalankan, `carryForwardPeriode` mewariskan stand terakhir yang valid sehingga di DPM `202612` terbukti **`stand_awal = 3909.00`** dan **`pakai_lalu = 27.00`** (tidak ter-reset ke `0`!).
5. **Skenario 5 — Pergantian Tahun (`202612` → `202701`)**:
   - Setelah seluruh 22.497 pelanggan dicatat di `202612` (`+12 m³`) dan `eksekusiClosing('202612')` berhasil menerbitkan 22.497 DRD (`269.964 m³`, `Rp 2.042.155.100`), `bukaBulanBaru('202612' -> '202701')` membuka periode `'202701'` (`getActivePeriode() === '202701'`) dengan **22.497 DPM** dan **0 selisih `stand_awal('202701') == stma('202612')`**.

---

## 4. File Export untuk Verifikasi Lapangan & Pelayanan

Ketiga file CSV export yang Anda minta telah dibuat secara otomatis oleh ETL di folder `packages/db/data/exports/`:

1. **686 Pelanggan Tanpa Nomor Meter Valid (lengkap dengan penanda `PRIORITAS_TINGGI` untuk 185 pasangan duplikat yang berbeda merk/tanggal pasang)**:
   - [daftar-686-pelanggan-tanpa-meter-valid.csv](file:///E:/Coding/elysia/packages/db/data/exports/daftar-686-pelanggan-tanpa-meter-valid.csv)
   - Rincian: `PLACEHOLDER` (`2018MBR`: 231, `2017MBR`: 24, `00000000`: 4, `0`: 1 = **260 SL**), `KOSONG` (`-` = **8 SL**), `DUPLIKAT` (**418 SL**, di mana **374 baris** bertanda `PRIORITAS_TINGGI` karena merk/tanggal pasang berbeda antar pelanggan yang berbagi nomor meter tersebut).
2. **20 Pelanggan Selisih (`mutasinama = 'PELANGGAN AKTIF'` tetapi bacaan Oktober `ketcatat = 'DICABUT' / tmss = 'D'`)**:
   - [daftar-20-pelanggan-selisih-dicabut.csv](file:///E:/Coding/elysia/packages/db/data/exports/daftar-20-pelanggan-selisih-dicabut.csv)
3. **6 Pelanggan `tupsp`/`tupsm` yang pada Oktober tercatat `MTA` / `RUMAH KOSONG` (tetap aktif di DPM `202611` dengan flag `perlu_verifikasi = true`)**:
   - [daftar-6-pelanggan-tups-verifikasi-lapangan.csv](file:///E:/Coding/elysia/packages/db/data/exports/daftar-6-pelanggan-tups-verifikasi-lapangan.csv)

---

## 5. Daftar Langkah yang Gagal atau Diasumsikan

- **Langkah yang gagal**: **Tidak ada (0 kegagalan)**. Seluruh migrasi, seed Run #1, seed Run #2, simulasi 3 periode lintas tahun, dan restorasi state akhir berjalan sukses dengan exit code `0`.
- **Catatan / Dokumentasi Aturan Bisnis**:
  1. Pada [seed-tarif.ts](file:///E:/Coding/elysia/packages/db/src/seed-tarif.ts#L252-L266), tabel referensi `biaya_tetap` (`BEA_BEBAN` per ukuran meter `1/2"` s/d `4"`) telah diberi komentar dokumentasi eksplisit bahwa angkanya diekstrak dari rekonsiliasi 100% `ProgresCater-PW5.csv` dan wajib dicocokkan dengan SK Tarif Direksi resmi bila ada pembaruan tarif.
  2. Jalur untuk melengkapi nomor meter valid bagi 686 pelanggan telah disediakan di `PelangganService.getPelangganTanpaMeterValid()` dan `PelangganService.lengkapiNomorMeterValid()`, serta jalur sambung kembali pelanggan `DICABUT` tersedia di `PelangganService.sambungKembali()` (`sambungKembaliPelanggan` di `@cater/db`).
