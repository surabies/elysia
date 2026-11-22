# PROMPT AGENT — Halaman "Capaian Pencatatan" (Tabel Progres, Tabel Target vs Realisasi, dan Grafik) — Aplikasi Baca Meter Tirtawening

> Tempel seluruh isi file ini ke AI agent yang dijalankan di root repositori. Bila agent mendukung gambar, lampirkan juga dua screenshot Excel sebagai referensi tampilan. Semua angka yang dibutuhkan sudah ada di Lampiran.

---

## 1. Konteks dan tujuan

Kamu sudah mengenal proyek **Baca Meter** (monorepo; frontend **React + shadcn/ui**, backend **ElysiaJS**, ORM **Drizzle** + PostgreSQL). Bangun satu halaman baru, **"Capaian Pencatatan"**, yang mereplikasi dua tabel Excel dan menambah grafik:

1. **Tabel 1:** "Progress Capaian Target Wilayah Pelayanan 5, periode tahun 2026".
2. **Tabel 2:** "Target dan Realisasi Capaian Pencatatan di Wilayah Pelayanan 5, periode tahun 2026".
3. **Grafik** dari data kedua tabel.

Syarat utama: **sel target diketik langsung di UI dan tersimpan otomatis ke backend.** Nilai turunan (rasio, selisih, jumlah, capaian) dihitung otomatis dan tidak diketik manual.

Default halaman: Wilayah Pelayanan **5**, tahun **2026**. Rancang agar wilayah dan tahun bisa dipilih.

Istilah: **SL** = sambungan langganan (jumlah pelanggan); **M³** = volume pemakaian air; **LPS** = liter per detik; **realisasi** = hasil pencatatan sebenarnya; **target** = angka rencana.

**Aplikasi sudah berjalan dan database sudah berisi data.** Semua perubahan harus aman terhadap data yang ada.

---

## 2. Aturan main (WAJIB)

1. **Discovery dulu (Fase 0).** Jangan mengasumsikan nama tabel, file, atau fungsi. Ikuti konvensi proyek: struktur folder, penamaan, plugin auth dan sistem role, gaya router Elysia, format respons `{ success, data | error }`, util format angka, library data fetching, komponen shadcn yang sudah terpasang, dan token tema (terang/gelap).
2. **Migrasi hanya aditif:** tabel baru atau kolom baru nullable/berdefault. DILARANG drop, rename, ubah tipe kolom, `drizzle-kit push`, reset DB. Hasilkan migrasi dengan cara yang dipakai repo, **baca SQL-nya**, terapkan hanya ke database lokal/dev/test. Periksa `DATABASE_URL` sebelum menerapkan; bila terlihat seperti produksi, BERHENTI dan laporkan.
3. **Tidak ada logika perhitungan di komponen UI.** Semua rumus berada di **fungsi murni** (domain engine, nol dependensi DB/HTTP) yang diuji. API mengembalikan view model lengkap; UI hanya memformat dan menampilkan.
4. **Tidak ada konstanta bisnis tersembunyi.** Parameter yang memengaruhi angka (hari acuan LPS, hari periode) disimpan di database dan terlihat serta bisa diubah di UI.
5. **File lengkap, bukan potongan.** Hasil akhir tiap file harus utuh dan bisa dikompilasi. Jangan meninggalkan placeholder seperti `// ...sisanya sama`.
6. Setelah **setiap fase**: jalankan typecheck, lint (bila ada), dan seluruh tes sampai hijau; lalu commit (satu commit per fase). Jangan lanjut sebelum hijau.
7. Label UI, pesan error, dan komentar kode dalam **bahasa Indonesia**.
8. Jangan menyentuh modul di luar ruang lingkup ini, dan jangan upgrade dependensi.
9. Data dari Excel hanya dipakai sebagai **fixture tes** dan **seed dev** (dengan guard); jangan pernah di-seed ke produksi.
10. Berhenti dan bertanya hanya untuk blocker nyata. Selain itu ambil keputusan terbaik dan catat di laporan akhir.

---

## 3. Fase 0 — Discovery (read-only)

