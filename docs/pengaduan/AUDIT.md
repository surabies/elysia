# AUDIT AWAL MODUL PENGADUAN AIR MINUM (MYTIRTA / TIRTAWENING)

> Dokumen Hasil Audit Fase 0 — Discovery & Verifikasi Kode  
> Tanggal Audit: 22 November 2026  
> Auditor: Antigravity Senior Backend AI Agent  

---

## 1. Pemetaan Struktur & Komponen Arsitektur

### 1.1 Modul Pengaduan (3 Lapis Arsitektur)
1. **Lapis 1 — Domain Engine (Logika Murni)**:
   - Lokasi: `apps/web/src/server/domain/pengaduan/alur-pengaduan.engine.ts`
   - Berisi fungsi murni: `generateNomorTiket`, `parseNomorTiket`, `isTransisiSah`, `hitungTargetSla`, `evaluasiPembuatanTiket`, `ringkasSla`.
   - Tes domain: `apps/web/src/server/domain/pengaduan/alur-pengaduan.test.ts` (4 tes passing di `bun:test`).
2. **Lapis 2 — Service Layer (Orkestrasi DB Drizzle)**:
   - Lokasi: `apps/web/src/server/services/pengaduan/pengaduan.service.ts`
   - Berisi 13 metode: `createPengaduan`, `getDetailPengaduan`, `tugaskanPengaduan`, `ubahStatusPengaduan`, `beriRating`, `getPengaduanPetaPublik`, `getStatistikPengaduan`, `listPengaduan`, `getDetailPengaduanFull`, `listPetugasPengaduan`, `tambahCatatanPengaduan`, `kirimChatPetugas`, `eskalasiPengaduan`.
3. **Lapis 3 — Router / Controller Layer (Elysia)**:
   - Lokasi: `apps/web/src/server/modules/pengaduan/pengaduan.router.ts` & `pengaduan.schema.ts`
   - Dipasang pada prefix `/api/pengaduan` dan `/api/v1/pengaduan` dengan guard `requireRole: PENGADUAN_INTERNAL_ROLES`.
   - Router publik: `apps/web/src/server/modules/publik/publik.router.ts` (dipasang pada `/api/publik` dan alias `/api/public`).

