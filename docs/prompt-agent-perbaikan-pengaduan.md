# PROMPT AGENT — Perbaikan & Pengujian Modul Pengaduan (Tirtawening / mytirta)

> Tempel seluruh isi file ini ke AI agent (Claude Code, Cursor, dsb.) yang dijalankan di root repositori.
> Jalankan SATU agent, fase demi fase, sesuai urutan.

---

## 1. Peran & konteks

Kamu adalah engineer backend senior. Tugasmu: memperbaiki dan menguji **modul pengaduan** (tiket pengaduan pelanggan air minum) pada sistem Tirtawening (mytirta).

Dari kode yang ada, stack-nya: **Bun, Elysia, Drizzle ORM, PostgreSQL + PostGIS (kolom geometry), Cloudinary**, monorepo dengan paket `@cater/db` dan `@cater/types`.

**Aplikasi SUDAH BERJALAN dan database SUDAH berisi data.** Semua perubahan harus aman terhadap data dan klien (frontend) yang sudah ada.

Arsitektur 3 lapis — **pertahankan**:
1. **Domain Engine** (`alur-pengaduan.engine.ts`): logika murni, nol dependensi DB/HTTP.
2. **Service** (`pengaduan.service.ts`): orkestrasi Drizzle + transaksi.
3. **Router** (`pengaduan.router.ts`, `pengaduan.schema.ts`, `index.ts`): Elysia, dipasang di dua prefix (`/pengaduan` dan `/v1/pengaduan`) dengan guard role internal.

File lain yang relevan: skema Drizzle `pengaduan.ts` (tabel `pengaduan`, `riwayat_pengaduan`, enum) dan tes `alur-pengaduan.test.ts` (bun:test). Cari lokasi pastinya di repo.

Semua komentar kode, pesan error, dan dokumen ditulis dalam **bahasa Indonesia**, konsisten dengan kode yang ada.

---

## 2. Aturan main (WAJIB)

1. **Database produksi/dev yang ada tidak boleh dirusak.** Migrasi hanya **aditif**: tabel baru atau kolom baru yang nullable/berdefault. DILARANG: drop, rename, ubah tipe kolom, mengubah/menghapus nilai enum, `drizzle-kit push`, reset DB, dan menjalankan perintah destruktif apa pun.
2. Ikuti konvensi migrasi yang sudah dipakai repo (cek folder migrasi dan script di `package.json`). Hasilkan migrasi, **baca SQL-nya**, terapkan hanya ke database **lokal/dev/test**. Periksa `DATABASE_URL` sebelum menerapkan; kalau terlihat seperti produksi, BERHENTI dan laporkan.
3. **Kompatibilitas klien:** endpoint legacy (`POST /tugaskan`, `PATCH /status`) dan bentuk respons `{ success, data | error, message?, meta? }` dipertahankan. Perubahan respons hanya boleh **menambah** field. Sebelum mengubah status code atau menghapus/mengubah field respons, cari semua konsumennya di repo (mis. app web/mobile) dan sesuaikan, atau laporkan jika konsumennya tidak ada di repo.
4. **Jangan mengarang aturan SOP.** Angka atau aturan yang belum pasti (SLA per jenis, jendela konfirmasi, batas reopen, matriks role, dll.) ditaruh di **satu file konfigurasi** dengan penanda `// TODO-SOP:` dan nilai default yang masuk akal. Daftar asumsi itu nanti dipakai untuk wawancara dengan bagian Hubungan Pelanggan (lihat Fase 9).
5. **File lengkap, bukan potongan.** Saat mengubah file, hasil akhirnya harus utuh dan bisa dikompilasi. Jangan pernah meninggalkan placeholder seperti `// ...sisanya sama`.
6. Setelah **setiap fase**: jalankan typecheck, lint (jika ada), dan seluruh tes; perbaiki sampai hijau; lalu commit dengan pesan jelas (satu commit per fase). Jangan lanjut ke fase berikutnya sebelum hijau.
7. Jangan menyentuh modul di luar pengaduan, kecuali yang mutlak perlu (mis. menambah ekspor tipe). Jangan upgrade dependensi.
8. Berhenti dan bertanya hanya jika ada blocker nyata (mis. tidak ada database tes, konflik desain yang tidak bisa diputuskan sendiri). Selain itu ambil keputusan terbaik, catat di laporan.

---

## 3. Fase 0 — Discovery (read-only, belum mengubah apa pun)

1. Petakan struktur repo; temukan semua file modul pengaduan, `authPlugin` (apa saja yang disediakan ke handler: `user.id`, `user.role`?), definisi `AppRole`, tabel `user` (kolom role), `pelanggan`, `lib/cloudinary`.
2. Temukan **semua pemanggil** `pengaduanService`, `createPengaduan`, `getPengaduanPetaPublik`, `getDetailPengaduan`, `beriRating` di seluruh repo. Cek apakah sudah ada route publik (landing, mobile) yang memakainya. **Jika sudah ada, pakai ulang dan perbaiki — jangan duplikasi.**
3. Cari semua konsumen endpoint pengaduan di frontend, dan field respons apa saja yang mereka baca (terutama peta publik, detail, daftar, statistik).
4. Cek infrastruktur yang ada: scheduler/cron/job, rate limiting, logger, konfigurasi env, cara tes saat ini, apakah ada DB tes dan apakah PostGIS tersedia.
5. Jalankan tes yang ada dan catat baseline.
6. Tulis `docs/pengaduan/AUDIT.md`: konfirmasi tiap temuan K1–K8 dan B1–B15 di bawah (benar/tidak, file:baris), plus temuan tambahan yang kamu lihat. Jika ada temuan yang ternyata tidak benar, catat dan lewati.