1. Temukan di skema Drizzle: tabel pencatatan/pembacaan meter, pelanggan, rute, dan konsep **wilayah pelayanan**. Petunjuk untuk diverifikasi: di modul pengaduan, kode wilayah diambil dari 2 digit pertama `ruteKode` pelanggan; kemungkinan "Wilayah Pelayanan 5" terkait kode itu. Cari tahu:
   - dari mana **SL** per wilayah per bulan bisa dihitung (jumlah sambungan yang tercatat/aktif),
   - dari mana **M³** pemakaian per wilayah per bulan bisa dijumlahkan,
   - apakah ada tanggal baca per periode (untuk menghitung hari periode),
   - sejak kapan data tersedia (apakah ada data 2025 dan Januari–Oktober 2026).
2. Pelajari routing API, auth plugin, definisi role; routing dan navigasi frontend, layout halaman; komponen shadcn yang terpasang (table, input, tabs, card, select, chart, skeleton, sonner, tooltip, badge, button, popover, sheet); library fetch/cache; util format angka dan tanggal.
3. Tulis `docs/capaian/DISCOVERY.md`: temuan, **definisi SL dan M³ yang kamu pilih** beserta alasannya, pemetaan wilayah, tipe data yang dipakai, dan lokasi file baru. Jika data pencatatan belum memadai untuk menghasilkan realisasi, gunakan mode **MANUAL** (5.3) dan catat.
4. Bila komponen `chart` shadcn belum ada, pasang: `bunx --bun shadcn@latest add chart -c apps/web` (sesuaikan path app).

---

## 4. Spesifikasi dua tabel (replika Excel)

### 4.1 Tabel 1 — Progress Capaian Target Wilayah Pelayanan {wilayah}, periode tahun {tahun}

Kolom: **NO | BULAN | PROGRES TAHUN {tahun}: SL, M³, M³/SL, M³/SL/HARI | KENAIKAN/PENURUNAN: SL, M³, M³/SL, M³/SL/HARI** (header dua tingkat).

Baris:

- Baris pembuka: **Desember tahun sebelumnya** (NO 12, mis. "DESEMBER 2025") sebagai pembanding.
- Lalu Januari–Desember tahun berjalan (NO 1–12).
- Baris akhir: **JUMLAH / RATA-RATA**.

Rumus:

- `M³/SL = M³ ÷ SL`
- `M³/SL/HARI = (M³/SL) ÷ hariPeriode` (lihat 4.3)
- **Kenaikan/penurunan** bulan X = nilai bulan X − nilai bulan sebelumnya. Januari dibandingkan dengan Desember tahun lalu; Desember tahun lalu dibandingkan dengan November tahun lalu. Dihitung dari **nilai presisi penuh**, bukan angka yang sudah dibulatkan (Excel juga begitu: Δ per hari Januari tampil 0,006, bukan 0,498 − 0,493).
- Jika bulan itu atau bulan pembandingnya belum ada data → sel **kosong**.

Baris JUMLAH / RATA-RATA (tidak termasuk Desember tahun lalu):

- SL = SL bulan terakhir yang terisi.
- M³ = Σ M³ dari Januari sampai bulan terakhir terisi.
- M³/SL = Σ M³ ÷ Σ SL (rata-rata tertimbang).
- M³/SL/HARI = Σ M³ ÷ Σ (SL × hariPeriode).

### 4.2 Tabel 2 — Target dan Realisasi Capaian Pencatatan di Wilayah Pelayanan {wilayah}, periode tahun {tahun}

Kolom: **NO | BULAN | TARGET TAHUN {tahun}: SL, M³, M³/SL | LPS | REALISASI TAHUN {tahun}: SL, M³, M³/SL | TARGET VS REALISASI SELISIH: SL, M³**. 12 baris Januari–Desember, lalu baris **JUMLAH** dan baris **CAPAIAN**.

Per baris:

