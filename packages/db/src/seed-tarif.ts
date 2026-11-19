import { db } from './client';
import { golonganTarif, tarifBlok, biayaTetap } from './schema/tarif';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Master Data Tarif Resmi Tirtawening
 * 13 Golongan Tarif Lengkap dengan 4 Tingkat Blok Konsumsi Progresif
 */
export const TARIF_RESMI_TIRTAWENING = [
  {
    kode: '1A',
    nama: 'SOS.UMUM / CORSEN, R.IBADAH',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 1050 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 1250 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 1500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 1800 },
    ],
  },
  {
    kode: '1B',
    nama: 'SOSIAL KHUSUS',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 1250 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 1550 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 1950 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 2450 },
    ],
  },
  {
    kode: '2A1',
    nama: 'RMH.TANGGA GOL.A1 (Sederhana)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 2800 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 3500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 4500 },
    ],
  },
  {
    kode: '2A2',
    nama: 'RMH.TANGGA GOL.A2 (Menengah)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2800 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 3600 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 4800 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 6200 },
    ],
  },
  {
    kode: '2A3',
    nama: 'RMH.TANGGA GOL.A3 (Menengah Atas)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 3500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 4500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 6000 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 7800 },
    ],
  },
  {
    kode: '2A4',
    nama: 'RMH.TANGGA GOL.A4 (Mewah)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 4200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 5500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 7200 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 9500 },
    ],
  },
  {
    kode: '2A5',
    nama: 'RMH.TANGGA GOL.A5 (Sangat Mewah)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 5000 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 6800 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 9000 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 12000 },
    ],
  },
  {
    kode: '2B',
    nama: 'INSTANSI PEMERINTAH',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 5500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 7000 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 9200 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 12500 },
    ],
  },
  {
    kode: '3A',
    nama: 'NIAGA KECIL / UMKM',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 7200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 8500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 10500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 13000 },
    ],
  },
  {
    kode: '3B',
    nama: 'NIAGA MENENGAH / BESAR',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 10500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 13000 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 15500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 18000 },
    ],
  },
  {
    kode: '3C',
    nama: 'NIAGA KHUSUS',
    beaBeban: 43000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 12000 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 15000 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 18000 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 22000 },
    ],
  },
  {
    kode: '4A',
    nama: 'INDUSTRI KECIL',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 11000 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 13500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 16500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 20000 },
    ],
  },
  {
    kode: '4B',
    nama: 'IND. MNGH / BESAR / PERK.',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 13500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 16500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 20000 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 25000 },
    ],
  },
];

export async function seedMasterTarif() {
  console.log('=== SEEDING MASTER GOLONGAN & BLOK TARIF RESMI ===');
  const berlakuMulai = new Date('2024-01-01T00:00:00Z');

  for (const item of TARIF_RESMI_TIRTAWENING) {
    // 1. Upsert Golongan Tarif
    await db
      .insert(golonganTarif)
      .values({
        kode: item.kode,
        nama: item.nama,
        beaBeban: String(item.beaBeban),
        beaAdmin: String(item.beaAdmin),
        airKotor: String(item.airKotor),
        lainLain: String(item.lainLain),
      })
      .onConflictDoUpdate({
        target: golonganTarif.kode,
        set: {
          nama: item.nama,
          beaBeban: String(item.beaBeban),
          beaAdmin: String(item.beaAdmin),
          airKotor: String(item.airKotor),
          lainLain: String(item.lainLain),
        },
      });

    // 2. Insert Blok Tarif Konsumsi Progresif
    for (const b of item.blok) {
      await db
        .insert(tarifBlok)
        .values({
          id: `blok-${item.kode}-${b.blok}`,
          tarifKode: item.kode,
          blok: b.blok,
          batasAwalM3: b.batasAwalM3,
          batasAkhirM3: b.batasAkhirM3,
          hargaPerM3: String(b.hargaPerM3),
          berlakuMulai,
          catatan: 'Tarif Resmi Perumda Tirtawening Kota Bandung',
        })
        .onConflictDoUpdate({
          target: [tarifBlok.tarifKode, tarifBlok.blok, tarifBlok.berlakuMulai],
          set: {
            batasAwalM3: b.batasAwalM3,
            batasAkhirM3: b.batasAkhirM3,
            hargaPerM3: String(b.hargaPerM3),
          },
        });
    }
  }

  console.log(`✓ Berhasil seeding 13 Golongan Tarif & 52 Blok Tarif Progresif.`);
}

if (import.meta.main) {
  seedMasterTarif()
    .then(() => {
      console.log('Selesai!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding tarif:', err);
      process.exit(1);
    });
}