---

## 4. Daftar temuan (sumber kebenaran pekerjaan)

### Temuan konsep alur bisnis (K)
- **K1.** Dua klasifikasi (`NILAI_TAGIHAN_REKENING` / `BUKAN_NILAI_TAGIHAN_REKENING`) tetapi alur sama. Pengaduan tagihan seharusnya lewat verifikasi dan cek meter dulu. Role `VERIFIKATOR_1/2/3` belum dipakai di alur.
- **K2.** SLA hanya per prioritas; prioritas default `NORMAL` untuk semua jenis; tidak ada prioritas otomatis per jenis (mis. `TIDAK_ADA_AIR`, `BOCOR_PIPA_DINAS`, `AIR_KERUH_BAU_BERWARNA`).
- **K3.** Jeda SLA setengah jadi: `jedaMulaiAt` dan `jedaTotalMenit` tidak pernah diisi, target SLA tidak digeser saat tiket `MENUNGGU_PELANGGAN`.
- **K4.** `SELESAI → DITUTUP` tidak punya pemicu: `konfirmasiBatasAt` tidak pernah diisi; enum aksi `DITUTUP_OTOMATIS` tidak punya kode/job.
- **K5.** Reopen belum lengkap: `jumlahDibukaKembali` tidak bertambah, SLA tidak di-reset, tidak ada batas reopen.
- **K6.** Kanal pelapor/publik hilang: service punya `beriRating` dan `getDetailPengaduan(nomorTiket, isInternal=false)` tapi router hanya melayani role internal; `ratingPengaduanBodySchema` dan `detailPengaduanParamsSchema` tidak dipakai.
- **K7.** Belum ada deteksi laporan duplikat (satu kebocoran dilaporkan banyak warga).
- **K8.** `DITOLAK` tidak mewajibkan alasan.

### Temuan bug kode (B), urut prioritas
- **B1.** `getPengaduanPetaPublik` mengembalikan `pelapor`, `kontakPelapor`, `deskripsi`, nama petugas, dan semua tiket (termasuk `DITOLAK`) ke endpoint "publik" → kebocoran data pribadi.
- **B2.** `getPengaduanPetaPublik` mengisi koordinat palsu (`TITIK_BANDUNG`) untuk tiket tanpa koordinat → peta menampilkan data tidak benar.
- **B3.** `listPetugasPengaduan` mengembalikan SEMUA user (limit 100, tanpa filter role) dan jatuh ke data tiruan (`usr-1`…`usr-4`) saat kosong/error → ID tiruan melanggar FK.
- **B4.** Nomor urut tiket memakai `count(*) + 1` per prefix → race condition, bisa bentrok pada unique `nomor_tiket` saat request bersamaan.
- **B5.** `createPengaduan` selalu mengisi `pelangganId = nomorLangganan` padahal pelanggan belum tentu ada di tabel `pelanggan` → error FK mentah dikirim ke klien.
- **B6.** Tidak ada otorisasi per role: semua role internal boleh menugaskan, mengeskalasi, mengubah status, menutup. `kewenangan` di detail hanya berdasar status, bukan role.
- **B7.** `ubahStatusPengaduan` menerima `statusKe: 'DITUGASKAN'` tanpa `ditugaskanKeId` (melewati penugasan).
- **B8.** `ubahStatusPengaduan` membaca status lalu meng-update tanpa pengunci optimistik (`WHERE status = statusDari`) → dua petugas bisa saling menimpa. Bacaan juga di luar transaksi.
- **B9.** `ringkasSla`: `melanggar` selalu `false` untuk tiket tertutup, jadi tiket yang selesai terlambat tidak terhitung melanggar. `responsTerlambat` juga bisa `true` selamanya untuk tiket `DITOLAK` dari `BARU` (karena `responsAt` hanya diisi saat penugasan).
- **B10.** `eskalasiKe` pada detail diambil dari `petugasId` riwayat eskalasi (= PELAKU eskalasi), bukan TARGET. Riwayat tidak menyimpan petugas tujuan sama sekali.
- **B11.** `getStatistikPengaduan.belumDitugaskan` menghitung juga tiket tertutup/ditolak yang tidak pernah ditugaskan. Statistik memuat semua baris ke memori. `melanggarSla` (statistik dan filter list) tidak mengecualikan tiket yang sedang dijeda.
- **B12.** `tambahCatatanPengaduan`, `kirimChatPetugas`, `eskalasiPengaduan` tetap bisa dilakukan pada tiket `DITUTUP` (bahkan eskalasi pada `SELESAI`/`DITOLAK`), padahal `kewenangan.bisaChat` menyatakan tidak. Eskalasi boleh menurunkan prioritas dan tidak menghitung ulang target SLA.
- **B13.** Validasi longgar: `status` (`PATCH /:id/status`) dan `prioritasBaru` (`PATCH /:id/eskalasi`) bertipe `t.String()` (bukan enum); banyak `as any`; SEMUA error dijawab 400 (termasuk error DB, pesan mentah bocor); hanya detail yang memetakan 404.
- **B14.** Upload Cloudinary dilakukan DI DALAM transaksi DB (menahan koneksi selama panggilan jaringan).
- **B15.** (Temuan tambahan) Bila upload Cloudinary gagal atau tidak dikonfigurasi, `fotoUrl`/`fotoPenyelesaianUrl` berupa data URL base64 tetap disimpan ke kolom teks DB → membengkak.