- **Target SL** dan **Target M³**: **INPUT** (sel bisa diedit).
- Target M³/SL = Target M³ ÷ Target SL (turunan).
- **LPS** = Target M³ × 1000 ÷ (hariAcuanLps × 86.400) (turunan). `hariAcuanLps` adalah **parameter tahunan per wilayah**, default **31** (Excel lama tampak memakai 31 untuk semua bulan: 345.584 m³ → 129,03). Tampilkan parameter ini di UI sebagai field kecil yang bisa diubah; jangan hardcode.
- **Realisasi SL, M³, M³/SL**: dari sumber realisasi yang sama dengan Tabel 1 (tidak diedit di tabel ini).
- Selisih SL = Realisasi SL − Target SL; Selisih M³ = Realisasi M³ − Target M³. **Kosong** bila realisasi bulan itu belum ada.

Baris JUMLAH:

- Target SL = Target SL bulan **Desember** (akhir tahun); Target M³ = Σ 12 bulan; Target M³/SL = Σ M³ ÷ Σ SL.
- Realisasi SL = SL bulan terakhir terisi; Realisasi M³ = Σ bulan terisi; Realisasi M³/SL = Σ M³ ÷ Σ SL bulan terisi.
- Selisih SL = Realisasi SL terakhir − Target SL bulan yang sama; Selisih M³ = Realisasi YTD − Target YTD (bulan yang sama).

Baris CAPAIAN, **dua angka** yang diberi label jelas:

- **"s.d. bulan ini (YTD)"**: Realisasi M³ ÷ Target M³ untuk bulan-bulan yang sama. SL: Realisasi SL terakhir ÷ Target SL bulan yang sama.
- **"Terhadap target tahunan"**: Realisasi M³ ÷ Target M³ 12 bulan.

### 4.3 Hari periode (`hariPeriode`)

M³/SL/HARI di Excel tampak memakai jumlah hari periode pemakaian yang **tidak sama dengan hari kalender**. Nilai yang bisa diturunkan dari angka Excel (verifikasi dengan data nyata): Des'25 = 31, Jan = 31, Feb = 29, Mar = 29, Apr = 29, Mei = 30, Jun–Okt = 31. Maka:

- Simpan `hariPeriode` **per bulan**, bisa diubah di UI oleh role berwenang (tercatat di riwayat).
- Nilai default: bila tanggal baca per periode tersedia, hitung dari selisih tanggal; jika tidak, pakai jumlah hari kalender bulan itu. Catat pilihanmu di laporan akhir.

### 4.4 Anomali pada Excel lama — JANGAN ditiru

Hasil pengecekan terhadap angka pada screenshot:

1. **Tabel 1, JUMLAH** menampilkan M³/SL 17,92 dan M³/SL/HARI 0,606, padahal rata-rata bulanan Jan–Okt hanya ≈ 15,10 dan ≈ 0,498. Pakai rumus 4.1.
2. **Tabel 1, November dan Desember 2026** menampilkan `#DIV/0!` dan kenaikan/penurunan −22.524 / −330.209 (bulan kosong dianggap 0). Harus **kosong**.
3. **Tabel 2, selisih November dan Desember** menampilkan minus target penuh karena bulan kosong dianggap 0. Harus **kosong**.
4. **Tabel 2, JUMLAH Realisasi SL = 0** dan CAPAIAN SL 0,0%. Yang benar: SL bulan terakhir terisi dan capaiannya.
5. **Tabel 2, CAPAIAN M³ 80,6%** membandingkan realisasi Jan–Okt dengan target Jan–Des. Tampilkan dua angka: YTD (≈ 97,0% pada data contoh) dan tahunan (80,6%).
6. **Tabel 2, JUMLAH Selisih M³ = −34.155** tidak sama dengan jumlah selisih bulanan (−104.664 untuk Jan–Okt). Pakai Realisasi YTD − Target YTD.
7. **Tabel 2, JUMLAH Target M³/SL = 15,50** sama dengan Σ M³ ÷ SL Desember ÷ 12. Rata-rata tertimbang yang benar ≈ 15,57. Pakai rumus 4.2 (selisih ini disengaja; catat di dokumen).

---

## 5. Data dan backend

