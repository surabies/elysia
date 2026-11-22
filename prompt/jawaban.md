Audit dan skema disetujui dengan penyesuaian di bawah. Lanjut ke Tahap 2.

## Keputusan desain

1. **Acuan pembanding: Opsi A** (bandingkan dengan pakaiLalu).
   - Jika pakaiLalu kosong/0, fallback ke rata-rata historis 3 periode terakhir yang tersedia.
   - Jika historis juga tidak ada, jangan evaluasi aturan persentase; hanya aturan absolut (m³, nol, meter mundur, kondisi fisik).
   - Acuan, jumlah periode historis, dan syarat minimum pakaiLalu disimpan sebagai parameter aturan di database, bukan di kode.
2. **Propagasi otomatis: setuju, dengan batasan:**
   - Hanya untuk periode berjalan yang belum closing. Periode yang sudah closing tidak boleh dihitung ulang; simpan hasil klasifikasi beserta versi aturan yang berlaku saat closing.
   - Rekalkulasi dalam satu transaksi (atau job dengan status progres), sehingga tidak pernah ada tampilan yang mencampur aturan lama dan baru.
   - Jangan menjanjikan "<1 detik" tanpa pengukuran. Ukur pada data nyata dan laporkan hasilnya.
   - Sediakan pratinjau dampak (dry-run: berapa baris akan berubah status) sebelum operator menyimpan. Alasan perubahan wajib diisi dan masuk audit log.
3. **Hak akses:** SUPERADMIN dan VERIFIKATOR_2 boleh mengubah aturan; role lain hanya baca. Pastikan nama role cocok dengan yang ada di aplikasi.

## Tambahan pada skema dan cakupan

a. **Pisahkan dua konsep.** `is_anomali` / `kode_anomali` adalah hasil klasifikasi otomatis; `status_verifikasi` adalah alur kerja verifikasi (V1/V2/V3). Semua kartu, grafik, dan statistik "anomali" memakai `is_anomali`, bukan status `ANOMALY`. Ini penyebab selisih angka di halaman Verifikasi. Dokumentasikan pemisahannya.
b. **Satu baris bisa kena beberapa aturan.** Simpan `kode_anomali` sebagai array plus satu kode utama (berdasarkan tingkat keparahan tertinggi), dengan indeks yang sesuai untuk filter.
c. **Kondisi fisik meter hanya lewat kode TMSS** ke `master_kondisi_catat`. Hapus semua perbandingan teks `ket_catat`. Sediakan daftar kondisi yang belum terpetakan agar operator bisa memetakannya lewat UI.
d. **Ring 1/2/3 (±30%, ±50%, >80%)** di `TabVerifikasiStand` harus menjadi aturan di database dan terhubung ke API, bukan state React lagi.
e. **Tahap 4 wajib mencakup semua titik pada audit**, termasuk: `kpi.ts`, `RingkasanCater.tsx` (angka dummy 6.2%), `PembacaanDitinjau.tsx`, `perhitungan-pemakaian.ts`, `warna-tahap.ts`, `kolom-verifikasi.tsx`, dan `ambangAnomali: 50` di payload verifikasi-grid. Frontend hanya menampilkan kode, label, dan tone dari API; tidak boleh menghitung ulang.
f. **Validasi aturan:** ambang tidak boleh tumpang tindih atau kontradiktif. Seed hanya membuat aturan bawaan sebagai data biasa yang bisa diubah operator.

## Verifikasi sebelum dianggap selesai

Untuk periode yang sama, jumlah anomali harus identik di: dashboard KPI, progres cater, analitik, header grid Verifikasi, dan filter "Hanya Anomali". Sertakan query atau uji sebagai bukti.

Laporkan rencana migrasi (file migrasi + dampaknya) sebelum dijalankan ke database.s
