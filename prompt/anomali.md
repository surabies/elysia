# Tugas: Pusatkan Aturan Anomali & Deviasi (Dinamis, Dikelola Operator)

## Konteks

Aplikasi baca meter untuk PDAM Tirtawening (Kota Bandung). Dashboard memakai Next.js + shadcn/ui dengan Vercel Geist Design System (token di `globals.css`, panduan di `VERCEL_GEIST_GUIDE.md`). Backend ada di repo/folder terpisah. Ikuti konvensi di `STRUKTUR-KODE.md`.

## Masalah

Definisi "anomali" dan "deviasi" saat ini tersebar dan tidak konsisten di banyak tempat (seed, konstanta kode, query masing-masing modul). Akibatnya kartu KPI, kartu metrik, grafik, tabel Verifikasi, dan tabel lain menghitung anomali dengan cara berbeda, sehingga angkanya saling bertentangan dan query sering salah.

## Tujuan

Satu sumber kebenaran (single source of truth) untuk aturan anomali dan deviasi:

1. Disimpan di database dan dilayani backend khusus (modul terpisah).
2. Dikelola operator lewat UI pengaturan, tanpa deploy ulang.
3. Dipakai oleh semua modul (KPI, metrik, grafik, tabel Verifikasi, tabel lainnya) berdasarkan **kode anomali** dari backend ini.
4. Saat operator mengubah aturan, seluruh tampilan dan perhitungan ikut berubah secara konsisten.

## Prinsip Wajib

- **Tidak ada hardcode.** Kategori anomali, ambang penurunan/lonjakan, dan deviasi tidak boleh ada di seed, konstanta kode, `CASE WHEN` pada query, atau komponen UI. Seed hanya boleh membuat _aturan bawaan awal_ sebagai data biasa yang bisa diubah operator.
- **Satu kode, satu arti.** Setiap kategori punya kode anomali yang stabil (misalnya `ANOM_...`). Semua modul merujuk kode itu, bukan membandingkan teks, angka, atau kondisi sendiri.
- **Perhitungan di satu tempat.** Klasifikasi (apakah satu pembacaan anomali, jenis apa, tingkat apa) dilakukan oleh satu layanan/fungsi backend. Frontend dan query agregat tidak boleh mengulang logikanya.

## Cakupan Aturan yang Harus Bisa Diatur Operator

1. **Kategori kondisi meter yang dianggap anomali**: daftar kondisi (kode & nama kondisi dari data meter, misalnya kolom kd_kel/nm_kel/TMSS) dan pemetaannya ke kategori anomali.
2. **Range penurunan pemakaian**: ambang batas penurunan dibanding pemakaian periode lalu (persen dan/atau m³), minimal bertingkat.
3. **Range lonjakan pemakaian**: ambang batas kenaikan dibanding periode lalu (persen dan/atau m³), minimal bertingkat.
4. **Deviasi**: aturan penyimpangan (acuan perbandingan, ambang, tingkat keparahan).
5. Untuk tiap aturan: kode, nama tampil, tingkat keparahan, warna semantik (memakai token Geist, bukan warna mentah), status aktif/nonaktif, dan urutan.

## Pekerjaan yang Diminta (kerjakan bertahap)

### Tahap 1 – Audit (jangan ubah kode dulu)

- Cari semua tempat yang mendefinisikan atau menghitung anomali/deviasi: seed, konstanta, query backend, endpoint, hook/komponen frontend, kartu KPI/metrik, grafik, tabel Verifikasi (Petugas/Mandiri), tabel lain.
- Buat laporan: lokasi (file:baris), definisi yang dipakai, dan inkonsistensinya.
- Beri usulan skema dan rencana migrasi, lalu **berhenti dan minta persetujuan saya** sebelum lanjut.

### Tahap 2 – Backend

- Rancang tabel aturan (kategori anomali, ambang penurunan/lonjakan, deviasi, pemetaan kondisi meter) beserta migrasi.
- Buat modul backend khusus dengan API CRUD aturan dan endpoint baca untuk konsumen (validasi: ambang tidak boleh tumpang tindih atau kontradiktif, nilai wajib masuk akal).
- Buat satu layanan klasifikasi yang menghasilkan kode anomali untuk setiap pembacaan dan dipakai ulang oleh semua query/agregasi.
- Mekanisme propagasi perubahan: saat aturan diubah, hasil klasifikasi dan agregat (KPI, metrik, grafik) harus ikut konsisten. Jelaskan pilihan Anda (hitung saat query, kolom turunan yang dihitung ulang, atau job rekalkulasi) beserta alasannya, dan pastikan tidak ada data basi.
- Catat audit perubahan aturan (siapa, kapan, nilai lama dan baru) dan batasi akses hanya untuk peran yang berwenang.

### Tahap 3 – UI Pengaturan Operator

- Halaman pengaturan (di dashboard) untuk melihat, menambah, mengubah, dan menonaktifkan aturan di atas, terhubung langsung ke API.
- Validasi form, pratinjau dampak (mis. jumlah pembacaan yang akan terklasifikasi anomali pada periode berjalan sebelum disimpan), dan konfirmasi sebelum menyimpan perubahan yang berdampak luas.
- Ikuti `VERCEL_GEIST_GUIDE.md`: Badge memakai varian Geist resmi, tombol 32px, token tipografi dan warna dari `globals.css`, tanpa ukuran atau warna mentah.

### Tahap 4 – Refactor Semua Konsumen

- Ganti seluruh definisi anomali/deviasi yang tersebar dengan pemanggilan ke backend aturan (berdasarkan kode anomali).
- Sasaran: kartu KPI, kartu Metrik Operasional, grafik pemakaian dan riwayat status, tabel Verifikasi, serta tabel lain yang menampilkan atau menghitung status anomali.
- Hapus konstanta dan logika lama yang sudah tergantikan. Seed hanya menyisakan aturan bawaan sebagai data.

## Kriteria Selesai

- Tidak ada lagi definisi anomali/deviasi di seed, konstanta, atau query di luar modul aturan (buktikan dengan pencarian kode dan sertakan hasilnya).
- Mengubah satu aturan lewat UI mengubah angka di kartu KPI, kartu metrik, grafik, dan tabel Verifikasi secara serentak dan konsisten.
- Untuk periode yang sama, jumlah anomali di semua tampilan sama persis.
- Ada pengujian untuk layanan klasifikasi (kasus batas ambang, aturan nonaktif, kondisi meter tanpa pemetaan) dan untuk konsistensi antar-endpoint agregat.
- Ada catatan migrasi data lama dan cara memutar ulang klasifikasi bila diperlukan.

## Cara Bekerja

- Mulai dari Tahap 1 dan tunggu persetujuan saya sebelum mengubah kode.
- Jika ada keputusan desain yang ambigu (mis. definisi deviasi, acuan perbandingan, siapa yang boleh mengubah aturan), ajukan pertanyaan singkat dengan opsi dan rekomendasi Anda, jangan menebak.
- Laporkan tiap tahap secara ringkas: apa yang diubah, file yang terdampak, dan cara memverifikasinya.