---

## 5. Fase 1 — Keamanan data publik (B1, B2)

1. Pisahkan DTO peta publik dari data internal. Field yang BOLEH keluar: `id` (atau `nomorTiket`), `jenis`, `status`, `prioritas`, `lng`, `lat`, `createdAt`, dan linimasa publik yang sudah disanitasi (tanpa nama petugas). **Dilarang** keluar: `pelapor`, `kontakPelapor`, `deskripsi` (teks bebas bisa memuat data pribadi), `alamatKejadian` mentah, `fotoUrl`, nama petugas.
2. Koordinat dibulatkan ke 3 desimal (~110 m) untuk privasi. Hanya tiket dengan koordinat nyata yang ditampilkan; **hapus** seluruh fallback koordinat palsu.
3. Tiket `DITOLAK` tidak ditampilkan. Pertimbangkan hanya jenis yang bersifat gangguan area (`BOCOR_PIPA_DINAS`, `TIDAK_ADA_AIR`, `AIR_KERUH_BAU_BERWARNA`); jadikan itu konfigurasi (`TODO-SOP`).
4. Sesuaikan konsumen di frontend dengan bentuk baru. Jika frontend di luar repo, pertahankan key lama dengan nilai `null`/kosong dan catat di laporan.
5. Tes: pastikan tidak ada `pelapor`/`kontakPelapor`/`deskripsi` di respons (cek terhadap seluruh JSON), tidak ada koordinat palsu, tiket tanpa koordinat tidak muncul.

---

## 6. Fase 2 — Integritas data (B3, B4, B5, B14, B15)

**Migrasi aditif (hasilkan dengan drizzle-kit, review SQL):**
- Tabel baru `pengaduan_nomor_urut` (`prefix` varchar PK, `last_urut` integer not null, `updated_at` timestamp).
- Kolom baru nullable `petugas_tujuan_id` (text, FK ke `user.id`) di `riwayat_pengaduan` (dipakai Fase 4/5 untuk B10).

**B4 — Nomor urut atomik:** ganti `count(*) + 1` dengan upsert atomik di dalam transaksi:
`INSERT INTO pengaduan_nomor_urut (prefix, last_urut) VALUES (:prefix, :seed) ON CONFLICT (prefix) DO UPDATE SET last_urut = pengaduan_nomor_urut.last_urut + 1 RETURNING last_urut`
- `:seed` harus aman terhadap data lama: `COALESCE(MAX(CAST(RIGHT(nomor_tiket,4) AS int)),0) + 1` dari tiket `pengaduan` dengan prefix sama.
- Jika `urut > 9999` → lempar error yang jelas (bukan memotong diam-diam).
- Tambahkan retry terbatas (maks 3x) bila tetap terjadi unique violation `nomor_tiket`.
- Format nomor tiket TIDAK berubah (14 karakter, `POLA_NOMOR_TIKET`).

**B5 — Pelanggan tidak ditemukan:** cari pelanggan sekali. Jika ada → isi `pelangganId`; jika tidak → `pelangganId = null`, `nomorLangganan` tetap tersimpan sebagai teks, tiket tetap dibuat (default `TODO-SOP`: toleran, karena pelapor bisa salah ketik). Jangan pernah mengirim error FK mentah.

**B14/B15 — Cloudinary:**
- Tidak boleh ada panggilan jaringan di dalam `db.transaction`. Buat `id` tiket lebih dulu (`crypto.randomUUID()`), unggah foto SEBELUM transaksi memakai id itu sebagai `identifier`, lalu masukkan `id` ke insert.
- Jika upload gagal atau Cloudinary tidak terkonfigurasi: **jangan simpan data URL base64**. Pilih perilaku berikut dan catat: tiket tetap dibuat tanpa foto, dan tambahkan catatan riwayat internal "Foto gagal diunggah". Hanya URL http(s) yang boleh disimpan di `fotoUrl`.
- Terapkan hal yang sama untuk `fotoPenyelesaianUrl` pada perubahan status.

Tes integrasi: 20 pembuatan tiket paralel (`Promise.all`) untuk prefix yang sama menghasilkan nomor unik dan berurutan; nomor langganan fiktif tidak membuat error FK; idempotensi `clientRequestId` tetap bekerja (termasuk dua request bersamaan).

