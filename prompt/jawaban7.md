# Perintah Kerja Mandiri: Aturan Anomali & Deviasi Dinamis (Tahap 1 revisi + Tahap 2 + 3 + 4)

Kerjakan seluruh tugas di bawah ini secara berurutan dan mandiri di Neon branch. JANGAN meminta persetujuan di antara langkah. Ambil keputusan sendiri memakai default yang sudah ditentukan di prompt ini, catat setiap keputusan di laporan akhir, dan jangan bertanya ulang soal hal yang sudah ditetapkan.

## Aturan keamanan (mutlak)

- Hanya bekerja di Neon branch. Database utama (ep-still-sun...) TIDAK BOLEH disentuh dalam bentuk apa pun. Pastikan DATABASE_URL yang dipakai proses, uji, dan skrip menunjuk branch, dan buktikan di laporan akhir. Jangan mengubah .env.local ke database utama.
- Jangan mengubah isi kolom yang sudah ada pada data transaksi (cater_baca_meter, rekening_drd, pelanggan). Hanya kolom klasifikasi baru yang boleh diisi.
- Periode yang sudah closing tidak boleh dihitung ulang setelah backfill awal.

## Kapan boleh berhenti dan bertanya (HANYA empat kondisi ini)

1. Perlu menyentuh database utama.
2. Perlu mengubah/menghapus data transaksi yang sudah ada selain kolom klasifikasi baru.
3. Uji otomatis atau pemeriksaan gerbang (lihat bawah) gagal dan tidak bisa diperbaiki setelah tiga upaya yang berbeda.
4. Dua keputusan desain yang sama-sama masuk akal dan akan mengubah total anomali periode berjalan lebih dari 2 poin persen, serta tidak ada default di prompt ini.
   Di luar itu, lanjutkan.

## Konteks keputusan bisnis (sudah final)

- Pemakaian 0 pada TMSS 8 (Tidak Ada Air) memang wajar karena stand dikosongkan. Yang menentukan anomali adalah POLANYA:
  - Berlanjut (periode lalu juga kode 8, atau pemakaian lalu di bawah ambang): peringatan WARN_KENDALA_AKSES, bukan anomali.
  - Mendadak (periode lalu normal dengan pemakaian lalu >= ambang, lalu kode 8 dengan pemakaian 0): ANOMALI, harus masuk antrean verifikasi.
  - Berkepanjangan (kode 8 berturut-turut >= N periode): ANOMALI untuk ditindaklanjuti.
- TMSS H dan R: tidak ada pengecualian khusus (tarif minimum membuat pemakaiannya jarang 0).
- ANOM_METER_MUNDUR TIDAK dikecualikan untuk TMSS 8. Pada kode 8, stma seharusnya sama dengan stml; stma < stml berarti data salah dan tetap anomali. Jangan menambah alur "pergantian meter".
- Pemetaan kondisi (sudah ada di branch): ANOM_KERUSAKAN_METER = 3, 6, 7, 9, D, F, O, T; WARN_KENDALA_AKSES = 2, 5, 8, AA, E, N, Q, R; spasi, -, H, Z, P, 4, U, 0, K, M = normal.

## Bagian A. Revisi Tahap 1 (bangun ulang branch dari awal)

1. Jalankan down migration di branch, lalu migrasi + seed final + backfill sebagai versi 1 yang bersih (bukan versi 1 lalu diubah).
2. Tidak ada kode TMSS di service/evaluator. Semua syarat dan pengecualian dibaca dari database dan ikut versi aturan + snapshot. Pengecualian bersifat BERSYARAT dan disimpan sebagai data (mis. berlaku hanya jika kondisi periode lalu sama dengan kondisi saat ini, atau pemakaian lalu di bawah ambang yang bisa diatur operator).
3. Tambahkan aturan KONDISI_FISIK baru (seed, semua parameter bisa diubah operator):
   - ANOM_TIDAK_ADA_AIR_MENDADAK: kode TMSS 8, pemakaian = 0, pemakaian lalu >= 10 m³ (parameter), DAN kondisi periode lalu termasuk kondisi yang dianggap normal untuk baseline. Default: dihitung anomali, ring 2 (Supervisor), keparahan TINGGI, badge warning. "Kondisi dianggap normal untuk baseline" ditentukan dari data (mis. kategori TERBACA di pemetaan) dengan H dan R dikecualikan lewat flag di data, bukan konstanta.
   - ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN: kode TMSS 8 berturut-turut >= N periode (parameter N, default 3). Default: dihitung anomali, ring 2, keparahan SEDANG. Hitung berurutan dari data periode sebelumnya di database. Bila riwayat di database kurang dari N periode (saat ini hanya 202610 dan 202611), evaluator tidak memicu aturan ini dan batasan itu didokumentasikan.
