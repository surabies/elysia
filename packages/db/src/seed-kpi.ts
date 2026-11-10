import { db } from "./index"
import { sql } from "drizzle-orm"
import {
  kpiPerspektif,
  kpiObjektif,
  kpiIndikator,
  kpiRealisasi,
} from "./schema/kpi"

export const PROJECT_KPI_OWNERS = {
  pencatat: {
    id: "user-pencatat-dadang",
    name: "Dadang (Pencatat Lapangan)",
    initials: "PL",
  },
  admin: {
    id: "user-staff-billing",
    name: "Staff Admin Billing",
    initials: "AB",
  },
  supervisor: {
    id: "user-verifikator-1",
    name: "Supervisor Verifikator 1",
    initials: "V1",
  },
  manager: {
    id: "user-verifikator-2",
    name: "Manager Verifikator 2",
    initials: "V2",
  },
  senior_manager: {
    id: "user-verifikator-3",
    name: "Senior Manager Verifikator 3",
    initials: "V3",
  },
}

export async function initAndSeedKpi() {
  console.log("⚙️  Memperbarui skema dan data KPI sesuai struktur nyata aplikasi Baca Meter (Cater)...")

  // 1. Buat tabel bila belum ada (DDL)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS kpi_perspektif (
      id VARCHAR(50) PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      bobot_skor INTEGER NOT NULL DEFAULT 25,
      deskripsi TEXT,
      urutan INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kpi_objektif (
      id VARCHAR(100) PRIMARY KEY,
      perspektif_id VARCHAR(50) NOT NULL REFERENCES kpi_perspektif(id) ON DELETE CASCADE,
      nama VARCHAR(150) NOT NULL,
      urutan INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kpi_indikator (
      id VARCHAR(100) PRIMARY KEY,
      objektif_id VARCHAR(100) NOT NULL REFERENCES kpi_objektif(id) ON DELETE CASCADE,
      nama VARCHAR(200) NOT NULL,
      arah VARCHAR(10) NOT NULL DEFAULT 'higher',
      pemilik_id VARCHAR(50) NOT NULL,
      pemilik_nama VARCHAR(100) NOT NULL,
      pemilik_inisial VARCHAR(10) NOT NULL,
      bobot INTEGER NOT NULL DEFAULT 10,
      baseline DOUBLE PRECISION NOT NULL DEFAULT 0,
      target DOUBLE PRECISION NOT NULL DEFAULT 0,
      format VARCHAR(20) NOT NULL DEFAULT 'percent',
      simbol_mata_uang VARCHAR(10) DEFAULT 'Rp',
      pengali_satuan DOUBLE PRECISION DEFAULT 1,
      sumber_data VARCHAR(50) DEFAULT 'manual',
      urutan INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kpi_realisasi (
      id VARCHAR(120) PRIMARY KEY,
      indikator_id VARCHAR(100) NOT NULL REFERENCES kpi_indikator(id) ON DELETE CASCADE,
      periode VARCHAR(30) NOT NULL,
      nilai_aktual DOUBLE PRECISION,
      sparkline TEXT,
      catatan TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS kpi_realisasi_indikator_periode_idx 
    ON kpi_realisasi(indikator_id, periode);
  `)

  // Hapus data dummy lama agar sinkron bersih dengan struktur nyata
  await db.execute(sql`
    TRUNCATE TABLE kpi_realisasi, kpi_indikator, kpi_objektif, kpi_perspektif CASCADE;
  `)

  // 1. Empat Perspektif Nyata Aplikasi Baca Meter (M2C)
  const perspektifList = [
    {
      id: "cater-lapangan",
      nama: "Pencatatan Meter Lapangan (Petugas Pencatat)",
      bobotSkor: 35,
      deskripsi: "Keberhasilan pembacaan rute fisik, kepatuhan radius GPS persil, dan produktivitas harian petugas pencatat.",
      urutan: 1,
    },
    {
      id: "verifikasi-anomali",
      nama: "Verifikasi & Screening Anomali (Supervisor & Manager)",
      bobotSkor: 30,
      deskripsi: "Kecepatan validasi anomali V1 (SPV), investigasi fisik cek ulang (re-survey), dan approval V2 (Manager).",
      urutan: 2,
    },
    {
      id: "closing-drd",
      nama: "Closing & Penagihan DRD (Admin & Senior Manager)",
      bobotSkor: 20,
      deskripsi: "Kesiapan kunci billing (locked billing), ketepatan waktu terbit DRD, dan pengesahan V3 Senior Manager.",
      urutan: 3,
    },
    {
      id: "mandiri-distribusi",
      nama: "Integrasi Mandiri & Pengawasan Distribusi (NRW)",
      bobotSkor: 15,
      deskripsi: "Penyelesaian kasus rumah terkunci (DK) via lapor mandiri dan temuan meter rusak/macet untuk tindak lanjut GWM.",
      urutan: 4,
    },
  ]

  for (const p of perspektifList) {
    await db.insert(kpiPerspektif).values(p)
  }

  // 2. Sasaran Strategis (Objektif) Nyata
  const objektifList = [
    {
      id: "obj-keterbacaan-cater",
      perspektifId: "cater-lapangan",
      nama: "Optimalisasi Keterbacaan Rute & Disiplin Lokasi GPS",
      urutan: 1,
    },
    {
      id: "obj-validasi-berjenjang",
      perspektifId: "verifikasi-anomali",
      nama: "Siklus Verifikasi Anomali Harian V1 & V2",
      urutan: 1,
    },
    {
      id: "obj-penutupan-rekening",
      perspektifId: "closing-drd",
      nama: "Kesiapan Closing Periode & Rekapitulasi DRD",
      urutan: 1,
    },
    {
      id: "obj-mandiri-pengurangan-dk",
      perspektifId: "mandiri-distribusi",
      nama: "Resolusi Kendala Akses (DK) & Deteksi Meter Rusak",
      urutan: 1,
    },
  ]

  for (const obj of objektifList) {
    await db.insert(kpiObjektif).values(obj)
  }

  // 3. Indikator KPI Nyata Project (Pemilik: Pencatat, Admin, SPV, Manager, Senior Manager)
  const indikatorList = [
    // --- Perspektif 1: Pencatatan Lapangan ---
    {
      id: "kpi-read-rate-rute",
      objektifId: "obj-keterbacaan-cater",
      nama: "Tingkat Keterbacaan Rute Fisik (Read Rate)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.pencatat.id,
      pemilikNama: PROJECT_KPI_OWNERS.pencatat.name,
      pemilikInisial: PROJECT_KPI_OWNERS.pencatat.initials,
      bobot: 40,
      baseline: 91.0,
      target: 98.5,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 1,
      nilaiSep2026: 96.8,
      sparkline: [91.0, 92.5, 94.0, 95.2, 96.0, 96.8],
    },
    {
      id: "kpi-kepatuhan-geofence",
      objektifId: "obj-keterbacaan-cater",
      nama: "Kepatuhan Koordinat GPS Pelanggan (< 15 Meter)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.pencatat.id,
      pemilikNama: PROJECT_KPI_OWNERS.pencatat.name,
      pemilikInisial: PROJECT_KPI_OWNERS.pencatat.initials,
      bobot: 35,
      baseline: 74.0,
      target: 95.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 2,
      nilaiSep2026: 89.5,
      sparkline: [75.0, 78.0, 81.5, 84.0, 87.0, 89.5],
    },
    {
      id: "kpi-produktivitas-pencatat",
      objektifId: "obj-keterbacaan-cater",
      nama: "Rata-rata Pembacaan Persil / Petugas / Hari",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.pencatat.id,
      pemilikNama: PROJECT_KPI_OWNERS.pencatat.name,
      pemilikInisial: PROJECT_KPI_OWNERS.pencatat.initials,
      bobot: 25,
      baseline: 150,
      target: 220,
      format: "decimal",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 3,
      nilaiSep2026: 198,
      sparkline: [155, 168, 175, 184, 192, 198],
    },

    // --- Perspektif 2: Verifikasi & Kontrol Anomali ---
    {
      id: "kpi-sla-verifikasi-v1",
      objektifId: "obj-validasi-berjenjang",
      nama: "Kecepatan Verifikasi Harian V1 Supervisor (< 24 Jam)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.supervisor.id,
      pemilikNama: PROJECT_KPI_OWNERS.supervisor.name,
      pemilikInisial: PROJECT_KPI_OWNERS.supervisor.initials,
      bobot: 40,
      baseline: 80.0,
      target: 96.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 1,
      nilaiSep2026: 92.0,
      sparkline: [82.0, 85.0, 87.5, 89.0, 90.5, 92.0],
    },
    {
      id: "kpi-resolusi-resurvey",
      objektifId: "obj-validasi-berjenjang",
      nama: "Penyelesaian Cek Fisik Lapangan Ulang (Re-Survey)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.supervisor.id,
      pemilikNama: PROJECT_KPI_OWNERS.supervisor.name,
      pemilikInisial: PROJECT_KPI_OWNERS.supervisor.initials,
      bobot: 30,
      baseline: 68.0,
      target: 92.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 2,
      nilaiSep2026: 84.5,
      sparkline: [70.0, 73.0, 76.5, 79.0, 82.0, 84.5],
    },
    {
      id: "kpi-approval-v2-manager",
      objektifId: "obj-validasi-berjenjang",
      nama: "Ketepatan Waktu Approval V2 Tingkat Wilayah (Manager)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.manager.id,
      pemilikNama: PROJECT_KPI_OWNERS.manager.name,
      pemilikInisial: PROJECT_KPI_OWNERS.manager.initials,
      bobot: 30,
      baseline: 85.0,
      target: 98.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 3,
      nilaiSep2026: 95.0,
      sparkline: [86.0, 88.5, 90.0, 92.0, 93.5, 95.0],
    },

    // --- Perspektif 3: Closing & Penagihan DRD ---
    {
      id: "kpi-locked-billing-readiness",
      objektifId: "obj-penutupan-rekening",
      nama: "Kesiapan Kunci Billing Pasca-Verifikasi (Locked Billing)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.admin.id,
      pemilikNama: PROJECT_KPI_OWNERS.admin.name,
      pemilikInisial: PROJECT_KPI_OWNERS.admin.initials,
      bobot: 35,
      baseline: 88.0,
      target: 100.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 1,
      nilaiSep2026: 97.4,
      sparkline: [90.0, 92.0, 93.5, 95.0, 96.2, 97.4],
    },
    {
      id: "kpi-closing-tepat-waktu",
      objektifId: "obj-penutupan-rekening",
      nama: "Eksekusi Closing Periode Bulanan Tepat Waktu",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.admin.id,
      pemilikNama: PROJECT_KPI_OWNERS.admin.name,
      pemilikInisial: PROJECT_KPI_OWNERS.admin.initials,
      bobot: 30,
      baseline: 90.0,
      target: 100.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_baca_meter",
      urutan: 2,
      nilaiSep2026: 98.0,
      sparkline: [91.0, 93.0, 94.5, 96.0, 97.0, 98.0],
    },
    {
      id: "kpi-collection-ratio-drd",
      objektifId: "obj-penutupan-rekening",
      nama: "Collection Ratio (CR) Rekening Air DRD Hasil Catat",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.senior_manager.id,
      pemilikNama: PROJECT_KPI_OWNERS.senior_manager.name,
      pemilikInisial: PROJECT_KPI_OWNERS.senior_manager.initials,
      bobot: 35,
      baseline: 84.0,
      target: 95.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "rekening_drd",
      urutan: 3,
      nilaiSep2026: 92.8,
      sparkline: [85.0, 87.0, 88.5, 90.0, 91.5, 92.8],
    },

    // --- Perspektif 4: Integrasi Mandiri & Distribusi ---
    {
      id: "kpi-konversi-dk-ke-mandiri",
      objektifId: "obj-mandiri-pengurangan-dk",
      nama: "Konversi Kasus Rumah Dikunci (DK) ke Lapor Mandiri",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.admin.id,
      pemilikNama: PROJECT_KPI_OWNERS.admin.name,
      pemilikInisial: PROJECT_KPI_OWNERS.admin.initials,
      bobot: 50,
      baseline: 32.0,
      target: 65.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "cater_mandiri",
      urutan: 1,
      nilaiSep2026: 54.0,
      sparkline: [35.0, 39.0, 43.0, 47.0, 50.5, 54.0],
    },
    {
      id: "kpi-tindak-lanjut-meter-rusak",
      objektifId: "obj-mandiri-pengurangan-dk",
      nama: "Tindak Lanjut Temuan Meter Macet/Rusak (GWM)",
      arah: "higher",
      pemilikId: PROJECT_KPI_OWNERS.manager.id,
      pemilikNama: PROJECT_KPI_OWNERS.manager.name,
      pemilikInisial: PROJECT_KPI_OWNERS.manager.initials,
      bobot: 50,
      baseline: 55.0,
      target: 90.0,
      format: "percent",
      simbolMataUang: "",
      pengaliSatuan: 1,
      sumberData: "water_meter_mutasi",
      urutan: 2,
      nilaiSep2026: 78.5,
      sparkline: [58.0, 62.0, 67.0, 71.5, 75.0, 78.5],
    },
  ]

  for (const ind of indikatorList) {
    const { nilaiSep2026, sparkline, ...indValues } = ind
    await db.insert(kpiIndikator).values(indValues)

    // Seed Realisasi Sep 2026
    await db.insert(kpiRealisasi).values({
      id: `${ind.id}_Sep 2026`,
      indikatorId: ind.id,
      periode: "Sep 2026",
      nilaiAktual: nilaiSep2026,
      sparkline: JSON.stringify(sparkline),
    })
  }

  console.log("🎉 Data KPI berhasil disinkronkan dengan struktur nyata aplikasi Baca Meter (Cater)!")
}

if (import.meta.main) {
  initAndSeedKpi()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Gagal sinkronisasi KPI:", err)
      process.exit(1)
    })
}
