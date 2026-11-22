# Instrumen Wawancara Standard Operating Procedure (SOP) Pengaduan Tirtawening (Versi 2.0)

> **Catatan Arsitektur Sistem:**  
> Sistem pengaduan Tirtawening telah mengadopsi arsitektur **Kebijakan Dinamis Berversi (Policy as Data)**. Seluruh parameter waktu (SLA), radius deteksi kebocoran, jendela waktu konfirmasi warga, serta matriks wewenang **tidak lagi dikunci permanen di dalam kode sumber program**, melainkan dikelola langsung melalui dokumen kebijakan ber-SK Direksi yang dapat diperbarui kapan saja secara aman tanpa henti layanan (*zero downtime*).
>
> Instrumen kuesioner ini dirancang untuk menggali **kondisi riil dan regulasi aktual operasional** di lapangan tanpa pertanyaan yang bersifat menggiring (*leading questions*).

---

## Bagian I: Bagian Hubungan Pelanggan (Hublang & Customer Service)

### 1.1 Klasifikasi Kedaruratan & Prioritas Layanan
1. **Kriteria Urgensi Awal:**  
   Ketika laporan pertama kali diterima dari warga (baik lewat kanal publik online, telepon kantor, maupun loket langsung), apa saja indikator faktual yang digunakan petugas penerima untuk menggolongkan pengaduan ke dalam kategori **Darurat**, **Tinggi**, **Normal**, atau **Rendah**?
2. **Keterlibatan Pelapor dalam Menentukan Prioritas:**  
   Apakah pelanggan/warga diperbolehkan memilih tingkat prioritas laporannya sendiri saat mengajukan pengaduan mandiri, ataukah penentuan prioritas murni menjadi hak prerogatif petugas verifikator layanan?
3. **Penyaringan Informasi Publik:**  
   Jenis insiden apa saja yang layak dan aman untuk dipublikasikan pada **Peta Sebaran Gangguan Publik** tanpa melanggar privasi warga (misal: pipa dinas bocor di jalan vs perselisihan internal meter)?

### 1.2 Penyelesaian & Jendela Konfirmasi Pelanggan
4. **Alur Validasi Setelah Pekerjaan Selesai:**  
   Setelah regu teknis menyatakan pekerjaan di lapangan tuntas, bagaimana tahapan konfirmasi kepada pelanggan? Apakah pelanggan dihubungi via telepon, WhatsApp, atau notifikasi aplikasi?
5. **Jendela Waktu Sanggahan Pelanggan:**  
   Berapa lama pelanggan diberikan tenggat waktu untuk menyatakan apakah masalahnya benar-benar tuntas atau masih bermasalah sebelum tiket ditutup secara permanen oleh sistem?
6. **Kebijakan Pembukaan Kembali (*Reopen*):**  
   Jika pelanggan merasa perbaikan belum memuaskan dalam masa tenggat tersebut:
   - Berapa kali maksimal tiket yang sama boleh dibuka kembali?
   - Jika batas buka kembali terlampaui namun pelanggan masih mengeluh, apakah diterbitkan tiket baru dengan referensi tiket lama atau diarahkan ke mediasi khusus?

### 1.3 Penolakan Laporan
7. **Kriteria Penolakan Pengaduan:**  
   Dalam kondisi apa saja sebuah laporan warga **dapat ditolak secara resmi** oleh PDAM (misalnya: pipa instalasi dalam rumah milik pelanggan pribadi, laporan fiktif, lokasi di luar wilayah layanan)?
8. **Akuntabilitas Alasan Penolakan:**  
   Apa standar minimal penjelasan penolakan yang wajib dicantumkan oleh petugas agar pelanggan mendapatkan transparansi informasi dan tidak menimbulkan sengketa konsumen?

---

## Bagian II: Bagian Transmisi & Distribusi (Trandis & Pemeliharaan Lapangan)

### 2.1 Target Waktu Penanganan (SLA) & Karakteristik Fisik
1. **Target Waktu Tanggap & Tuntas:**  
   Berapa target standar operasional (jam/menit) untuk masing-masing jenis insiden lapangan:
   - Kebocoran pipa dinas (pipa persil pelanggan)?
   - Kebocoran pipa distribusi utama jalan raya?
   - Air keruh / bau / berwarna?
   - Aliran air mati total satu wilayah?
2. **Penghitungan Waktu (Kalender vs Hari Kerja):**  
   Bagaimana regulasi penghitungan SLA kebocoran air:
   - Apakah penanganan insiden kebocoran fisik berjalan 24 jam non-stop (termasuk malam hari, akhir pekan, dan hari libur nasional)?
   - Ataukah terdapat pembagian antara jam siaga tim darurat (*quick response*) dengan tim pekerjaan sipil terjadwal?

### 2.2 Kondisi Tertunda & Jeda SLA (Penangguhan Waktu)
3. **Kondisi Penangguhan Pekerjaan:**  
   Faktor eksternal apa saja yang secara sah mengizinkan waktu pengerjaan SLA "dijeda" (*paused*), misalnya:
   - Menunggu izin galian dari Dinas Bina Marga / Kepolisian?
   - Menunggu kehadiran pemilik rumah untuk membukakan pagar/persil?
   - Terkendala cuaca ekstrem / banjir?
