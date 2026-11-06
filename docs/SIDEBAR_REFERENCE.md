# Referensi Modul Sidebar & Arsitektur Backend: Aplikasi Aurora Baca Meter (Perumda Tirtawening)

Dokumen ini mendefinisikan seluruh struktur menu navigasi, Master Data, RBAC, dan Logika Bisnis dari sistem legasi Aurora untuk diimplementasikan ke dalam arsitektur backend modern (Node.js/Hono/Prisma/PostgreSQL).

---

## 1. Dashboard
- **Fungsi Utama:** Ringkasan eksekutif (high-level overview) operasional pembacaan meter harian.
- **Logika Bisnis & Backend:** 
  - Menyediakan metrik real-time: Total target pelanggan, jumlah pembacaan masuk (uploaded), progress persentase (%) penyelesaian oleh petugas (cater), dan anomali/kelainan meter harian.
  - Endpoint agregasi data berdasarkan wilayah pelayanan aktif (misalnya Wilayah 5).

---

## 2. Master
Berisi konfigurasi inti sistem, pengelolaan hak akses, dan struktur rute petugas lapangan.
1. **Kelainan:** Master data kode jenis kelainan meter (contoh: meter rusak, kaca buram, rumah kosong, jarum macet).
2. **Otorisasi Menu:** Pengaturan hak akses (*Role-Based Access Control / RBAC*) per level pengguna (Admin, Supervisor, Petugas/Cater).
3. **User:** Manajemen akun pengguna aplikasi desktop/web backend (CRUD user, password hash, status aktif).
4. **Petugas:** Manajemen data profil petugas pencatat meter lapangan (*cater*).
5. **Pemetaan Petugas:** Penugasan area/wilayah kerja spesifik untuk masing-masing petugas.
6. **Pengurutan Rute Petugas:** Pengaturan urutan sekuensial rute jalan/gang pelanggan agar efisien saat pembacaan lapangan.
7. **Penggabungan Rute:** Fitur untuk menggabungkan beberapa rute kecil menjadi satu rute penugasan.
8. **Pindah Rute:** Memindahkan data pelanggan dari satu rute ke rute petugas lain.
9. **Pindah Rute Monitoring:** Memantau riwayat atau log pemindahan rute pelanggan antar petugas agar tidak ada data yang tercecer.

---

## 3. Pengolahan Data
Modul operasional harian untuk memproses data pembacaan meter dan mutasi pelanggan.
1. **Baca Meter CHN:** Pemrosesan data hasil baca meter format CHN dari perangkat/aplikasi mobile petugas.
2. **Info Pelanggan:** Pencarian detail data pelanggan (nomor langganan, nama, alamat, golongan, koordinat).
3. **Mutasi PB-PK:** Pengelolaan mutasi Pasang Baru (PB) atau Perubahan Kategori/Golongan (PK).
4. **No HP Pel:** Pembaruan nomor telepon/WhatsApp pelanggan untuk keperluan konfirmasi atau layanan mandiri.
5. **Pindah Jenis Pel:** Modifikasi kategori tarif/golongan pelanggan.
6. **Manual ADD:** Input data pembacaan meter secara manual oleh admin untuk kasus khusus.
7. **Manual Add All:** Input atau penyesuaian data manual secara massal (*batch*).
8. **Hitung Rata-Rata:** Kalkulasi otomatis pemakaian rata-rata air pelanggan berdasarkan histori bulan-bulan sebelumnya (digunakan jika meter mati/taksiran).
9. **Cek Foto Petugas:** Validasi visual foto bukti fisik yang diunggah petugas di lapangan untuk mencegah kecurangan (*fraud*).
10. **Verifikasi Catat Mandiri:** Validasi data pembacaan mandiri yang dikirimkan oleh pelanggan melalui kanal publik.

---

## 4. Peta (Mapping)
1. **Pemetaan Pelanggan:** Visualisasi titik koordinat pelanggan (GIS / PostGIS) di atas peta wilayah operasional untuk melihat sebaran rute dan pembacaan secara spasial.

