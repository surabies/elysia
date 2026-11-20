# Laporan Verifikasi Lanjutan (Read-Only) — `tugas_lanjutan.md`

Seluruh verifikasi pada poin 1 s/d 5 di [tugas_lanjutan.md](file:///E:/Coding/elysia/prompt/tugas_lanjutan.md) dijalankan **100% read-only** (tanpa mengubah rumus tagihan, data di database, maupun skema), ditambah penyelesaian poin 6 (`.gitignore`, security guard `seed.ts`/`clean.ts`, tes regresi otomatis dengan transaksi rollback, dan runbook `/docs/SEED-DAN-GO-LIVE.md`).

---

## 1. Replay Tagihan Oktober (`202610`) — 22.524 Pelanggan

Seluruh **22.524 pelanggan** periode `202610` dihitung ulang tagihannya dari `pakai_m3` (`pakai_drd`) menggunakan fungsi engine yang sama persis dengan `ClosingService` (`hitungRincianHargaAir`, `tentukanBlok`, `hitungTotalTagihan`, `bea_beban` dari ukuran meter di `biaya_tetap`, serta `bea_admin`, `air_kotor`, `lain_lain` dari `golongan_tarif`), lalu dibandingkan per komponen dengan nilai di [ProgresCater-PW5.csv](file:///E:/Coding/elysia/packages/db/data/raw/ProgresCater-PW5.csv):

### 1.1 Ringkasan Komparasi Per Komponen (22.524 Pelanggan)

| Komponen Tagihan                        |                     Jumlah Cocok Persis |                             Jumlah Selisih | Persentase Cocok | Keterangan                                                                                                                                                                         |
| --------------------------------------- | --------------------------------------: | -----------------------------------------: | ---------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`blok_m3`** (`tentukanBlok`)          |                              **22.524** |                                      **0** |      **100,00%** | Batas blok `1..10`, `11..20`, `21..30`, `>30` cocok 100%.                                                                                                                          |
| **`bea_beban`** (dari `ukuran_meter`)   |                              **22.524** |                                      **0** |      **100,00%** | `7.000` s/d `187.000` cocok 100% di seluruh 22.524 baris.                                                                                                                          |
| **`bea_admin`** (dari `golongan_tarif`) |                              **22.524** |                                      **0** |      **100,00%** | `Rp 10.000` cocok 100%.                                                                                                                                                            |
| **`air_kotor`** (dari `golongan_tarif`) |                              **22.524** |                                      **0** |      **100,00%** | `Rp 11.100` cocok 100%.                                                                                                                                                            |
| **`lain_lain`** (dari `golongan_tarif`) |                              **22.524** |                                      **0** |      **100,00%** | `Rp 0` cocok 100%.                                                                                                                                                                 |
| **`jml_harga_air` & `total_tagihan`**   | **356** (semua yang `pakai_drd = 0 m³`) | **22.168** (semua yang `pakai_drd > 0 m³`) |        **1,58%** | Selisih **100% berasal dari tabel angka `harga_per_m3` di [seed-tarif.ts](file:///E:/Coding/elysia/packages/db/src/seed-tarif.ts) yang berbeda dari tarif blok yang dipakai CSV**. |

### 1.2 Pola Penyebab Selisih (Bukan Pembulatan / Denda / Batas Blok, Melainkan Tabel `tarif_blok` di `seed-tarif.ts`!)

Saya melakukan deduksi aljabar linier terhadap seluruh 22.168 baris yang memiliki `pakai_drd > 0` di `ProgresCater-PW5.csv` untuk mengekstrak tarif per m³ Blok 1 (`1–10 m³`), Blok 2 (`11–20 m³`), Blok 3 (`21–30 m³`), dan Blok 4 (`>30 m³`) yang sesungguhnya dipakai oleh sistem lama saat menerbitkan CSV Oktober.

Hasilnya mengejutkan: **Jika menggunakan tabel tarif blok hasil ekstraksi CSV di bawah ini, maka 22.522 dari 22.524 pelanggan (99,991%) cocok Rp 0 selisih!** (Hanya 2 baris anomali data di CSV yang berbeda).

Berikut perbandingan angka `harga_per_m3` di [seed-tarif.ts](file:///E:/Coding/elysia/packages/db/src/seed-tarif.ts) saat ini vs **Tarif Blok Aktual di CSV `ProgresCater-PW5.csv`**:

| Kode Golongan (`trp`) | Jml SL di CSV | Tarif Blok 1..4 di `seed-tarif.ts` Saat Ini (Rp/m³) | Tarif Blok 1..4 Aktual di CSV `ProgresCater-PW5.csv` (Rp/m³) | Kecocokan Jika Pakai Tarif Aktual CSV                     |
| --------------------- | ------------: | --------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| **`1A`**              |           179 | `1.050 / 1.250 / 1.500 / 1.800`                     | **`900 / 900 / 900 / 1.300`**                                | **179 / 179 (100% Cocok)**                                |
| **`1B`**              |            44 | `1.250 / 1.550 / 1.950 / 2.450`                     | **`900 / 900 / 1.400 / 2.900`**                              | **44 / 44 (100% Cocok)**                                  |
| **`2A1`**             |             6 | `2.200 / 2.800 / 3.500 / 4.500`                     | **`1.000 / 1.600 / 2.300 / 5.500`**                          | **6 / 6 (100% Cocok)**                                    |
| **`2A2`**             |           431 | `2.800 / 3.600 / 4.800 / 6.200`                     | **`2.000 / 3.600 / 5.700 / 8.800`**                          | **431 / 431 (100% Cocok)**                                |
| **`2A3`**             |         9.373 | `3.500 / 4.500 / 6.000 / 7.800`                     | **`3.120 / 5.520 / 8.880 / 12.840`**                         | **9.373 / 9.373 (100% Cocok)**                            |
| **`2A4`**             |         7.767 | `4.200 / 5.500 / 7.200 / 9.500`                     | **`3.960 / 7.200 / 11.280 / 15.120`**                        | **7.767 / 7.767 (100% Cocok)**                            |
| **`2A5`**             |            22 | `5.000 / 6.800 / 9.000 / 12.000`                    | **`4.800 / 8.880 / 13.680 / 17.400`**                        | **22 / 22 (100% Cocok)**                                  |
| **`2B`**              |            96 | `5.500 / 7.000 / 9.200 / 12.500`                    | **`3.150 / 5.700 / 9.000 / 12.750`**                         | **95 / 96** _(1 anomali CSV: `00008001503`)_              |
| **`3A`**              |         1.196 | `7.200 / 8.500 / 10.500 / 13.000`                   | **`4.350 / 7.950 / 13.050 / 18.900`**                        | **1.196 / 1.196 (100% Cocok)**                            |
| **`3B`**              |         3.295 | `10.500 / 13.000 / 15.500 / 18.000`                 | **`6.900 / 10.800 / 16.050 / 21.600`**                       | **3.295 / 3.295 (100% Cocok)**                            |
| **`3C`**              |            55 | `12.000 / 15.000 / 18.000 / 22.000`                 | **`9.450 / 13.650 / 19.050 / 24.300`**                       | **55 / 55 (100% Cocok)**                                  |
| **`4A`**              |            26 | `11.000 / 13.500 / 16.500 / 20.000`                 | **`7.350 / 11.250 / 14.550 / 19.350`**                       | **25 / 26** _(1 pelanggan `78 m³` menentukan Blok 3 & 4)_ |
| **`4B`**              |            34 | `13.500 / 16.500 / 20.000 / 25.000`                 | **`10.200 / 14.400 / 19.950 / 24.450`**                      | **34 / 34 (100% Cocok)**                                  |

_(Catatan tentang 1 baris anomali di golongan `2B`: Pelanggan `00008001503` — `RM.TINGGAL PANGDAM VI/SL` memiliki `pakai_drd = 3.000 m³` dan `jmlhargaair = Rp 10.391.250`, yang berarti di aplikasi lama ditagih menggunakan tarif khusus/kontrak militer `[3.150, 3.300, 3.300, 3.475]`, sedangkan 95 pelanggan `2B` lainnya termasuk `KOTAMADYA DT II BANDUNG` dengan `12.789 m³` persis 100% mengikuti tarif `[3.150, 5.700, 9.000, 12.750]`)._

### 1.3 Daftar 20 Selisih Terbesar (Antara `seed-tarif.ts` Saat Ini vs CSV `202610`)

|  No | `nolg`        | Nama Pelanggan              | Gol (`trp`) | Uk Meter | `pakai_drd` (m³) | Harga Air CSV (Rp) | Harga Air Engine Saat Ini (Rp) | Selisih Harga Air & Total (Rp) |
| --: | ------------- | --------------------------- | ----------- | -------- | ---------------: | -----------------: | -----------------------------: | -----------------------------: |
|   1 | `00008001503` | RM.TINGGAL PANGDAM VI/SL    | `2B`        | `1`      |            3.000 |         10.391.250 |                     37.342.000 |                **+26.950.750** |
|   2 | `00102100110` | PT.SANBE KARYAPERSADA/HOTEL | `3B`        | `2`      |            6.750 |        145.489.500 |                    121.350.000 |                **-24.139.500** |
|   3 | `00300700360` | LA GRANDE APART.            | `3B`        | `1/2`    |            3.959 |         85.203.900 |                     71.112.000 |                **-14.091.900** |
|   4 | `00007801527` | KOTAMADYA DT II BANDUNG     | `2B`        | `3`      |           12.789 |        162.855.750 |                    159.704.500 |                 **-3.151.250** |
|   5 | `00406000490` | Drs.R.WIKARNO               | `2A4`       | `1/2`    |              371 |          5.380.320 |                      3.408.500 |                 **-1.971.820** |
|   6 | `00006901315` | PENDOPO                     | `3C`        | `2`      |              829 |         19.837.200 |                     18.028.000 |                 **-1.809.200** |
|   7 | `00801400491` | BANK RAKYAT INDONESIA       | `3B`        | `1`      |              508 |         10.662.300 |                      8.994.000 |                 **-1.668.300** |
|   8 | `00101900760` | PT. B.E.C.                  | `3B`        | `2`      |              476 |          9.971.100 |                      8.418.000 |                 **-1.553.100** |
|   9 | `00005601306` | P.L.N. EXPL. XI             | `3B`        | `1`      |              400 |          8.329.500 |                      7.050.000 |                 **-1.279.500** |
|  10 | `00101900820` | A.B.A. YAPARI BANDUNG       | `3B`        | `1/2`    |              377 |          7.832.700 |                      6.636.000 |                 **-1.196.700** |
|  11 | `00906550765` | HUSAINI MAHDIN IMAN         | `2A3`       | `1/2`    |              247 |          2.961.480 |                      1.832.600 |                 **-1.128.880** |
|  12 | `00901310465` | DIDA DJOEBAEDAH             | `2A4`       | `1/2`    |              211 |          2.961.120 |                      1.888.500 |                 **-1.072.620** |
|  13 | `00900900904` | ASEP MULYADI                | `2A3`       | `1/2`    |              220 |          2.614.800 |                      1.622.000 |                   **-992.800** |
|  14 | `00904820078` | AAS ASMARA                  | `2A3`       | `1/2`    |              214 |          2.537.760 |                      1.575.200 |                   **-962.560** |
|  15 | `00302600065` | BANK.JABAR                  | `3B`        | `2`      |              300 |          6.169.500 |                      5.250.000 |                   **-919.500** |
|  16 | `00900400090` | KAN HIE TIE                 | `3B`        | `1/2`    |              300 |          6.169.500 |                      5.250.000 |                   **-919.500** |
|  17 | `00102000310` | R.SOEDIONO                  | `2A4`       | `1/2`    |              176 |          2.431.920 |                      1.556.000 |                   **-875.920** |
|  18 | `00905300157` | CHALIS                      | `2A3`       | `1/2`    |              195 |          2.293.800 |                      1.427.000 |                   **-866.800** |
|  19 | `00403100425` | OEOEN BUDIMAN               | `3B`        | `1/2`    |              256 |          5.219.100 |                      4.458.000 |                   **-761.100** |
|  20 | `00904820115` | NUNUNG NUGRAHA              | `2A3`       | `1/2`    |              168 |          1.947.120 |                      1.216.400 |                   **-730.720** |

> [!WARNING]
> **Keputusan yang Diperlukan untuk Poin 1**:
> Apakah Anda ingin saya memperbarui angka `harga_per_m3` di [seed-tarif.ts](file:///E:/Coding/elysia/packages/db/src/seed-tarif.ts) dengan **Tarif Blok Aktual CSV** pada tabel 1.2 di atas agar perhitungan tagihan `ClosingService` cocok 99,991% (22.522/22.524 pelanggan, 0 selisih rumus) dengan `ProgresCater-PW5.csv`?

---

## 2. Perilaku Bulan Terlewat (Pelanggan Tanpa Pembacaan Saat Closing)

### 2.1 Penjelasan dari Kode Saat Ini & Bukti Hasil Simulasi

Berdasarkan kode di [closing.service.ts](file:///E:/Coding/elysia/apps/web/src/server/services/closing/closing.service.ts#L308-L598) dan [carry-forward.ts](file:///E:/Coding/elysia/packages/db/src/carry-forward.ts#L228-L250) serta hasil simulasi pada pelanggan `00009004590` (`stma 202610 = 3909`, `pakai 202610 = 27 m³`, sengaja tidak dicatat di `202611`):

1. **Apakah pada `pratinjauClosing` muncul peringatan?**
   - **Ya.** Di `pratinjauClosing` ([closing.service.ts](file:///E:/Coding/elysia/apps/web/src/server/services/closing/closing.service.ts#L384-L391)), sistem mendeteksi `dpmBelumSelesai = 1` dan menambahkan item hambatan `DPM_BELUM_SELESAI` (_"Target pencatatan meter belum mencapai 100%... Masih ada 1 pelanggan yang belum dicatat"_).
   - Namun, pada [closing.service.ts](file:///E:/Coding/elysia/apps/web/src/server/services/closing/closing.service.ts#L462-L467) (`bisaDitutup`) dan `eksekusiClosing` (L494–L548), guard penolakan keras (throw error) hanya memeriksa: (a) mutasi ganti meter `PENDING == 0`, dan (b) seluruh bacaan yang masuk di `cater_baca_meter` sudah `APPROVED_FINAL`. Ia **tidak memblokir** `eksekusiClosing` jika masih ada baris `daftar_catat` yang `BELUM_DICATAT`.
2. **Apakah DRD diterbitkan untuk pelanggan yang terlewat, dan berapa pemakaian/tagihannya?**
   - **TIDAK diterbitkan DRD.** Karena `eksekusiClosing` hanya mengiterasi `cater_baca_meter` periode tersebut (`22.495` pelanggan yang terbaca), pelanggan `00009004590` yang tidak memiliki baris di `cater_baca_meter('202611')` **tidak dibuatkan baris di `rekening_drd('202611')`** (pemakaian = tidak ada, tagihan = tidak ada / unbilled).
3. **Bagaimana `stand_awal` dan `pakai_lalu` terisi di periode berikutnya (`202612`)?**
   - Saat `bukaBulanBaru('202611' -> '202612')` dipanggil, `carryForwardPeriode` melihat bahwa `00009004590` tidak memiliki baris di `cater_baca_meter('202611')`, sehingga ia mengambil fallback dari `daftar_catat('202611')`:
     - `stand_awal('202612') = 3909.00` (tetap stand akhir Oktober).
     - `pakai_lalu('202612') = 27.00` (tetap pemakaian Oktober).
4. **Bagaimana pembacaan 2 bulan di periode berikutnya (`202612`) dihitung?**
   - Saat di bulan Desember (`202612`) meter pelanggan akhirnya dibaca (misal angka meter sudah berjalan 2 bulan dari `3909` menjadi `3963` = akumulasi `54 m³`), maka `pakai_m3` Desember akan menjadi `3963 - 3909 = 54 m³` dalam **1 rekening Desember**.
   - **Dampak finansialnya bagi pelanggan**: Karena tarif progresif PDAM dihitung per rekening bulanan (`1–10 m³` Blok 1, `11–20 m³` Blok 2, `21–30 m³` Blok 3, `>30 m³` Blok 4), jika `54 m³` ditagihkan sekaligus di bulan Desember, maka **`24 m³` masuk ke Blok 4 (tarif termahal)**, padahal jika dicatat tiap bulan (`27 m³` di November dan `27 m³` di Desember), pelanggan sama sekali tidak terkena Blok 4! Selain itu, PDAM kehilangan 1 bulan biaya tetap (`bea_beban + bea_admin + air_kotor`) di bulan November.

### 2.2 Tiga Opsi Penanganan Bulan Terlewat (Menunggu Keputusan Anda)

| Opsi                                                            | Aturan Bisnis & Mekanisme                                                                                                                                                                                                                                                                                                                                                                                                                     | Dampak ke Pelanggan & PDAM                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Opsi 1 (Standar Operasional PDAM — Blokir Closing 100% DPM)** | **Wajib 100% DPM tercatat sebelum Closing (`dpmBelumSelesai === 0`)**. Tambahkan guard keras di `eksekusiClosing`: jika masih ada pelanggan aktif di `daftar_catat` yang `status = 'BELUM_DICATAT'`, tolak `eksekusiClosing` dan arahkan operator untuk menyelesaikan lewat fitur **Manual ADD & Taksasi Massal** (`manual-add-masal.service.ts` yang sudah ada di aplikasi: mengisi `stma = stml` dan `pakai_tagih = taksasi/minimum 5 m³`). | - Tidak pernah ada pelanggan aktif yang unbilled (0 selisih antara DPM dan DRD).<br>- PDAM tetap menerima pendapatan biaya tetap + taksasi bulan tersebut.<br>- Saat bulan depan terbaca fisik, perlu mekanisme kompensasi/rekonsiliasi atas m³ yang sudah ditaksir bulan lalu. |
| **Opsi 2 (Otomatis Taksir / Minimum saat Closing)**             | Jika saat `eksekusiClosing` masih ada DPM `BELUM_DICATAT`, sistem otomatis membuat bacaan `OFFSITE / TAKSASI` dengan `stma = stml` dan `pakai_tagih = pakai_lalu` (atau minimum 5 m³), lalu menerbitkan DRD untuk seluruh pelanggan aktif.                                                                                                                                                                                                    | - 100% pelanggan aktif tetap terbit DRD.<br>- Risiko: jika petugas lupa upload bacaan, pelanggan langsung tertagih taksasi tanpa review supervisor.                                                                                                                             |
| **Opsi 3 (Biarkan Boleh Unbilled + Prorata Blok 2 Bulan)**      | Tetap izinkan pelanggan dilewati tanpa DRD di bulan `N`, tetapi saat dibaca di bulan `N+1`, lebar setiap blok tarif dikalikan jumlah bulan (`1..20 m³` Blok 1, `21..40 m³` Blok 2, dst.).                                                                                                                                                                                                                                                     | - Pelanggan tidak dirugikan tarif progresif Blok 4.<br>- Risiko: melanggar prinsip rekonsiliasi 4 pilar PDAM (`DPM == Baca == DRD`), dan laporan keuangan bulanan menjadi bolong.                                                                                               |

---

## 3. Daftar Normalisasi Kode Rute oleh Seed

Di seluruh [ProgresCater-PW5.csv](file:///E:/Coding/elysia/packages/db/data/raw/ProgresCater-PW5.csv) (22.524 baris), **hanya ada 1 baris (1 pelanggan)** yang mengalami normalisasi kode rute saat seed ([import-progres-cater.ts](file:///E:/Coding/elysia/packages/db/src/etl/import-progres-cater.ts#L173-L176)):

| Baris CSV | `nolg`        | Nama Pelanggan | `nprs` di CSV       | `rute_kode` Sumber CSV | `pencatat` Sumber CSV | Hasil Normalisasi (`rute_kode` → `pencatat`) | Alasan Normalisasi                                                                                                                                                                                                                                                                                                                                           |
| --------: | ------------- | -------------- | ------------------- | ---------------------- | --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|    **87** | `00904801141` | DONI RAMDAN    | **`KD308`**`030003` | `KC308`                | `"-"` (Kosong)        | **`KD308`** → **`PERIYADI`**                 | Di CSV hanya ada 1 baris dengan `rute_kode = 'KC308'` dan kolom `pencatat = '-'`. Padahal prefix kode sambungan `nprs`-nya adalah **`KD308`** (`KD308030003`), dan rute `KD308` adalah rute resmi milik petugas `PERIYADI` (212 pelanggan). Salah ketik `KC308` di data sumber ini menyebabkan rute yatim tanpa petugas jika tidak dinormalisasi ke `KD308`. |

- **Jumlah pelanggan terdampak**: **1 pelanggan** (`00904801141`).
- **Perubahan rute lainnya**: **0** (125 rute lainnya masuk apa adanya sesuai CSV).

---

## 4. Isi Lengkap Tabel `biaya_tetap` (9 Baris)

Berikut adalah seluruh **9 baris** di tabel referensi `biaya_tetap` saat ini di database:

|  No | `id`                  | `jenis` (Komponen) | `ukuran_meter` |  `nominal` (Rp) | `berlaku_mulai`       | `berlaku_sampai` |
| --: | --------------------- | ------------------ | -------------- | --------------: | --------------------- | ---------------- |
|   1 | `bt-beban-1/2`        | `BEA_BEBAN`        | **`1/2`**      |   **`7000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   2 | `bt-beban-3/4`        | `BEA_BEBAN`        | **`3/4`**      |   **`7000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   3 | `bt-beban-1`          | `BEA_BEBAN`        | **`1`**        |  **`43000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   4 | `bt-beban-1-1/2`      | `BEA_BEBAN`        | **`1 1/2`**    |  **`72000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   5 | `bt-beban-2`          | `BEA_BEBAN`        | **`2`**        | **`129000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   6 | `bt-beban-3`          | `BEA_BEBAN`        | **`3`**        | **`158000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   7 | `bt-beban-4`          | `BEA_BEBAN`        | **`4`**        | **`187000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   8 | `bt-admin-default`    | `BEA_ADMIN`        | `NULL`         |  **`10000.00`** | `2024-01-01 00:00:00` | `NULL`           |
|   9 | `bt-airkotor-default` | `AIR_KOTOR`        | `NULL`         |  **`11100.00`** | `2024-01-01 00:00:00` | `NULL`           |

---

## 5. Cek Sisa Simulasi & Daftar Akun Pengguna / Peran Login

### 5.1 Semua Tabel yang Ditulis oleh `ClosingService`, `GwmService`, `BulanBaruService`, dan `PelangganService`

| Nama Tabel             | Ditulis Oleh Service                                                   | Jumlah Baris Sekarang | Rincian per Periode / Status Saat Ini                                           | Sisa Simulasi?      |
| ---------------------- | ---------------------------------------------------------------------- | --------------------: | ------------------------------------------------------------------------------- | ------------------- |
| `periode_penagihan`    | `ClosingService`, `BulanBaruService`                                   |                 **2** | `202610` (`TERKUNCI`: 1), `202611` (`BERJALAN`: 1)                              | **0 Sisa** (Bersih) |
| `daftar_catat`         | `ClosingService`, `BulanBaruService`, `GwmService`, `PelangganService` |            **45.019** | `202610` (`DICATAT`: 22.495, `DICABUT`: 29), `202611` (`BELUM_DICATAT`: 22.495) | **0 Sisa** (Bersih) |
| `cater_baca_meter`     | `ClosingService`, `GwmService`                                         |            **22.524** | `202610` (`LOCKED_BILLING`: 22.524), `202611` (**0 baris**)                     | **0 Sisa** (Bersih) |
| `cater_verifikasi_log` | `GwmService`                                                           |                 **0** | 0 baris                                                                         | **0 Sisa** (Bersih) |
| `rekening_drd`         | `ClosingService`                                                       |            **22.524** | `202610` (`BELUM_LUNAS`: 22.524), `202611` (**0 baris**)                        | **0 Sisa** (Bersih) |
| `water_meter_mutasi`   | `GwmService`, `ClosingService`                                         |                 **0** | 0 baris                                                                         | **0 Sisa** (Bersih) |
| `gwm_baca_meter`       | `GwmService`                                                           |                 **0** | 0 baris                                                                         | **0 Sisa** (Bersih) |
| `water_meter`          | `GwmService`, `PelangganService`                                       |            **21.838** | 21.838 meter unik valid dari CSV                                                | **0 Sisa** (Bersih) |
| `pelanggan`            | `ClosingService`, `GwmService`, `PelangganService`                     |            **22.524** | 22.524 pelanggan dari CSV (`29` `DICABUT`, `22.495` Aktif)                      | **0 Sisa** (Bersih) |

### 5.2 Daftar Akun Pengguna & Peran (RBAC) yang Dibuat oleh Seed untuk Login

Ya, `bun run db:seed` menjalankan `seedAccounts` ([seed-accounts.ts](file:///E:/Coding/elysia/packages/db/src/seed-accounts.ts)) yang membuat **15 akun pengguna resmi** di tabel `user`, `account` (Better Auth credential dengan password dari `SEED_DEFAULT_PASSWORD`), dan `user_roles` (23 baris penugasan role RBAC):

|   No | `id`                 | Email Login                                                                                                                   | Nama                        | Role Utama (`user.role`) | Role RBAC (`user_roles`)                                                       |
| ---: | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
|    1 | `user-superadmin`    | `wiska.prayoga@gmail.com`                                                                                                     | Wiska Prayoga               | `superadmin`             | `SUPERADMIN, STAFF_ADMIN_BILLING, VERIFIKATOR_1, VERIFIKATOR_2, VERIFIKATOR_3` |
|    2 | `seed-user-1`        | `demo@example.com`                                                                                                            | Demo Admin                  | `superadmin`             | `SUPERADMIN, STAFF_ADMIN_BILLING, VERIFIKATOR_1, VERIFIKATOR_2, VERIFIKATOR_3` |
|    3 | `user-staff-billing` | `staff.billing@pdam.co.id`                                                                                                    | Staff Admin Billing         | `staff_admin_billing`    | `STAFF_ADMIN_BILLING`                                                          |
|    4 | `user-verifikator-1` | `verifikator1@pdam.co.id`                                                                                                     | Supervisor Verifikator 1    | `verifikator_1`          | `VERIFIKATOR_1`                                                                |
|    5 | `user-verifikator-2` | `verifikator2@pdam.co.id`                                                                                                     | Manager Verifikator 2       | `verifikator_2`          | `VERIFIKATOR_2`                                                                |
|    6 | `user-verifikator-3` | `verifikator3@pdam.co.id`                                                                                                     | Direksi Verifikator 3       | `verifikator_3`          | `VERIFIKATOR_3`                                                                |
| 7–15 | `user-pencatat-*`    | `dadang@cater.pdam.co.id`, `periyadi@...`, `omay@...`, `iwan@...`, `agus@...`, `didin@...`, `rudy@...`, `dani@...`, `edi@...` | 9 Petugas Pencatat Lapangan | `pencatat`               | `PENCATAT`                                                                     |

---

## 6. Penyelesaian Poin 6 (Guard Produksi, Tes Regresi Otomatis, Runbook, & `.gitignore`)

1. **Guard Seed & Reset Produksi**:
   - [clean.ts](file:///E:/Coding/elysia/packages/db/src/clean.ts#L36-L41): Menolak mereset database apabila `NODE_ENV === 'production'` kecuali `ALLOW_PRODUCTION_DB_RESET=true`.
   - [seed.ts](file:///E:/Coding/elysia/packages/db/src/seed.ts#L21-L26): Menolak menjalankan seed otomatis apabila `NODE_ENV === 'production'` kecuali `ALLOW_PRODUCTION_SEED=true`.
2. **Tes Regresi Otomatis (Read-Only dengan Rollback Transaction)**:
   - Dibuat di [VerifySeedAndScenarios.test.ts](file:///E:/Coding/elysia/packages/db/src/__tests__/VerifySeedAndScenarios.test.ts) dan telah dijalankan (`bun test src/__tests__/VerifySeedAndScenarios.test.ts` → **4 pass, 0 fail, 36 assertions**).
3. **Runbook Go-Live**:
   - Dibuat di [SEED-DAN-GO-LIVE.md](file:///E:/Coding/elysia/docs/SEED-DAN-GO-LIVE.md).
4. **Pembaruan `.gitignore`**:
   - Diperbarui di [.gitignore](file:///E:/Coding/elysia/.gitignore#L51-L57) untuk mengabaikan `packages/db/backups/`, `packages/db/data/exports/`, `packages/db/data/raw/*.csv`, `packages/db/data/jan/*.csv`, serta `.env` / `.env*.local`.
