# Laporan Pelaksanaan `keputusan-saya.md` & Analisis Data November (`lapdatametertes.csv`)

Seluruh instruksi pada [keputusan-saya.md](file:///E:/Coding/elysia/prompt/keputusan-saya.md) telah dikerjakan dengan mematuhi **Prinsip Desain Generik** (tidak ada `nolg`, nama pelanggan, nama perusahaan, atau kode rute yang ditulis langsung di logika engine/service/ETL).

---

## 0. Perbaikan Error `import 'bun:test'` pada `VerifySeedAndScenarios.test.ts`

- **Akar Masalah**: File [packages/db/tsconfig.json](file:///E:/Coding/elysia/packages/db/tsconfig.json) belum menyertakan `"types": ["bun"]` dan `@types/bun` di `packages/db/package.json`, sehingga TypeScript/IDE di dalam workspace `packages/db` tidak mengenali modul built-in `bun:test`.
- **Solusi**: Menambahkan `"types": ["bun"]` pada [packages/db/tsconfig.json](file:///E:/Coding/elysia/packages/db/tsconfig.json#L10) dan `"@types/bun": "latest"` pada [packages/db/package.json](file:///E:/Coding/elysia/packages/db/package.json#L27). Error hilang dan seluruh tes lulus (`5 pass, 0 fail, 40 assertions`).

---

## 1. Tarif Blok, Investigasi Pelanggan `4A` (`78 m³`), & Hasil Replay Oktober (`22.523 / 22.524` Cocok!)

### 1.1 Hasil Investigasi Pelanggan `4A` (`78 m³` — `nolg: 00904900251`, KOMARIAH)

- Pada pemeriksaan seluruh **26 pelanggan** golongan `4A` di CSV Oktober:
  - 22 pelanggan berada di Blok 1 (`5..10 m³` → tarif Blok 1 = `Rp 7.350/m³`).
  - 3 pelanggan berada di Blok 2 (`15..20 m³` → tarif Blok 2 = `Rp 11.250/m³`; pada `20 m³`, `jmlhargaair = 10×7.350 + 10×11.250 = Rp 186.000`).
  - **Hanya ada 1 pelanggan `4A` yang pemakaiannya `> 20 m³`**, yaitu `00904900251` (`KOMARIAH`) dengan **`pakai_drd = 78 m³`** (`stml: 5578`, `stma: 5656`, `blok_m3: 4`, `jmlhargaair: Rp 1.385.100`).
- **Mengapa pada skrip deduksi awal pelanggan ini tampak selisih?**
  - Karena tidak ada pelanggan `4A` di rentang `21..30 m³` (Blok 3), skrip deduksi awal membiarkan `r3 = null (0)` dan `r4 = null (0)` sehingga hanya menghitung Blok 1 + Blok 2 (`Rp 186.000`).
  - Padahal `Rp 1.385.100 - Rp 186.000 = Rp 1.199.100` adalah harga air untuk `10 m³` di Blok 3 (`21..30 m³`) + `48 m³` di Blok 4 (`31..78 m³`), yakni persamaan bulat `10 × r3 + 48 × r4 = 1.199.100` → **`r3 = Rp 17.550/m³`** dan **`r4 = Rp 21.325/m³`** (`175.500 + 48 × 21.325 = 175.500 + 1.023.600 = 1.199.100`).
  - Dengan tarif Blok 3 = `17.550` dan Blok 4 = `21.325`, seluruh **26 dari 26 pelanggan golongan `4A` (100%) cocok Rp 0 selisih**!

### 1.2 Pembaruan `seed-tarif.ts`, Masa Berlaku Tarif, Snapshot Rincian Blok DRD, & Tes Regresi Replay

1. **`tarif_blok` Diperbarui via Seed**: [seed-tarif.ts](file:///E:/Coding/elysia/packages/db/src/seed-tarif.ts) telah di-upsert ke database dengan catatan eksplisit bahwa angka berasal dari ekstraksi CSV Oktober dan wajib dicocokkan dengan SK tarif resmi.
2. **Filter Masa Berlaku Tarif & Snapshot `rincian_blok`**:
   - [closing.service.ts](file:///E:/Coding/elysia/apps/web/src/server/services/closing/closing.service.ts#L178-L212) (`muatKonteksTarif(periodeStr)`) kini memfilter `tarif_blok` dan `biaya_tetap` yang masa berlakunya (`berlaku_mulai` s/d `berlaku_sampai`) mencakup periode yang sedang di-closing.
   - Kolom `rincian_blok` (`jsonb`) ditambahkan ke tabel [rekening_drd](file:///E:/Coding/elysia/packages/db/src/schema/billing.ts#L26) (migrasi `0015_robust_jackal.sql`) dan diisi snapshot rincian per blok (`blok, dariM3, sampaiM3, volumeM3, hargaPerM3, subtotal`) saat `eksekusiClosing`.
3. **Hasil Replay Tagihan Oktober di Tes Regresi Permanen ([VerifySeedAndScenarios.test.ts](file:///E:/Coding/elysia/packages/db/src/__tests__/VerifySeedAndScenarios.test.ts#L106-L195))**:
   - **22.523 dari 22.524 pelanggan (99,996%) cocok 100% (Rp 0 selisih)** pada seluruh komponen (`blok_m3`, `jml_harga_air`, `bea_beban`, `bea_admin`, `air_kotor`, `lain_lain`, `total_tagihan`)! (Melampaui target 22.522 karena pelanggan `4A` `78 m³` terbukti bukan anomali).
   - Satu-satunya pengecualian (`00008001503` — tarif khusus kesepakatan golongan `2B` `3.000 m³`) disimpan sebagai daftar data `KNOWN_BILLING_EXCEPTIONS` di file tes, **bukan** di engine.

---

## 2. Bulan Terlewat (Blokir Closing) & Bukti Data Aturan Taksasi Aplikasi Lama

### 2.1 Guard Blokir Closing pada DPM `BELUM_DICATAT` (Sudah Diimplementasikan)

- Pada [closing.service.ts](file:///E:/Coding/elysia/apps/web/src/server/services/closing/closing.service.ts#L583-L607), `eksekusiClosing` kini **menolak keras (throw error)** apabila masih ada baris `daftar_catat` berstatus `'BELUM_DICATAT'`, dan menampilkan jumlah serta daftar pelanggan (`nolg`, `nama`, `rute_kode`) yang belum dicatat.

### 2.2 Bukti Data: Bagaimana Aplikasi Lama Menaksir & Memberi Minimum di CSV (`202610` & `202611`)

Sesuai instruksi Anda (_"cari dulu bagaimana aplikasi lama menaksir... Tampilkan aturan yang kamu temukan dan usulanmu, lalu tunggu persetujuan saya sebelum implementasi"_), berikut adalah fakta angka dari **22.524 baris `ProgresCater-PW5.csv` (Oktober)** dan **14.238 baris `lapdatametertes.csv` (November)**:

1. **Kapan Pemakaian = `0 m³`? (356 pelanggan di Oktober, 271 pelanggan di November)**:
   - Di Oktober, **356 pelanggan** yang ditagih `0 m³` terdiri dari:
     - **`8 | TIDAK ADA AIR`**: **324 dari 324 pelanggan (100%)** ditagih **`0 m³`** (`stma = stml`, `pakai_drd = 0`).
     - **`D | DICABUT`**: **29 dari 29 pelanggan (100%)** ditagih **`0 m³`** (`stma = stml`, `pakai_drd = 0`).
     - **`P | REV.PENCATAT`**: **3 pelanggan** yang dikoreksi khusus menjadi `0 m³` karena `pakailalu = 0`.
   - Artinya: Di aplikasi lama, **`0 m³` HANYA diberikan jika kondisi catatnya adalah `TIDAK ADA AIR` (`8`), `DICABUT` (`D`), atau revisi manual (`P`)**.
2. **Bagaimana Aplikasi Lama Menaksir Kondisi Kendala / Meter Bermasalah (`stma == stml`)?**:
   - Untuk kondisi kendala akses / fisik di mana meter tidak terbaca (`stma` dikunci sama dengan `stml`), proporsi baris yang nilai **`pakai_drd`-nya disamakan persis dengan `pakailalu` (`pakai_drd == pakailalu`)** adalah:
     - `H | TIDAK DIPAKAI` (`4.082` SL): **3.972 SL (97,3%)** `pakai_drd == pakailalu` (di mana 1.850 di antaranya bernilai `5 m³` karena bulan lalunya juga `5 m³`; **0 pelanggan** yang diberi `0 m³`!).
     - `R | RUMAH KOSONG` (`1.310` SL): **1.291 SL (98,5%)** `pakai_drd == pakailalu` (**0 pelanggan** yang diberi `0 m³`!).
     - `7 | MATI ADA AIR` (`307` SL): **302 SL (98,4%)** `pakai_drd == pakailalu`.
     - `3 | MTA` (`289` SL): **283 SL (97,9%)** `pakai_drd == pakailalu`.
     - `5 | TTB` (`281` SL): **260 SL (92,5%)** `pakai_drd == pakailalu`.
     - `O | METER RUSAK` (`83` SL): **75 SL (90,4%)** `pakai_drd == pakailalu`.
     - `E | TERHALANG` (`176` SL): **152 SL (86,4%)** `pakai_drd == pakailalu`.
     - `2 | DK` (`700` SL): **594 SL (84,9%)** `pakai_drd == pakailalu`.
     - `6 | BMK/BMB` (`234` SL): **191 SL (81,6%)** `pakai_drd == pakailalu`.
     - `Q | ADA ANJING` (`3` SL): **3 SL (100%)** `pakai_drd == pakailalu`.
   - Sedangkan pada bacaan **`Normal`** (`12.500` SL): ketika `0 <= stma - stml < 5` (terdapat `2.465` SL), sebanyak **2.369 SL (96,1%)** dikenakan **minimum pemakaian `5 m³`**, sedangkan **96 SL** tetap ditagih `1..4 m³` apa adanya.

### 2.3 Pembuktian Angka Rekonsiliasi Bacaan Fisik Setelah Taksasi (`3909` → Taksasi `27` → Bacaan Fisik `3963`)

Sesuai permintaan Anda: _"Tunjukkan dengan contoh angka (stand awal 3909, taksasi 27, bacaan fisik 3963) bahwa tagihannya tidak masuk Blok 4."_

Lihat perbandingan dua cara di bawah ini (misal pelanggan Golongan `2A3` dengan tarif Blok 1 = `3.120`, Blok 2 = `5.520`, Blok 3 = `8.880`, Blok 4 = `12.840`):

| Bulan / Periode                                        | Kejadian                                              | Stand Awal (`stml`) | Stand Akhir (`stma`) | Selisih Fisik (`stma - stml`) |      Kredit Taksasi yang Sudah Ditagih | Pemakaian Ditagih (`pakai_tagih`) |                             Blok Tertinggi | Rincian Harga Air (`2A3`)                                                          |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------: | -------------------: | ----------------------------: | -------------------------------------: | --------------------------------: | -----------------------------------------: | ---------------------------------------------------------------------------------- |
| **Bulan N (November)**                                 | Rumah terkunci (`DK`), ditaksir `27 m³` oleh operator |              `3909` |   `3909` _(dikunci)_ |                        `0 m³` |                                 `0 m³` |                       **`27 m³`** |         **Blok 3** _(Tidak masuk Blok 4!)_ | `10×3.120 + 10×5.520 + 7×8.880` = **Rp 148.560**                                   |
| **Bulan N+1 (Desember) — DENGAN Rekonsiliasi Taksasi** | Terbaca fisik di angka `3963`                         |              `3909` |               `3963` |                       `54 m³` | **`-27 m³`** _(dikurangi taksasi Nov)_ |           **`27 m³`** (`54 - 27`) |         **Blok 3** _(Tidak masuk Blok 4!)_ | `10×3.120 + 10×5.520 + 7×8.880` = **Rp 148.560** _(Total 2 bln = **Rp 297.120**)_  |
| _(Pembanding jika TANPA Rekonsiliasi / Lompat Bulan)_  | _Ditagih 54 m³ sekaligus di Des_                      |            _`3909`_ |             _`3963`_ |                     _`54 m³`_ |                               _`0 m³`_ |                         _`54 m³`_ | **_Blok 4 (24 m³ terkena tarif 12.840!)_** | _`10×3.120 + 10×5.520 + 10×8.880 + 24×12.840` = **Rp 483.360** (Rugi Rp 186.240!)_ |

**Menunggu Persetujuan Anda untuk Implementasi Taksasi & Rekonsiliasi**:

1. **Usulan Aturan Taksasi Generik (Berbasis Konfigurasi Data `master_kondisi_catat`)**:
   - Tambahkan kolom konfigurasi pada `master_kondisi_catat`: `mode_hitung` (`'SELISIH_FISIK' | 'NOL' | 'TAKSASI_HISTORI'`) sehingga perilaku tiap kondisi (`TIDAK ADA AIR` → `NOL`, `DK/RUMAH KOSONG/METER RUSAK/dll.` → `TAKSASI_HISTORI`, `Normal` → `SELISIH_FISIK`) ditentukan oleh data di tabel `master_kondisi_catat`, bukan `Set` hardcode di kode.
   - Besaran `pemakaian_minimum_m3` disimpan di tabel konfigurasi `pengaturan_konten` (default `5` m³ jika diaktifkan, atau `0` jika perusahaan air tidak menerapkan minimum).
   - Saat operator menjalankan taksasi eksplisit (dengan alasan & pencatat), sistem mengusulkan `pakai_lalu` (atau rata-rata histori) dan melewati alur verifikasi normal (`SUBMITTED` → `VERIFIED` → `APPROVED_FINAL`).
2. **Usulan Rekonsiliasi Taksasi di Bulan Berikutnya**:
   - Simpan `akumulasi_taksasi_m3` pada `daftar_catat` saat carry-forward: jika di bulan `N` pelanggan ditaksir (`stma == stml` dan `pakai_tagih > 0`), maka `akumulasi_taksasi_m3` dibawa ke `daftar_catat(N+1)`.
   - Saat di bulan `N+1` terbaca fisik (`stma > stml`), sistem menghitung `pakai_tagih = (stma - stml) - akumulasi_taksasi_m3`. Jika hasilnya `< 0` (negatif), sistem **tidak memotong otomatis**, melainkan memberi status `'ANOMALY'` / flag koreksi manual agar diverifikasi operator.

---

## 3. Pengamanan Sebelum Produksi (Sudah Dikerjakan)

1. **Seed Akun Dipisahkan & `demo@example.com` Dihapus**:
   - [seed-accounts.ts](file:///E:/Coding/elysia/packages/db/src/seed-accounts.ts) kini menghapus `demo@example.com` dari database (`0` baris di DB, menyisakan **14 akun resmi**: 5 manajemen/verifikator + 9 pencatat lapangan) dan menolak memakai `FALLBACK_SEED_PASSWORD` saat `NODE_ENV=production`.
   - [seed.ts](file:///E:/Coding/elysia/packages/db/src/seed.ts) kini murni menjalankan seed data (tanpa memanggil `seedAccounts`). Untuk akun, dijalankan terpisah via `bun run db:seed:accounts`.
2. **Guard `seed.ts` & `clean.ts` dengan Allowlist Nama Database & Proteksi Bacaan Periode Open**:
   - [clean.ts](file:///E:/Coding/elysia/packages/db/src/clean.ts#L37-L72): Wajib menyetel `ALLOW_RESET_DB=<nama_database>` yang cocok persis dengan `SELECT current_database()`, serta menolak reset jika periode `BERJALAN` sudah memiliki bacaan di `cater_baca_meter`.
   - [seed.ts](file:///E:/Coding/elysia/packages/db/src/seed.ts#L28-L67): Memeriksa `current_database()` terhadap allowlist `ALLOW_SEED_DB`, serta menolak dijalankan jika periode `BERJALAN` sudah memiliki bacaan di `cater_baca_meter`.
3. **Audit & Pembersihan Nilai Hardcode di Kode**:
   - Normalisasi rute di [import-progres-cater.ts](file:///E:/Coding/elysia/packages/db/src/etl/import-progres-cater.ts#L347-L360) telah diubah menjadi **algoritma generik berbasis data**: jika suatu baris memiliki `pencatat` kosong (`'-'`) dan `rute_kode`-nya tidak memiliki petugas di seluruh dataset, ETL memeriksa apakah 5 karakter awal `nprs` cocok dengan kode rute valid di `ruteMap` yang memiliki petugas. Tidak ada lagi string `'KC308'`, `'KD308'`, atau `'PERIYADI'` di kode ETL!
   - Fallback periode `'202610'` / `'202611'` di `cater-progres.service.ts`, `cater-progress.service.ts`, dan `manual-add-masal.service.ts` telah diganti dengan `await getActivePeriode()`.
   - Diuji di [VerifySeedAndScenarios.test.ts](file:///E:/Coding/elysia/packages/db/src/__tests__/VerifySeedAndScenarios.test.ts#L251-L267) dengan periode sintetis lintas tahun **`202512` → `202601`** dalam transaksi rollback.

---

## 4. Analisis Data November dari Aplikasi Lama (`lapdatametertes.csv` — ANALISIS SAJA, 100% Read-Only)

File yang dianalisis: [packages/db/data/raw/lapdatametertes.csv](file:///E:/Coding/elysia/packages/db/data/raw/lapdatametertes.csv) (`1.869.688` bytes). **Tidak ada satu baris pun yang di-import ke database.**

### 4.1 Format File, Jumlah Baris, Kolom, & Status Verifikasi

- **Format**: CSV dengan delimiter koma (`,`) dan tanda kutip ganda (`"`), nilai `No Pel` diawali karakter tab (`"\t00901000440"`).
- **Jumlah Baris**: **14.238 baris data** (dari 14.239 baris termasuk header), **14.238 `nolg` unik (0 duplikat)**.
- **Periode & Rentang Tanggal**: 100% berada pada `Periode = 202611`, dengan `tgl_catat` mulai **`2026-11-01` s/d `2026-11-20`** dan `tgl_upload` s/d `2026-11-20` (mencerminkan **63,29%** progres pembacaan dari 22.495 DPM November).
- **Daftar 25 Kolom**:
  `[0] No Pel`, `[1] Nama`, `[2] Alamat`, `[3] Periode`, `[4] St AWAL`, `[5] St Akhir`, `[6] St Akhir Catat`, `[7] Pakai`, `[8] Pakai Lau`, `[9] persentase`, `[10] Trf`, `[11] Kd_kel` (kode kondisi `tmss`), `[12] Nm_Kel` (nama kondisi `ket_catat`), `[13] kd_petugas`, `[14] kd_wm` (nomor meter), `[15] Wil`, `[16] Rute`, `[17] Zona Wil`, `[18] Kd Zonasi`, `[19] Nama Zonasi`, `[20] Kecamatan`, `[21] Kelurahan`, `[22] tgl_catat`, `[23] tgl_upload`, `[24] Nama Petugas`.
- **Status Verifikasi di Aplikasi Lama**:
  - File `lapdatametertes.csv` **tidak memiliki kolom status verifikasi eksplisit**, namun menyimpan **dua kolom stand akhir**:
    - **`St Akhir` (kolom 5)**: Stand akhir efektif setelah evaluasi/taksasi/koreksi di aplikasi lama.
    - **`St Akhir Catat` (kolom 6)**: Angka mentah yang diinput petugas di HP (bernilai `0` pada `13.949` baris, dan berisi angka bacaan lapangan mentah pada `289` baris yang mengalami koreksi/taksasi).
  - Selain itu, terdapat **370 baris** yang sudah diberi kode `Kd_kel = 'P'` (`REV.PENCATAT`) yang menandakan telah direvisi oleh verifikator/supervisor di aplikasi lama.

### 4.2 Rekonsiliasi `St AWAL` November vs `stma` Oktober di Database

Dari **14.238 baris** di `lapdatametertes.csv`:

- **Ada di Master/Oktober (`202610`)**: **14.234 pelanggan** (`Pakai Lau` di CSV November cocok **100% [14.234 / 14.234, 0 selisih]** dengan `pakai_drd` Oktober!).
- **Pelanggan Baru (Tidak ada di CSV Oktober)**: **4 pelanggan**.
- **Kecocokan `St AWAL` November vs `stma` Oktober (`daftar_catat(202611).stand_awal`)**:
  - **Cocok Persis (`St AWAL == stma Oktober`)**: **13.857 pelanggan (97,35%)**.
  - **Selisih (`St AWAL != stma Oktober`)**: **377 pelanggan (2,65%)**.
  - **Penyebab 377 Pelanggan Selisih `St AWAL`**:
    - **370 dari 377 pelanggan (98,1%)** memiliki kondisi November **`REV.PENCATAT` (`Kd_kel = 'P'`)**!
    - **220 dari 377 pelanggan** memenuhi rumus eksak **`St AWAL November == stma Oktober + pakai_drd Oktober`**!
    - Mengapa? Karena di bulan Oktober pelanggan tersebut ditaksir (`DK`, `STAND-KONSUMEN`, `STAND TEMPEL`, `TTB`, `TIDAK DIPAKAI`) sehingga `stma` Oktobernya ditahan (`stma == stml`) namun ditagih `pakai_drd` (mis. pelanggan `00903100812` di Oktober `stml=459, stma=459, pakai_drd=5`). Ketika di bulan November petugas berhasil membaca meter fisiknya (`469`), aplikasi lama **menaikkan `St AWAL` November dari `459` menjadi `459 + 5 = 464` (`REV.PENCATAT`)** agar pelanggan hanya ditagih selisihnya (`469 - 464 = 5 m³`), bukan ditagih dua kali!
    - Ini membuktikan secara empiris bahwa aplikasi lama melakukan **rekonsiliasi taksasi bulan lalu** dengan cara menggeser `St AWAL` bulan berjalan (`REV.PENCATAT`) sebesar m³ taksasi yang sudah ditagih di bulan sebelumnya.

### 4.3 Kejadian November yang Tidak Ada di Seed Oktober

1. **4 Pelanggan Baru (PBPK November — Tidak Ada di Seed Oktober)**:
   - `00700250273` (`IR.H.ABDUL RAUF KADIR`, Rute `BD502`, Tarif `2A4`, Meter `A26S-167987`, `stAwal: 0, stAkhir: 0, pakai: 5`, `TIDAK DIPAKAI`).
   - `00805500362` (`PURI ANGGRAENI`, Rute `BD521`, Tarif `2A3`, Meter `A26S-167985`, `stAwal: 0, stAkhir: 12, pakai: 12`, `Normal`).
   - `00404150364` (`DENI ACHMAD CHANDRA`, Rute `KD214`, Tarif `2A4`, Meter `A26S-024977`, `stAwal: 0, stAkhir: 53, pakai: 53`, `Normal`).
   - `00704200871` (`KOKO SUPRIADI HALIM`, Rute `TA601`, Tarif `3B`, Meter `034205`, `stAwal: 0, stAkhir: 5, pakai: 5`, `Normal`).
2. **Pelanggan `DICABUT` (17 Pelanggan dari 29 `DICABUT` Oktober Muncul di Export November, + 3 Pelanggan Baru `DI CABUT`)**:
   - Di aplikasi lama, 17 dari 29 pelanggan yang pada Oktober tercatat `DICABUT` ternyata masih ikut ter-export di laporan lapangan November: 12 di antaranya tetap dicatat `DI CABUT` (`pakai = 0`), 2 dicatat `TIDAK ADA AIR` (`pakai = 0`), dan 3 dicatat `MTA` (`pakai = 0`).
   - Selain itu ada **4 pelanggan** yang di Oktober masih aktif namun di November baru dicatat `DI CABUT` (`D`).
3. **Ganti Meter (`Kd_kel = '4' / MB` — 14 Pelanggan di November)**:
   - Terdapat **14 pelanggan** dengan kondisi `MB` (`Meter Baru`), di mana `St Akhir` ter-reset ke angka kecil (`2` s/d `88`) sementara `St AWAL` masih angka meter lama (`101` s/d `4421`).

### 4.4 Data Tidak Wajar / Anomali di Export November

1. **`St Akhir < St AWAL` (16 Pelanggan)**:
   - **13 pelanggan** adalah kasus **`MB` (`Kd_kel = '4'`, Meter Baru)** di mana `St Akhir` adalah angka meter baru (`2..88`) dan `Pakai` sudah diisi angka positif (`5..20 m³`), **KECUALI 1 baris bug aplikasi lama**:
     - Pelanggan **`00704300190` (`ONG CHIN ENG`, Baris 13565)**: Kondisi `MB` (`4`), `St AWAL = 174`, `St Akhir = 88`, tetapi di CSV tertulis **`Pakai = -86` (negatif!)**.
   - **3 pelanggan lainnya** (`00403751123`, `00802000200`, `00802000610`) adalah kondisi `TIDAK DIPAKAI` (`H`) atau `METER MUNDUR` di mana `St Akhir` lebih kecil dari `St AWAL` tetapi `Pakai` diisi positif (`5..10 m³`).
2. **Pemakaian Ekstrem (`Pakai > 100 m³`)**:
   - Terdapat **27 pelanggan** dengan `Pakai > 100 m³` (tertinggi `480 m³`, tidak ada yang `> 500 m³`), yang wajib masuk ke antrean verifikasi anomali (`ANOMALY_HIGH`).
3. **Ketidakkonsistenan Pasangan `Kd_kel` (`tmss`) dan `Nm_Kel` (`ket_catat`)**:
   - Terdapat **26 baris** di mana `Kd_kel` dan `Nm_Kel` tidak sinkron (mis. `Kd_kel = 'R'` tetapi `Nm_Kel = 'Normal'` [3 baris], `Kd_kel = '-'` tetapi `Nm_Kel = 'TIDAK DIPAKAI'` [6 baris], dan 1 kode baru **`Kd_kel = 'M' | Nm_Kel = 'KELEBIHAN'`** yang belum ada di `master_kondisi_catat`).

### 4.5 Usulan Pemetaan & Strategi Import November Lewat Service Aplikasi Normal

Apabila nanti Anda memutuskan untuk mengimpor data berjalan November (`lapdatametertes.csv`):

1. **Jangan Bypass Alur Verifikasi (Tanpa Status Terkunci)**:
   - Seluruh bacaan masuk dengan `status_verifikasi = 'SUBMITTED'` (atau `'ANOMALY_NEGATIVE'` / `'ANOMALY_HIGH'` / `'ANOMALY_LOW'` sesuai hasil evaluasi `evaluasiPemakaianMeter`), **bukan** `'LOCKED_BILLING'` atau `'APPROVED_FINAL'`.
2. **Pemetaan Kolom ke `cater_baca_meter` & `daftar_catat`**:
   - Untuk **4 pelanggan baru**: jalankan lewat jalur PBPK (`pelanggan` + `daftar_catat` dengan `sumber = 'PBPK'`, `stand_awal = 0`).
   - Untuk **377 pelanggan yang `St AWAL` November-nya direvisi (`REV.PENCATAT`) oleh aplikasi lama**:
     - Pertahankan `cater_baca_meter.stml = daftar_catat.stand_awal` (stand akhir Oktober asli sebagai fakta sejarah), simpan `St AWAL` dari CSV November ke **`cater_baca_meter.stml_revisi`**, `St Akhir` ke **`stma`**, dan `Pakai` ke **`pakai_tagih`** (dengan `alasan_taksir = 'REKONSILIASI_TAKSASI_LALU'`), sehingga jejak audit antara stand Oktober dan penyesuaian November terlihat transparan 100%.
   - Untuk **1 baris pemakaian negatif (`00704300190`, `Pakai = -86`)**: tandai otomatis sebagai `'ANOMALY_NEGATIVE'` agar wajib dikoreksi di Verifikasi Ring 1 sebelum closing November bisa dijalankan.
   - Update `daftar_catat('202611').status` menjadi `'DICATAT'` (atau `'DICABUT'` untuk yang berkondisi `DI CABUT`).
