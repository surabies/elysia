# Kuesioner Wawancara Standard Operating Procedure (SOP) Pengaduan Tirtawening

Dokumen ini disusun sebagai instrumen wawancara dan sinkronisasi regulasi operasional antara pengembang sistem dengan pemangku kepentingan internal Perumda Tirtawening (Bagian Hubungan Pelanggan, Transmisi & Distribusi, Pembacaan Meter, dan Pengendalian Rekening/Billing).

Setiap butir pertanyaan diangkat langsung dari konfigurasi kode sumber (`pengaduan.config.ts`) yang saat ini mengimplementasikan nilai default asumsi industri air minum.

---

## Tabel Pertanyaan & Konfirmasi Parameter Bisnis

| No | Bagian Terkait | Parameter Konfigurasi | Pertanyaan Konkret untuk Divisi | Nilai Default Sistem Saat Ini | Jawaban / Regulasi Resmi PDAM |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | Hubungan Pelanggan / TI | `JENIS_PENGADUAN_PETA_PUBLIK` | Jenis pengaduan apa saja yang tergolong gangguan utilitas publik dan boleh ditampilkan pada Peta Spasial Publik warga tanpa membocorkan privasi pelapor? | `BOCOR_PIPA_DINAS`, `TIDAK_ADA_AIR`, `AIR_KERUH_BAU_BERWARNA` | |
| **2** | Rekening & Billing | `KLASIFIKASI_PER_JENIS` | Apakah jenis komplain *Mutasi Golongan Tarif* dan *Tidak Mampu Bayar* perlu dimasukkan ke klasifikasi `NILAI_TAGIHAN_REKENING` atau tetap `BUKAN_NILAI_TAGIHAN_REKENING`? | Hanya *Lapor Stand Meter*, *Pencatatan Meter Tidak Sesuai*, dan *Lonjakan Pemakaian* yang masuk tagihan | |
| **3** | Distribusi & Hublang | `PRIORITAS_DEFAULT_PER_JENIS` | Jika pelapor/warga tidak menentukan prioritas tiket saat input, apakah jenis `BOCOR_PIPA_DINAS` dan `TIDAK_ADA_AIR` selalu otomatis masuk prioritas `TINGGI`? | Otomatis `TINGGI` | |
| **4** | Distribusi / Pemeliharaan | `SLA_OVERRIDE_PER_JENIS` | Apakah ada durasi penyelesaian khusus per jenis pengaduan (misal: pipa bocor dinas harus selesai maks 12 jam, bukan 24 jam)? | Durasi mengikuti level prioritas umum (Darurat: 6j, Tinggi: 24j, Normal: 48j, Rendah: 72j) | |
| **5** | Pengendalian Billing | `WAJIB_VERIFIKASI_TAGIHAN` | Apakah pengaduan lonjakan rekening air **wajib diverifikasi** oleh Bagian Billing terlebih dahulu sebelum petugas lapangan diizinkan melakukan pengecekan fisik meter? | `true` (Wajib Verifikasi, melarang transisi langsung BARU -> DITUGASKAN) | |
| **6** | Hubungan Pelanggan | `BATAS_KONFIRMASI_JAM` | Berapa lama pelanggan diberi waktu untuk memeriksa dan mengonfirmasi hasil pekerjaan sebelum tiket berstatus `SELESAI` ditutup otomatis oleh sistem? | `72 Jam` (3 Hari Kalender) | |
| **7** | Hubungan Pelanggan | `MAKS_BUKA_KEMBALI` | Berapa kali maksimal pelanggan diperbolehkan membuka kembali (*reopen*) tiket pengaduan yang sama jika perbaikan dinilai belum tuntas? | Maksimal `2 Kali` | |
| **8** | Verifikator Layanan | `MIN_PANJANG_ALASAN_TOLAK` | Berapa panjang karakter minimal yang diwajibkan bagi petugas saat menolak laporan warga agar alasannya substantif dan jelas? | Minimal `10 Karakter` | |
| **9** | Wilayah Distribusi | `DUPLIKAT_RADIUS_METER` & `DUPLIKAT_JENDELA_JAM` | Berapa radius jarak (meter) dan rentang waktu (jam) untuk mendeteksi bahwa dua laporan kebocoran air berasal dari titik insiden yang sama? | Radius `100 Meter`, Jendela Waktu `48 Jam` | |
| **10** | Hublang & Distribusi | `MATRIKS_IZIN_PENGADUAN` | Siapa saja pejabat/staf yang memiliki wewenang resmi untuk menolak pengaduan warga? Apakah pelaksana lapangan boleh menolak tiket saat di lokasi? | `SUPERADMIN` dan `VERIFIKATOR_1..3` | |
| **11** | Manajemen / KPI Eksekutif | Definisi "Selesai Ditangani" | Pada laporan kinerja eksekutif dan desk kartu KPI, apakah tiket dengan status `DITOLAK` dihitung sebagai tiket yang "selesai ditangani" atau dikecualikan dari persentase penyelesaian? | Dikecualikan (hanya tiket `SELESAI` dan `DITUTUP` yang dihitung tuntas) | |
| **12** | Pembacaan Meter | Hak Akses Lapor Stand | Apakah staf `PENCATAT` meter memiliki hak akses untuk menerima penugasan pengecekan fisik komplain stand meter? | Ya, `PENCATAT` terdaftar pada role lapangan yang layak | |

---

## Prosedur Pengesahan Jawaban

1. Dokumen ini dicetak atau dibagikan dalam format digital kepada Kepala Bagian terkait.
2. Kolom **Jawaban / Regulasi Resmi PDAM** diisi dengan ketetapan angka dan aturan SOP tertulis yang berlaku.
3. Tim pengembang akan memperbarui file `pengaduan.config.ts` sesuai hasil kesepakatan berita acara wawancara ini.