---

## 7. Fase 3 — Engine & alur bisnis (K1–K5, K7, K8, B9)

Semua aturan baru ditaruh **di engine (fungsi murni)** dan konstanta di file konfigurasi baru `pengaduan.config.ts` (di folder domain), setiap nilai berpenanda `TODO-SOP`.

**Konfigurasi (default asumsi, mudah diubah):**
- `KLASIFIKASI_PER_JENIS`: `LAPOR_STAND_METER`, `PENCATATAN_METER_TIDAK_SESUAI`, `LONJAKAN_PEMAKAIAN_AIR` → `NILAI_TAGIHAN_REKENING`; lainnya → `BUKAN_NILAI_TAGIHAN_REKENING`. Server menurunkan `klasifikasi` dari `jenis` bila klien tidak mengirim; jika klien mengirim nilai yang bertentangan, gunakan nilai turunan server dan catat di riwayat internal.
- `PRIORITAS_DEFAULT_PER_JENIS`: `BOCOR_PIPA_DINAS`, `TIDAK_ADA_AIR`, `AIR_KERUH_BAU_BERWARNA` → `TINGGI`; lainnya `NORMAL`. Hanya dipakai bila `prioritas` tidak diisi saat tiket dibuat.
- `SLA_OVERRIDE_PER_JENIS` (opsional, kosong secara default; fallback ke `SLA_PRIORITAS`).
- `WAJIB_VERIFIKASI_TAGIHAN = true`: tiket `NILAI_TAGIHAN_REKENING` wajib `TERVERIFIKASI` sebelum `DITUGASKAN`.
- `BATAS_KONFIRMASI_JAM = 72`: jendela pelapor mengonfirmasi/membuka kembali setelah `SELESAI`.
- `MAKS_BUKA_KEMBALI = 2`.
- `MIN_PANJANG_ALASAN_TOLAK = 10`.
- `DUPLIKAT_RADIUS_METER = 100`, `DUPLIKAT_JENDELA_JAM = 48`.

**Perubahan engine** (tanda tangan lama tetap berlaku agar tes lama tidak pecah):
1. `isTransisiSah(dari, ke, opsi?)`: parameter ketiga opsional `{ klasifikasi }`. Untuk `NILAI_TAGIHAN_REKENING` dengan `WAJIB_VERIFIKASI_TAGIHAN`, `BARU → DITUGASKAN` tidak sah. Tanpa opsi, perilaku persis seperti sekarang. `TRANSISI_PENGADUAN` tetap sebagai whitelist dasar; `DITUTUP` tetap terminal.
2. `evaluasiPembuatanTiket`: tetap, ditambah validasi rentang koordinat (x −180..180, y −90..90).
3. `tentukanKlasifikasi(jenis)`, `tentukanPrioritasAwal(jenis, prioritasInput?)`, `hitungTargetSla(prioritas, mulai, { jenis? })` (override per jenis bila ada).
4. **Jeda SLA.** Saat masuk `MENUNGGU_PELANGGAN`: `jedaMulaiAt = now`. Saat keluar: `durasi = now − jedaMulaiAt` (menit); `jedaTotalMenit += durasi`; **geser `targetSelesaiAt += durasi`** (supaya filter SQL tetap benar); `jedaMulaiAt = null`. Buat fungsi murni `hitungEfekJeda(...)`. `jedaTotalMenit` bersifat informatif.
5. **`ringkasSla` diperbaiki (B9)** tanpa mengubah nama field/tipe `RingkasSla`:
   - Tiket tertutup dengan `selesaiAt`: `melanggar = selesaiAt > targetSelesaiAt`. `DITOLAK` tanpa `selesaiAt`: `melanggar = false`.
   - `responsTerlambat`: jika `responsAt` ada → `responsAt > targetResponsAt`; jika belum ada dan tiket belum tertutup → `now > targetResponsAt`; tiket tertutup tanpa respons → `false`.
   - Tiket yang sedang dijeda: `sisaMenit` dibekukan pada `jedaMulaiAt`.
6. **Side-effect per transisi** (di fungsi murni `hitungPerubahanTransisi(...)` yang mengembalikan patch kolom + `aksi` riwayat; service hanya menerapkannya):
   - Transisi pertama keluar dari `BARU` (ke `TERVERIFIKASI`, `DITUGASKAN`, atau `DITOLAK`) → isi `responsAt` jika masih null.
   - `→ TERVERIFIKASI`: `verifikasiAt = now`; aksi riwayat `DIVERIFIKASI`.
   - `→ SELESAI`: `selesaiAt = now`, `konfirmasiBatasAt = now + BATAS_KONFIRMASI_JAM`; wajib `catatan` atau foto (aturan lama tetap).
   - `→ DITUTUP` oleh staf: aksi `STATUS_DIUBAH`; oleh pelapor: `DIKONFIRMASI`; otomatis: `DITUTUP_OTOMATIS`.
   - `→ DIBUKA_KEMBALI` (hanya dari `SELESAI` dalam jendela `konfirmasiBatasAt`, atau `DITOLAK` oleh staf): `jumlahDibukaKembali += 1` (tolak jika sudah `MAKS_BUKA_KEMBALI`); `selesaiAt = null`; `konfirmasiBatasAt = null`; mulai siklus SLA baru (`targetSelesaiAt = now + SLA selesai`, `jedaMulaiAt = null`); aksi `DIBUKA_KEMBALI`; **alasan wajib**.
   - `→ DITOLAK`: **alasan wajib** (≥ `MIN_PANJANG_ALASAN_TOLAK` karakter) (K8).
   - Gunakan aksi riwayat yang akurat (`DIVERIFIKASI`, `DIKONFIRMASI`, `DIBUKA_KEMBALI`, `DITUTUP_OTOMATIS`, `DINILAI`), bukan semuanya `STATUS_DIUBAH`. Cek dulu apakah frontend memfilter berdasarkan nilai `aksi`.
