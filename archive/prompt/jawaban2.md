Rencana migrasi BELUM disetujui untuk dijalankan. Perbaiki dulu poin berikut, lalu kirim ulang file migrasi dan seed yang sudah direvisi.

## Wajib diubah pada skema

1. **Ekspresivitas aturan.** Skema harus bisa menyatakan semua aturan seed tanpa memelintir kolom:
   - Tambah `arah` ('NAIK' | 'TURUN' | 'KEDUANYA') dan `selisih_min_m3`.
   - Pisahkan kondisi OR menjadi aturan terpisah (mis. LONJAKAN_ABSOLUT dan LONJAKAN_RELATIF) atau tambah penggabung kondisi yang eksplisit. Jelaskan pilihan Anda.
   - Definisikan tanda min/max persen dengan jelas dan dokumentasikan.
2. **Input evaluasi.** `evaluasiAnomali` menerima `stml`, `stma`, `pakaiM3`, `pakaiLalu`, `kodeTmss`. ANOM_METER_MUNDUR dievaluasi dari `stma < stml`. Pakai m³ saat ini di-clamp ke 0, jadi jangan mengandalkannya untuk mendeteksi mundur.
3. **Versi aturan.** Buat mekanisme versi nyata:
   - Tabel/baris penghitung versi aturan yang naik setiap perubahan disimpan.
   - Snapshot isi aturan (JSON) per versi, agar klasifikasi periode closing bisa ditelusuri.
4. **Anomali vs peringatan.** Tambah penanda per aturan (mis. `dihitung_sebagai_anomali` boolean, atau tingkat 'PERINGATAN' yang tidak mengisi `is_anomali`). Usul awal: Ring 1 (30–50%) masuk peringatan, bukan anomali. Tampilkan di pratinjau berapa baris termasuk tiap kategori.
5. **Kode aturan immutable.** `kode` tidak boleh diubah setelah dibuat. Penghapusan aturan hanya lewat `aktif = false`. Tambahkan 'DELETE' atau larangannya secara eksplisit di audit.
6. **Tipe/ketergantungan.** Pastikan `master_kondisi_catat.kode_tmss` memang unik/PK sebelum dijadikan foreign key.

## Wajib ditambahkan pada rencana

7. **Backfill awal.** Setelah migrasi, klasifikasikan SEMUA periode yang ada (bukan hanya periode aktif) sekali dengan aturan bawaan, supaya grafik riwayat tidak menampilkan nol. Tandai baris hasil backfill (aturan_versi awal). Ini klasifikasi awal, bukan "rekalkulasi periode closing karena aturan berubah". Setelah itu periode closing tidak disentuh lagi.
8. **Seed idempoten.** Aturan bawaan memakai INSERT ... ON CONFLICT DO NOTHING; menjalankan ulang seed tidak boleh menimpa aturan yang sudah diedit operator.
9. **Pendaftaran migrasi Drizzle.** File 0019 harus konsisten dengan skema Drizzle di packages/db dan journal migrasi (hasil drizzle-kit atau didaftarkan manual). Jelaskan caranya.
10. **Cache.** Jika backend bisa berjalan di lebih dari satu instance/serverless, cache memori tidak cukup. Gunakan pemeriksaan versi aturan di database sebagai kunci invalidasi. Jelaskan arsitektur yang Anda pilih.
11. **Keamanan eksekusi.** Jalankan dulu di database salinan/staging, sertakan skrip rollback (down migration), dan laporkan hasil: jumlah anomali per kategori untuk periode aktif sebelum vs sesudah.

## Seed bawaan

Nilai seed saat ini mengambil ambang dari satu modul saja (75 m³, 30 m³, 50%). Itu boleh sebagai titik awal, tetapi tulis di laporan bahwa ambang lama berbeda-beda (mis. 100 m³ dan 3x pada engine lama), supaya operator tahu angka awalnya merupakan pilihan, bukan kebenaran mutlak. Seed ANOM_KONDISI_FISIK harus mengisi `aturan_kondisi_meter_map` per kode TMSS, dan kode yang belum terpetakan harus muncul di daftar "belum terpetakan" pada UI.

Setelah revisi, kirim ulang: (a) file migrasi dan seed, (b) hasil dry-run di data salinan, (c) rencana rollback. Saya setujui eksekusi setelah itu.