---

## 5. Progress
Modul monitoring kinerja dan analisis volume air.
1. **Grafik Pelanggan:** Grafik tren kubikasi pemakaian air pelanggan.
2. **Progress per Wilayah:** Laporan persentase penyelesaian pembacaan meter per zona wilayah.
3. **Progress per Cater:** Laporan produktivitas harian masing-masing petugas pencatat meter.
4. **Presentase Koreksi:** Monitoring jumlah data yang dikoreksi oleh supervisor.
5. **Ikhtisar Pemakaian Ekstrim:** Deteksi lonjakan pemakaian air yang tidak wajar (anomali tinggi).
6. **Ikhtisar Pemakaian Turun:** Analisis penurunan drastis pemakaian air pelanggan.
7. **Ikhtisar Pemakaian 0 (Nol):** Daftar pelanggan dengan pemakaian air 0 kubik (indikasi meter mati atau tidak ada huni).
8. **Hasil Foto Petugas:** Rekapitulasi galeri foto bukti pembacaan lapangan.

---

## 6. Laporan (Reports)
Modul pelaporan komprehensif untuk keperluan audit, penagihan, dan manajerial.
1. **Laporan DRD (Daftar Rekening Ditagih):** Rekapitulasi tagihan air bulanan[cite: 9].
2. **Lap. Mutasi Pel:** Laporan perubahan data induk pelanggan[cite: 9].
3. **Lap. Mutasi PB-PK:** Laporan pasang baru dan perubahan kategori[cite: 9].
4. **Lap. Periode Cater:** Laporan jadwal dan periode pembacaan[cite: 9].
5. **Lap. Data Meter:** Laporan nomor seri dan spesifikasi meter air[cite: 9].
6. **Lap. Kelainan Meter:** Laporan rekapitulasi gangguan/kerusakan meter[cite: 9].
7. **Lap. Evaluasi:** Laporan evaluasi kinerja bulanan[cite: 9].
8. **Lap. Pelanggan:** Direktori lengkap data pelanggan[cite: 9].
9. **Lap. Selisih Hari:** Laporan deviasi rentang hari pembacaan antar periode[cite: 9].
10. **Lap. Data St. Awal & Akhir:** Laporan stand angka meter awal dan akhir[cite: 9].
11. **Lap. Data St. 0 (Nol):** Laporan khusus stand meter nol[cite: 9].
12. **Lap. History:** Rekapitulasi histori pembacaan jangka panjang[cite: 9].
13. **Lap. Perubahan Pel:** Log audit perubahan data pelanggan[cite: 9].
14. **Lap. Data dan Foto:** Laporan gabungan data teks dan bukti foto[cite: 9].
15. **Lap. Monitoring Kubikasi Koreksi:** Laporan audit koreksi kubikasi air[cite: 9].

---

## 7. Tool Tutup Bulan (Closing Period)
Prosedur administratif akhir bulan untuk mengunci periode pembacaan dan membuka siklus penagihan baru.
1. **PBPK:** Finalisasi data pasang baru dan perubahan kategori[cite: 10].
2. **Stand Angkat:** Penguncian stand akhir meter[cite: 10].
3. **Update Zonasi:** Pembaruan data struktur zonasi wilayah[cite: 10].
4. **Posting Datameter:** Publikasi data meter final untuk sistem billing utama[cite: 10].
5. **Create Closed DRD:** Pembuatan data DRD terkunci (closing)[cite: 10].
6. **Create Perbandingan:** Pembuatan data pembandingan antar bulan[cite: 10].
7. **Create Bulan Baru:** Inisialisasi periode pembacaan bulan berikutnya[cite: 10].
8. **Upload Master Pelanggan:** Sinkronisasi database master pelanggan baru[cite: 10].
9. **Sync Pelanggan Baru:** Sinkronisasi data pelanggan dari sistem pendaftaran[cite: 10].
10. **Update Data Pelanggan:** Pembaruan massal data pelanggan[cite: 10].
11. **Cek Selisih Pelanggan:** Audit rekonsiliasi jumlah pelanggan aktif[cite: 10].
12. **Monitoring Ttp Bulan:** Pantauan status proses tutup bulan[cite: 10].

