Disetujui dengan syarat. Ikuti urutan berikut.

## 1. Eksekusi di cabang Neon dulu, bukan database utama

- Buat branch Neon dari database utama, jalankan migrasi 0019, seed, dan backfill di sana.
- Jalankan migrasi + seed + backfill dalam satu transaksi (atau backfill per batch dengan status), supaya tidak ada keadaan setengah jadi.
- Konfirmasi dry-run sebelumnya hanya membaca (tanpa menulis ke database utama). Sebutkan bagaimana dijamin.
- Setelah hasil di branch saya setujui, baru jalankan ke database utama. Pastikan ada backup/titik pemulihan sebelum itu.

## 2. Pecah ANOM_KONDISI_FISIK (keputusan bisnis, tunggu saya)

Anomali 47,2% dengan 5.358 baris dari kondisi fisik terlalu tinggi untuk dipakai sebagai KPI. Siapkan dua aturan:

- ANOM_KERUSAKAN_METER (dihitung sebagai anomali)
- WARN_KENDALA_AKSES (dihitung_sebagai_anomali = false)
  Jangan memutuskan sendiri kode TMSS mana masuk ke mana. Berikan tabel semua kode TMSS beserta jumlah baris periode 202611 dan 202610 per kode, dengan kolom usulan kategori kosong, untuk saya isi. Setelah itu seed diperbarui.

## 3. Perbaikan teknis

- Tegakkan `kode` immutable (trigger atau validasi API + uji).
- Dokumentasikan batas nilai (`>` vs `>=`) setiap aturan dan buat uji di nilai batas (74, 75, 76 m³; 49%, 50%, 51%, dst).
- Konfirmasi fallback RATA_HISTORIS sudah diimplementasikan dan diuji (pakai lalu 0/kosong).
- Perbarui skema Drizzle (TS) agar sama dengan SQL; pastikan drizzle-kit tidak menghasilkan selisih.
- Pastikan DEFAULT_ATURAN_ANOMALI hanya diimpor skrip seed, tidak oleh kode runtime (sertakan hasil pencarian).

## 4. Koreksi klaim laporan

- "Sebelum/sesudah" belum terbukti sampai Tahap 4. Laporkan hanya hasil klasifikasi untuk saat ini.
- Perbaiki klaim bahwa KPI lama menampilkan 0 agar sesuai hasil audit (kutip file:baris yang benar).
- Setelah Tahap 4 selesai, buktikan angka anomali identik di semua tampilan dengan query/uji yang saya bisa jalankan ulang.

Lanjutkan ke modul service backend setelah poin 1–3 selesai dan hasil di branch saya setujui.
