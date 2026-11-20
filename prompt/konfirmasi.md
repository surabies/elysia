Konfirmasi saya:

## 1. Database target

neondb adalah database dev. Boleh backup (pg_dump lewat koneksi direct, bukan pooler) ke file lokal lalu reset & re-seed.

## 2. Nomor meter tidak unik (686 pelanggan) → Setuju, dengan tambahan

- `pelanggan.no_meter = NULL` untuk 686 pelanggan itu, dan tidak dibuat baris `water_meter` untuk mereka.
- **Simpan nilai aslinya** di kolom terpisah (mis. `no_meter_asli`, tanpa unique constraint) agar tidak ada data hilang dan bisa ditelusuri.
- Simpan `ukuran_meter`, merk, dan tanggal pasang di level pelanggan untuk 686 pelanggan ini.
- Buat daftar/export 686 pelanggan (nolg, nama, rute, nomor asli, alasan: placeholder / duplikat / kosong) untuk diverifikasi petugas lapangan. Tandai 185 pasangan yang merk dan tanggal pasangnya berbeda sebagai prioritas.
- Pastikan SEMUA alur (DPM, pencatatan, verifikasi, closing, riwayat) tetap berjalan untuk pelanggan tanpa baris `water_meter`: tidak ada join wajib ke `water_meter`, tidak ada pelanggan yang hilang dari DPM karena `no_meter` NULL. Buktikan lewat jumlah pelanggan DPM 202611 yang tepat.
- Beri jalur untuk melengkapi nomor meter valid lewat aplikasi nanti, dan jelaskan perilaku saat meter diganti untuk pelanggan tanpa baris `water_meter`.

## 3. Enam pelanggan tupsp/tupsm (MTA / RUMAH KOSONG)

Tetap AKTIF di DPM 202611. Aturan umum: pelanggan hanya dilewati dari DPM jika hasil baca terakhirnya (ketcatat) = DICABUT. Jangan mengubah status berdasarkan asumsi.
Tandai ke-6 pelanggan ini (kolom flag/catatan "perlu verifikasi") dan sertakan dalam daftar verifikasi lapangan.

## 4. Pelanggan DICABUT (29) → tetap Opsi A

Pelanggan DICABUT tetap ada di master, statusnya DICABUT, riwayat Oktober utuh, dan dilewati dari DPM 202611 (22.495 aktif).
Untuk 20 pelanggan yang mutasinama-nya masih "PELANGGAN AKTIF": ikuti data baca Oktober (DICABUT), tapi export daftarnya (nolg, nama, mutasinama, ketcatat, tmss) untuk saya cocokkan ke data pelayanan. Pastikan jalur sambung kembali tersedia: saat status kembali aktif, pelanggan masuk DPM periode yang sedang open dengan stand awal = stand akhir terakhir.

## 5. Biaya tetap → Setuju dengan temuan Anda, dengan syarat

- `bea_beban` diambil dari **ukuran meter** (bukan golongan_tarif). `bea_admin` dan `air_kotor` dari `golongan_tarif`, `lain_lain` 0.
- Tabel ukuran meter → bea_beban disimpan sebagai **tabel referensi di database dan di-seed** (1/2" & 3/4" = 7.000; 1" = 43.000; 1 1/2" = 72.000; 2" = 129.000; 3" = 158.000; 4" = 187.000). Jangan jadi konstanta di kode.
- Cek kelengkapan: laporkan pelanggan dengan `ukuran_meter` kosong atau di luar tabel (targetnya 0).
- Nilai ketiga biaya di-**snapshot** ke data periode saat closing. Periode closed tidak berubah jika tarif diubah kemudian.
- Jika ukuran meter atau golongan tarif tidak ditemukan, closing gagal dengan pesan jelas. Tidak ada fallback angka default.
- Nilai di tabel referensi ini bersumber dari data CSV. Beri tanda di dokumentasi bahwa harus dicocokkan dengan SK tarif resmi.

## 6. Urutan rute

Setuju: 1..N per rute_kode berdasarkan nprs ASC, nolg ASC, disimpan permanen di `pelanggan.no_urut_rute`, dan tidak ditimpa seed ulang jika sudah diubah di aplikasi.

## Yang saya minta setelah eksekusi

Laporan rekonsiliasi (jumlah pelanggan/meter/rute vs CSV, FK yatim = 0, stand awal 202611 = stand akhir 202610, total pemakaian dan tagihan 202610 cocok dengan CSV), bukti seed 2x identik, hasil simulasi 202611 → 202612 → 202701, dan file export untuk 20 pelanggan, 6 pelanggan, serta 686 pelanggan tanpa nomor meter valid. Setelah simulasi, database dikembalikan ke kondisi 202610 closed dan 202611 open.
