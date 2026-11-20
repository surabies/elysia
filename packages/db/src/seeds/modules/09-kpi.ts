import { db } from '../../client';
import {
  kpiPerspektif,
  kpiObjektif,
  kpiIndikator,
  kpiRealisasi,
} from '../../schema/kpi';
import type { SeedModule, SeedOptions } from '../types';

export const PROJECT_KPI_OWNERS = {
  pencatat: {
    id: 'user-pencatat-dadang',
    name: 'Dadang (Pencatat Lapangan)',
    initials: 'PL',
  },
  admin: {
    id: 'user-staff-billing',
    name: 'Staff Admin Billing',
    initials: 'AB',
  },
  supervisor: {
    id: 'user-verifikator-1',
    name: 'Supervisor Verifikator 1',
    initials: 'V1',
  },
  manager: {
    id: 'user-verifikator-2',
    name: 'Manager Verifikator 2',
    initials: 'V2',
  },
  senior_manager: {
    id: 'user-verifikator-3',
    name: 'Senior Manager Verifikator 3',
    initials: 'V3',
  },
};

export const KPI_PERSPEKTIF_LIST = [
  {
    id: 'cater-lapangan',
    nama: 'Pencatatan Meter Lapangan (Petugas Pencatat)',
    bobotSkor: 35,
    deskripsi: 'Keberhasilan pembacaan rute fisik, kepatuhan radius GPS persil, dan produktivitas harian petugas pencatat.',
    urutan: 1,
  },
  {
    id: 'verifikasi-anomali',
    nama: 'Verifikasi & Screening Anomali (Supervisor & Manager)',
    bobotSkor: 30,
    deskripsi: 'Kecepatan validasi anomali V1 (SPV), investigasi fisik cek ulang (re-survey), dan approval V2 (Manager).',
    urutan: 2,
  },
  {
    id: 'closing-drd',
    nama: 'Closing & Penagihan DRD (Admin & Senior Manager)',
    bobotSkor: 20,
    deskripsi: 'Kesiapan kunci billing (locked billing), ketepatan waktu terbit DRD, dan pengesahan V3 Senior Manager.',
    urutan: 3,
  },
  {
    id: 'mandiri-distribusi',
    nama: 'Integrasi Mandiri & Pengawasan Distribusi (NRW)',
    bobotSkor: 15,
    deskripsi: 'Penyelesaian kasus rumah terkunci (DK) via lapor mandiri dan temuan meter rusak/macet untuk tindak lanjut GWM.',
    urutan: 4,
  },
];

export const KPI_OBJEKTIF_LIST = [
  {
    id: 'obj-keterbacaan-cater',
    perspektifId: 'cater-lapangan',
    nama: 'Optimalisasi Keterbacaan Rute & Disiplin Lokasi GPS',
    urutan: 1,
  },
  {
    id: 'obj-validasi-berjenjang',
    perspektifId: 'verifikasi-anomali',
    nama: 'Siklus Verifikasi Anomali Harian V1 & V2',
    urutan: 1,
  },
  {
    id: 'obj-penutupan-rekening',
    perspektifId: 'closing-drd',
    nama: 'Kesiapan Closing Periode & Rekapitulasi DRD',
    urutan: 1,
  },
  {
    id: 'obj-mandiri-pengurangan-dk',
    perspektifId: 'mandiri-distribusi',
    nama: 'Resolusi Kendala Akses (DK) & Deteksi Meter Rusak',
    urutan: 1,
  },
];

