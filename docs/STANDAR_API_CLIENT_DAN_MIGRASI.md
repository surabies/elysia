# Standar Arsitektur API Client (api.ts) & Log Migrasi Modul

Dokumen ini mencatat keputusan arsitektur, standar pola penulisan `api.ts`, modul yang telah selesai dimigrasi, serta modul yang tersisa untuk migrasi berikutnya.

---

## 1. Latar Belakang & Keputusan Arsitektur

### Masalah Pola Lama (Raw `fetch` di dalam Komponen)
Sebelum standarisasi, komponen-komponen UI memanggil endpoint backend secara langsung (`fetch('/api/...')`). Hal ini menimbulkan kendala:
1. **Fat Components**: File komponen membengkak ratusan hingga ribuan baris karena logika HTTP, perakitan query param, parsing JSON, dan error handling bercampur dengan logika rendering UI.
2. **Duplikasi Kode**: Blok `fetch`, `res.ok`, `res.json()`, dan `try-catch` diulang di puluhan komponen.
3. **Hardcoded String URL**: Rawan typo dan sangat rentan patah saat ada perubahan rute backend.
4. **Sulit Di-test & Tidak Reusable**: Panggilan API tidak bisa digunakan ulang di komponen lain tanpa menyalin kode.

### Solusi: Lapisan Klien API Fitur (`api.ts`)
Setiap folder fitur di `features/dashboard/<fitur>/` memiliki satu berkas `api.ts` yang bertindak sebagai **Single Source of Truth** untuk pemanggilan HTTP ke backend. Komponen UI hanya memanggil fungsi async yang mengembalikan data bertipe (*strongly-typed*).

```
apps/web/src/features/dashboard/<fitur>/
├── api.ts              # Lapisan klien HTTP terpusat (objek API)
├── types.ts            # Definisi kontrak DTO & interface
├── index.ts            # Re-export API, types, dan view components
└── components/         # Komponen UI murni (bebas dari string URL fetch)
```

---

## 2. Status Migrasi Modul Dashboard

### ✅ Modul yang Telah Selesai Dimigrasi (Fase 1)

| No | Modul Fitur | Lokasi `api.ts` | Objek Klien | Komponen yang Telah Diselaraskan |
|---|---|---|---|---|
| 1 | **Rute Baca & Mutasi** | `features/dashboard/rute/api.ts` | `ruteApi` | `MutasiRuteView.tsx`, `PenggabunganRuteView.tsx`, `PindahRuteDialog.tsx` |
| 2 | **Master Data** | `features/dashboard/master/api.ts` | `masterApi` | `PemetaanPetugasRute.tsx`, `KelolaPetugas.tsx`, `KelolaUrutanRute.tsx`, `KelolaKodeKelainan.tsx`, `KelolaManajemenUser.tsx`, `MatriksHakAkses.tsx` |
| 3 | **Pelanggan & Manual ADD** | `features/dashboard/pelanggan/api.ts` | `manualAddApi` | `ManualAddPage.tsx`, `ManualAddSatuanForm.tsx`, `ManualAddMasalTaksasi.tsx`, `ManualAddRiwayatTable.tsx` |
| 4 | **Capaian Pencatatan** | `features/dashboard/cater/capaian/api.ts` | `capaianApi` | `CapaianPencatatanView.tsx` |
| 5 | **KPI Scorecard** | `features/dashboard/kpi/api.ts` | `kpiApi` | `KpiScorecardView.tsx` |

---

### 📋 Modul yang Masih Menggunakan Raw `fetch` (Roadmap Migrasi Fase 2)

Daftar modul yang perlu dimigrasikan ke pola `api.ts` pada tahap berikutnya:

1. **Pengaturan Sistem & Profil (`features/dashboard/pengaturan/`)**
   * `PengaturanAkunView.tsx`
   * `PengaturanAturanAnomaliView.tsx`
   * `PengaturanBillingView.tsx`
   * `PengaturanCaterView.tsx`
   * `PengaturanPengaduanView.tsx`
   * `PengaturanSistemView.tsx`
   * `PengaturanVerifikasiView.tsx`
   * `TabVerifikasiStand.tsx`
2. **Progres & Monitoring Lapangan (`features/dashboard/progres/`)**
   * `AuditAnomaliView.tsx`
   * `MonitoringAnomaliKubikasi.tsx`
   * `MonitoringKoreksiStand.tsx`
   * `MonitoringProgresLapangan.tsx`
   * `MonitoringProgresWilayah.tsx`
