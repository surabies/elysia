Keputusan saya:

## Prinsip desain (berlaku untuk semua poin di bawah)

- Logika tagihan, periode, closing, dan seed harus **generik** dan berjalan sesuai aturan perhitungan umum, supaya aplikasi bisa dipakai perusahaan air lain.
- **Dilarang** ada nolg, nama pelanggan, nama perusahaan, atau nilai khusus yang ditulis langsung di kode. Semua yang bersifat konfigurasi (tarif, biaya tetap, periode, rute) berasal dari data.
- Kasus khusus akibat kebijakan/kesepakatan manusia (mis. tarif khusus satu pelanggan) **tidak dibuatkan mekanisme khusus** dan dibiarkan mengikuti perhitungan umum.

## 1. Tarif blok → Ya, perbarui, dengan syarat

- Perbarui tarif_blok sesuai Tabel 1.2 lewat seed (upsert), bukan hardcode di engine.
- Tarif memiliki masa berlaku (berlaku_mulai/berlaku_sampai). Closing memakai tarif yang berlaku pada periode itu.
- Saat closing, snapshot rincian per blok (m³ dan tarif per m³) ke DRD. Periode closed tidak berubah jika tarif diubah kemudian.
- Beri catatan di seed-tarif.ts dan runbook: angka berasal dari ekstraksi CSV Oktober dan wajib dicocokkan dengan SK tarif resmi.
- Pelanggan 00008001503 (tarif khusus hasil kesepakatan): **abaikan**. Jangan buat override atau penanganan khusus. Dokumentasikan hanya sebagai pengecualian yang diketahui di data dan tes (lihat bawah).
- Selidiki pelanggan 4A (78 m³) yang selisih. Jika penyebabnya anomali data CSV, dokumentasikan seperti di atas. Jika penyebabnya logika penentuan blok pada pemakaian besar, perbaiki dan laporkan.
- Setelah perubahan, jalankan ulang replay Oktober dan jadikan tes regresi permanen. Target: 22.522 dari 22.524 pelanggan cocok. Pengecualian yang diketahui disimpan sebagai **daftar data di file tes** (nolg + alasan), bukan sebagai kondisi di engine.

## 2. Bulan terlewat → Opsi 1 (blokir closing)

- eksekusiClosing menolak jika masih ada DPM aktif BELUM_DICATAT. Pesan error menampilkan jumlah dan daftar pelanggannya.
- Cara menyelesaikan: bacaan nyata, kondisi catat resmi (master_kondisi_catat: rumah kosong, meter rusak, dll.), atau taksasi yang dijalankan operator secara eksplisit (dengan alasan, pencatat, dan melewati alur verifikasi). Tidak ada taksasi otomatis.
- Aturan taksasi: cari dulu bagaimana aplikasi lama menaksir (data CSV/master_kondisi_catat) dan ikuti. Jangan menetapkan minimum 5 m³ tanpa bukti dari data (ada 356 pelanggan dengan pemakaian 0 m³ di Oktober). Tampilkan aturan yang kamu temukan dan usulanmu, lalu tunggu persetujuan saya sebelum implementasi.
- Rekonsiliasi: pemakaian yang ditagih di bacaan fisik berikutnya = selisih fisik − taksasi yang sudah ditagih. Jika hasilnya negatif, tandai untuk koreksi manual, jangan otomatis. Tunjukkan dengan contoh angka (stand awal 3909, taksasi 27, bacaan fisik 3963) bahwa tagihannya tidak masuk Blok 4.

## 3. Pengamanan sebelum produksi

- Seed akun: hapus akun demo@example.com. Pisahkan seed akun dari seed data. Password default tidak boleh dipakai di produksi (wajib ganti saat login pertama atau dibuat lewat prosedur terpisah). Jelaskan peran tiap akun dan cara membuatnya di runbook.
- Guard seed/clean: tolak jika (a) periode open sudah punya bacaan, atau (b) nama database target tidak ada di allowlist eksplisit (mis. env ALLOW_RESET_DB harus sama dengan nama database). Tidak cukup hanya mengandalkan NODE_ENV.
- Periode dinamis: pastikan import-progres-cater.ts, seed, dan service tidak menulis 202610/202611 secara langsung. Periode dibaca dari data dan periode berikutnya dihitung. Buktikan dengan tes data sintetis periode lain (mis. 202512 → 202601).
- Pastikan tes regresi mencakup kelima skenario ditambah replay tagihan.
- Telusuri seluruh kode (engine, service, seed, ETL) untuk nilai yang terikat ke PDAM Tirtawening atau pelanggan tertentu yang ditulis langsung di kode. Laporkan temuannya, dan pindahkan ke data/konfigurasi jika ada.

## 4. Data November dari aplikasi lama (ANALISIS SAJA, jangan import)

Saya punya export aplikasi lama (lapdatameter) berisi pencatatan November sampai 20 Nov 2026 pukul 14.00. Aplikasi lama masih dipakai berjalan. Tugas:

- Baca format file, jumlah baris, kolom, dan status verifikasi di aplikasi lama.
- Cocokkan stand awal di export dengan stma Oktober di database. Laporkan selisihnya.
- Laporkan data yang tidak wajar (stand akhir < awal, kondisi catat khusus, pemakaian ekstrem) dan kejadian November yang tidak ada di seed (pelanggan baru, DICABUT, ganti meter, perubahan data Oktober).
- Usulkan pemetaan ke cater_baca_meter/daftar_catat dan strategi import lewat service aplikasi yang sama dengan alur normal (tanpa status terkunci).
- Simulasikan hanya di database salinan/branch, bukan database utama.
