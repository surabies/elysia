# Prompt AI Agent: Fitur Mutasi Rute & Penggabungan Rute Baca

Kamu adalah engineer senior TypeScript yang bekerja di monorepo aplikasi internal PDAM (aplikasi baca meter). Tugasmu: menerapkan dua halaman yang **frontend-nya sudah dibuat** dengan backend nyata memakai **Elysia + Drizzle ORM + PostgreSQL**, lalu menghubungkan keduanya.

## 1. Tujuan fitur

Memindahkan rute baca pelanggan antar petugas pencatat meter.

1. **Mutasi Rute Pelanggan** (`/rute/mutasi`): satu pelanggan dipindah ke wilayah, zona, rute, dan nomor urut baru. Setiap mutasi tercatat di riwayat.
2. **Penggabungan / Kelola Rute** (`/rute/penggabungan`): pilih Wilayah → Petugas → Rute, centang banyak pelanggan, lalu pindahkan sekaligus ke rute lain.

## 2. Stack & aturan umum

- Next.js App Router, TypeScript strict, shadcn/ui (registry Base UI, prop `render`, bukan `asChild`), Tailwind.
- Backend: **Elysia**, **Drizzle ORM**, **PostgreSQL**. Validasi request/response dengan `t` (TypeBox) bawaan Elysia.
- Bahasa UI dan pesan error: **Bahasa Indonesia**. Penamaan kode: ikuti konvensi yang sudah ada di repo.
- **Jangan menambah dependency baru tanpa konfirmasi.** Pakai library yang sudah terpasang.
- **Jangan mendesain ulang UI.** Komponen sudah final, hanya ganti sumber datanya.
- Jika ada error, jelaskan dulu penyebabnya sebelum memperbaiki.

## 3. File frontend yang sudah ada

```
src/features/rute/
  data.ts                          <- DATA TIRUAN, akan digantikan API
  components/ui-parts.tsx
  components/field-select.tsx
  components/mutasi-rute-view.tsx
  components/penggabungan-rute-view.tsx
  components/pindah-rute-dialog.tsx
src/app/(dashboard)/rute/mutasi/page.tsx
src/app/(dashboard)/rute/penggabungan/page.tsx
```

`data.ts` mengekspor tipe `Opsi`, `Pelanggan`, `RiwayatMutasi` dan fungsi async berikut. Kontrak ini yang harus dipenuhi API:

| Fungsi | Mengembalikan |
|---|---|
| `getPetugas(wilayah)` | `Opsi[]` (value = id petugas, label = nama) |
| `getRute(petugasId)` | `Opsi[]` |
| `getRuteTujuan(kecuali)` | `Opsi[]` (label: `KODE · NAMA PETUGAS`) |
| `getZona()` | `Opsi[]` |
| `getPelanggan(rute)` | `Pelanggan[]` |
| `cariPelanggan(noPel)` | `Pelanggan \| null` |
| `pindahRute(noPelList, ruteBaru)` | `boolean` |
| `simpanMutasi(pelanggan, tujuan)` | `RiwayatMutasi` |
| `getRiwayat()` | `RiwayatMutasi[]` |

## 4. Langkah 0: pelajari repo dulu (jangan langsung menulis kode)

1. Baca skema Drizzle yang sudah ada. **Pakai ulang** tabel pelanggan, petugas, rute, wilayah jika sudah ada. Buat tabel baru hanya untuk yang belum ada.
2. Cari cara project ini: memasang plugin Elysia, struktur modul API, sistem auth/session dan role, format error, cara frontend memanggil API (Eden Treaty, fetch wrapper, TanStack Query, dll.).
3. Tulis rencana singkat (file yang akan dibuat/diubah, perbedaan skema dengan usulan di bawah), lalu lanjut mengerjakan.

## 5. Skema Drizzle (usulan, sesuaikan dengan skema yang ada)