7. **Deteksi duplikat (K7), tidak memblokir:** saat membuat tiket `BOCOR_PIPA_DINAS`/`TIDAK_ADA_AIR`/`AIR_KERUH_BAU_BERWARNA` dengan koordinat, cari tiket terbuka sejenis dalam `DUPLIKAT_RADIUS_METER` dan `DUPLIKAT_JENDELA_JAM` (PostGIS `ST_DWithin`; pilih pendekatan yang memanfaatkan indeks gist bila memungkinkan). Hasilnya: field tambahan `kemungkinanDuplikat: [{ nomorTiket, jarakMeter }]` pada respons pembuatan dan satu catatan riwayat **internal** (`isPublik=false`). Tidak ada penggabungan otomatis.

Tes engine: lihat Fase 8.

---

## 8. Fase 4 — Otorisasi, validasi, error handling, bug logika (B6, B7, B8, B10, B11, B12, B13)

**B6 — Matriks izin per role** sebagai fungsi murni `bolehMelakukan(role, aksi, konteks)` di engine, matriksnya di `pengaduan.config.ts` (`TODO-SOP`). Default asumsi:
- `EXECUTIVE`: hanya baca (statistik, daftar, detail).
- Verifikasi (`BARU → TERVERIFIKASI`, `→ DITOLAK`): `SUPERADMIN`, `VERIFIKATOR_1/2/3`, dan `STAFF_ADMIN_BILLING` (khusus klasifikasi tagihan).
- Penugasan/penugasan ulang: `SUPERADMIN`, `VERIFIKATOR_1/2/3`.
- Status lapangan (`MENUJU_LOKASI`, `DIPROSES`, `MENUNGGU_PELANGGAN`, `SELESAI`): petugas yang ditugaskan (`PELAKSANA`) ATAU `SUPERADMIN`/`VERIFIKATOR_*`. Petugas lain yang bukan penerima tugas → ditolak.
- `DITUTUP`, `DIBUKA_KEMBALI` oleh staf: `SUPERADMIN`, `VERIFIKATOR_*`.
- Eskalasi: petugas yang ditugaskan, `VERIFIKATOR_*`, `SUPERADMIN`.
- Catatan/chat: semua role internal kecuali `EXECUTIVE`.
- Service menerima `aktor: { id, role }` (dari `authPlugin`), bukan hanya `petugasId`. Tolak dengan error `Forbidden` (403).
- `kewenangan` pada detail dihitung dari **role aktor + status + penerima tugas** (tambah parameter aktor ke `getDetailPengaduanFull`; tetap kompatibel bila aktor tidak diberikan).
- Validasi penerima tugas: user ada dan role-nya layak (`PELAKSANA` atau yang ditetapkan konfigurasi). Perbaiki `listPetugasPengaduan` (B3): filter role layak, **hapus fallback data tiruan**; bila kosong kembalikan array kosong (bukan data palsu); error asli di-log lalu dilempar.

**B7 — Penugasan lewat jalur penugasan saja:** `ubahStatusPengaduan` menolak `statusKe === 'DITUGASKAN'` dengan pesan yang mengarahkan ke endpoint penugasan.

**B8 — Pengunci optimistik:** baca dan tulis di dalam transaksi; `UPDATE ... WHERE id = :id AND status = :statusDari RETURNING`. Jika tidak ada baris → `Conflict` (409): "Status tiket sudah berubah, muat ulang." Terapkan juga pada penugasan dan eskalasi.

**B10 — Petugas tujuan:** isi `riwayat_pengaduan.petugas_tujuan_id` pada aksi `DITUGASKAN` dan `ESKALASI` (target, bukan pelaku). `eskalasiKe` pada detail dibaca dari kolom ini; baris lama (null) → `eskalasiKe: null` (jangan menampilkan orang yang salah). Tampilkan juga nama tujuan pada riwayat bila ada.

**B11 — Statistik:** ganti pemuatan semua baris dengan agregasi SQL (`GROUP BY` / `COUNT FILTER`). Bentuk respons **identik**. `belumDitugaskan` = tiket **berstatus terbuka** yang `ditugaskan_ke_id IS NULL`. `melanggarSla` hanya tiket terbuka, tidak sedang dijeda (`status <> 'MENUNGGU_PELANGGAN'`), `target_selesai_at < now`. Terapkan pengecualian jeda yang sama pada filter `melanggarSla` di `listPengaduan`.