4. **Bukti Validasi Jeda:**  
   Apa dokumen atau bukti lapangan yang wajib diunggah pelaksana untuk membuktikan bahwa penundaan tersebut bukan kelalaian petugas?

### 2.3 Deteksi Laporan Berulang / Duplikat di Lapangan
5. **Penanganan Laporan Titik yang Sama:**  
   Jika beberapa warga melaporkan kebocoran di ruas jalan yang sama dalam rentang beberapa jam:
   - Berapa perkiraan radius jarak (misal 50m, 100m) yang dianggap satu titik insiden yang sama?
   - Apakah tiket-tiket tersebut digabung (*merge*) ke dalam satu surat perintah kerja (SPK) induk, atau tetap diproses masing-masing?

---

## Bagian III: Bagian Pengendalian Billing & Rekening Air

### 3.1 Penanganan Pengaduan Lonjakan Tagihan
1. **Tahapan Verifikasi Pra-Lapangan:**  
   Ketika ada pelanggan yang mengajukan keberatan lonjakan tagihan rekening:
   - Apakah laporan wajib diverifikasi terlebih dahulu oleh staf billing di kantor (analisis riwayat pemakaian 3-6 bulan terakhir) sebelum menerbitkan tugas pemeriksaan fisik meter ke lapangan?
   - Apakah ada nilai toleransi lonjakan tertentu (misal lonjakan > 50% dari rata-rata) yang langsung memicu audit meter?
2. **Status Rekening Selama Masa Sanggah:**  
   Selama pengaduan lonjakan rekening dalam status pemeriksaan, apakah tagihan tersebut otomatis berstatus *dispute* (bebas denda sementara dan tidak diterbitkan surat pemutusan aliran) sampai ada putusan resmi?

### 3.2 Otoritas Penyelesaian Keuangan
3. **Wewenang Penyesuaian Rekening:**  
   Siapa pejabat yang berwenang menandatangani berita acara koreksi rekening jika terbukti terjadi salah catat meter atau kebocoran tersembunyi (*underground leakage*)?

---

## Bagian IV: Bagian Pembacaan Meter (Cater)

### 4.1 Hubungan Lapor Stand Mandiri & Komplain
1. **Peran Petugas Pencatat Meter:**  
   Jika ada komplain meter rusak, buram, atau angka stand melonjak:
   - Apakah petugas pencatat meter wilayah setempat langsung ditugaskan melakukan verifikasi ulang di rutenya?
   - Bagaimana mekanisme sinkronisasi antara foto stand meter hasil cater bulanan dengan foto bukti yang dikirimkan warga pada tiket pengaduan?
2. **Koreksi Stan Meter:**  
   Jika ditemukan selisih angka stand, apa mekanisme penyesuaian angka stand di aplikasi Cater agar sinkron dengan database billing?

---

## Bagian V: Jajaran Direksi & Manajemen Mutu (Quality Assurance)

### 5.1 Skema Eskalasi dan Peringatan Keterlambatan
1. **Jenjang Eskalasi Keterlambatan:**  
   Jika sebuah tiket mendekati batas akhir SLA (misal tersisa 20% waktu) atau telah melanggar target waktu:
   - Kepada siapa notifikasi peringatan (*warning*) pertama kali dikirimkan? (Supervisor / Manager / Senior Manager?)
   - Kapan Direksi menerima laporan ringkasan tiket yang menunggak penanganan?
2. **Kejadian Luar Biasa (*Force Majeure*):**  
   Bagaimana prosedur penetapan status bencana/force majeure (misalnya pipa transmisi transmisi Cikalong jebol) yang menyebabkan ratusan komplain masuk sekaligus? Apakah ada kebijakan pembekuan SLA massal berlandaskan SK Direksi darurat?

### 5.2 Tata Kelola Pembaruan Kebijakan (Policy Governance)
3. **Prosedur Pengesahan Parameter:**  
   Bagaimana alur persetujuan saat PDAM hendak mempercepat standar SLA pelayanan:
   - Staf / Manager mengusulkan draf pembaruan parameter kebijakan di sistem.
   - Direksi menyetujui dan membubuhkan Nomor SK Direksi pengesahan pada sistem.
   - Sistem secara otomatis memberlakukan SLA baru untuk seluruh tiket yang terbit setelah tanggal penetapan SK tersebut.

---

## Lembar Berita Acara Kesepakatan SOP

| No | Unit Kerja | Nama Pejabat / Perwakilan | Jabatan | Tanggal Wawancara | Tanda Tangan |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | Bagian Hubungan Pelanggan | | Kepala Bagian Hublang | | |
| 2 | Bagian Transmisi & Distribusi | | Kepala Bagian Trandis | | |
| 3 | Bagian Rekening & Billing | | Kepala Bagian Billing | | |
| 4 | Bagian Pembacaan Meter (Cater) | | Koordinator Cater | | |
| 5 | Bagian Hukum & Tata Kelola | | Legal Officer | | |
| 6 | Direksi / Manajemen Mutu | | Direktur Terkait | | |
