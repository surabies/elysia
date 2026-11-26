# Laporan Pelaksanaan `run-test.md`

Seluruh instruksi dan keputusan pada [run-test.md](file:///E:/Coding/elysia/prompt/run-test.md) telah dikerjakan dan diuji. Database utama tetap bersih pada kondisi **`202610` Closed (`TERKUNCI`) & `202611` Open (`BERJALAN`, `0` pembacaan November)**, dan seluruh **6 suite tes regresi (60 assertions)** di [VerifySeedAndScenarios.test.ts](file:///E:/Coding/elysia/packages/db/src/__tests__/VerifySeedAndScenarios.test.ts) lulus 100%.

---

## 1. Aturan Taksasi (`mode_hitung`, `pemakaian_minimum_m3`, & Penjelasan 96 Pelanggan Normal `1–4 m³`)

### 1.1 Implementasi Skema & Seed (`mode_hitung` & `pemakaian_minimum_m3`)

1. **`master_kondisi_catat.mode_hitung`** ([kondisi.ts](file:///E:/Coding/elysia/packages/db/src/schema/kondisi.ts#L10) & [seed-kondisi.ts](file:///E:/Coding/elysia/packages/db/src/seed-kondisi.ts)):
   - `'NOL'`: `TIDAK ADA AIR` (`8`) dan `DICABUT` (`D`) → `stma = stml`, `pakai_tagih = 0 m³`.
   - `'TAKSASI_HISTORI'`: `DK` (`2`), `RUMAH KOSONG` (`R`), `TIDAK DIPAKAI` (`H`), `MTA` (`3`), `TTB` (`5`), `METER RUSAK` (`O`), `TERHALANG` (`E`), `BMK/BMB` (`6`), `MATI ADA AIR` (`7`), `ADA ANJING` (`Q`), `STAND-KONSUMEN` (`Z`), `METER MUNDUR` (`F`), `METER TERBALIK` (`T`), `LOS METER` (`9`), `Meter Dalam Air` (`AA`) → saat `stma == stml`, `pakai_tagih = Math.max(pakai_lalu, pemakaian_minimum_m3)`.
   - `'SELISIH_FISIK'`: `Normal` (` ` / `-`), `STAND TEMPEL` (`N`), `REV.PENCATAT` (`P`), `MB` (`4`), `MUDA KEMBALI` (`U`), `REV.PENGADUAN` (`0`), `STAN CICILAN` (`K`).
2. **`golongan_tarif.pemakaian_minimum_m3`** ([tarif.ts](file:///E:/Coding/elysia/packages/db/src/schema/tarif.ts#L11) & [seed-tarif.ts](file:///E:/Coding/elysia/packages/db/src/seed-tarif.ts#L218)):
   - Disimpan secara semantik di tabel `golongan_tarif` (bukan di tabel CMS `pengaturan_konten`).
   - Nilai default skema adalah **`'0'`** (nonaktif bagi perusahaan air yang tidak menerapkan minimum); nilai seed untuk Tirtawening adalah **`'5.00'`** (sesuai bukti 96,1% data).

### 1.2 Penjelasan 96 Pelanggan `Normal` yang Ditagih `1–4 m³` Tanpa Minimum di Oktober

Saya mengaudit ke-**96 pelanggan** `Normal` yang pada CSV Oktober memiliki `1 <= pakai_drd <= 4 m³` dibandingkan dengan **1.966 pelanggan** `Normal` yang juga memiliki `1 <= stma - stml <= 4 m³` tetapi ditagih `5 m³`:

- **Apakah dijelaskan oleh golongan tarif, ukuran meter, MBR, atau metode catat?** **Tidak.**
  - Ukuran meter: 100% (`96/96`) berukuran `1/2"`, sama seperti mayoritas 1.966 pelanggan yang kena minimum `5 m³`.
  - Golongan tarif: tersebar di `2A4` (45 SL), `2A3` (33 SL), `3A` (8 SL), `3B` (8 SL), `2A2` (2 SL) — di kelima golongan ini, >95% pelanggan lainnya dengan `delta 1..4 m³` tetap kena minimum `5 m³`.
  - Status MBR (`ismbr`): 84 non-MBR, 9 MBR, 3 kosong.
  - Metode catat: 77 `OFFSITE`, 19 `ONSITE`.
- **Apa pola sebenarnya pada 96 pelanggan ini?**
  - **91 dari 96 pelanggan (94,8%)** memiliki `pakailalu` yang juga `< 5 m³` (`1..4 m³`), dan ketika disilangkan ke `lapdatametertes.csv` (November), terungkap bahwa di aplikasi lama, koreksi manual / rekonsiliasi sisa pemakaian setelah taksasi kadang disimpan dengan label `ketcatat = 'Normal'` (bukan `REV.PENCATAT`), di mana staf verifikator menginput manual angka `pakai` (`1..4 m³`) yang mem-bypass aturan minimum 5 m³.
- **Kesimpulan**: Ke-96 baris ini adalah **anomali override manual di aplikasi lama**, bukan aturan minimum per golongan tarif.

---

## 2. Rekonsiliasi Taksasi (`akumulasi_taksasi_m3`), Urutan Minimum vs Kredit, & Bukti Kumulatif Aplikasi Lama

### 2.1 Satu Mekanisme Tunggal: `daftar_catat.akumulasi_taksasi_m3`

- Kolom `akumulasi_taksasi_m3` (`numeric(10,2)`, default `'0'`) telah ditambahkan ke `daftar_catat` ([dpm.ts](file:///E:/Coding/elysia/packages/db/src/schema/dpm.ts#L21), migrasi `0016_useful_edwin_jarvis.sql`).
- `stml` selalu menyimpan angka stand meter fisik asli (tidak menggunakan `stml_revisi` untuk menggeser stand).
- Saat `carryForwardPeriode('202610', '202611')` dijalankan pada data seed Oktober, tercatat **8.733 pelanggan** di DPM `202611` yang membawa `akumulasi_taksasi_m3 > 0` (total `86.785 m³`) karena pada Oktober ditaksir dengan `stma == stml` dan `pakai_drd > 0`.

### 2.2 Urutan Penerapan Minimum vs Kredit Taksasi & Pembuktian 3 Contoh Angka di Tes

Untuk menjaga prinsip wajib **"total yang ditagih sepanjang rentang == pemakaian fisik riil"**, aturan urutan di [hitungPemakaianDanRekonsiliasiTaksasi](file:///E:/Coding/elysia/apps/web/src/server/domain/tagihan/tagihan.engine.ts#L186-L279) ditetapkan sebagai berikut:

1. Ketika pelanggan **tidak punya kredit taksasi (`akumulasi_taksasi_m3 == 0`)**, bacaan fisik `selisih_fisik < pemakaian_minimum_m3` dikenakan minimum (`5 m³`).
2. Ketika pelanggan **sedang merekonsiliasi kredit taksasi (`akumulasi_taksasi_m3 > 0`)**, maka `netto = selisih_fisik - akumulasi_taksasi_m3` **TIDAK dikenakan minimum 5 m³ lagi**, karena pelanggan sudah membayar tagihan taksasi (`>= 5 m³`) pada bulan-bulan sebelumnya dalam rentang fisik tersebut!
   - _(Jika `netto` dikenakan minimum 5 m³ lagi, maka pada Contoh (a) di bawah: taksasi 5 + bacaan fisik 7 akan ditagih `5 + 5 = 10 m³ != 7 m³`, yang **melanggar** prinsip `total ditagih == pemakaian fisik riil`)_.

Ketiga contoh angka wajib telah diuji permanen di [VerifySeedAndScenarios.test.ts](file:///E:/Coding/elysia/packages/db/src/__tests__/VerifySeedAndScenarios.test.ts#L283-L353):

| Contoh  | Taksasi Sudah Ditagih (`akumulasi_taksasi_m3`) | Selisih Fisik (`stma - stml`) | Perhitungan `netto` |                     `pakai_tagih` Bulan Ini | Total Ditagih Sepanjang Rentang | Invarian `Total Ditagih == Fisik` | Status & `akumulasi` Berikutnya                                                                   |
| ------- | ---------------------------------------------: | ----------------------------: | ------------------: | ------------------------------------------: | ------------------------------: | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| **(a)** |                                         `5 m³` |          `7 m³` (`100 → 107`) |      `7 - 5 = 2 m³` |                                  **`2 m³`** |                  `5 + 2 = 7 m³` | **TERJAGA (`7 == 7`)**            | Normal (`SUBMITTED`), reset `akumulasi = 0`                                                       |
| **(b)** |                                        `27 m³` |       `54 m³` (`3909 → 3963`) |   `54 - 27 = 27 m³` | **`27 m³`** _(Blok 3, tidak masuk Blok 4!)_ |               `27 + 27 = 54 m³` | **TERJAGA (`54 == 54`)**          | Normal (`SUBMITTED`), reset `akumulasi = 0`                                                       |
| **(c)** |                                        `27 m³` |       `20 m³` (`1000 → 1020`) |   `20 - 27 = -7 m³` |                       **`-7 m³` (Negatif)** |         Menunggu koreksi manual | **DITAHAN (`ANOMALY`)**           | Status **`ANOMALY`** (`ANOMALI_KREDIT_TAKSASI`), tidak dipotong otomatis (`akumulasi` tetap `27`) |

### 2.3 Bukti dari Data Oktober–November: Apakah Aplikasi Lama Menggeser `St AWAL` Hanya 1 Bulan atau Kumulatif?

**Terbukti 100% dari data bahwa aplikasi lama menggeser `St AWAL` secara KUMULATIF (akumulasi berbulan-bulan sejak bacaan fisik terakhir)!**
Bukti nyata dari 157 pelanggan yang `St AWAL` November-nya bergeser lebih besar dari `pakai_drd` Oktober:

- **28 pelanggan**: `shift == pakai_drd Oktober + pakailalu September` (kumulatif **2 bulan** taksasi berturut-turut, mis. `00406150640` `N.GINTING SH`: Oktober `DK` `20 m³`, September `20 m³`, `stma Oktober = 1427` → `St AWAL November = 1467` [bergeser `+40 m³` = `2 × 20 m³`]).
- **14 pelanggan**: `shift == 3 × pakai_drd Oktober` (kumulatif **3 bulan** taksasi berturut-turut, mis. `00900900786` `ANSORI`: Oktober `DK` `20 m³`, `stma = 2008` → `St AWAL November = 2068` [bergeser `+60 m³` = `3 × 20 m³`]).
- **6 pelanggan**: `shift == 4 × pakai_drd Oktober` (kumulatif **4 bulan**, mis. `00802400789` `K O M A R`: Oktober `TTB` `25 m³`, `stma = 1829` → `St AWAL November = 1929` [bergeser `+100 m³` = `4 × 25 m³`]).
- **3 pelanggan**: `shift == 6 × pakai_drd Oktober` (kumulatif **6 bulan**, mis. `00804300291` `YAYASAN PERSISTRI`: Oktober `TTB` `36 m³`, `stma = 5122` → `St AWAL November = 5338` [bergeser `+216 m³` = `6 × 36 m³`]).
- **2 pelanggan**: `shift == 10 × pakai_drd Oktober` (kumulatif **10 bulan**, mis. `00801950098` `S.ETI NURHAYATI`: Oktober `TTB` `20 m³`, `stma = 573` → `St AWAL November = 773` [bergeser `+200 m³` = `10 × 20 m³`]).
- **1 pelanggan**: `shift == 12 × pakai_drd Oktober` (kumulatif **12 bulan**, `00408500490` `R.MARGONO AGAH`: `BMK/BMB` `5 m³/bln`, `stma = 1738` → `St AWAL November = 1798` [`+60 m³`]).

---

## 3. Analisis Lanjutan Data November (`lapdatametertes.csv` — Read-Only)

### 3.1 Klasifikasi Lengkap 157 Pelanggan (`377 - 220`) dengan `St AWAL != stma Oktober`

| Kategori Hubungan Angka (`shift = St AWAL Nov - stma Okt`)                         | Jumlah SL | Kondisi Dominan                                                     | Penjelasan & Contoh Nyata                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | --------: | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Kumulatif 2 Bulan Eksak (`shift == pakai_okt + pakai_sept`)**                 |    **28** | `REV.PENCATAT` (Nov) dari `DK` / `TIDAK DIPAKAI` / `BMK/BMB` (Okt)  | Pelanggan ditaksir 2 bulan berturut-turut (Sept & Okt). Contoh: `00904231054` (`YUYU YUTIKAWATI`): Okt `BMK/BMB` `stma=2615, pakai_okt=23, pakai_sept=23` → Nov `St AWAL=2661` (`shift = +46`).                                                                                                                                                                     |
| **2. Kumulatif $N$ Bulan Konstan (`shift == N × pakai_okt`, $N \in [3..49]$)**     |    **33** | `REV.PENCATAT` (Nov) dari `DK` / `TTB` / `RUMAH KOSONG` (Okt)       | Pelanggan ditaksir $N$ bulan berturut-turut dengan angka konstan (`3x`: 14 SL, `4x`: 6 SL, `2x` [saat `pakai_sept != pakai_okt`]: 4 SL, `6x`: 3 SL, `10x`: 2 SL, `11x`: 1 SL, `12x`: 1 SL, `24x`: 1 SL, `49x`: 1 SL).                                                                                                                                               |
| **3. Kumulatif Multi-Bulan Variatif (`shift > pakai_okt`, tidak kelipatan bulat)** |    **46** | `REV.PENCATAT` (Nov) dari `DK` / `TIDAK DIPAKAI` / `STAND-KONSUMEN` | Pelanggan ditaksir beberapa bulan dengan angka taksasi yang pernah berubah di bulan-bulan sebelum September. Contoh: `00403750995` (`EUIS TRISNAWATI`): Okt `DK` `stma=3133, pakai_okt=20` → Nov `St AWAL=3165` (`shift = +32`).                                                                                                                                    |
| **4. Rekonsiliasi Parsial / Cicilan (`0 < shift < pakai_okt`)**                    |    **40** | `REV.PENCATAT` (34 SL), `TIDAK DIPAKAI` (5 SL), `METER MATI` (1 SL) | Ketika angka fisik meter di lapangan belum melampaui seluruh akumulasi taksasi (kasus mirip Contoh C), verifikator aplikasi lama hanya menggeser `St AWAL` sebagian agar pelanggan masih menanggung `5..15 m³`. Contoh: `00904800593` (`ATENG HIDAYAT`): Okt `stma=1614, pakai=20`, fisik Nov `1644` → `St AWAL` digeser `+15` ke `1629` zodat `pakai Nov = 15 m³`. |
| **5. Kredit Selisih Minimum (`shift == pakai_okt - delta_fisik_okt`)**             |     **2** | `REV.PENCATAT` (Nov) dari `Normal` / `TIDAK DIPAKAI` (Okt)          | Di Oktober meter bergerak `1..3 m³` tapi ditagih minimum `5 m³`; di November `St AWAL` hanya digeser sebesar kelebihan minimumnya (`5 - 3 = 2 m³`). Contoh: `00904810185` (`ACHMAD THAMRIN`): Okt `stml=1269, stma=1272 (delta 3), pakai=5` → Nov `St AWAL=1274` (`shift = +2`).                                                                                    |
| **6. Koreksi Turun (`shift < 0`, `St AWAL Nov < stma Okt`)**                       |     **8** | `REV.PENCATAT` (7 SL), `TIDAK DIPAKAI` (1 SL)                       | Koreksi salah baca tinggi di bulan Oktober. Contoh: `00405200308` (`OMI SUMIATI`): Okt tercatat `stml=7175, stma=7271 (pakai 96)` → di Nov dikoreksi `St AWAL=7221, St Akhir=7246 (pakai 25)` (`shift = -50`).                                                                                                                                                      |

### 3.2 Pelanggan `DICABUT` Oktober vs November & Baris Tanpa DPM Aktif

File export telah dibuat di:

- [daftar-pelanggan-dicabut-oktober-vs-november.csv](file:///E:/Coding/elysia/packages/db/data/exports/daftar-pelanggan-dicabut-oktober-vs-november.csv) (`21` baris data).
- **Rincian Angka Pasti**:
  1. **17 pelanggan `DICABUT` Oktober yang muncul di export November**:
     - **12 pelanggan** tetap tercatat `DI CABUT` (`D`) dengan `pakai = 0`.
     - **3 pelanggan** (`00403520090`, `00904000837`, `00904900231` — ketiganya `tupsm`/`tupsp`) tercatat **`MTA` (`3`) dengan `pakai = 0`** (di aplikasi lama tetap tidak ditagih pemakaian).
     - **2 pelanggan** (`00900850066`, `00906520024`) tercatat **`TIDAK ADA AIR` (`8`) dengan `pakai = 0`**.
  2. **4 pelanggan aktif Oktober yang di November baru tercatat `DI CABUT` (`D`)**:
     - `00703600215` (`RUKMINI`, Rute `TA501`: Okt `TIDAK ADA AIR` `0 m³` → Nov `DI CABUT` `0 m³`).
     - `00900901092` (`LEO SUSANTO`, Rute `TA101`: Okt `TIDAK ADA AIR` `0 m³` → Nov `DI CABUT` `0 m³`).
     - `00904801119` (`IDANG SYAEFUL`, Rute `KD712`: Okt `MTA` `5 m³` → Nov `DI CABUT` `0 m³`).
     - `00906550132` (`HJ. SITI DJULAEHA`, Rute `TC211`: Okt `Normal` `5 m³` → Nov `DI CABUT` `5 m³`).
  3. **Pelanggan Baru (PBPK November) yang langsung berstatus `DI CABUT`**: **0 pelanggan** (ke-4 pelanggan baru di November berstatus `Normal` [3 SL] dan `TIDAK DIPAKAI` [1 SL]).
  4. **Total baris export November yang TIDAK punya DPM aktif `202611`**: **21 baris** (terdiri dari **17 pelanggan `DICABUT` Oktober** yang dilewati dari DPM `202611` + **4 pelanggan baru PBPK November** yang belum ada di CSV Oktober).

### 3.3 Analisis 14 Pelanggan `MB` (Meter Baru) terhadap `GwmService`

Dari 14 baris `Kd_kel = '4'` (`MB`) di `lapdatametertes.csv`:

- **Yang BISA dipetakan dari CSV**:
  - `nolg`, `periode` (`202611`), `standLalu` (`St AWAL` = `stma` Oktober), `standBacaBaru` (`St Akhir` = stand akhir meter baru, berkisar `2..88`), dan `totalPemakaianM3` (`Pakai` di CSV).
- **Yang TIDAK ADA di CSV `lapdatametertes.csv`**:
  - **`standAngkat` (angka terakhir meter lama saat dicabut)** tidak ada (kolom `St Akhir Catat` bernilai `0` untuk ke-14 baris tersebut).
  - **`standPasang` (angka awal meter baru saat dipasang)** tidak ada (meskipun umumnya `0`).
  - **`noMeterBaru` belum diperbarui di CSV**: Untuk **14 dari 14 pelanggan `MB`**, kolom `kd_wm` di CSV November **masih berisi nomor meter lama Oktober** (`octMeter === novMeter`)! Artinya di aplikasi lama, petugas lapangan hanya memilih kode kondisi `4 | MB` dan memasukkan stand meter baru, sedangkan nomor seri meter fisiknya baru diinput kemudian oleh bagian teknik/pelayanan.

### 3.4 Kode Kondisi `M | KELEBIHAN` dan 26 Baris `Kd_kel` vs `Nm_Kel` Tidak Sinkron

- Dari 14.238 baris November, terdapat **27 baris** yang pasangan `(Kd_kel, Nm_Kel)`-nya tidak standar (26 baris kode vs nama silang + 1 baris `M | KELEBIHAN` pada `nolg = 00901000288` `AAM SITI AISYAH`, `stAwal=125, stAkhir=125, pakai=5, pakaiLalu=5`, kondisi Oktober `TIDAK DIPAKAI`).
- **Pola 26 baris tidak sinkron**:
  - Pada seluruh 26 baris tersebut, **perhitungan `Pakai` di CSV mengikuti kolom `Nm_Kel` (Nama Kondisi) apabila `Kd_kel = '-'`**, ATAU **mengikuti `Kd_kel` apabila `Nm_Kel = 'Normal'` tetapi `stAkhir == stAwal`** (mis. `Kd_kel = 'R', Nm_Kel = 'Normal', stAwal=1021, stAkhir=1021, pakai=10`).
- **Usulan Pemetaan (Menunggu Keputusan Anda, Belum Ditambahkan ke `master_kondisi_catat`)**:
  1. Untuk **`M | KELEBIHAN`**: maknanya di PDAM adalah _"Kelebihan Tagih / Kredit Taksasi Bulan Lalu"_ (pelanggan sudah kelebihan bayar taksasi sehingga bulan ini `stma = stml` dan hanya dikenakan minimum `5 m³`). Usulan: petakan ke `REV.PENCATAT` (`P`) dengan catatan `[Kelebihan Taksasi]`, atau tambahkan kode `'M'` (`KELEBIHAN`, `mode_hitung = 'TAKSASI_HISTORI'`) ke `master_kondisi_catat` jika Anda setuju.
  2. Untuk **26 baris `Kd_kel` vs `Nm_Kel` silang**: prioritaskan kondisi yang bukan `'Normal'` / `'-'` (yakni jika `Kd_kel != '-'`, gunakan `Kd_kel`; jika `Kd_kel == '-'` tapi `Nm_Kel != 'Normal'`, gunakan `Nm_Kel`), dan beri catatan audit pada `cater_baca_meter.catatan`.

### 3.5 Export 3 Baris Stand Akhir < Stand Awal (Non-MB, Pakai Positif) & 27 Baris Pakai > 100 m³

Telah diekspor lengkap ke:

- [daftar-anomali-november-stand-mundur-dan-ekstrem.csv](file:///E:/Coding/elysia/packages/db/data/exports/daftar-anomali-november-stand-mundur-dan-ekstrem.csv) (`43` baris data: 3 stand mundur non-MB dengan pakai positif + 12 MB stand reset positif + 1 MB pakai negatif `-86 m³` + 27 pemakaian ekstrem `> 100 m³`).

---

## 4. Jalur Go-Live Opsi A (Desember dari `progrescater` Closing November) & Hasil Simulasi `lapdatametertes.csv`

### 4.1 Kesiapan ETL Menerima `progrescater` `202611` (Closed) → Membuka `202612` (Open) + Menurunkan `akumulasi_taksasi_m3`

1. **Dinamis Tanpa Perubahan Kode**: [import-progres-cater.ts](file:///E:/Coding/elysia/packages/db/src/etl/import-progres-cater.ts#L569-L686) membaca `periodeSumber` dari kolom `thbl` CSV (`'202611'`), menyimpan histori closed `202611` (`TERKUNCI`), lalu memanggil `carryForwardPeriode({ periodeLalu: '202611', periodeBaru: nextPeriode('202611') })` yang otomatis membuka **`202612` (`BERJALAN`)**.
2. **Penurunan `akumulasi_taksasi_m3` & Keterbatasannya**:
   - `carryForwardPeriode` ([carry-forward.ts](file:///E:/Coding/elysia/packages/db/src/carry-forward.ts#L283-L320)) otomatis mendeteksi setiap pelanggan yang pada closing November ditaksir (`stma == stml` dan `pakai_drd > 0`) dan menurunkan `akumulasi_taksasi_m3` ke `daftar_catat('202612')`.
   - **Keterbatasan Data 1 Bulan**: Jika seorang pelanggan sudah ditaksir berturut-turut sejak **sebelum November** (misal Oktober juga `DK` `20 m³` dan November kembali `DK` `20 m³` sehingga total kumulatif sebenarnya `40 m³`), file `ProgresCater` 1 bulan (November saja) hanya memuat `stml, stma, pakai_drd` bulan November (`20 m³`) dan `pakailalu` Oktober (`20 m³`), tanpa memberi tahu apakah bulan Oktober (`pakailalu`) itu hasil bacaan fisik atau taksasi.
   - **Keunggulan Arsitektur Kita**: Karena database kita **sudah di-seed dengan `ProgresCater` Oktober (`202610`)**, maka ketika nanti file `ProgresCater` closing November (`202611`) di-import di atas database ini, `carryForwardPeriode` akan **menjumlahkan secara kumulatif** `akumulasi_taksasi_m3` Oktober (`daftar_catat(202611).akumulasi_taksasi_m3`) + taksasi November (`cater_baca_meter(202611).pakai_tagih`), sehingga akumulasi 2 bulan (Okt + Nov) tercatat 100% akurat! Hanya taksasi dari bulan **September ke belakang** yang tidak terekam di CSV Oktober yang perlu diverifikasi lewat fitur koreksi apabila saat baca fisik Desember menghasilkan angka kredit berlebih.

### 4.2 Hasil Simulasi `lapdatametertes.csv` (Di Transaksi Rollback — Skrip Reusable [simulate-lapdatameter.ts](file:///E:/Coding/elysia/packages/db/src/etl/simulate-lapdatameter.ts))

#### a. Replay Aturan Hitung (`mode_hitung` + `minimum 5 m³` vs Kolom `Pakai` di CSV November)

Dari **14.238 baris** `lapdatametertes.csv`, hasil penerapan `hitungPemakaianDanRekonsiliasiTaksasi` (`mode_hitung` + `minimum 5 m³`):

- **Cocok Persis (`pakaiCalc == pakaiCsv`)**: **13.267 baris (93,18%)**.
- **Selisih**: **971 baris (6,82%)**, dengan rincian per kondisi:
  - `H | TIDAK DIPAKAI` (`TAKSASI_HISTORI`): **2.512 / 2.549 cocok (98,55%)** — hanya 37 baris yang di-override manual oleh verifikator lama.
  - `R | RMH/TANAH KSG` (`TAKSASI_HISTORI`): **851 / 884 cocok (96,27%)** — 33 baris override manual.
  - `8 | TIDAK ADA AIR` (`NOL`): **222 / 233 cocok (95,28%)** — 11 baris di-override `5 m³`.
  - `3 | MTA` (`TAKSASI_HISTORI`): **188 / 197 cocok (95,43%)**.
  - `P | REV.PENCATAT` (`SELISIH_FISIK`): **418 / 443 cocok (94,36%)**.
  - `- | Normal` (`SELISIH_FISIK`): **7.249 / 7.615 cocok (95,19%)** — 366 baris selisih karena di CSV November terdapat 341 baris `Normal` dengan `stAkhir == stAwal` (`delta = 0`) yang oleh aplikasi lama ditaksir mengikuti `pakai_lalu > 5 m³` (padahal label kondisinya tetap dibiarkan `Normal`), ditambah 25 baris `Normal` yang diberi `pakai = 0`.
  - `N | STAND TEMPEL` & `Z | STAND-KONSUMEN`: `564 / 722` dan `267 / 409` cocok (selisihnya adalah baris-baris di mana angka tempel/konsumen diabaikan dan diganti rata-rata 3 bulan oleh verifikator lama).

#### b. Cakupan Data per Petugas & per Rute (Evaluasi Bias Sampel 20 Nov Pukul 14.00)

- **Per Petugas (9 Petugas)**:
  - `PERIYADI`: `2.545 / 2.546` (**99,96%** — hampir selesai 100%).
  - `AGUS`: `2.102 / 2.518` (**83,48%**).
  - `EDI`: `2.028 / 2.518` (**80,54%**).
  - `IWAN`: `1.923 / 2.538` (**75,77%**).
  - `DANI`: `1.691 / 2.448` (**69,08%**).
  - `OMAY`: `1.558 / 2.496` (**62,42%**).
  - `DIDIN`: `1.296 / 2.459` (**52,70%**).
  - `DADANG`: `585 / 2.488` (**23,51%**).
  - `RUDY`: `510 / 2.484` (**20,53%**).
- **Per Rute (125 Rute)**:
  - **73 rute (58,4%)** sudah selesai **100%**.
  - **8 rute (6,4%)** terisi sebagian (`1..99%`).
  - **44 rute (35,2%)** masih **0%** (belum diunggah petugas sampai tanggal 20 Nov, terutama rute milik `DADANG` dan `RUDY`).
  - **Kesimpulan Bias Sampel**: Sampel 14.238 baris ini **bias per rute/petugas** (73 rute selesai penuh, 44 rute belum masuk sama sekali), yang lazim terjadi karena petugas mencatat dan mengunggah per buku rute harian.

#### c. Hasil Impor Lewat Alur Normal (Status `SUBMITTED` / `ANOMALY_*`)

Saat ke-14.238 baris diimpor dengan evaluasi `evaluasiPemakaianMeter` & kredit taksasi:

- `SUBMITTED` (Normal, siap diverifikasi): **13.855 baris**
- `ANOMALY_LOW` (`0 m³` berulang): **242 baris**
- `ANOMALY_HIGH` (Lonjakan `> 100 m³` atau `>= 3x pakai_lalu`): **114 baris**
- `ANOMALY_NEGATIVE` (`St Akhir < St Awal` atau `Pakai < 0`): **16 baris**
- `ANOMALY` (Kredit `akumulasi_taksasi_m3` > selisih fisik): **11 baris**

#### d. Uji Guard Closing, Penyelesaian Sisa DPM via Taksasi Eksplisit, Closing `202611`, & Buka `202612`

1. **Guard Closing**: Saat baru 14.238 baris masuk, masih ada **8.278 pelanggan aktif** di `daftar_catat('202611')` yang berstatus `BELUM_DICATAT` → `ClosingService.eksekusiClosing('202611')` **terbukti menolak closing**.
2. **Penyelesaian via Taksasi Eksplisit Operator & Buka Desember (`202612`)**:
   - Setelah 8.278 pelanggan diselesaikan dengan taksasi eksplisit (`stma = stml`, `pakai_tagih = max(pakai_lalu, 5)`), disahkan (`APPROVED_FINAL`), dan di-closing:
   - Proyeksi DPM Desember (`202612`) menghasilkan **22.495 pelanggan aktif**, di mana:
     - **838 pelanggan** yang bulan Oktobernya ditaksir (`akumulasi > 0`) dan di bulan November berhasil terbaca fisik **otomatis ter-reset `akumulasi_taksasi_m3`-nya menjadi `0`**!
     - **7.893 pelanggan** yang ditaksir di Oktober dan kembali ditaksir di November mengalami **penjumlahan `akumulasi_taksasi_m3` kumulatif 2 bulan berturut-turut**!
3. **Rollback & Reusabilitas**: Seluruh transaksi simulasi di-rollback otomatis di akhir skrip (`0` perubahan di database utama). Skrip [simulate-lapdatameter.ts](file:///E:/Coding/elysia/packages/db/src/etl/simulate-lapdatameter.ts) dapat dijalankan ulang kapan pun untuk file CSV baru dengan perintah:
   ```powershell
   bun packages/db/src/etl/simulate-lapdatameter.ts --csv=path/ke/file_baru.csv
   ```

---

## 5. Pengamanan Tambahan Seed Akun (Sudah Diimplementasikan)

Pada [seed-accounts.ts](file:///E:/Coding/elysia/packages/db/src/seed-accounts.ts#L13-L169):

- Konstanta fallback password bawaan (`FALLBACK_SEED_PASSWORD = "wiskaprayoga12"`) telah **dihapus** dan dimasukkan ke daftar blokir `DISALLOWED_WEAK_PASSWORDS`.
- `seedAccounts()` kini **wajib** menerima `SEED_DEFAULT_PASSWORD` dari environment dengan panjang minimal 12 karakter dan menolak nilai bawaan/contoh **walaupun `NODE_ENV` tidak diset ke `production`**.