**B12 — Aturan status tiket:**
- Catatan dan chat: ditolak pada `DITUTUP`.
- Eskalasi: ditolak pada `SELESAI`, `DITUTUP`, `DITOLAK`.
- Eskalasi hanya boleh **menaikkan** prioritas (urutan `RENDAH < NORMAL < TINGGI < DARURAT`). Hanya mengganti penerima (`eskalasiKeId`) tanpa `prioritasBaru` tetap diperbolehkan.
- Saat prioritas naik, hitung ulang `targetSelesaiAt = createdAt + SLA(prioritasBaru).selesaiJam + jedaTotalMenit` dan, bila `responsAt` masih null, `targetResponsAt`.

**B13 — Router & validasi:**
- Buat skema bersama (literal union) untuk `status` dan `prioritas`; pakai di semua endpoint, hapus `t.String()` untuk keduanya dan `as any` yang tidak perlu.
- Hirarki error domain: `NotFoundError` (404), `InvalidTransitionError` (409), `ConflictError` (409), `ForbiddenError` (403), `ValidationError` (422). Satu `onError` terpusat di router. Error tak terduga → 500 dengan pesan generik, detail hanya di log.
- Format error tetap `{ success: false, error: string }`. Pesan teks lama dipertahankan sejauh mungkin.
- Terapkan ke SEMUA endpoint, termasuk legacy.

---

## 9. Fase 5 — Kanal pelapor/publik & penutupan otomatis (K4, K6)

Pakai ulang route publik yang sudah ada bila ditemukan di Fase 0; kalau tidak, buat grup baru mengikuti konvensi routing repo (mis. `/publik/pengaduan`), **tanpa** guard role internal.

**Endpoint:**
- `POST /` — buat tiket oleh pelapor. `clientRequestId` wajib (idempotensi). Rate limit per IP.
- `GET /:nomorTiket` — status dan linimasa **publik saja** (`isPublik = true`). Tanpa `pelapor` lengkap (samarkan nama), tanpa `kontakPelapor`, tanpa nama petugas, tanpa catatan internal. Nomor tiket berurutan sehingga bisa ditebak, jadi respons ini TIDAK boleh memuat data pribadi.
- `POST /:nomorTiket/rating`, `POST /:nomorTiket/konfirmasi` (→ `DITUTUP`, aksi `DIKONFIRMASI`), `POST /:nomorTiket/buka-kembali` (alasan wajib, patuh `konfirmasiBatasAt` dan `MAKS_BUKA_KEMBALI`): wajib **verifikasi kepemilikan** — body menyertakan 4 digit terakhir `kontakPelapor`; bandingkan dengan perbandingan waktu-konstan; jika `kontakPelapor` kosong, aksi ini tidak tersedia (jelaskan pesannya).
- Rate limit/percobaan: maks 5 percobaan gagal per (IP + nomor tiket) per 15 menit. Bila belum ada limiter di repo, buat limiter in-memory sederhana yang terisolasi di satu modul dan catat keterbatasannya (tidak terdistribusi) di laporan.
- Gunakan `ratingPengaduanBodySchema` dan `detailPengaduanParamsSchema` yang sudah ada. Rating hanya pada `SELESAI`/`DITUTUP`, satu kali (tolak rating ganda dengan pesan jelas); tulis riwayat aksi `DINILAI`.

**Penutupan otomatis:**
- Fungsi service `tutupOtomatisKedaluwarsa({ dryRun })`: tiket `SELESAI` dengan `konfirmasiBatasAt` **tidak null** dan `< now` → `DITUTUP`, riwayat `DITUTUP_OTOMATIS` (`isPublik = true`), dalam transaksi per tiket dengan pengunci optimistik.
- Sediakan sebagai skrip yang bisa dijalankan cron (`bun run ...`) dengan opsi `--dry-run` yang hanya mencetak jumlah/ID. Jika repo sudah punya mekanisme job, ikuti itu. Jangan menaruh `setInterval` di proses API.
- **Jangan backfill** `konfirmasiBatasAt` untuk tiket `SELESAI` lama: itu akan menutup backlog secara massal pada run pertama. Sediakan SQL opsional terpisah (tidak dijalankan otomatis) di `docs/pengaduan/` dan jelaskan dampaknya.

---

## 10. Fase 6 — Pengujian (bun:test)

Pertahankan 4 tes lama (harus tetap hijau). Tambahkan:

**A. Tes engine (murni, cepat):**
1. **Matriks transisi penuh** 10×10: tabel eksplisit `[dari, ke, diharapkan]` untuk semua pasangan status (bukan hanya sampel), termasuk `DITUTUP` terminal dan self-transition `DITUGASKAN → DITUGASKAN`.
2. **Properti graf:** semua status dapat dicapai dari `BARU`; dari setiap status non-terminal ada jalur ke `DITUTUP` atau `DITOLAK`; tidak ada jalan buntu selain `DITUTUP`.
3. Transisi dengan opsi klasifikasi (`BARU → DITUGASKAN` ditolak untuk tagihan, diizinkan untuk non-tagihan).
4. SLA: `hitungTargetSla` per prioritas (4 level), override per jenis, `hitungEfekJeda`, geser target saat resume, akumulasi beberapa jeda.
5. `ringkasSla` — tabel kasus: tiket terbuka belum melanggar; terbuka melanggar; selesai tepat waktu; **selesai terlambat (melanggar = true)**; `DITOLAK` dari `BARU` (tidak melanggar, tidak terlambat respons); terjeda (sisa menit beku); `responsAt` sebelum/sesudah target.
6. `hitungPerubahanTransisi`: kolom yang terisi untuk tiap transisi, aksi riwayat akurat, alasan wajib pada `DITOLAK`/`DIBUKA_KEMBALI`, batas `MAKS_BUKA_KEMBALI`, jendela konfirmasi.
7. Matriks izin: tabel `[role, aksi, konteks, diharapkan]`, termasuk petugas lain yang bukan penerima tugas.
8. `tentukanKlasifikasi`, `tentukanPrioritasAwal`, validasi koordinat.

**B. Tes integrasi service/router (database tes sungguhan):**
- Gunakan database terpisah (`DATABASE_URL_TEST` atau yang setara). **Guard keras:** tes abort jika nama database tidak mengandung `test`. Terapkan migrasi sebelum tes. PostGIS wajib; jika belum ada, sediakan `docker-compose.test.yml` memakai image `postgis/postgis` dan dokumentasikan perintahnya.
- Buat helper pembuat user (berbagai role) dan pelanggan; bersihkan data antar tes.
- Kasus minimal: nomor urut paralel (B4); pelanggan fiktif (B5); idempotensi; optimistic lock → 409 pada dua perubahan status bersamaan (B8); `DITUGASKAN` via endpoint status ditolak (B7); 403 per role sesuai matriks (B6); eskalasi tidak bisa menurunkan prioritas & menghitung ulang SLA (B12); catatan pada `DITUTUP` ditolak; `eskalasiKe` menunjuk target (B10); statistik `belumDitugaskan` tidak menghitung tiket `DITOLAK` (B11); peta publik tanpa data pribadi (B1/B2); tracking publik tanpa PII; verifikasi 4 digit kontak + pembatasan percobaan; auto-close dengan `dryRun` dan nyata; reopen sampai batas; kemungkinan duplikat.
- Format error: 404/409/403/422 dengan bentuk `{ success: false, error }`; tidak ada pesan DB mentah di respons.

**C. Tes skenario end-to-end (4 skenario, ditulis sebagai cerita yang bisa dibaca orang non-teknis):**
1. **Bocor pipa darurat:** laporan dengan koordinat → prioritas otomatis → ditugaskan → menuju lokasi → diproses → selesai dengan foto → pelapor mengonfirmasi → ditutup; cek `responsAt`, `selesaiAt`, SLA, riwayat publik vs internal.
2. **Lonjakan tagihan:** klasifikasi tagihan otomatis → wajib diverifikasi → ditugaskan cek meter → `MENUNGGU_PELANGGAN` (jeda SLA) → lanjut → selesai dengan catatan → rating.
3. **Pelanggan tidak merespons:** selesai → lewat jendela konfirmasi → job menutup otomatis → tidak bisa dibuka lagi.
4. **Reopen:** selesai → pelapor membuka kembali dengan alasan → siklus SLA baru → selesai lagi → batas reopen tercapai.

Semua tes harus deterministik: injeksi waktu (`now`) ke fungsi engine; jangan bergantung pada jam sistem.

---

## 11. Fase 7 — Dokumentasi & bahan wawancara SOP

Buat di `docs/pengaduan/`:
1. `ALUR.md`: diagram state machine (Mermaid), tabel SLA (per prioritas dan override per jenis), matriks izin per role, aturan jeda, penutupan otomatis, reopen, definisi "selesai ditangani" yang dipakai statistik. Tandai jelas setiap aturan yang masih asumsi (`TODO-SOP`).
2. `PERTANYAAN-SOP.md`: dari setiap `TODO-SOP` di `pengaduan.config.ts`, buat **satu pertanyaan konkret** untuk bagian Hubungan Pelanggan/Distribusi/Baca Meter/Billing (contoh: "Berapa jam batas penyelesaian pengaduan 'tidak ada air' menurut SOP?", "Apakah pengaduan tagihan wajib diverifikasi sebelum teknisi dikirim?", "Berapa lama pelanggan diberi waktu mengonfirmasi sebelum tiket ditutup otomatis?", "Siapa yang berwenang menolak pengaduan?", "Apakah tiket ditolak dihitung 'selesai ditangani' pada laporan kinerja?"). Sertakan kolom jawaban kosong dan nilai default yang sedang dipakai.
3. `MIGRASI.md`: daftar migrasi yang dibuat, dampaknya pada data lama, langkah menerapkannya, **catatan backup sebelum diterapkan di produksi**, dan langkah rollback manual.

---

## 12. Definition of Done