### 5.1 Skema Drizzle (aditif; sesuaikan nama, tipe, dan referensi wilayah dengan konvensi proyek)

- **`capaian_target_bulanan`**: `id`, wilayah, `tahun` int, `bulan` int (1–12), `target_sl` int nullable, `target_m3` (tipe numerik mengikuti tipe pemakaian di tabel pencatatan) nullable, `versi` int default 1, `updated_by`, `updated_at`, `created_at`. Unik pada (wilayah, tahun, bulan).
- **`capaian_realisasi_bulanan`**: wilayah, `tahun`, `bulan`, `sl`, `m3`, `hari_periode` int, `sumber` (`OTOMATIS` | `MANUAL`), `dihitung_at`, `updated_by`. Unik pada (wilayah, tahun, bulan). Berfungsi sebagai **snapshot** agar pembacaan cepat, dan menampung bulan yang tidak punya data pencatatan.
- **`capaian_pengaturan`**: wilayah, `tahun`, `hari_acuan_lps` int default 31.
- **`capaian_riwayat`** (audit): `id`, entitas (target / realisasi / hari periode / pengaturan), wilayah, tahun, bulan, kolom, `nilai_lama`, `nilai_baru`, `oleh` (user id), `at`.

### 5.2 Domain engine (fungsi murni, dengan tes)

Buat `capaian.engine.ts` berisi fungsi seperti `bangunTabelProgres`, `bangunTabelTargetRealisasi`, `hitungJumlah`, `hitungCapaian`, `hitungLps`, `bangunSeriGrafik`. Ketentuan:

- Nilai tidak ada = `null` (bukan 0). Satu util pembagian aman: pembagi 0 atau null → `null`.
- **Pembulatan hanya saat ditampilkan**; seluruh perhitungan memakai presisi penuh.
- Jangan ada I/O di dalam engine.

### 5.3 Sumber realisasi

- **Utama (OTOMATIS):** agregasi dari data pencatatan per wilayah dan periode, disimpan ke `capaian_realisasi_bulanan`. Sediakan aksi **"Hitung ulang"** (hanya role berwenang) dan ikuti definisi SL/M³ dari `DISCOVERY.md`. Jika data Oktober 2026 tersedia, bandingkan dengan Excel (SL 22.524; M³ 330.209) dan laporkan selisihnya.
- **Cadangan (MANUAL):** bulan tanpa data pencatatan dapat diisi manual (SL, M³) oleh role berwenang. Tandai dengan badge **"Manual"** dan catat di riwayat.
- Bulan berjalan yang belum selesai ditandai **"Belum final"**.

### 5.4 API Elysia

Pasang di prefix sesuai konvensi (mis. `/capaian-pencatatan`), semuanya dengan auth dan role:

- `GET /?wilayah=5&tahun=2026`: view model lengkap `{ tabelProgres, tabelTargetRealisasi, jumlah, capaian, parameter: { hariAcuanLps }, grafik, meta: { sumberPerBulan, diperbaruiAt } }`. Angka dikirim **mentah dan presisi penuh** (`number | null`); UI yang memformat.
- `PATCH /target`: body `{ wilayah, tahun, bulan, targetSl?, targetM3?, versi? }`. Menyimpan satu sel, menulis riwayat, mengembalikan baris target terbaru plus baris/jumlah/capaian yang terdampak. **409** bila `versi` tidak cocok (diubah pengguna lain).
- `PUT /target/bulk`: body `{ wilayah, tahun, items: [{ bulan, targetSl?, targetM3? }] }`. **Atomik**: satu item tidak valid berarti tidak ada yang tersimpan.
- `PATCH /hari-periode` dan `PATCH /pengaturan` (hari acuan LPS).
- `PUT /realisasi` (override manual) dan `POST /hitung-ulang`.
- `GET /riwayat?wilayah&tahun&bulan?`.

Validasi (TypeBox): `bulan` 1–12; `tahun` 2000–2100; SL bilangan bulat 0–1.000.000; M³ ≥ 0 dengan batas wajar; wilayah harus ada. Error memakai format modul lain (`{ success: false, error }`) dengan kode 403/404/409/422 yang tepat; jangan membocorkan pesan DB mentah.

