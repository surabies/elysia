# Tugas: Buat halaman "Strategy Scorecard" (KPI) mengikuti gambar referensi

Gambar referensi terlampir. Tiru tata letak, hierarki visual, dan perilakunya
semirip mungkin. Gunakan data contoh (mock data) di bawah ini.

## Aturan proyek (wajib)

- Baca dan patuhi docs/STRUKTUR-KODE.md (folder semantik, file PascalCase,
  jangan memecah file berlebihan).
- UI memakai komponen shadcn/ui, ikon memakai HugeIcons.
- Semua teks tampilan dalam bahasa yang konsisten (label ikuti gambar
  berbahasa Inggris, kecuali saya minta lain).
- Pisahkan: tipe data, data contoh, fungsi perhitungan (murni, tanpa UI), dan
  komponen tampilan.

## Langkah kerja

1. Baca struktur proyek dan konvensi dulu.
2. Usulkan daftar file yang akan dibuat/diubah, lalu tunggu persetujuan saya.
3. Implementasi, lalu ringkas hasilnya.

## 1. Struktur halaman (atas ke bawah)

### A. Header halaman

- Kiri: breadcrumb "Atlas > Strategy > Goals" (ikon bulat ungu kecil di depan
  "Atlas"; "Goals" adalah halaman aktif dan lebih tebal).
- Kanan: teks abu-abu "Updated Sep 29, 14:20 UTC" dan tombol hitam "Share"
  dengan ikon share.

### B. Kartu utama "Strategy Scorecard"

Satu card berborder tipis berisi: toolbar, ringkasan, tabel, footer total,
dan legenda.

**Toolbar** (baris atas card)

- Kiri: judul tebal "Strategy Scorecard" + subjudul abu-abu
  "Sep 2026, baseline to year end target".
- Kanan, berurutan: input "Search KPIs" (ikon kaca pembesar, badge shortcut
  "/" di ujung kanan), dropdown periode "Sep 2026", empat tombol ikon
  (filter, penyesuaian/sliders, pilih kolom, unduh), tombol hitam "+ Add KPI".

**Strip ringkasan** (4 sel sejajar, dipisah garis vertikal tipis)
| Sel | Label kecil | Angka besar | Teks pendamping |
|---|---|---|---|
| 1 | Company Score | 61% | "Watch, +2 pts since Aug" |
| 2 | KPIs On Track | 12 | "of 29 scored" |
| 3 | Weakest Perspective | 56% | "Product, 2 off track" |
| 4 | KPI Status | 12 / 11 / 6 | titik hijau "On Track", titik oranye "Watch", titik merah "Off Track" |
Angka besar tebal dan berukuran besar; teks pendamping abu-abu kecil.

### C. Tabel KPI

Header tabel menempel (sticky) di atas saat scroll; footer total menempel di
bawah. Hanya area baris yang scroll vertikal.

Kolom (kiri ke kanan):
Perspective | Objective and KPI | Owner | Weight | Baseline | Value | Target |
To Go | Change | Lagging Market | Progress | (menu titik tiga)

**Kolom Perspective** (sel besar yang menggabungkan banyak baris / rowspan,
satu per perspektif):

- Judul tebal ("Financial") dengan tombol collapse "−" di kanan.
- Skor besar berwarna oranye ("64%") + teks kecil "30% of score".
- Garis progres tipis berwarna oranye di bawah skor.
- Badge kecil merah-muda "2 off track" + teks "of 9" (jumlah KPI).
- Paragraf deskripsi abu-abu kecil.

**Baris Objective** (latar abu-abu muda, tebal)

- Ikon chevron collapse/expand, nama objektif tebal, jumlah KPI (abu-abu),
  tombol "+" kecil untuk menambah KPI ke objektif itu.
- Sel Progress di baris ini menampilkan progres objektif, berlatar warna
  status.
- Klik chevron = lipat/buka KPI di dalamnya.

**Baris KPI** (latar putih, tinggi baris seragam sekitar 28px, padat)

- Objective and KPI: nama KPI + ikon panah kecil abu-abu: ↑ artinya
  "makin tinggi makin baik", ↓ artinya "makin rendah makin baik".
- Owner: avatar bulat kecil + nama + chevron dropdown (bisa ganti pemilik).
  Nama panjang dipotong dengan "..." (contoh "Mich...").
