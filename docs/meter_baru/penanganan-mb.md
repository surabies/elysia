# Blueprint Final: Penanganan Meter Baru (`MB`), Muda Kembali (*Rollover*), & Kubikasi Negatif

Dokumen ini adalah rancangan final siap-eksekusi yang menggabungkan **audit kode**, **standar SNI 2547 / ISO 4064 & Enterprise CIS (SAP IS-U / Oracle MDM)**, serta **bukti data riil dari database proyek Anda saat ini**.

---

## 1. Keputusan Terbaik untuk Kasus #1: Mengganti "Trik Bypass Aurora" dengan Cara yang Sama Cepat tapi Jujur Audit

### Mengapa Trik Lama di Aurora Berbahaya?
Di aplikasi lama (Aurora), ketika petugas lalai tidak mencatat `Stand Angkat` dan `No. Meter Baru`:
- Operator menyamakan `Stand Angkat = Stand Awal` agar rumus $( \text{Stand Angkat} - \text{Stand Awal} ) + \text{Stand Baru}$ menghasilkan $0 + \text{Stand Baru}$.
- Sistem menyalin `No. Meter Lama` ke `No. Meter Baru`.

**Kelemahan fatal trik tersebut:** Database tidak bisa membedakan mana pelanggan yang *memang riil pemakaian meter lamanya 0 m³* dengan mana pelanggan yang *petugasnya lupa mencatat Stand Angkat*. Selain itu, menyalin nomor meter lama ke kolom nomor meter baru merusak akurasi inventaris aset meter fisik di lapangan.

### Solusi Terbaik yang Kita Terapkan (*Zero Friction, Zero Fake Data*)
Operator mendapatkan **kemudahan secepat Aurora**, namun data tetap **100% jujur secara audit**:

1. **Field `Stand Angkat Meter Lama` Dibuat Opsional (Tanpa Perlu Mengisi Angka Palsu)**:
   - **Jika Stand Angkat ada**: Operator cukup mengisi angkanya ($\ge \text{Stand Awal}$). Sistem menghitung *Split-Read*:
     $$\text{Pakai} = (\text{Stand Angkat} - \text{Stand Awal}) + (\text{Stand Meter Baru} - \text{Stand Pasang})$$
   - **Jika Stand Angkat tidak dicatat petugas**: Operator **cukup mengosongkan field Stand Angkat** (tidak perlu mengetik ulang angka `Stand Awal`). Sistem otomatis menghitung dari meter baru saja:
     $$\text{Pakai} = \text{Stand Meter Baru} - \text{Stand Pasang}$$
     *(dengan tetap mengikuti aturan pemakaian minimum golongan tarif saat penetapan tagihan)*, dan menyimpan `stand_angkat = NULL` dengan jejak keterangan `[MB Tanpa Stand Angkat]`.
2. **Field `No. Meter Baru` Opsional Tanpa Menimpa Palsu**:
   - **Jika terlihat di foto / diketahui operator**: Diisi langsung -> sistem otomatis memperbarui `pelanggan.no_meter` dan tabel aset `water_meter`.
   - **Jika tidak diketahui (kosong)**: `pelanggan.no_meter` tetap dipertahankan (agar relasi tagihan aman), namun `water_meter_mutasi.no_meter_baru` dibiarkan `NULL` dan flag `pelanggan.perlu_verifikasi = true` diaktifkan supaya tim lapangan tahu nomor seri meter rumah tersebut perlu didata ulang.

---

## 2. Keputusan Final Kasus #2: Mutasi dari Meja Verifikasi Otomatis Sah (`APPROVED`)