**Role:** semua role internal yang boleh melihat laporan boleh membaca. Mengedit target, hari periode, pengaturan, dan realisasi manual dibatasi ke role manajerial yang sudah ada; bila ragu, **hanya SUPERADMIN**. Catat pilihanmu di laporan. Aktor selalu dicatat di riwayat.

---

## 6. Frontend

Halaman baru **"Capaian Pencatatan"**, didaftarkan di navigasi sesuai konvensi.

**Header:** judul, selector **Wilayah** (default 5) dan **Tahun** (default 2026), tombol Muat Ulang, indikator simpan ("Tersimpan"), badge sumber data, dan field kecil **Hari acuan LPS**.

**Kartu ringkas (4):** Capaian M³ s.d. bulan ini (%), Capaian terhadap target tahunan (%), Selisih M³ YTD, SL terakhir vs target.

**Tabs:** "Target vs Realisasi" (Tabel 2) | "Progres Bulanan" (Tabel 1) | "Grafik".

**Gaya tabel** (shadcn `Table`, meniru Excel):

- Header dua tingkat (`colSpan`) berwarna gelap; baris selang-seling; baris JUMLAH dan CAPAIAN tebal dengan garis pemisah di atas.
- Angka rata kanan dengan `tabular-nums`; format angka **Indonesia** (22.554 dan 15,27) memakai util format yang sudah ada di proyek (screenshot memakai format Excel berbahasa Inggris; ikuti konvensi aplikasi).
- Angka negatif berwarna merah dan tetap ada tanda minus (tidak hanya mengandalkan warna). Semua warna lewat **token tema** sehingga mendukung mode gelap; jangan hardcode hex.
- `null` ditampilkan **"–"**, tidak pernah `#DIV/0!`.
- Tooltip pada header kolom menjelaskan rumus.
- Header dan kolom NO/BULAN lengket (sticky), kontainer scroll horizontal pada layar kecil.
- Skeleton saat memuat; keadaan kosong yang jelas bila target belum diisi.

**Sel target yang bisa diedit (Target SL, Target M³):**

- Klik atau Enter pada sel membuka input numerik di tempat. **Enter/blur = simpan, Esc = batal.** Tab, Shift+Tab, dan panah atas/bawah memindahkan sel.
- Saat tidak diedit, tampil terformat (ribuan); saat diedit, nilai mentah.
- **Simpan otomatis** ke `PATCH /target` dengan update optimistik. Indikator kecil per sel (spinner lalu centang). Bila gagal: toast, nilai dikembalikan. Bila 409: toast "Data diubah pengguna lain" lalu muat ulang.
- **Tempel dari Excel:** menempel satu kolom (maksimal 12 nilai) mulai dari sel aktif memicu `PUT /target/bulk` dengan konfirmasi ringkas.
- Sel read-only (tanpa input) bagi role yang tidak berhak.
- Kolom turunan (M³/SL, LPS, selisih, jumlah, capaian) **tidak bisa diedit** dan diperbarui dari respons server. Jangan menghitung ulang di klien kecuali memakai fungsi engine yang sama.
- Tombol **"Riwayat perubahan"** membuka `Sheet` berisi log (siapa, kapan, nilai lama dan baru).
- Hari periode diedit lewat sel kecil di Tabel 1 (hanya role berwenang).
- Aksesibilitas: `aria-label` per sel (mis. "Target SL Januari"), fokus terlihat, navigasi keyboard penuh.

---

## 7. Grafik (shadcn `chart` + Recharts)

Lima grafik, semuanya responsif, dengan legend dan tooltip berformat Indonesia. Warna dari token `--chart-1..5`; **target dibedakan dengan garis putus atau pola**, jangan hanya mengandalkan warna.