```ts
export const wilayah = pgTable("wilayah", {
  id: uuid("id").primaryKey().defaultRandom(),
  kode: varchar("kode", { length: 20 }).notNull().unique(), // "WP 5"
});

export const petugas = pgTable("petugas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: varchar("nama", { length: 120 }).notNull(),
  wilayahId: uuid("wilayah_id").notNull().references(() => wilayah.id),
});

export const rute = pgTable("rute", {
  id: uuid("id").primaryKey().defaultRandom(),
  kode: varchar("kode", { length: 20 }).notNull().unique(), // "BD502"
  petugasId: uuid("petugas_id").notNull().references(() => petugas.id),
  wilayahId: uuid("wilayah_id").notNull().references(() => wilayah.id),
});

export const pelanggan = pgTable("pelanggan", {
  id: uuid("id").primaryKey().defaultRandom(),
  noPel: varchar("no_pel", { length: 20 }).notNull().unique(),
  nama: varchar("nama", { length: 150 }).notNull(),
  alamat: text("alamat").notNull(),
  golTarif: varchar("gol_tarif", { length: 10 }).notNull(),
  wilayahId: uuid("wilayah_id").notNull().references(() => wilayah.id),
  ruteId: uuid("rute_id").notNull().references(() => rute.id),
  noUrut: integer("no_urut").notNull(),
  tglPasang: date("tgl_pasang").notNull(),
}, (t) => [index("pelanggan_rute_urut_idx").on(t.ruteId, t.noUrut)]);

// Riwayat (audit log), hanya ditambah, tidak pernah diubah/dihapus
export const mutasiRute = pgTable("mutasi_rute", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").notNull(),             // satu aksi penggabungan = satu batch
  tipe: varchar("tipe", { length: 12 }).notNull(), // "mutasi" | "penggabungan"
  pelangganId: uuid("pelanggan_id").notNull().references(() => pelanggan.id),
  wilayahLamaId: uuid("wilayah_lama_id").notNull().references(() => wilayah.id),
  ruteLamaId: uuid("rute_lama_id").notNull().references(() => rute.id),
  urutLama: integer("urut_lama").notNull(),
  wilayahBaruId: uuid("wilayah_baru_id").notNull().references(() => wilayah.id),
  ruteBaruId: uuid("rute_baru_id").notNull().references(() => rute.id),
  urutBaru: integer("urut_baru").notNull(),
  inputBy: text("input_by").notNull(),             // id user dari session
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Buat migrasi dengan `drizzle-kit generate` (bukan `push`), plus seed data dev kecil.

## 6. Endpoint Elysia (prefix `/rute`, satu modul/plugin, mis. `modules/rute`)

| Method & path | Fungsi |
|---|---|
| `GET /rute/wilayah` | daftar wilayah |
| `GET /rute/zona` | daftar zona |
| `GET /rute/petugas?wilayahId=` | petugas per wilayah |
| `GET /rute/daftar?petugasId=` | rute milik petugas |
| `GET /rute/tujuan?kecuali=` | semua rute tujuan + nama petugas |
| `GET /rute/pelanggan?ruteId=` | pelanggan satu rute, urut `noUrut` |
| `GET /rute/pelanggan/:noPel` | detail satu pelanggan (404 jika tidak ada) |
| `POST /rute/mutasi` | body `{ noPel, wilayahId, ruteKode, noUrut }` |
| `POST /rute/penggabungan` | body `{ noPelList: string[], ruteTujuanId }` |
| `GET /rute/riwayat?limit=&cursor=` | riwayat terbaru dulu |

Response harus cocok dengan tipe di `data.ts` (nilai `Opsi` = `{ value, label }`). Pisahkan **route handler** (tipis) dari **service** (logika bisnis + query Drizzle).

## 7. Aturan bisnis (wajib)

1. Setiap operasi tulis berjalan dalam **satu transaksi** (`db.transaction`) yang mencakup update pelanggan **dan** insert ke `mutasi_rute`. Gagal sebagian = rollback semua.
2. Kunci baris pelanggan dengan `select ... for update` agar dua penyelia tidak memutasi pelanggan yang sama bersamaan.
3. **Mutasi:** rute baru harus ada, dan nomor urut minimal 1. Jika nomor urut sudah dipakai di rute tujuan, geser pelanggan dengan urut ≥ nomor itu sebesar +1 (di transaksi yang sama). Tolak jika rute baru sama dengan rute lama dan urut sama (tidak ada perubahan).
4. **Penggabungan:** semua `noPelList` harus ada dan berasal dari rute yang sama. Rute tujuan harus ada dan berbeda dari rute asal. Maksimal 500 pelanggan per request. Pelanggan ditaruh di **akhir** rute tujuan (`max(noUrut) + 1`, dst.) dengan menjaga urutan lama. Rute asal tidak perlu dinomori ulang.
5. Tabel `mutasi_rute` hanya ditambah, tidak ada update/delete. Satu aksi penggabungan memakai satu `batchId`.
6. `inputBy` diambil dari **session di server**, jangan dari body request.
7. Otorisasi: hanya role penyelia/admin yang boleh menulis. Pakai mekanisme auth/RBAC yang sudah ada di repo.
8. Error: 404 (tidak ditemukan), 409 (konflik/tidak ada perubahan), 422 (validasi), 403 (tidak berhak). Pesan dalam Bahasa Indonesia dan jelas, mis. "Rute tujuan tidak boleh sama dengan rute asal."
9. Tidak ada raw SQL tanpa parameter. Pakai query builder Drizzle atau `sql` template.

## 8. Integrasi frontend

1. Buat API client di `src/features/rute/api.ts` memakai cara yang sudah dipakai project (utamakan Eden Treaty jika tipe app Elysia sudah dibagikan di monorepo).
2. Ubah `data.ts`: **pertahankan tipe**, hapus data tiruan, dan implementasikan fungsi dengan memanggil API. Nama dan signature fungsi sebisa mungkin tetap supaya komponen tidak banyak berubah.
3. Ganti `getPetugas(wilayah)` dan sejenisnya agar memakai **id** dari database (bukan teks), dan sesuaikan komponen secukupnya.
4. Tangani error API di komponen (toast untuk kegagalan simpan, state error di filter/tabel). Jangan telan error diam-diam.
5. Setelah penggabungan sukses, muat ulang data rute asal dari server (jangan hanya memfilter state lokal).
6. Opsional jika TanStack Query sudah terpasang: pakai untuk fetching dan invalidasi cache riwayat. Jika belum, jangan ditambahkan.

## 9. Kriteria selesai

- [ ] `pnpm typecheck` dan `pnpm lint` bersih.
- [ ] Migrasi Drizzle ter-generate dan bisa dijalankan di database kosong, seed dev tersedia.
- [ ] Mutasi satu pelanggan: data pelanggan berubah dan riwayat tercatat dengan nilai lama/baru yang benar.
- [ ] Penggabungan beberapa pelanggan: semua pindah ke akhir rute tujuan dengan urutan terjaga; semua tercatat dengan `batchId` yang sama.
- [ ] Simulasi gagal di tengah transaksi: tidak ada data setengah berubah.
- [ ] Pengguna tanpa role yang tepat ditolak (403).
- [ ] Tidak ada data tiruan tersisa di `data.ts`.

## 10. Hal yang tidak boleh dilakukan

- Mengubah tampilan/layout komponen yang sudah ada tanpa alasan teknis.
- Hard delete data pelanggan atau riwayat.
- Menjalankan `drizzle-kit push` ke database produksi.
- Mengubah skema tabel yang sudah dipakai fitur lain tanpa menjelaskan dampaknya terlebih dulu.

Mulai dari **Langkah 0**, tampilkan ringkasan temuan dan rencanamu, lalu kerjakan bertahap: skema + migrasi → service + endpoint → integrasi frontend → verifikasi.