- Weight: persen berwarna biru (input yang bisa diedit).
- Baseline: angka biasa.
- Value: berwarna biru (input yang bisa diedit). Bila kosong tampil "-".
- Target dan To Go: angka biasa; tampil "-" bila Value kosong.
- Change: sparkline mini (bar kecil tren) + ikon tren dan selisih:
  hijau "↗ +2" (naik), merah "↘ -1" (turun), abu-abu "→ 0" (tetap).
- Lagging Market: bendera negara kecil + kode negara + persen progres pasar
  terlemah, dengan latar berwarna status.
- Progress: persen dengan sel berlatar warna status (hijau/kuning/merah muda).
- Kolom terakhir: menu titik tiga vertikal per baris.

**Format angka per KPI**: ikuti tipe KPI: uang ($18.40M, $9.40), persen
(14.0%), angka biasa (4.6, 41.0). Simpan tipe format di data, jangan
di-hardcode di komponen.

### D. Footer total (menempel di bawah tabel, latar abu-abu muda)

- Kiri: "COMPANY SCORE Sep 2026" (tebal) dan di bawahnya
  "12 of 29 KPIs on track, 9 objectives".
- Kolom-kolom sejajar dengan tabel: "11 owners", "100% total" (total bobot),
  "12 on track" (hijau), "11 on watch" (oranye), "6 off track" (merah),
  "1 no actual", sparkline + "+2 pts since Aug", bendera GB + "0 of 10 behind",
  dan skor besar "61%" dengan label "Watch" di kolom Progress.

### E. Legenda (baris paling bawah card)

- Kiri: "Blue figures are inputs. Click one to edit, paste a range, Ctrl Z to
  undo." ("Blue figures" ditulis biru).
- Kanan: titik hijau "On Track 70% or more", titik oranye "Watch 45% or more",
  titik merah "Off Track under 45%".

## 2. Aturan status warna (satu fungsi bersama)

- Progress ≥ 70% = On Track (hijau)
- 45% sampai di bawah 70% = Watch (kuning/oranye)
- Di bawah 45% = Off Track (merah)
- Tidak ada Value = "no actual": tampil "-", tidak dihitung ke jumlah scored.
  Pakai satu fungsi/konstanta untuk batas ini dan pakai di semua tempat
  (sel progress, badge, ringkasan, legenda, footer).

## 3. Rumus perhitungan (fungsi murni, mudah diuji)

- Progress KPI "makin tinggi makin baik" = (Value − Baseline) ÷ (Target − Baseline)
- Progress KPI "makin rendah makin baik" = (Baseline − Value) ÷ (Baseline − Target)
  Batasi hasil ke rentang 0% sampai 100%.
- To Go = selisih absolut antara Target dan Value.
- Progress Objective = rata-rata berbobot progress KPI di dalamnya
  (pakai kolom Weight; bobot KPI dalam satu objektif berjumlah 100%).
- Skor Perspective = rata-rata berbobot progress objektif di dalamnya;
  setiap perspektif punya "X% of score" (bobot terhadap skor perusahaan).
- Company Score = rata-rata berbobot skor semua perspektif.
- Lagging Market = pasar dengan progres terendah untuk KPI tersebut.
- KPI tanpa Value dikecualikan dari perhitungan dan hitungan "scored".

Contoh verifikasi (harus cocok dengan data di bawah):

- ARR: (22.99−18.40)÷(24.00−18.40) = 82%
- Discount Rate (lebih rendah lebih baik): (14.0−12.5)÷(14.0−10.0) ≈ 38%
- Objektif "Grow Recurring Revenue": 0.40×82 + 0.35×60 + 0.25×88 ≈ 76%

## 4. Interaksi

- Value dan Weight bisa diedit langsung dengan klik; Enter menyimpan,
  Esc membatalkan. Setelah edit, semua turunan (progress, objektif,
  perspektif, ringkasan, footer) dihitung ulang seketika.
- Mendukung paste rentang angka dari spreadsheet ke kolom yang bisa diedit.
- Ctrl+Z membatalkan edit terakhir (riwayat undo sederhana).
- Pencarian "Search KPIs" memfilter baris; tombol "/" memfokuskan input.
- Collapse/expand per objektif dan per perspektif.
- Dropdown Owner mengganti pemilik KPI.
- Validasi input: tolak huruf pada kolom angka, tampilkan error kecil
  di sel, jangan sampai crash.

## 5. Data contoh (gunakan persis ini)

Tahun/periode: Sep 2026. Format: Baseline | Value | Target | arah (↑/↓).

Perspective "Financial" (skor 64%, 30% of score, 2 off track dari 9)
Deskripsi: "Recurring revenue funds what we build and who we hire next."