1. **Target vs Realisasi Pemakaian (M³):** batang berkelompok per bulan (sumbu Y mulai dari 0).
2. **Target vs Realisasi M³/SL:** garis dua seri.
3. **Jumlah SL: Target vs Realisasi:** garis dua seri; sumbu Y boleh domain otomatis (selisih kecil), beri catatan kecil "sumbu tidak dimulai dari 0".
4. **Kenaikan/Penurunan M³ dibanding bulan sebelumnya:** batang dengan garis nol; positif/negatif dibedakan warna **dan** tanda.
5. **M³/SL/HARI per bulan:** garis dengan garis referensi rata-rata YTD.

Bulan tanpa realisasi **tidak digambar** (bukan nol). Sediakan alternatif teks bagi pembaca layar (ringkasan atau tabel sr-only), dan empty state bila belum ada data.

---

## 8. Pengujian

**Unit engine (fixture dari Lampiran):**

- Reproduksi angka Excel dalam toleransi pembulatan (M³/SL ±0,01; M³/SL/HARI ±0,001; LPS ±0,01) untuk semua baris Tabel 1 dan 2, **kecuali anomali 4.4**, yang tesnya menegaskan perilaku yang benar.
- Kasus tepi: pembagian nol dan null; Januari dibanding Desember tahun lalu; bulan tanpa data (selisih kosong); presisi penuh; JUMLAH tertimbang; dua jenis CAPAIAN.

**Integrasi API** (database tes terpisah; **guard keras**: tes abort bila nama database tidak mengandung `test`):

- GET view model; PATCH target menulis riwayat; **409** konflik versi; **403** role tidak berhak; bulk **atomik** (satu item invalid berarti tidak ada yang tersimpan); hitung ulang realisasi dari data pencatatan contoh; override manual.

**Komponen UI:** bila infrastruktur tes frontend ada, tes sel editable (Enter simpan, Esc batal, gagal berarti rollback, tempel 12 nilai). Jika tidak ada, tulis daftar uji manual di `docs/capaian/`.

**Seed dev opsional:** skrip `seed-capaian-dev` memasukkan fixture 2026 **hanya** ke DB dev/test dengan guard yang sama.

---

## 9. Dokumentasi

Di `docs/capaian/`:

- `RUMUS.md`: semua rumus, definisi SL, M³, LPS, hari periode, cara JUMLAH dan CAPAIAN, daftar anomali Excel (4.4), dan keputusan yang kamu ambil.
- `MIGRASI.md`: migrasi yang dibuat, dampaknya pada data lama, cara menerapkan, **catatan backup sebelum diterapkan di produksi**, dan langkah rollback manual.

---

## 10. Definition of Done

- [ ] Dua tabel tampil dengan struktur dan rumus sesuai Bagian 4; anomali 4.4 tidak ditiru.
- [ ] Sel Target SL/M³ dapat diedit di UI, tersimpan otomatis, ada riwayat, konflik 409 tertangani, dan bisa menempel dari Excel.
- [ ] Lima grafik tampil dan bekerja di mode terang dan gelap.
- [ ] Tidak ada rumus di komponen UI; semua dari engine yang teruji.
- [ ] Migrasi aditif, sudah direview, dan hanya diterapkan ke dev/test.
- [ ] Typecheck, lint, dan semua tes hijau; tes fixture Excel lolos.
- [ ] Dokumen di `docs/capaian/` lengkap.

## 11. Format laporan akhir

Ringkas dalam bahasa Indonesia: (1) file yang dibuat dan diubah, (2) migrasi dan SQL-nya, (3) definisi SL/M³ dan sumber realisasi yang dipilih (serta hasil pembandingan dengan angka Excel bila data ada), (4) keputusan yang kamu ambil sendiri (role pengedit, asal hari periode, dll.), (5) risiko atau keterbatasan, (6) perintah menjalankan tes, aplikasi, dan migrasi.

---

## Lampiran — Data Excel (untuk fixture tes dan seed dev)

**Realisasi** (kolom "hari" diturunkan dari angka Excel; verifikasi dengan data nyata). Nilai tampil di Excel dicantumkan untuk pengecekan:

