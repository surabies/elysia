import { db, conn } from '../client';
import {
  user,
  userRoles,
  masterKondisiCatat,
  areaLayanan,
  places,
  sumberAir,
  pipaJaringan,
  pelanggan,
  waterMeter,
  caterBacaMeter,
  rekeningDrd,
  periodePenagihan,
  broadcast,
  pengaturanKonten,
  kpiPerspektif,
  kpiObjektif,
  kpiIndikator,
  kpiRealisasi,
  pengaduan,
} from '../schema';
import { count } from 'drizzle-orm';

interface TableCheck {
  table: string;
  query: () => Promise<number>;
  expectedMinimum: number;
  expectedIdeal: string;
  category: string;
}

export async function verifyDatabaseState() {
  console.log('\n================================================================');
  console.log('       🔍 VERIFIKASI INTEGRITAS DATA BASIS DATA PDAM CATER       ');
  console.log('================================================================');

  const checks: TableCheck[] = [
    {
      table: 'user (Akun Pengguna)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(user);
        return Number(r?.c || 0);
      },
      expectedMinimum: 15,
      expectedIdeal: '15 Akun Resmi',
      category: 'Otentikasi & RBAC',
    },
    {
      table: 'user_roles (Role RBAC)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(userRoles);
        return Number(r?.c || 0);
      },
      expectedMinimum: 15,
      expectedIdeal: '19+ Role Pemetaan',
      category: 'Otentikasi & RBAC',
    },
    {
      table: 'master_kondisi_catat',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(masterKondisiCatat);
        return Number(r?.c || 0);
      },
      expectedMinimum: 22,
      expectedIdeal: '22-23 Kode STI',
      category: 'Master Data Cater',
    },
    {
      table: 'area_layanan (Kelurahan PW5)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(areaLayanan);
        return Number(r?.c || 0);
      },
      expectedMinimum: 21,
      expectedIdeal: '21 Kelurahan Lengkap',
      category: 'Geospasial & Wilayah',
    },
    {
      table: 'places (Landmark Penting)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(places);
        return Number(r?.c || 0);
      },
      expectedMinimum: 3,
      expectedIdeal: '4 Landmark Bandung',
      category: 'Geospasial & Wilayah',
    },
    {
      table: 'sumber_air (IPA & Booster Pump)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(sumberAir);
        return Number(r?.c || 0);
      },
      expectedMinimum: 8,
      expectedIdeal: '8 Sumber/Pompa',
      category: 'Jaringan Distribusi',
    },
    {
      table: 'pipa_jaringan (Segmen GIS Pipa)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(pipaJaringan);
        return Number(r?.c || 0);
      },
      expectedMinimum: 500,
      expectedIdeal: '12.100 Segmen',
      category: 'Jaringan Distribusi',
    },
    {
      table: 'pelanggan (Sambungan Aktif)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(pelanggan);
        return Number(r?.c || 0);
      },
      expectedMinimum: 500,
      expectedIdeal: '22.549 Pelanggan',
      category: 'Pelanggan & Aset',
    },
    {
      table: 'water_meter (Aset Fisik Meter)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(waterMeter);
        return Number(r?.c || 0);
      },
      expectedMinimum: 500,
      expectedIdeal: '22.078 Unit Unik',
      category: 'Pelanggan & Aset',
    },
    {
      table: 'cater_baca_meter (Transaksi Cater)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(caterBacaMeter);
        return Number(r?.c || 0);
      },
      expectedMinimum: 500,
      expectedIdeal: '22.549 Rekod',
      category: 'Transaksi Catat Meter',
    },
    {
      table: 'rekening_drd (Tagihan Rekening)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(rekeningDrd);
        return Number(r?.c || 0);
      },
      expectedMinimum: 500,
      expectedIdeal: '22.549 Tagihan',
      category: 'Billing & DRD',
    },
    {
      table: 'periode_penagihan',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(periodePenagihan);
        return Number(r?.c || 0);
      },
      expectedMinimum: 1,
      expectedIdeal: '2 Periode (202601)',
      category: 'Billing & DRD',
    },
    {
      table: 'broadcast (Siaran & Banner)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(broadcast);
        return Number(r?.c || 0);
      },
      expectedMinimum: 3,
      expectedIdeal: '4 Siaran',
      category: 'Portal & Konten',
    },
    {
      table: 'pengaturan_konten (Config)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(pengaturanKonten);
        return Number(r?.c || 0);
      },
      expectedMinimum: 3,
      expectedIdeal: '4 Konfigurasi',
      category: 'Portal & Konten',
    },
    {
      table: 'kpi_indikator (KPI Balanced)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(kpiIndikator);
        return Number(r?.c || 0);
      },
      expectedMinimum: 10,
      expectedIdeal: '11 Indikator',
      category: 'Executive Dashboard',
    },
    {
      table: 'pengaduan (Workflow Tiket)',
      query: async () => {
        const [r] = await db.select({ c: count() }).from(pengaduan);
        return Number(r?.c || 0);
      },
      expectedMinimum: 5,
      expectedIdeal: '5-10 Tiket Nyata',
      category: 'Pengaduan Pelanggan',
    },
  ];

  console.log('| Tabel Basis Data                | Aktual   | Target Ideal    | Status');
  console.log('|---------------------------------|----------|-----------------|---------');

  let allHealthy = true;
  for (const c of checks) {
    try {
      const countVal = await c.query();
      const isHealthy = countVal >= c.expectedMinimum;
      if (!isHealthy) allHealthy = false;

      const countStr = countVal.toLocaleString().padEnd(8);
      const idealStr = c.expectedIdeal.padEnd(15);
      const tableStr = c.table.padEnd(31);
      const statusStr = isHealthy ? '✅ BAIK' : countVal === 0 ? '❌ KOSONG' : '⚠️ KURANG';

      console.log(`| ${tableStr} | ${countStr} | ${idealStr} | ${statusStr}`);
    } catch (err: any) {
      allHealthy = false;
      const tableStr = c.table.padEnd(31);
      console.log(`| ${tableStr} | ERROR    | -               | ❌ GAGAL (${err.message?.slice(0, 15)})`);
    }
  }

  console.log('----------------------------------------------------------------');
  if (allHealthy) {
    console.log('🎉 SELURUH TABEL DATABASE BERADA DALAM KONDISI LENGKAP & SIAP PAKAI!\n');
  } else {
    console.log('⚠️ Terdapat tabel yang masih kosong atau belum memenuhi target data awal.');
    console.log('   Jalankan: bun run db:seed\n');
  }

  return allHealthy;
}

if (import.meta.main) {
  verifyDatabaseState()
    .then((healthy) => {
      process.exit(healthy ? 0 : 1);
    })
    .catch((err) => {
      console.error('Verification error:', err);
      process.exit(1);
    });
}