- Objective "Grow Recurring Revenue" (progress 76%)
  - Annual Recurring Revenue ↑ | Nick | 40% | $18.40M | $22.99M | $24.00M | To Go $1.01M | change → 0 | US 73% | progress 82%
  - Trial to Paid ↑ | Sana | 35% | 14.0% | 17.6% | 20.0% | 2.4% | ↗ +2 | FR 44% | 60%
  - Checkout Conversion ↑ | David | 25% | 30.0% | 38.8% | 40.0% | 1.2% | ↘ -1 | JP 79% | 88%
- Objective "Protect Gross Margin" (55%)
  - Gross Margin ↑ | David | 50% | 74.0% | 76.9% | 79.0% | 2.1% | ↗ +8 | JP 44% | 58%
  - Discount Rate ↓ | Nick | 30% | 14.0% | 12.5% | 10.0% | 2.5% | ↘ -2 | CA 22% | 38%
  - Monthly Revenue Churn ↓ | Priya | 20% | 2.4% | 1.8% | 1.6% | 0.2% | → 0 | CA 65% | 75%
- Objective "Lower Cost to Serve" (58%)
  - Cost per Million Events ↓ | Michael | 50% | $9.40 | $8.48 | $8.00 | $0.48 | ↗ +9 | NL 45% | 66%
  - Media Cost of Sale ↓ | Sana | 25% | 18.0% | 16.7% | 15.0% | 1.7% | → 0 | AU 25% | 43%
  - Support Cost Share ↓ | Omar | 15% | 7.2% | 6.5% | 6.0% | 0.5% | → 0 | AU 48% | 58%

Perspective "Customer" (skor 62%, 25% of score, 1 off track dari 6)
Deskripsi: "Teams stay when Signal answers their questions fast, week after week."

- Objective "Activate and Retain Teams" (53%)
  - Activation Rate ↑ | Priya | 35% | 40.0% | 47.2% | 50.0% | 2.8% | ↗ +4 | GB 62% | 72%
  - Week 1 Retention ↑ | Sofia | 30% | 38.0% | 42.5% | 48.0% | 5.5% | ↘ -1 | US 31% | 45%
  - Weekly Active Teams ↑ | Kenji | 20% | 58.0% | 60.4% | 66.0% | 5.6% | ↗ +4 | SE 20% | 30%
  - Net Promoter Score ↑ | Omar | 15% | 41.0 | (kosong) | 52.0 | - | → - | - | - (contoh "no actual")
- Objective "Support and Respond" (77%)
  - Solved on First Contact ↑ | Omar | 50% | 72.0% | 78.8% | 82.0% | 3.2% | ↘ -7 | FR 58% | 68%
  - Days to Resolve ↓ | Omar | 30% | 4.6 | 3.7 | 3.5 | 0.2 | ↗ +9 | DE 66% | 82%
  - First Reply Time ↓ | Sofia | 20% | 9.0 | 4.3 | 4.0 | 0.3 | ↗ +4 | DE 88% | 94%

Catatan: angka ringkasan di atas (61%, 12 on track, dst.) adalah dari
dataset penuh di gambar (29 KPI). Dengan data contoh yang lebih sedikit ini,
ringkasan boleh dihitung dari data yang ada. Yang penting rumusnya benar.

## 6. Gaya visual

- Latar putih, border tipis abu-abu, sudut card hampir tajam (radius kecil).
- Tipografi sans-serif bersih, ukuran kecil dan padat (tabel 12–13px),
  angka rata kanan dan memakai tabular-nums agar sejajar.
- Warna aksen: biru untuk angka yang bisa diedit, hijau/oranye/merah untuk
  status (latar sel dibuat pudar, teks lebih pekat), hitam untuk tombol utama.
- Header kolom tebal kecil dengan garis pemisah vertikal tipis.
- Warna dashboard selaras dengan arah warna dashboard yang sudah ada.
- Responsif: tabel boleh scroll horizontal di layar sempit; kolom Perspective
  dan Objective and KPI tetap terlihat.

## 7. Hal yang jangan dilakukan

- Jangan menaruh angka status/warna langsung di tiap komponen; pakai satu
  sumber aturan.
- Jangan memecah menjadi puluhan file kecil.
- Jangan menambah dependensi baru (chart, grid) tanpa izin saya; sparkline
  cukup dengan SVG sederhana.
- Jangan mengubah halaman lain.

## Hasil akhir yang diharapkan

Ringkasan: file yang dibuat, cara membuka halaman, dan hal yang perlu saya
putuskan (misalnya: sumber data asli, penyimpanan hasil edit).