| Bulan                              |       SL |       M³ | Hari | M³/SL tampil | M³/SL/hari tampil |
| ---------------------------------- | -------: | -------: | ---: | -----------: | ----------------: |
| Nov 2025 (turunan dari Δ Des 2025) |   25.713 |  430.994 |   31 |        16,76 |             0,541 |
| Des 2025                           |   22.554 |  344.363 |   31 |        15,27 |             0,493 |
| Jan 2026                           |   22.549 |  348.192 |   31 |        15,44 |             0,498 |
| Feb 2026                           |   22.551 |  345.605 |   29 |        15,33 |             0,528 |
| Mar 2026                           |   22.532 |  314.290 |   29 |        13,95 |             0,481 |
| Apr 2026                           |   22.527 |  346.246 |   29 |        15,37 |             0,530 |
| Mei 2026                           |   22.523 |  341.139 |   30 |        15,15 |             0,505 |
| Jun 2026                           |   22.515 |  349.193 |   31 |        15,51 |             0,500 |
| Jul 2026                           |   22.511 |  335.295 |   31 |        14,89 |             0,480 |
| Agu 2026                           |   22.516 |  359.562 |   31 |        15,97 |             0,515 |
| Sep 2026                           |   22.523 |  330.631 |   31 |        14,68 |             0,474 |
| Okt 2026                           |   22.524 |  330.209 |   31 |        14,66 |             0,473 |
| Nov 2026                           | (kosong) | (kosong) |      |              |                   |
| Des 2026                           | (kosong) | (kosong) |      |              |                   |

**Kenaikan/penurunan yang tampil di Tabel 1** (untuk verifikasi): Des 2025: SL −3.159, M³ −86.631, M³/SL −1,49, per hari −0,048. Jan: −5; 3.829; 0,17; 0,006. Feb: 2; −2.587; −0,12; 0,030. Mar: −19; −31.315; −1,38; −0,047. Apr: −5; 31.956; 1,42; 0,049. Mei: −4; −5.107; −0,22; −0,025. Jun: −8; 8.054; 0,36; −0,005. Jul: −4; −13.898; −0,61; −0,020. Agu: 5; 24.267; 1,07; 0,035. Sep: 7; −28.931; −1,29; −0,042. Okt: 1; −422; −0,02; −0,001.

**Target** (Target SL dan Target M³ adalah input; M³/SL dan LPS tampil di Excel untuk verifikasi, LPS dengan hari acuan 31):

| Bulan | Target SL | Target M³ | M³/SL tampil | LPS tampil |
| ----- | --------: | --------: | -----------: | ---------: |
| Jan   |    22.500 |   345.584 |        15,36 |     129,03 |
| Feb   |    22.515 |   346.696 |        15,40 |     129,44 |
| Mar   |    22.530 |   347.772 |        15,44 |     129,84 |
| Apr   |    22.545 |   348.851 |        15,47 |     130,25 |
| Mei   |    22.560 |   349.932 |        15,51 |     130,65 |
| Jun   |    22.575 |   351.014 |        15,55 |     131,05 |
| Jul   |    22.590 |   352.099 |        15,59 |     131,46 |
| Agu   |    22.605 |   353.185 |        15,62 |     131,86 |
| Sep   |    22.625 |   354.359 |        15,66 |     132,30 |
| Okt   |    22.645 |   355.534 |        15,70 |     132,74 |
| Nov   |    22.665 |   356.712 |        15,74 |     133,18 |
| Des   |    22.685 |   357.891 |        15,78 |     133,62 |

**Selisih Realisasi − Target yang tampil di Excel** (Jan–Okt, untuk verifikasi): SL: 49, 36, 2, −18, −37, −60, −79, −89, −102, −121. M³: 2.608; −1.091; −33.482; −2.605; −8.793; −1.821; −16.804; 6.377; −23.728; −25.325.

**Total yang benar berdasarkan data di atas** (untuk tes): Σ Realisasi M³ Jan–Okt = 3.400.362; Σ Target M³ 12 bulan = 4.219.629; Σ Target M³ Jan–Okt = 3.505.026; Selisih M³ YTD = −104.664; Capaian YTD ≈ 97,0%; Capaian tahunan ≈ 80,6%.