export const KPI_INDIKATOR_LIST = [
  {
    id: 'kpi-read-rate-rute',
    objektifId: 'obj-keterbacaan-cater',
    nama: 'Tingkat Keterbacaan Rute Fisik (Read Rate)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.pencatat.id,
    pemilikNama: PROJECT_KPI_OWNERS.pencatat.name,
    pemilikInisial: PROJECT_KPI_OWNERS.pencatat.initials,
    bobot: 40,
    baseline: 91.0,
    target: 98.5,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 1,
    nilaiJan2026: 96.8,
    sparkline: [91.0, 92.5, 94.0, 95.2, 96.0, 96.8],
  },
  {
    id: 'kpi-kepatuhan-geofence',
    objektifId: 'obj-keterbacaan-cater',
    nama: 'Kepatuhan Koordinat GPS Pelanggan (< 15 Meter)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.pencatat.id,
    pemilikNama: PROJECT_KPI_OWNERS.pencatat.name,
    pemilikInisial: PROJECT_KPI_OWNERS.pencatat.initials,
    bobot: 35,
    baseline: 74.0,
    target: 95.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 2,
    nilaiJan2026: 89.5,
    sparkline: [75.0, 78.0, 81.5, 84.0, 87.0, 89.5],
  },
  {
    id: 'kpi-produktivitas-pencatat',
    objektifId: 'obj-keterbacaan-cater',
    nama: 'Rata-rata Pembacaan Persil / Petugas / Hari',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.pencatat.id,
    pemilikNama: PROJECT_KPI_OWNERS.pencatat.name,
    pemilikInisial: PROJECT_KPI_OWNERS.pencatat.initials,
    bobot: 25,
    baseline: 150,
    target: 220,
    format: 'decimal',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 3,
    nilaiJan2026: 198,
    sparkline: [155, 168, 175, 184, 192, 198],
  },
  {
    id: 'kpi-sla-verifikasi-v1',
    objektifId: 'obj-validasi-berjenjang',
    nama: 'Kecepatan Verifikasi Harian V1 Supervisor (< 24 Jam)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.supervisor.id,
    pemilikNama: PROJECT_KPI_OWNERS.supervisor.name,
    pemilikInisial: PROJECT_KPI_OWNERS.supervisor.initials,
    bobot: 40,
    baseline: 80.0,
    target: 96.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 1,
    nilaiJan2026: 92.0,
    sparkline: [82.0, 85.0, 87.5, 89.0, 90.5, 92.0],
  },
  {
    id: 'kpi-resolusi-resurvey',
    objektifId: 'obj-validasi-berjenjang',
    nama: 'Penyelesaian Cek Fisik Lapangan Ulang (Re-Survey)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.supervisor.id,
    pemilikNama: PROJECT_KPI_OWNERS.supervisor.name,
    pemilikInisial: PROJECT_KPI_OWNERS.supervisor.initials,
    bobot: 30,
    baseline: 68.0,
    target: 92.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 2,
    nilaiJan2026: 84.5,
    sparkline: [70.0, 73.0, 76.5, 79.0, 82.0, 84.5],
  },
  {
    id: 'kpi-approval-v2-manager',
    objektifId: 'obj-validasi-berjenjang',
    nama: 'Ketepatan Waktu Approval V2 Tingkat Wilayah (Manager)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.manager.id,
    pemilikNama: PROJECT_KPI_OWNERS.manager.name,
    pemilikInisial: PROJECT_KPI_OWNERS.manager.initials,
    bobot: 30,
    baseline: 85.0,
    target: 98.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 3,
    nilaiJan2026: 95.0,
    sparkline: [86.0, 88.5, 90.0, 92.0, 93.5, 95.0],
  },
  {
    id: 'kpi-locked-billing-readiness',
    objektifId: 'obj-penutupan-rekening',
    nama: 'Kesiapan Kunci Billing Pasca-Verifikasi (Locked Billing)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.admin.id,
    pemilikNama: PROJECT_KPI_OWNERS.admin.name,
    pemilikInisial: PROJECT_KPI_OWNERS.admin.initials,
    bobot: 35,
    baseline: 88.0,
    target: 100.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 1,
    nilaiJan2026: 97.4,
    sparkline: [90.0, 92.0, 93.5, 95.0, 96.2, 97.4],
  },
  {
    id: 'kpi-closing-tepat-waktu',
    objektifId: 'obj-penutupan-rekening',
    nama: 'Eksekusi Closing Periode Bulanan Tepat Waktu',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.admin.id,
    pemilikNama: PROJECT_KPI_OWNERS.admin.name,
    pemilikInisial: PROJECT_KPI_OWNERS.admin.initials,
    bobot: 30,
    baseline: 90.0,
    target: 100.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_baca_meter',
    urutan: 2,
    nilaiJan2026: 98.0,
    sparkline: [91.0, 93.0, 94.5, 96.0, 97.0, 98.0],
  },
  {
    id: 'kpi-collection-ratio-drd',
    objektifId: 'obj-penutupan-rekening',
    nama: 'Collection Ratio (CR) Rekening Air DRD Hasil Catat',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.senior_manager.id,
    pemilikNama: PROJECT_KPI_OWNERS.senior_manager.name,
    pemilikInisial: PROJECT_KPI_OWNERS.senior_manager.initials,
    bobot: 35,
    baseline: 84.0,
    target: 95.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'rekening_drd',
    urutan: 3,
    nilaiJan2026: 92.8,
    sparkline: [85.0, 87.0, 88.5, 90.0, 91.5, 92.8],
  },
  {
    id: 'kpi-konversi-dk-ke-mandiri',
    objektifId: 'obj-mandiri-pengurangan-dk',
    nama: 'Konversi Kasus Rumah Dikunci (DK) ke Lapor Mandiri',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.admin.id,
    pemilikNama: PROJECT_KPI_OWNERS.admin.name,
    pemilikInisial: PROJECT_KPI_OWNERS.admin.initials,
    bobot: 50,
    baseline: 32.0,
    target: 65.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'cater_mandiri',
    urutan: 1,
    nilaiJan2026: 54.0,
    sparkline: [35.0, 39.0, 43.0, 47.0, 50.5, 54.0],
  },
  {
    id: 'kpi-tindak-lanjut-meter-rusak',
    objektifId: 'obj-mandiri-pengurangan-dk',
    nama: 'Tindak Lanjut Temuan Meter Macet/Rusak (GWM)',
    arah: 'higher',
    pemilikId: PROJECT_KPI_OWNERS.manager.id,
    pemilikNama: PROJECT_KPI_OWNERS.manager.name,
    pemilikInisial: PROJECT_KPI_OWNERS.manager.initials,
    bobot: 50,
    baseline: 55.0,
    target: 90.0,
    format: 'percent',
    simbolMataUang: '',
    pengaliSatuan: 1,
    sumberData: 'water_meter_mutasi',
    urutan: 2,
    nilaiJan2026: 78.5,
    sparkline: [58.0, 62.0, 67.0, 71.5, 75.0, 78.5],
  },
];