3. **Laporan & Evaluasi (`features/dashboard/laporan/`)**
   * `LaporanEvaluasiPetugas.tsx`
   * `LaporanKelainanMeter.tsx`
   * `LaporanMonitoringKoreksi.tsx`
   * `LaporanStandAwalAkhir.tsx`
4. **Setting Landing Page CMS (`features/dashboard/setting-landing/`)**
   * `BeritaPengumumanView.tsx`
   * `CaraBayarView.tsx`
   * `CmsLayananView.tsx`
   * `PasangBaruView.tsx`
   * `ProfilKontakView.tsx`
   * `TarifAirView.tsx`
5. **Meter & GIS (`features/dashboard/meter/`, `features/dashboard/gis/`, `features/dashboard/gwm/`)**
   * `MonitoringCekFoto.tsx`
   * `PetaMonitoringSpasial.tsx`
   * `GantiMeterPage.tsx`
6. **Broadcast Gangguan (`app/(dashboard)/broadcast/`)**
   * `BroadcastFormPage.tsx`
   * `CloudinaryImageUploader.tsx`

---

## 3. Penjelasan Khusus: `verifikasi-legacy.router.ts` vs `ApiDashboard.ts`

### A. `apps/web/src/server/modules/verifikasi-legacy.router.ts` (Backend)
* **Peran**: Router backend ElysiaJS yang menangani seluruh API dengan prefix `/api/v1/*` untuk alur verifikasi baca meter dan laporan harian.
* **Mengapa disebut "Legacy"?**: Router ini mengadopsi spesifikasi API v1 dari sistem sebelumnya agar kompatibel dengan modul grid verifikasi tanpa harus merombak kontrak data tabel.
* **Fitur Utama yang Ditangani**:
  1. `/api/v1/laporan-harian`: Endpoint data grid tak hingga (*infinite scroll / pagination*) untuk hasil pembacaan meter petugas lapangan, filter anomali, status verifikasi (Ring 1, 2, 3), dan pencarian pelanggan.
  2. `/api/v1/laporan-mandiri`: Endpoint data grid untuk pembacaan mandiri oleh konsumen via aplikasi mobile/web publik beserta foto meter dan verifikasi geofencing GPS.
  3. Aksi Verifikasi: Persetujuan (*approve*), penolakan (*reject*), permintaan cek ulang ke lapangan, koreksi angka stand meter, dan pembacaan taksasi darurat.
  4. Guard Keamanan: Dilindungi oleh `authPlugin` dan macro guard `requireRole` (`STAFF_ADMIN_BILLING`, `VERIFIKATOR_1`, `VERIFIKATOR_2`, `VERIFIKATOR_3`, `EXECUTIVE`, `SUPERADMIN`).

### B. `apps/web/src/features/dashboard/api/ApiDashboard.ts` (Frontend)
* **Peran**: Helper HTTP Client tingkat rendah (*low-level fetcher*) untuk modul grid interaktif (TanStack Table & Data Grid).
* **Isi & Fungsi**: Berkas ini adalah *barrel export* yang mengekspor helper dari `features/dashboard/shared/api/api-dashboard.ts`:
  1. `ApiError`: Kelas kustom turunan `Error` yang menyimpan status HTTP (`status`) dan kode error backend (`code`).
  2. `ambilList<T>(path, params)`: Helper pembungkus `fetch('/api/v1' + path)` untuk permintaan data berbentuk daftar atau tabel (otomatis membuang parameter null/kosong dan memetakan metadata total baris).
  3. `ambilSatu<T>(path, params)`: Helper pembungkus `fetch` untuk mengambil satu objek tunggal (detail tiket atau ringkasan statistik).
  4. `kirimJson<T>(path, method, body)`: Helper mutasi JSON (`POST`, `PUT`, `PATCH`, `DELETE`).
  5. `kirimForm<T>(path, form)`: Helper unggah berkas multipart `FormData` (misalnya upload foto pengaduan atau foto bukti meter).

### Hubungan Keduanya
Keduanya merupakan pasangan langsung (*client-server pair*):
```
[Browser / TanStack Table / DataGrid]
                 │
                 ▼
[ApiDashboard.ts (ambilList / ambilSatu / kirimJson)]
                 │
                 ▼ HTTP GET/POST ke /api/v1/...
[verifikasi-legacy.router.ts (Elysia Backend Router)]
                 │
                 ▼
[verifikasiGridService & PostgreSQL Database]
```
