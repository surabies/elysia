# Penilaian Kuesioner SOP Pengaduan & Rancangan Kebijakan Dinamis

*Modul pengaduan Tirtawening · 22 November 2026*

## Ringkasan

Kuesioner wawancara SOP yang dihasilkan agent adalah titik awal yang bagus, tetapi belum cukup untuk dipakai langsung. Aturan bisnis pengaduan juga bisa dibuat dinamis lewat UI dan backend. Hanya saja tujuannya sebaiknya bukan “tanpa konstanta sama sekali”, melainkan “tanpa angka dan aturan SOP di dalam kode”.

## Penilaian kuesioner

### Yang sudah baik

- Setiap butir pertanyaan bisa ditelusuri ke parameter konfigurasi di kode.
- Ada nilai default dan kolom jawaban.
- Ada prosedur pengesahan.

### Yang perlu diperbaiki

1. **Pertanyaannya menggiring.** Hampir semuanya ya/tidak dengan default yang sudah ditulis, sehingga narasumber cenderung menjawab “ya sudah”. Mulai dengan pertanyaan terbuka (misalnya “ceritakan apa yang terjadi kalau ada laporan pipa bocor jam 2 pagi”), baru validasi angkanya.
2. **Kata “default asumsi industri air minum” menyesatkan.** Itu asumsi pengembang, bukan standar industri. Tulis apa adanya supaya narasumber tidak merasa terikat.
3. **Topik penting belum ditanyakan:**
   - Angka SLA dasar per prioritas (1/6, 2/24, 6/48, 12/72 jam). Q4 hanya menanyakan override per jenis.
   - Apakah jam SLA berjalan 24/7 atau hanya jam kerja dan hari kerja, serta pengaruh hari libur.
   - Kriteria “darurat” dan siapa yang berhak menentukannya.
   - Unit mana yang menangani tiap jenis (Distribusi, Hublang, Billing, Baca Meter).
   - Kanal masuk pengaduan dan arti kode wilayah di nomor tiket.
   - Alasan sah dan batas lama `MENUNGGU_PELANGGAN`.
   - Eskalasi otomatis (kapan dan ke siapa).
   - Bukti wajib per jenis (foto, GPS).
   - Apakah `VERIFIKATOR_1/2/3` berjenjang.
   - Notifikasi ke pelapor.
4. **Q11 baru separuh.** Selain soal tiket `DITOLAK` masuk pembilang atau tidak, tanyakan juga apakah ia masuk penyebut (jumlah pengaduan). Dua pilihan itu memberi hasil persentase yang berbeda.
5. **Q12 menyebut role `PENCATAT`.** Di router yang terlihat, role hanya `SUPERADMIN`, `EXECUTIVE`, `STAFF_ADMIN_BILLING`, `VERIFIKATOR_1/2/3`, dan `PELAKSANA`. Pastikan role itu memang ada di `AppRole`.
6. **Satu tabel 6 kolom sulit diisi Kepala Bagian.** Pecah per unit, sehingga tiap Kabag hanya melihat pertanyaannya.
7. **Minta data nyata**, bukan hanya opini: SK atau SOP tertulis dan logbook pengaduan 3 sampai 6 bulan terakhir. Data itu lebih jujur daripada jawaban kuesioner.
8. **Lakukan sebagai workshop**, bukan hanya formulir. Peragakan 4 skenario dari tes end-to-end dan minta mereka mengoreksi alurnya.

## Dinamis lewat UI: ya, dengan batasan

Batasannya ada pada **apa yang dijadikan data**:

| Jadikan data (bisa diatur lewat UI) | Tetap di kode |
| --- | --- |
| Durasi SLA per prioritas dan per jenis, jam kerja dan libur | Daftar status, jenis, dan aksi (enum database dan tipe di `@cater/types`) |
| Klasifikasi dan prioritas default per jenis | Invarian keamanan: pengunci optimistik, jejak audit, `DITUTUP` terminal, tidak ada data pribadi di endpoint publik |
| Jendela konfirmasi, batas reopen, panjang alasan tolak | Penomoran tiket atomik |
| Aturan transisi antar status yang sudah ada (plus syarat: wajib catatan, foto, penerima tugas) | Skema konfigurasi dan validatornya |
| Matriks izin role × aksi | Mekanisme pengecekan izin itu sendiri |
| Radius dan jendela duplikat, jenis yang tampil di peta publik, bukti wajib per jenis |  |

Menambah status atau jenis baru tetap pekerjaan pengembang. Mengubahnya jadi tabel referensi berarti migrasi besar pada database yang hidup, jadi tunda dulu.

## Rancangan singkat

- **Satu dokumen kebijakan berversi** di tabel baru `kebijakan_pengaduan`: versi, status (`DRAFT`/`AKTIF`/`ARSIP`), tanggal berlaku, nomor SK atau SOP dasar, alasan perubahan, pembuat dan penyetuju, serta isi konfigurasi dalam satu JSONB yang divalidasi skema. Satu dokumen per versi membuat penerbitan atomik, perbandingan antar versi mudah, dan rollback tinggal mengaktifkan versi lama.
- **Engine tetap murni:** semua fungsi menerima objek `kebijakan` sebagai parameter. File `pengaduan.config.ts` yang sekarang menjadi seed versi 1 dan nilai bawaan untuk tes. Perilaku hari pertama sama persis dengan sekarang.
- **Backend:** endpoint baca kebijakan aktif, simpan draft, validasi, terbitkan, dan riwayat versi. Kebijakan di-cache di memori dan dibuang saat ada penerbitan. Jika pembacaan gagal, pakai versi terakhir yang berhasil dimuat.
- **UI untuk SUPERADMIN** (atau role Kabag dengan persetujuan): tab SLA, Jam Kerja, Klasifikasi & Prioritas, Alur (grid transisi), Hak Akses (grid role × aksi), Penutupan & Reopen, Duplikat, Peta Publik. Alurnya: draft, simulasi, terbitkan (wajib isi nomor SK dan alasan), lalu riwayat dan rollback.

## Risiko yang harus dijaga

1. **Salah konfigurasi.** Pasang validasi rentang (SLA tidak boleh 0) dan validator graf: setiap status non-terminal harus tetap punya jalur ke status akhir, supaya tiket tidak terkunci.
2. **Ubah SLA tidak boleh mengubah sejarah.** Target waktu sudah tersimpan per tiket, jadi tiket lama aman. Simpan juga `kebijakan_versi` pada tiket untuk audit, supaya laporan kinerja tetap konsisten. Tambahkan tombol eksplisit “terapkan ke tiket terbuka” bila diperlukan.
3. **Izin mengubah kebijakan itu sendiri.** Matriks izin tidak boleh bisa mengunci SUPERADMIN keluar.
4. **Jangan membuat workflow engine generik.** Cukup parameter, matriks, dan aturan transisi di atas status yang sudah ada.

## Efeknya pada wawancara

Taruhan wawancara jadi jauh lebih kecil. Jawaban yang meleset bisa dikoreksi lewat UI tanpa rilis, dan “berita acara” menjadi versi kebijakan bernomor SK. Versi 1 bisa dijalankan dari default, dipantau beberapa minggu secara paralel dengan proses manual, lalu disetel ulang. Pertanyaan yang tetap harus tuntas sebelum membangun adalah yang menyangkut **struktur**: unit penanggung jawab, jenjang verifikasi, dan definisi “selesai ditangani”.

## Rekomendasi tahapan

- **Tahap A:** kebijakan berversi untuk parameter (SLA, jendela, batas, klasifikasi, prioritas) dengan UI sederhana.
- **Tahap B:** editor transisi dan matriks izin; sisanya menyusul.
- **Kuesioner v2:** tulis ulang per unit dengan pertanyaan terbuka dan topik yang tadi kurang.