### 1.2 Database & Skema
- Skema tabel utama & riwayat: `packages/db/src/schema/pengaduan.ts` (`pengaduan`, `riwayat_pengaduan`, enum: `klasifikasi_pengaduan_enum`, `jenis_pengaduan_enum`, `prioritas_pengaduan_enum`, `status_pengaduan_enum`, `aksi_pengaduan_enum`).
- Skema RBAC & Auth:
  - `packages/db/src/schema/rbac.ts`: `appRoleEnum` ('SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'VERIFIKATOR_2', 'VERIFIKATOR_1', 'STAFF_ADMIN_BILLING', 'PENCATAT', 'PELAKSANA', 'USER').
  - `userRoles` table (`userId`, `role`).
  - `packages/db/src/schema/auth.ts`: `user` (`id`, `name`, `email`, `role`, `nolg`, dll.).
  - `packages/db/src/schema/pelanggan.ts`: `pelanggan` (`nolg` PK, `nama`, `alamat`, `ruteKode`, dll.).
- PostGIS: Kolom `geometry('koordinat', { type: 'point', mode: 'xy', srid: 4326 })` dengan indeks GIST `pengaduan_koordinat_idx`.

### 1.3 Media Storage
- Cloudinary wrapper: `apps/web/src/server/lib/cloudinary.ts`.
- Fungsi pembantu: `isCloudinaryConfigured()`, `uploadToCloudinary(...)`.

### 1.4 Autentikasi & Guard Internal
- Plugin: `apps/web/src/server/plugins/auth.ts` (`authPlugin`).
- Menyediakan ke handler: `user` (`id`, `name`, `email`, `role`), `session`, dan `userRoles` (`AppRole[]`).
- Macro: `requireAuth: true`, `requireRole: AppRole[]`.

---

## 2. Konsumen Endpoint di Frontend & API

1. **Peta Publik Interaktif**:
   - URL: `/peta-pengaduan`
   - SSR data fetch: `apps/web/src/app/peta-pengaduan/page.tsx` memanggil `pengaduanService.getPengaduanPetaPublik()`.
   - Client fetch: `apps/web/src/features/peta-pengaduan/lib/ApiPengaduan.ts` memanggil `/api/public/pengaduan/peta` dan `/api/public/pengaduan`.
2. **Portal Warga (Landing & Formulir)**:
   - URL: `/pengaduan-air` (Form pengaduan publik & pelacakan tiket).
   - Client fetch: `apps/web/src/features/public/lib/api.ts` memanggil:
     - `POST /api/publik/pengaduan`
     - `GET /api/publik/pengaduan/:nomorTiket`
     - `POST /api/publik/pengaduan/:nomorTiket/rating`
3. **Dashboard Internal Staf**:
   - URL: `/(dashboard)/pengaduan` dan `/(dashboard)/pengaduan/[id]`
   - Konsumen:
     - `apps/web/src/features/dashboard/pengaduan/hooks/UseStatistikPengaduan.ts` (`/api/v1/pengaduan/statistik`)
     - `apps/web/src/features/dashboard/pengaduan/components/papan-pengaduan/TabelPengaduanGlide.tsx` (`/api/v1/pengaduan?...`)
     - `apps/web/src/features/dashboard/pengaduan/components/detail-tiket/index.tsx` (`/api/v1/pengaduan/:id`, `/status`, `/tugaskan`, `/catatan`, `/chat`, `/eskalasi`)

---

## 3. Konfirmasi Temuan Bisnis & Fungsional (K1–K8)

| ID | Deskripsi Temuan | Status | Bukti Kode (File & Baris) |
|---|---|---|---|
| **K1** | Dua klasifikasi (`NILAI_TAGIHAN_REKENING` vs `BUKAN_NILAI_TAGIHAN_REKENING`), tapi alur sama. Pengaduan tagihan seharusnya wajib verifikasi/cek meter. Role `VERIFIKATOR_1/2/3` belum digunakan. | **BENAR (CONFIRMED)** | `alur-pengaduan.engine.ts:147` (`TRANSISI_PENGADUAN` memperbolehkan `BARU -> DITUGASKAN` tanpa membedakan klasifikasi). `pengaduan.router.ts:11` hanya memeriksa list role tapi tidak membatasi per aksi. |
| **K2** | SLA hanya per prioritas; default `NORMAL` untuk semua jenis; tidak ada penentuan prioritas otomatis berdasarkan jenis pengaduan (mis. kebocoran/air mati). | **BENAR (CONFIRMED)** | `alur-pengaduan.engine.ts:176` (`SLA_PRIORITAS` hanya DARURAT, TINGGI, NORMAL, RENDAH). `pengaduan.service.ts:108` (`const prioritas = input.prioritas ?? 'NORMAL'`). |
| **K3** | Jeda SLA setengah jadi: `jedaMulaiAt` dan `jedaTotalMenit` tidak pernah diisi saat tiket `MENUNGGU_PELANGGAN`, target SLA tidak digeser. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:327-360` (`ubahStatusPengaduan` mengabaikan `jedaMulaiAt`, `jedaTotalMenit`, dan `targetSelesaiAt`). |
| **K4** | `SELESAI → DITUTUP` tidak punya pemicu otomatis: `konfirmasiBatasAt` tidak pernah diisi; enum `DITUTUP_OTOMATIS` tidak pernah dipanggil. | **BENAR (CONFIRMED)** | Kolom `konfirmasiBatasAt` ada di `packages/db/src/schema/pengaduan.ts:112` tetapi tidak pernah di-insert/update di `pengaduan.service.ts`. Enum `DITUTUP_OTOMATIS` tidak dipakai. |
| **K5** | Reopen belum lengkap: `jumlahDibukaKembali` tidak bertambah, SLA tidak di-reset, tidak ada batas reopen. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:327-360` pada transisi ke `DIBUKA_KEMBALI` tidak mengubah `jumlahDibukaKembali` dan tidak menghitung ulang SLA. |
| **K6** | Kanal pelapor/publik hilang/terbatas: service punya `beriRating` & `getDetailPengaduan`, namun verifikasi kepemilikan tidak ada; `ratingPengaduanBodySchema` & `detailPengaduanParamsSchema` tidak dipakai di router internal. | **BENAR (CONFIRMED)** | `pengaduan.schema.ts:49, 77` tidak dipakai di `pengaduan.router.ts`. Di `publik.router.ts:165, 196`, detail & rating dapat diakses tanpa verifikasi kontak pelapor. |
| **K7** | Belum ada deteksi laporan duplikat (satu kebocoran dilaporkan oleh banyak warga). | **BENAR (CONFIRMED)** | `pengaduan.service.ts:70-197` (`createPengaduan`) hanya memeriksa idempotensi `clientRequestId`, tidak ada kueri kedekatan spasial/temporal PostGIS. |
| **K8** | `DITOLAK` tidak mewajibkan alasan/keterangan penolakan. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:301-303` hanya memvalidasi `catatan` saat `SELESAI`, sedangkan untuk `DITOLAK` dibiarkan kosong tanpa validasi. |

---

## 4. Konfirmasi Temuan Bug Teknis (B1–B15)

| ID | Deskripsi Bug | Status | Bukti Kode (File & Baris) |
|---|---|---|---|
| **B1** | `getPengaduanPetaPublik` mengembalikan `pelapor`, `kontakPelapor`, `deskripsi`, nama petugas, dan semua tiket (termasuk `DITOLAK`) ke endpoint publik -> kebocoran PII. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:422-442` memilih field sensitif `pelapor`, `kontakPelapor`, `deskripsi`, `petugasNama` dan mengembalikannya ke klien publik di baris 494-514. Tiket `DITOLAK` juga tidak difilter. |
| **B2** | `getPengaduanPetaPublik` mengisi koordinat palsu (`TITIK_BANDUNG`) untuk tiket tanpa koordinat -> data peta fiktif. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:405-418` mendefinisikan `TITIK_BANDUNG` array dan baris 489-493 menginjeksi fallback koordinat palsu ke tiket yang koordinatnya null. |
| **B3** | `listPetugasPengaduan` mengembalikan SEMUA user (limit 100 tanpa filter role) dan jatuh ke mock data fiktif (`usr-1`..`usr-4`) saat kosong/error -> ID melanggar Foreign Key. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:913-935` query `select({ id: user.id, name: user.name }).from(user).limit(100)`, dan blok catch mengembalikan hardcoded `usr-1` hingga `usr-4`. |
| **B4** | Penomoran urut tiket menggunakan `count(*) + 1` per prefix -> race condition saat request konkuren. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:122-126` menghitung urut dengan `select count(*)::int from pengaduan where nomor_tiket like prefix%`. Dua request bersamaan akan menghasilkan nomor urut yang sama. |
| **B5** | `createPengaduan` mengisi `pelangganId = nomorLangganan` tanpa mengecek eksistensi di tabel `pelanggan` -> PostgreSQL FK violation terlempar mentah ke klien. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:167` `pelangganId: input.nomorLangganan`. Bila nomor pelanggan tidak ada di tabel `pelanggan`, insert melempar foreign key error. |
| **B6** | Tidak ada otorisasi per role: semua role internal bebas melakukan semua aksi. `kewenangan` pada detail hanya berdasar status tiket, bukan role aktor. | **BENAR (CONFIRMED)** | `pengaduan.router.ts:23` hanya memeriksa apakah user memiliki salah satu dari `PENGADUAN_INTERNAL_ROLES`. `pengaduan.service.ts:902-906` menghitung `kewenangan` murni dari `status` tiket tanpa memeriksa identitas/role aktor. |
| **B7** | `ubahStatusPengaduan` menerima `statusKe: 'DITUGASKAN'` tanpa `ditugaskanKeId` -> tiket menjadi `DITUGASKAN` tanpa ada petugas. | **BENAR (CONFIRMED)** | `pengaduan.schema.ts:64` mengizinkan `'DITUGASKAN'`. `pengaduan.service.ts:281` tidak memvalidasi atau mengisi `ditugaskanKeId` pada method tersebut. |
| **B8** | `ubahStatusPengaduan` membaca status di luar transaksi dan meng-update tanpa pengunci optimistik (`WHERE status = statusDari`) -> race condition / lost updates. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:282-286` pembacaan dilakukan di luar `db.transaction`, dan baris 345 hanya memfilter `.where(eq(pengaduan.id, input.pengaduanId))` tanpa klausa status asal. Hal serupa terjadi di `tugaskanPengaduan` dan `eskalasiPengaduan`. |
| **B9** | `ringkasSla`: `melanggar` selalu `false` untuk tiket tertutup (tiket selesai terlambat tidak terhitung melanggar). `responsTerlambat` bisa `true` selamanya pada tiket `DITOLAK` dari `BARU`. | **BENAR (CONFIRMED)** | `alur-pengaduan.engine.ts:242, 261` `const tutup = ...; melanggar: !tutup && sisaMenit < 0`. Jika tiket ditutup, `melanggar` pasti false. Di baris 263 `responsTerlambat: !p.responsAt && targetRespons < sekarang`, tiket `DITOLAK` dari `BARU` tidak pernah diisi `responsAt`, sehingga bernilai true selamanya. |
| **B10** | `eskalasiKe` pada detail diambil dari `petugasId` riwayat eskalasi (= pelaku eskalasi), bukan target/penerima eskalasi. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:848-859` membaca `lastEscalation?.petugasId`, padahal di `eskalasiPengaduan` (baris 1042) `petugasId` diisi pelaku yang login (`input.petugasId`). Tabel `riwayat_pengaduan` belum memiliki kolom `petugas_tujuan_id`. |
| **B11** | `getStatistikPengaduan.belumDitugaskan` menghitung tiket tertutup/ditolak. Agregasi memuat semua baris ke memori. `melanggarSla` tidak mengecualikan tiket terjeda. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:527-573` memuat seluruh tabel `pengaduan` ke memori array; baris 570 `if (r.status === 'BARU' || !r.ditugaskanKeId) { belumDitugaskan++; }` menghitung tiket tertutup/ditolak; `melanggarSla` tidak mengecualikan `status === 'MENUNGGU_PELANGGAN'`. Begitu pula filter `melanggarSla` di `listPengaduan` baris 658 menyertakan `MENUNGGU_PELANGGAN`. |
| **B12** | `tambahCatatanPengaduan`, `kirimChatPetugas`, `eskalasiPengaduan` tetap bisa dijalankan pada tiket `DITUTUP` (eskalasi pada `SELESAI`/`DITOLAK`). Eskalasi dapat menurunkan prioritas tanpa hitung ulang SLA. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:946, 978, 1010` tidak memeriksa apakah tiket telah berstatus `DITUTUP`, `SELESAI`, atau `DITOLAK`. `eskalasiPengaduan` menerima prioritas apa pun dan tidak memperbarui `targetSelesaiAt`. |
| **B13** | Validasi longgar di router: `status` dan `prioritasBaru` bertipe `t.String()`; banyak `as any`; semua error ditangkap dan dijawab 400 (bocor pesan DB mentah). | **BENAR (CONFIRMED)** | `pengaduan.router.ts:205` `status: t.String()`, baris 289 `prioritasBaru: t.Optional(t.String())`. Seluruh handler melempar `catch (err: any) { set.status = 400; return { success: false, error: err.message }; }`. |
| **B14** | Panggilan upload Cloudinary dilakukan DI DALAM transaksi DB (`db.transaction`). | **BENAR (CONFIRMED)** | `pengaduan.service.ts:111-150` (`createPengaduan` membungkus `await uploadToCloudinary(...)` di dalam `db.transaction(async (tx) => { ... })`). Menahan koneksi DB saat panggilan jaringan ke Cloudinary. |
| **B15** | Data URL base64 disimpan mentah ke kolom teks DB saat Cloudinary gagal atau tidak terkonfigurasi. | **BENAR (CONFIRMED)** | `pengaduan.service.ts:143, 178` (`let processedFotoUrl = input.fotoUrl; ... fotoUrl: processedFotoUrl`). Jika upload gagal atau tidak aktif, string base64 `data:image/...` masuk ke kolom teks database. Hal yang sama terjadi pada `fotoPenyelesaianUrl` di baris 305. |

---

## 5. Temuan Tambahan (Audit Extra)

1. **Pelacakan Publik Membocorkan Nama Lengkap Pelapor**:
   - Di `apps/web/src/server/modules/publik/publik.router.ts:176`, endpoint publik `GET /api/publik/pengaduan/:nomorTiket` mengembalikan `pelapor: result.pengaduan.pelapor` tanpa masking (mis. nama lengkap terbaca publik). Nomor tiket terstruktur dan dapat ditebak, sehingga nama warga seharusnya disamarkan (mis. "Ded*** Kus****").
2. **Endpoint Publik Tanpa Proteksi Brute-force Kontak**:
   - Di `publik.router.ts`, belum ada validasi 4-digit nomor kontak untuk aksi konfirmasi, pembukaan kembali, atau pemberian rating.
3. **Database Environment Guard**:
   - Target database di `.env` adalah database produksi Neon (`ep-still-sun-azg726ne`), sedangkan di `.env.local` adalah database dev/branch (`ep-bitter-wildflower-azaxnlz0`).
   - Sesuai Aturan Main 2, migrasi **HANYA** boleh dijalankan ke database lokal/dev/test.

---

## 6. Baseline Pengujian
- Unit test engine (`apps/web/src/server/domain/pengaduan/alur-pengaduan.test.ts`): **4 pass, 0 fail**.
- Test integrasi publik (`tests/publik-pengaduan-integrasi.test.ts`): **13 pass, 0 fail**.
- Baseline dicatat dan siap dieksekusi ke Fase 1.
