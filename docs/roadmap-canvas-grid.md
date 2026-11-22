# Roadmap & Tracking: Refactoring Tabel Verifikasi ke Canvas Data Grid (Opsi 4)

Dokumen ini memetakan seluruh tahapan refactoring dari tabel berbasis DOM TanStack Table ke **Canvas Data Grid (`@glideapps/glide-data-grid`)** secara _non-destructive_ (berdampingan tanpa menghapus komponen lama).

---

## 🎯 Prinsip & Kebijakan Implementasi

1. **Zero Data/Logic Loss**: Seluruh aturan bisnis (validasi stand, anomali, status V1–V3, koreksi) harus bekerja identik.
2. **Zero Breaking Change**: Komponen lama (`TabelVerifikasi.tsx`, `BarisTabel.tsx`, dll) **tetap dipertahankan 100%**.
3. **Dual-Engine Toggle**: Pengguna dapat berpindah antara **Mode Tabel Standar (DOM)** dan **Mode Canvas Super Grid (60 FPS)** lewat _View Switcher_.
4. **Dark Mode & Styling Konsisten**: Tema warna PDAM (biru, hijau tahap, amber anomali, merah error) direfleksikan secara presisi pada kanvas.

---

## 📊 Matriks Fitur yang Harus Dipetakan (Feature Checklist)

| Fitur                                | Komponen Lama (DOM TanStack)                                 |             Status di Canvas Grid             |
| :----------------------------------- | :----------------------------------------------------------- | :-------------------------------------------: |
| **Freeze Column (Kolom Beku)**       | Ceklis, NOLG, dan Nama Pelanggan beku di kiri                |        🟢 _Selesai (freezeColumns=2)_         |
| **Format Stand Akhir (STMA)**        | Teks mono, angka id-ID, ikon sumber catat, segitiga MB       |     🟢 _Selesai (custom canvas drawing)_      |
| **Status Ring Verifikasi**           | Bar warna berjenjang (V1, V2, V3) atau tunggal               |        🟢 _Selesai (badge dot canvas)_        |
| **Deviasi & Indikator Anomali**      | Persentase deviasi, warna amber/merah deviasi > ambang       |        🟢 _Selesai (highlight canvas)_        |
| **Klik Baris (Master-Detail)**       | Memperbarui foto & profil pelanggan di panel kiri            |         🟢 _Selesai (onCellClicked)_          |
| **Menu Klik Kanan (Context Menu)**   | Verifikasi, Unverifikasi, CHN, ADD, Kondisi Foto, Baca Ulang |       🟢 _Selesai (onCellContextMenu)_        |
| **Seleksi Baris (Checkbox & Range)** | Multi-select baris untuk aksi massal                         |     🟢 _Selesai (rowMarkers="checkbox")_      |
| **Inline Editing**                   | Koreksi STMA, Revisi, Ket Catat langsung di sel              |        🟢 _Selesai (onSimpanKoreksi)_         |
| **Urutan & Lebar Kolom**             | Drag & drop kolom dan simpan preferensi                      |         🟢 _Selesai (onColumnResize)_         |
| **Dual-Engine Switcher**             | Beralih antara DOM Klasik & Canvas 60 FPS                    | 🟢 _Selesai (PanelTabel & PanelTabelMandiri)_ |

---

## 🗺️ Tahapan Kerja (Roadmap Milestones)

### 📌 Sesi 1: Fondasi & Pembacaan Data Kanvas

- [x] Instalasi `@glideapps/glide-data-grid` & `@types/lodash`.
- [x] Buat file baru: `apps/web/src/components/tanstacktable/components/canvas/CanvasTabelVerifikasi.tsx`.
- [x] Buat tema warna canvas yang selaras dengan variabel tema sistem (Dark & Light mode).
- [x] Definisikan kolom-kolom grid Glide (`GridColumn[]`) mencerminkan `definisi-kolom.ts`.
- [x] Implementasikan data provider `getCellContent([col, row])` untuk data teks & angka dasar.

### 📌 Sesi 2: Custom PDAM Cell Renderers (Visual & Ikon)

- [x] Render sel Stand Akhir (STMA): angka terformat + penanda visual segitiga Meter Baru (MB).
- [x] Render sel Status Ring Verifikasi: indikator warna tahap V1 (biru), V2 (oranye), V3 (hijau), Mandiri (cyan).
- [x] Render sel Anomali: visual penanda deviasi kubikasi melebihi ambang batas.
- [x] Format sel numerik (STML, STMA, Pakai m³, Pakai Lalu) rata kanan dengan font monospaced.

### 📌 Sesi 3: Interaktivitas, Klik Baris, & Menu Konteks

- [x] Hubungkan `onCellClicked` agar klik baris langsung memicu `onKlikBaris(row)` (sinkron dengan panel foto & info kiri).
- [x] Implementasikan penanganan klik kanan (`onCellContextMenu`) untuk memicu menu aksi yang sudah ada (`MenuKonteks`).
- [x] Dukungan seleksi baris untuk Aksi Massal (Verifikasi Massal).

### 📌 Sesi 4: Inline Edit & Integrasi Dual-Engine di UI

- [x] Implementasikan callback editing sel yang memanggil `onSimpanKoreksi`.
- [x] Tambahkan sakelar (_Toggle Engine_) pada `PanelTabel.tsx` dan `PanelTabelMandiri.tsx`:
  - Otomatis: jika pageSize $\ge 1.000$, sistem mengaktifkan Canvas secara otomatis untuk mencegah lag.
  - Manual: tombol `Canvas 60FPS` vs `DOM Grid` tersedia di toolbar.
- [x] Verifikasi typecheck lulus 100% tanpa error (`bun --cwd apps/web typecheck`).

---

## 📈 Status Saat Ini

- **Status**: **Selesai Diimplementasikan (Siap Diuji)**
- **File Baru Utama**:
  - [CanvasTabelVerifikasi.tsx](file:///E:/Coding/elysia/apps/web/src/components/tanstacktable/components/canvas/CanvasTabelVerifikasi.tsx)
- **Komponen yang Ditingkatkan (Dual-Engine)**:
  - [PanelTabel.tsx](file:///E:/Coding/elysia/apps/web/src/components/tanstacktable/components/panel/PanelTabel.tsx) (Verifikasi Petugas)
  - [PanelTabelMandiri.tsx](file:///E:/Coding/elysia/apps/web/src/components/tanstacktable/components/panel/PanelTabelMandiri.tsx) (Verifikasi Mandiri)