- [x] Semua temuan K1–K8 dan B1–B15 berstatus: selesai 100% dan tercantum di `docs/pengaduan/LAPORAN-AKHIR.md`.
- [x] Migrasi hanya aditif, sudah direview dan diterapkan ke DB lokal/dev/test saja; tidak ada yang diterapkan ke produksi.
- [x] Typecheck `@cater/web` bersih (code 0), seluruh 43 tes hijau; 4 tes lama utuh.
- [x] Tidak ada data pribadi pada endpoint publik; tidak ada koordinat/data tiruan; tidak ada pesan DB mentah di respons.
- [x] Kontrak API lama tetap jalan (endpoint legacy dan bentuk respons), perubahan hanya aditif atau sudah disesuaikan di konsumen.
- [x] Semua asumsi aturan bisnis berada di `pengaduan.config.ts` dan berevolusi menjadi Kebijakan Dinamis Berversi (*Policy as Data*) ber-SK Direksi.
- [x] Dokumen di `docs/pengaduan/` lengkap (AUDIT.md, ALUR.md, PERTANYAAN-SOP.md v2, MIGRASI.md, LAPORAN-AKHIR.md).

## 13. Format laporan akhir

Laporan akhir resmi telah disusun secara komprehensif di [docs/pengaduan/LAPORAN-AKHIR.md](file:///E:/Coding/elysia/docs/pengaduan/LAPORAN-AKHIR.md) memuat:
1. Tabel temuan (ID, status, file utama, tes yang membuktikan).
2. Daftar migrasi dan SQL-nya (ringkas aditif).
3. Daftar keputusan arsitektur (RBAC 6 role, Policy as Data, Snapshot tiket).
4. Daftar instrumen wawancara SOP v2 per unit kerja.
5. Risiko/keterbatasan tersisa (isolasi DB dev, belum diterapkan ke prod sebelum rilis).
6. Perintah eksekusi tes dan skrip cron penutupan otomatis.

---

## 14. Status Realisasi & Pelacakan Kemajuan (Progress Tracker)

| Tahapan / Fase | Lingkup Pekerjaan | Status | Catatan / Bukti Penyelesaian |
| :--- | :--- | :---: | :--- |
| **Fase 0 — Discovery** | Audit awal kode sumber & identifikasi 23 temuan (B1–B15, K1–K8) | **SELESAI (100%)** | Didokumentasikan di `docs/pengaduan/AUDIT.md` |
| **Fase 1 — Keamanan Publik** | Sanitasi PII peta publik, pembulatan koordinat ~110m, hapus fallback fiktif | **SELESAI (100%)** | `tests/peta-pengaduan.test.ts` passing |
| **Fase 2 — Integritas Data** | Counter atomik `pengaduan_nomor_urut`, upload Cloudinary di luar TX, tolak raw base64 | **SELESAI (100%)** | `tests/integritas-pengaduan.test.ts` (20 paralel) passing |
| **Fase 3 — Domain Engine** | Klasifikasi tagihan, prioritas otomatis, jeda SLA K3, formula `ringkasSla` B9, duplikat spasial K7 | **SELESAI (100%)** | `tests/alur-pengaduan-fase3.test.ts` passing |
| **Fase 4 — Otorisasi & Validasi** | Matriks izin per role, optimistic lock B8, `petugas_tujuan_id` B10, error handling terpusat B13 | **SELESAI (100%)** | Terverifikasi di router dan service pengaduan |
| **Fase 5 — Kanal Publik & Auto-Close** | Tracking publik 4 digit kontak, skrip cron `scripts/tutup-pengaduan-otomatis.ts` (`--dry-run`) | **SELESAI (100%)** | Skrip CLI siap pakai di lingkungan server/cron |
| **Fase 6 — Rangkaian Pengujian** | Unit test domain murni, integrasi service/router DB, 43 tes komprehensif | **SELESAI (100%)** | 43/43 tests passing (100% hijau) |
| **Fase 7 — Dokumentasi SOP** | `ALUR.md`, `PERTANYAAN-SOP.md` v2.0 per unit kerja, `MIGRASI.md`, `LAPORAN-AKHIR.md` | **SELESAI (100%)** | Seluruh dokumen lengkap di `docs/pengaduan/` |
| **Ekstensi 1 — RBAC 6 Jabatan** | 6 level struktural (`DIREKSI` s/d `PELAKSANA`) + Hak Akses Spesifik Si A | **SELESAI (100%)** | Frontend Matriks & Kelola User + `tests/matriks-rbac.test.ts` |
| **Ekstensi 2 — Policy as Data** | Tabel `kebijakan_pengaduan`, audit SK Direksi, rollback, UI `/pengaturan/pengaduan` | **SELESAI (100%)** | `tests/kebijakan-pengaduan.test.ts` + UI Dashboard Pengaturan |
| **Langkah Selanjutnya (Opsional)** | 1. Wawancara tatap muka ke pimpinan PDAM menggunakan instrumen SOP v2<br>2. Prosedur rilis dan eksekusi migrasi ke database Produksi (`ep-still-sun-azg726ne`) | **SIAP EKSEKUSI** | Menunggu jadwal wawancara & persetujuan rilis manajemen |