Sesuai arahan Anda:
- Saat operator/verifikator menyimpan koreksi `MB` di halaman **Verifikasi Petugas** ([verifikasi.router.ts](file:///C:/Users/DESKTOP/Documents/elysia/packages/backend/src/modules/pencatat-meter/verifikasi/verifikasi.router.ts)), backend otomatis melakukan *upsert* ke tabel `water_meter_mutasi` (`mutasi-{thbl}-{nolg}`), menautkan `water_meter_mutasi_id`, dan langsung menetapkan status mutasi menjadi **`APPROVED`** (bukan `PENDING`).
- Dengan demikian:
  1. Alert error *"Stand angkat hanya dapat disimpan jika laporan terhubung ke data mutasi meter"* **hilang selamanya**.
  2. Laporan langsung mulus berlanjut ke jenjang verifikasi **V1 → V2 → V3**.
  3. **Gate 1 di Konsol Tutup Bulan (`1. Persetujuan Ganti Meter`) tidak akan terganjal kerja dua kali**, karena persetujuan mutasi sudah terwakili oleh rantai verifikasi resmi.

---

## 3. Riset & Rumus Matang Kasus #3: `U | MUDA KEMBALI` (*Dial Rollover*)

### A. Validasi Rumus Matematika Anda
Contoh hitungan yang Anda sampaikan:
> Meter 4-digit (`10.000`), angka terakhir tercatat `9.998`, stand muda kembali `10`:
> $(10.000 - 9.998) + 10 = 2 + 10 = \mathbf{12\text{ m³}}$

> [!IMPORTANT]
> **Rumus Anda 100% TEPAT secara matematis dan metrologis!**
> Pada roda register 4-digit (`0000`–`9999`), perpindahan dari `9998 -> 9999` adalah `1 m³`, dan perpindahan dari `9999 -> 0000` adalah `1 m³` lagi (`total 2 m³`), ditambah `0000 -> 0010` (`10 m³`) = **`12 m³`**.
> Jadi batas putar (*rollover modulus*) untuk $D$ digit angka hitam ($m^3$) selalu **$10^D$** (`10.000`, `100.000`, `1.000.000`), **bukan** `9.999`.

$$\text{Pemakaian Muda Kembali } (V_{\text{rollover}}) = (10^D - \text{Stand Awal}) + \text{Stand Akhir}$$

---

### B. Bukti Fakta Mengejutkan dari Database Riil Proyek Anda!
Kami menjalankan kueri audit langsung terhadap data riil pelanggan dan bacaan meter di PostgreSQL Anda, dan menemukan **2 fakta krusial**:

1. **Kondisi `U | MUDA KEMBALI` Sudah Ada di Database, Tapi `mode_hitung`-nya Masih Salah!**
   Di tabel `master_kondisi_catat`:
   - `kode_tmss = 'U'`, `nama = 'MUDA KEMBALI'`, saat ini `mode_hitung` masih bernilai `'SELISIH_FISIK'`!
   - Akibatnya pada data riil Anda (contoh: pelanggan `00900800720` dengan `stml = 9.989 -> stma = 25` dan `00904620039` dengan `stml = 9.849 -> stma = 37`), mesin anomali saat ini salah mencapnya sebagai **`ANOM_METER_MUNDUR`**!
   - Kita wajib menambahkan mode hitung resmi baru: **`mode_hitung = 'MUDA_KEMBALI'`** (Rollover).

2. **Ukuran `1/2"` Tidak Selalu 4-Digit (`10.000`)! (Bukti Data Pelanggan Anda)**:
   Berdasarkan standar **SNI 2547 / ISO 4064**, warna hitam adalah satuan $m^3$, tetapi jumlah digit roda hitam bervariasi menurut **ukuran pipa DAN merek/seri register**:

   | Ukuran Meter di DB Anda | Merek di DB Anda | Stand Tertinggi Tercatat di DB Anda | Kapasitas Digit Aktual ($D$) | Batas Putar ($10^D$) |
   | :--- | :--- | ---: | :---: | ---: |
   | `1/2"` | `LIN` (Linflow), `BAR`, `ARM`, `ACT` | `9.997 m³` | **4 Digit** (`0000–9999`) | **`10.000`** |
   | `1/2"` | `ITR` (Itron — mayoritas seri lama) | `9.999 m³` | **4 Digit** (`0000–9999`) | **`10.000`** |
   | `1/2"` | `ITR` (seri baru), `PAM`, `CDC`, `RVT` | `15.767` s/d **`47.208 m³`** | **5 Digit** (`00000–99999`) | **`100.000`** |
   | `1/2"` | `SEN` (Sensus — pelanggan `00300700360`) | **`518.885 m³`** | **6 Digit** (`000000–999999`) | **`1.000.000`** |
   | `1"` & `1 1/2"` | `PAM` | `41.469` s/d **`84.913 m³`** | **5 Digit** (`00000–99999`) | **`100.000`** |
   | `2"`, `3"`, `4"` | `SEN`, `PUJ`, `AQ` | `95.482` s/d **`216.678 m³`** | **5 s/d 6 Digit** | **`100.000` / `1.000.000`** |

> [!WARNING]
> **Mengapa Tidak Boleh Hanya Hardcode dari Ukuran Meter?**
> - Jika semua `1/2"` dipaksa `10.000`, maka meter `1/2" PAM` yang stand awalnya `30.499` akan menghasilkan angka minus `-20.499`!
> - Sebaliknya, jika semua meter `2"` dipaksa `1.000.000` (6-digit), padahal ada meter `2"` 5-digit yang muda kembali dari `99.980 -> 45`, sistem akan salah menghitung `(1.000.000 - 99.980) + 45 = 900.065 m³` (tagihan miliaran rupiah), padahal seharusnya `(100.000 - 99.980) + 45 = 65 m³`!

---

### C. Algoritma *Hybrid Smart Rollover Engine* (3 Lapisan Pertahanan Anti-Meleset)

Agar perhitungan `U | MUDA KEMBALI` 100% tahan banting untuk semua ukuran & merek meter, kita terapkan algoritma 3 lapis standar CIS:

1. **Lapisan 1 — *Auto-Detect Digit dari Kedekatan Ambang Atas (`Proximity & Magnitude Inference`)*:**
   - Hitung jumlah digit minimum mutlak dari `Stand Awal`: $D_{\min} = \max(4, \lfloor \log_{10}(\max(1, \text{stml})) \rfloor + 1)$.
     *(Contoh: `stml = 9.998` $\rightarrow D_{\min} = 4$; `stml = 99.980` $\rightarrow D_{\min} = 5$; `stml = 999.950` $\rightarrow D_{\min} = 6$).*
   - Cek **Kedekatan Ambang Putar (*Rollover Zone*)**: Apakah `stml` sudah berada di $\ge 90\%$ dari $10^{D_{\min}}$ (misal $\ge 9.000$ untuk 4-digit, $\ge 90.000$ untuk 5-digit, $\ge 900.000$ untuk 6-digit)?
     - **Jika YA**: Maka kapasitas digit meter **pasti $D_{\min}$** ($10^{D_{\min}}$)! Ini bahkan menangani meter `2"` 5-digit di `99.980` secara akurat menjadi `100.000` (bukan `1.000.000`)!
     - **Jika TIDAK** (misal `stml = 8.500` pada meter besar `2"` atau `stml = 4.421` pada meter `1/2"`): Gunakan referensi `water_meter.jumlah_digit` (jika tercatat) atau tabel default ukuran pipa (`1/2"` & `3/4"` $\rightarrow 4$ digit; `1"` & `1 1/2"` $\rightarrow 5$ digit; `>= 2"` $\rightarrow 6$ digit), **disertai peringatan anomali lonjakan** untuk ditinjau verifikator!

2. **Lapisan 2 — *Plausibility Guard* (Penjaga Masuk Akal di Form Koreksi)**:
   - Jika hasil hitung `Muda Kembali` melonjak tidak wajar (misal `stml = 4.421 -> stma = 9` dipilih `Muda Kembali`, menghasilkan `5.588 m³` padahal rata-rata pakai pelanggan `15 m³`), UI langsung memberi peringatan kuning jelas:
     *"Stand awal 4.421 masih jauh dari batas putar 9.999 (menghasilkan 5.588 m³). Pastikan ini bukan pergantian Meter Baru (MB)!"*

3. **Lapisan 3 — Pemilih Digit Eksplisit di UI Saat Kondisi `MUDA_KEMBALI` Dipilih**:
   - Di `ModalKoreksi` dan Popover Tabel Verifikasi, saat memilih **Muda Kembali (`U`)**, muncul pilihan cepat kapasitas digit yang sudah otomatis memilih nilai terbaik (*auto-selected*), namun bisa di-klik manual oleh verifikator sesuai jumlah kotak hitam di foto meter:
     - `4 Digit (Maks 9.999 → 10.000)` *(Default 1/2" & 3/4")*
     - `5 Digit (Maks 99.999 → 100.000)` *(Default 1" – 1 1/2" / Seri Baru)*
     - `6 Digit (Maks 999.999 → 1.000.000)` *(Default >= 2" Industri)*

---

## 4. Daftar Eksekusi Perubahan Kode (End-to-End)

1. **Database Schema (`packages/db`)**:
   - Tambahkan kolom opsional `jumlah_digit` (`integer`, nullable) pada tabel `water_meter` untuk mendukung override spesifik aset di masa depan.
   - Update `master_kondisi_catat` untuk kode `'U'` (`MUDA KEMBALI`) menjadi `mode_hitung = 'MUDA_KEMBALI'`.
   - Perbarui `carryForwardPeriode` di [carry-forward.ts](file:///C:/Users/DESKTOP/Documents/elysia/packages/db/src/carry-forward.ts) agar membaca `ket_catat_revisi` & `stand_meter_baru_revisi`, serta me-reset `akumulasi_taksasi_m3 = '0.00'` untuk `METER_BARU` dan `MUDA_KEMBALI`.
2. **Domain Engine (`packages/backend/src/domain` & `apps/web/src/lib/domain`)**:
   - Buat fungsi murni `hitungPemakaianMudaKembali({ standAwal, standAkhir, ukuranMeter, jumlahDigitOverride })` lengkap dengan *Smart Proximity Digit Inference* dan validasi plausibilitas.
   - Perbarui `gwm.engine.ts`, `tagihan.engine.ts`, dan `anomali-evaluator.ts` agar:
     - Mendukung `MB` dengan maupun tanpa `Stand Angkat`.
     - Mendukung `MUDA_KEMBALI` (`kodeTmss === 'U'`) tanpa dicap sebagai `METER_MUNDUR`.
3. **Backend Services & Router (`verifikasi.router.ts`, `closing.service.ts`, `import-data.service.ts`, `cater-verifikasi.service.ts`)**:
   - Hilangkan *deadlock* di `PATCH /laporan-harian/:id/koreksi`: otomatis *upsert* `water_meter_mutasi` dengan status `APPROVED` saat operator menyimpan `MB` di halaman Verifikasi.
   - Jangan timpa `stml` & `stma` asli petugas saat koreksi; simpan di kolom `*_revisi`.
   - Tutup seluruh celah **Gate 4 Closing (`4. Bebas Anomali & Kubikasi Negatif`)**: blokir tegas semua baris `ANOMALY_NEGATIVE` dan semua baris `stma_efektif < stml_efektif` yang belum diselesaikan lewat `MB`, `MUDA_KEMBALI`, atau `KREDIT_TAKSASI` / Taksasi sah!
4. **Frontend Halaman Verifikasi Petugas (`ModalKoreksi.tsx`, `SelEditInline.tsx`, `hasil-pembacaan.ts`)**:
   - Form `MB`: `Stand Angkat` opsional (tanpa perlu trik samakan stand awal), `Stand Pasang` (default `0`), `No. Meter Baru` opsional, dengan *live preview* rincian meter lama + meter baru.
   - Form `MUDA_KEMBALI`: Pemilih kapasitas digit otomatis (`10.000` / `100.000` / `1.000.000`) + *live preview* rumus `(10^D - ST Awal) + ST Akhir` + peringatan plausibilitas.