export async function seedKpi() {
  // 1. Perspektif
  for (const p of KPI_PERSPEKTIF_LIST) {
    await db
      .insert(kpiPerspektif)
      .values(p)
      .onConflictDoUpdate({
        target: kpiPerspektif.id,
        set: {
          nama: p.nama,
          bobotSkor: p.bobotSkor,
          deskripsi: p.deskripsi,
          urutan: p.urutan,
          updatedAt: new Date(),
        },
      });
  }

  // 2. Objektif
  for (const obj of KPI_OBJEKTIF_LIST) {
    await db
      .insert(kpiObjektif)
      .values(obj)
      .onConflictDoUpdate({
        target: kpiObjektif.id,
        set: {
          nama: obj.nama,
          urutan: obj.urutan,
          updatedAt: new Date(),
        },
      });
  }

  // 3. Indikator & Realisasi
  for (const ind of KPI_INDIKATOR_LIST) {
    const { nilaiJan2026, sparkline, ...indValues } = ind;
    await db
      .insert(kpiIndikator)
      .values(indValues)
      .onConflictDoUpdate({
        target: kpiIndikator.id,
        set: {
          nama: ind.nama,
          arah: ind.arah,
          pemilikId: ind.pemilikId,
          pemilikNama: ind.pemilikNama,
          pemilikInisial: ind.pemilikInisial,
          bobot: ind.bobot,
          baseline: ind.baseline,
          target: ind.target,
          format: ind.format,
          urutan: ind.urutan,
          updatedAt: new Date(),
        },
      });

    // Seed Realisasi Periode
    await db
      .insert(kpiRealisasi)
      .values({
        id: `${ind.id}_202611`,
        indikatorId: ind.id,
        periode: '202611',
        nilaiAktual: nilaiJan2026,
        sparkline: JSON.stringify(sparkline),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: kpiRealisasi.id,
        set: {
          nilaiAktual: nilaiJan2026,
          sparkline: JSON.stringify(sparkline),
          updatedAt: new Date(),
        },
      });
  }

  return {
    count: KPI_INDIKATOR_LIST.length,
    message: `Seeded ${KPI_PERSPEKTIF_LIST.length} perspektif BSC, ${KPI_OBJEKTIF_LIST.length} objektif, ${KPI_INDIKATOR_LIST.length} indikator & realisasi tren KPI.`,
  };
}

export const kpiModule: SeedModule = {
  id: 'kpi',
  name: 'Balanced Scorecard KPI (Cater & Billing)',
  description: '4 Perspektif BSC, 4 Sasaran Strategis, 11 Indikator Operasional & Realisasi Tren',
  run: async (_options: SeedOptions) => {
    return await seedKpi();
  },
};