---

## 8. Tools & Integrasi (Import / Sync)
Modul utilitas untuk migrasi data, backup, dan pertukaran data eksternal.
1. **Running Text:** Pengaturan teks pengumuman berjalan di aplikasi mobile petugas.
2. **Import St Angkat:** Impor data stand angka pengangkatan/penggantian meter[cite: 11].
3. **Import PB PK:** Impor data mutasi pasang baru/perubahan kategori[cite: 11].
4. **Proses Pbpk:** Eksekusi pemrosesan data mutasi[cite: 11].
5. **Import Backup Photo:** Pemulihan cadangan file foto pembacaan[cite: 11].
6. **Import Backup Photo GWM:** Pemulihan cadangan foto Grand Water Meter (Master Meter)[cite: 11].
7. **Import Backup Data:** Pemulihan database/file cadangan sistem[cite: 11].
8. **Import Data SPT:** Impor data Surat Perintah Tugas / rute[cite: 11].
9. **Import Data Anomali:** Impor data penandaan anomali dari sistem lain[cite: 11].
10. **Import Data GWM:** Impor data master atau pembacaan Grand Water Meter (Master Meter)[cite: 11].
11. **Import Tutup:** Impor file hasil penutupan buku/bulan[cite: 11].

---

## 9. SYNC Tutup Bulan (Mobile Synchronization)
Sinkronisasi data antara server backend Elsia dengan aplikasi mobile petugas lapangan (Android).
1. **Sync (1) Kirim Mutasi:** Mengirim data terbaru mutasi pelanggan ke perangkat petugas.
2. **Sync (2) Kirim Datameter:** Mengirim daftar rute dan target pembacaan meter ke perangkat petugas.
3. **Sync (3) Import STI:** Menarik data hasil pembacaan lapangan (Stand, Foto, Koordinat, Kelainan) dari perangkat petugas ke server.
4. **Sync (4) Bulan Baru:** Sinkronisasi perpindahan siklus ke bulan operasional baru.

---

## 10. Matriks Paritas Backend Elysia vs Aurora Sidebar

Tabel berikut menunjukkan pemetaan menyeluruh antara modul sidebar aplikasi Aurora dengan lapisan backend Elysia + Drizzle + PostGIS yang telah selesai dibangun:

| No | Modul Aurora | Menu / Fitur | Elysia Endpoint | Service Layer | Domain Engine / DB Schema | Status RBAC |
|---|---|---|---|---|---|---|
| **1** | **Dashboard** | Overview Stats | `GET /api/cater/stats` | `caterKueriService.getStats` | `caterBacaMeter`, `rekeningDrd` | Public/Staff |
| **2** | **Master Rute** | Pengurutan Rute (2.6) | `POST /api/cater/rute/urutkan` | `caterRuteService.urutkanRute` | `pelanggan.noUrutRute` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_1/2` |
| | | Penggabungan Rute (2.7) | `POST /api/cater/rute/gabung` | `caterRuteService.gabungRute` | `pelanggan.ruteKode` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_1/2` |
| | | Pindah Rute (2.8) | `POST /api/cater/rute/pindah` | `caterRuteService.pindahRute` | `pelanggan.ruteKode` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_1/2` |
| **3** | **Pengolahan Data** | Submit Baca Meter (3.1) | `POST /api/cater/readings` | `caterVerifikasiService.submitReading` | `evaluasiPemakaianMeter` | `PENCATAT` |
| | | Cari Pelanggan (3.2) | `GET /api/cater/pelanggan/search` | `pelangganService.searchPelanggan` | `pelanggan` (ilike nolg, nprs, nama) | Semua Staff / Verifikator |
| | | Info Pelanggan (3.3) | `GET /api/cater/pelanggan/:nolg` | `pelangganService.getDetailPelanggan` | `pelanggan`, 12B Histori, DRD | Semua Staff / Verifikator |
| | | Update No HP (3.4) | `PATCH /api/cater/pelanggan/:nolg/kontak` | `pelangganService.updateKontak` | `pelanggan.noTelp` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_1/2` |
| | | Pindah Jenis Pel (3.5) | `PATCH /api/cater/pelanggan/:nolg/tarif` | `pelangganService.updateGolonganTarif` | `pelanggan.tarifKode` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_2/3` |
| | | Ganti Water Meter (3.6) | `POST /api/gwm/mutasi` | `gwmService.catatMutasiGantiMeter` | `hitungMutasiGantiMeter` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_1/2` |
| | | Verifikasi Mandiri (3.10)| `POST /api/mandiri/verifikasi` | `mandiriService.verifikasiLaporanMandiri` | `evaluasiGeofenceMandiri` | `VERIFIKATOR_1`, `VERIFIKATOR_2` |
| **4** | **Peta (Mapping)** | Peta Persebaran Spasial | `GET /api/cater/map/geojson` | `mapService.getPelangganGeoJson` | PostGIS `titikLokasi` -> GeoJSON | Semua Staff / Verifikator |
| **5** | **Progress** | Progress Wilayah (5.2) | `GET /api/cater/progress/wilayah/:thbl` | `caterProgressService.getProgressPerWilayah`| `daftarCatat` x `caterBacaMeter` | Staff, Verifikator, Executive |
| | | Progress Cater (5.3) | `GET /api/cater/progress/cater/:thbl` | `caterProgressService.getProgressPerCater` | `petugasCater` produktivitas | Staff, Verifikator, Executive |
| | | Ikhtisar Ekstrim (5.5) | `GET /api/cater/progress/ekstrim/:thbl` | `caterProgressService.getIkhtisarEkstrim` | Filter `pakaiM3 > 100` | Staff, Verifikator, Executive |
| | | Ikhtisar 0 Kubik (5.7) | `GET /api/cater/progress/pemakaian-nol/:thbl`| `caterProgressService.getIkhtisarPemakaianNol` | Filter `pakaiM3 = 0` | Staff, Verifikator, Executive |
| **6** | **Laporan & Audit**| Riwayat Audit Log Cater | `GET /api/cater/history/:caterId` | `caterKueriService.getAuditHistory` | `caterAuditLog` | Semua Staff / Verifikator |
| | | Verifikasi 3 Tingkat | `POST /api/cater/verify/v1-v3` | `caterVerifikasiService.verifikasiV1/2/3` | RBAC Tier Approval | `V1: SPV`, `V2: MGR`, `V3: DIR` |
| | | Koreksi Staff | `POST /api/cater/staff/correct` | `caterVerifikasiService.koreksiStaff` | Post-closing Audit Trail | `STAFF_ADMIN_BILLING` |
| **7** | **Tutup Bulan** | Pratinjau Kesiapan | `GET /api/closing/pratinjau/:periode` | `closingService.pratinjauClosing` | Kesiapan DPM & Anomali | `STAFF_ADMIN_BILLING`, `V2`, `EXEC` |
| | | Eksekusi Closing (8.1) | `POST /api/closing/eksekusi` | `closingService.eksekusiClosing` | DPM Lock & Penerbitan DRD Batch | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_2` |
| | | Buka Bulan Baru (8.2) | `POST /api/closing/bulan-baru` | `bulanBaruService.bukaBulanBaru` | DPM Carry-over: `DPM(N) - DICABUT` | `STAFF_ADMIN_BILLING`, `VERIFIKATOR_2` |
| **8** | **GWM Teknik** | Debit & Neraca Air DMA | `POST /api/gwm/debit`, `GET /neraca-air` | `gwmService.hitungNeracaAirZona` | `hitungNeracaAirDma` (NRW %) | Staff Distribusi, Executive |
| **9** | **Sync Mobile** | Unduh Rute Beban Kerja | `GET /api/cater/routes/:kode/pelanggan` | `caterKueriService.getRoutePelanggan` | Mobile Offline Cache | `PENCATAT`, Staff |