4. RATA_HISTORIS: periode "tidak aktif" (kondisi yang dikecualikan menurut data, mis. kode 8 dengan pemakaian 0) dikeluarkan dari rata-rata. Jika seluruh riwayat kosong, aturan berbasis persentase dilewati dan aturan absolut (lonjakan m³, nol, meter mundur, kondisi fisik) tetap berlaku.
5. Untuk periode tanpa data periode lalu (mis. 202610), evaluator memakai kolom pakai_lalu pada baris itu dan melewati aturan yang butuh kondisi periode lalu. Dokumentasikan batasan ini.
6. Koreksi kondisi/stand pada periode N-1 (lewat Verifikasi) harus memicu evaluasi ulang baris periode berikutnya yang bergantung padanya, selama periode itu belum closing. Terapkan mekanismenya dan uji.
7. Seed idempoten (ON CONFLICT DO NOTHING), kode aturan immutable (trigger idempoten + validasi API + uji), tidak ada hapus (hanya nonaktif). DEFAULT_ATURAN_ANOMALI hanya diimpor skrip seed, bukan kode runtime.
8. Skema Drizzle (TS) sama dengan SQL; drizzle-kit check bersih; tsc --noEmit lulus.
9. Uji otomatis (data sintetis + batas nilai): mendadak (30 m³ lalu normal, sekarang 0 dengan kode 8), berlanjut, berkepanjangan (N=3 dan N=4), pemakaian lalu di bawah ambang, pelanggan H/R tarif minimum, meter mundur pada kode 8, batas nilai tiap aturan (> vs >=), fallback RATA_HISTORIS, kode immutable.
10. Gerbang A: setelah backfill, query integritas harus 0 pelanggaran: (a) is*anomali = true dengan kode kosong atau WARN*%, (b) kode anomali non-WARN dengan is_anomali = false, (c) aturan_versi NULL. Total anomali + peringatan + normal sama dengan total baris per periode.

## Bagian B. Tahap 2: Backend (ikuti pola API yang sudah dipakai di aplikasi, jangan membuat pola baru)

1. CRUD aturan, pemetaan kondisi, dan pengecualian bersyarat. Kode tidak bisa diubah, tidak ada hapus.
2. Setiap perubahan aturan, dalam satu transaksi: validasi (ambang tidak kontradiktif), versi baru + snapshot, audit log (alasan wajib), hitung ulang periode berjalan yang belum closing. Periode closing tidak disentuh.
3. Endpoint pratinjau dampak (dry-run): jumlah baris yang berubah per kategori dan per kode, tanpa menulis.
4. Akses ubah hanya SUPERADMIN dan VERIFIKATOR_2; role lain hanya baca. Pastikan nama role sesuai yang ada di aplikasi.
5. Cache aturan memakai versi di database sebagai kunci invalidasi (aman untuk banyak instance).
6. Endpoint daftar kondisi yang belum terpetakan.
7. Seluruh jalur yang menulis ke cater_baca_meter wajib memanggil evaluator: /api/import/lapdatameter, /api/import/data, /api/import/pbpk, /api/import/r-nomor, /api/import/foto-backup, sinkron mobile, koreksi stand verifikasi, verifikasi mandiri, proses closing, dan skrip seed/ETL. Cari semua jalur lewat pencarian kode dan lampirkan daftar lengkap (path file:baris) beserta status: mengubah kolom yang memengaruhi klasifikasi (stml, stma, pakai_m3, kondisi/tmss) atau tidak, dan memanggil evaluator atau tidak. Tambahkan uji yang gagal jika ada jalur yang menulis tanpa evaluator.
8. Uji otomatis untuk poin 1-7.
   Gerbang B: semua uji lulus, tsc dan drizzle-kit bersih, tidak ada jalur penulisan tanpa evaluator.

