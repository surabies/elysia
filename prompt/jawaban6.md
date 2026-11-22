Hasil eksekusi di branch saya setujui. Berikut keputusan terbuka dan instruksi berikutnya.

## 1. Keputusan

1. TMSS H dan R: Opsi 1 (biarkan, tidak ada pengecualian).
2. TMSS 8 (Tidak Ada Air): TIDAK dikecualikan secara menyeluruh, dan TIDAK dianggap anomali selalu. Yang menentukan adalah perubahannya:
   - Kode 8 dengan pemakaian 0 yang BERLANJUT (periode lalu juga kode 8, atau pemakaian lalu 0/di bawah ambang) = wajar, hanya peringatan (WARN_KENDALA_AKSES).
   - Pelanggan yang periode lalu NORMAL dengan pemakaian wajar (mis. 30 m³) lalu mendadak kode 8 dengan pemakaian 0 = ANOMALI dan harus muncul untuk ditindaklanjuti verifikator.

## 2. Implementasi aturan TMSS 8 (semuanya data, tanpa hardcode)

- Tidak ada `if tmss === '8'` di service atau evaluator. Seluruhnya dibaca dari database dan ikut versi aturan + snapshot.
- Pengecualian per aturan dan per kode TMSS bersifat BERSYARAT, dengan syarat disimpan sebagai data (mis. berlaku hanya jika kondisi periode lalu sama dengan kondisi saat ini, atau pemakaian periode lalu di bawah ambang yang bisa diatur operator).
- Tambah aturan KONDISI_FISIK khusus perubahan mendadak (usulan kode ANOM_TIDAK_ADA_AIR_MENDADAK): TMSS 8 dengan pemakaian lalu >= ambang (parameter aturan, bukan konstanta). Tingkat dan ring ditentukan di seed dan bisa diubah operator.
- Anomali ini harus muncul di antrean verifikasi untuk ditindaklanjuti verifikator.

## 3. Bukti dari database branch sebelum Tahap 2

a. Isi `aturan_kondisi_meter_map` per aturan (kode TMSS yang terpetakan ke ANOM*KERUSAKAN_METER dan WARN_KENDALA_AKSES). Tabel pemakaian 0 sebelumnya menunjukkan P dan 4 sebagai KERUSAKAN_METER, padahal harusnya NORMAL. Pastikan itu hanya salah label.
b. Query kebalikan: baris dengan kode_anomali_utama bukan NULL, bukan WARN*%, dan bukan NORMAL_BERSIH tetapi is_anomali = false (harus 0). Jelaskan bagaimana baris normal disimpan (NULL atau kode NORMAL_BERSIH).
c. Nama aturan di database untuk ANOM_LONJAKAN_PERSEN harus sesuai aturannya (>=100% dan selisih >= 30 m³), bukan ">80%".
d. Semua baris TMSS 8 untuk 202611 dan 202610 dikelompokkan berdasarkan keadaan periode lalu: (i) kondisi lalu normal dengan pemakaian lalu >= 10 m³, (ii) kondisi lalu juga 8, (iii) pemakaian lalu 0 atau di bawah 10 m³ dengan kondisi lalu selain 8, (iv) tidak ada riwayat. Sertakan jumlah baris dan rata-rata pemakaian lalu tiap kelompok.
e. Untuk tiap kelompok pada poin d, kode_anomali_utama yang dihasilkan saat ini (kelompok mana yang sudah anomali, mana yang hanya peringatan).
f. Stand akhir (stma) pada baris TMSS 8: sama dengan stand lalu, NULL, atau 0. Pastikan ANOM_METER_MUNDUR tidak terpicu oleh baris TMSS 8. Jika terpicu, tambahkan pengecualian bersyarat yang sama.
g. Perlakuan RATA_HISTORIS untuk pelanggan yang bulan-bulan sebelumnya kode 8 dengan pemakaian 0. Usulkan perlakuan dan jelaskan sebelum diterapkan.
h. Dry-run ulang dengan aturan baru: total anomali, peringatan, dan normal sebelum vs sesudah, serta rincian per kode utama untuk 202611 dan 202610.
Tunggu persetujuan saya atas hasil poin d sampai h (termasuk ambang pemakaian lalu) sebelum mengubah seed atau aturan.

## 4. Tahap 2 (backend)

Ikuti pola API yang sudah dipakai di aplikasi (jangan memperkenalkan pola baru jika bukan tRPC yang sudah ada):

1. CRUD aturan, pemetaan kondisi, dan pengecualian bersyarat. Kode tidak bisa diubah, tidak ada hapus (hanya nonaktif).
2. Setiap perubahan aturan: validasi (ambang tidak kontradiktif), versi baru + snapshot, audit log (alasan wajib), lalu hitung ulang periode berjalan dalam satu transaksi. Periode closing tidak disentuh.
3. Endpoint pratinjau dampak (dry-run) yang melaporkan jumlah baris yang berubah per kategori, tanpa menulis.
4. Akses ubah: SUPERADMIN dan VERIFIKATOR_2; role lain hanya baca.
5. Cache aturan memakai versi di database sebagai kunci invalidasi (aman untuk banyak instance).
6. Daftar kondisi belum terpetakan.
7. Semua jalur yang menulis ke cater_baca_meter harus memanggil evaluator: impor LapDataMeter, impor data pencatatan, sinkron mobile, koreksi stand verifikasi. Cari semua jalur dengan pencarian kode dan laporkan daftarnya. Sertakan uji yang memastikan tidak ada jalur yang melewati evaluator.
8. Uji otomatis untuk poin 1-7, termasuk kasus TMSS 8 berlanjut vs mendadak.

Tetap di branch. Jangan menyentuh database utama sebelum Tahap 2-4 selesai dan saya setujui.