## Bagian C. Tahap 3: UI Pengaturan Operator

Terhubung langsung ke API Tahap 2. Ikuti VERCEL_GEIST_GUIDE.md dan STRUKTUR-KODE.md: Badge pakai varian Geist resmi, tombol 32px, token tipografi dan warna dari globals.css, tanpa warna atau ukuran mentah, tanpa hardcode kode TMSS atau ambang di komponen.

- Daftar aturan (kode, nama, keparahan, ring, status), edit parameter (ambang, arah, acuan pembanding, syarat pemakaian lalu, nilai N), aktif/nonaktif.
- Tab pemetaan kondisi meter dan pengecualian bersyarat; tab "Belum Terpetakan".
- Riwayat versi dan audit log.
- Pratinjau dampak sebelum simpan, konfirmasi untuk perubahan berdampak luas, alasan perubahan wajib.
- Hanya SUPERADMIN dan VERIFIKATOR_2 yang bisa menyimpan; lainnya melihat saja.
- Tab Verifikasi Stand yang sekarang hanya state React (Ring 1/2/3) diganti memakai data aturan dari API.
  Gerbang C: halaman bisa dibuka, perubahan aturan terbukti mengubah klasifikasi periode berjalan, uji komponen/integrasi lulus.

## Bagian D. Tahap 4: Refactor semua konsumen

Ganti semua definisi anomali/deviasi yang tersebar dengan membaca is_anomali / kode_anomali_utama / kode_anomali_list dan label, tone, ring dari API aturan:

- dashboard.service.ts (KPI overview, antrean tindakan), cater-progress.service.ts (KPI dan radar ekstrim), cater-kueri.service.ts, verifikasi-grid.service.ts (statistik header, filter hanyaAnomali, ambangAnomali di payload), analytics.service.ts, kpi.ts, RingkasanCater.tsx (hapus angka dummy 6,2%), PembacaanDitinjau.tsx, perhitungan-pemakaian.ts, warna-tahap.ts, kolom-verifikasi.tsx, TabVerifikasiStand.tsx, serta engine lama cater-anomali.engine.ts (hapus setelah tidak dipakai).
- Pisahkan jelas: is*anomali (hasil klasifikasi) vs status_verifikasi (alur kerja V1/V2/V3). Semua kartu, grafik, dan statistik "anomali" memakai is_anomali. Peringatan (WARN*\*) ditampilkan terpisah dari anomali dan tidak masuk hitungan KPI anomali.
- Frontend hanya menampilkan; tidak boleh menghitung ulang klasifikasi.
- Setelah selesai, cari sisa definisi lama di kode (ambang 75/100/50 m³, ket_catat != 'Normal', tmss NOT IN, rumus deviasi) dan lampirkan hasil pencarian yang membuktikan tidak ada yang tersisa di luar modul aturan.
  Gerbang D: buat satu uji/skrip konsistensi yang membandingkan jumlah anomali periode yang sama di: dashboard KPI, progres cater, analitik, header grid Verifikasi, filter "Hanya Anomali", dan antrean tindakan. Semua harus identik. Lampirkan query/uji yang bisa saya jalankan ulang.

## Laporan akhir (satu kali, ringkas, setelah semua gerbang lulus)

1. Bukti DATABASE_URL yang dipakai (branch) dan pernyataan bahwa database utama tidak disentuh.
2. Tabel rincian per kode utama dan total (anomali / peringatan / normal) untuk 202611 dan 202610, plus total 36.762, dan hasil query integritas.
3. Daftar jalur penulisan ke cater_baca_meter (path:baris, status evaluator).
4. Daftar keputusan yang Anda ambil memakai default (nilai seed dan parameter akhir).
5. Hasil semua gerbang (A-D), uji otomatis, tsc, drizzle-kit.
6. Daftar file yang diubah/ditambah/dihapus.
7. Rencana eksekusi ke database utama (skrip, urutan, titik pemulihan Neon, rollback). JANGAN dijalankan; saya yang menyetujui terpisah.
8. Risiko atau batasan yang tersisa.

Mulai dari Bagian A sekarang dan lanjutkan sampai Bagian D tanpa menunggu persetujuan.
