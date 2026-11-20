import { db } from './client';
import { golonganTarif, tarifBlok, biayaTetap } from './schema/tarif';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Master Data Golongan Tarif & Blok Konsumsi Progresif
 *
 * CATATAN PENTING:
 * Angka `hargaPerM3` pada 4 tingkat blok progresif di bawah ini diekstrak secara matematis
 * dari data produksi `ProgresCater-PW5.csv` (periode 202610, 22.523 dari 22.524 baris cocok 100%,
 * kecuali 1 pelanggan kesepakatan tarif khusus 00008001503).
 * Wajib dicocokkan dengan SK Tarif Direksi resmi apabila terdapat pembaruan tarif.
 */
export const MASTER_GOLONGAN_DAN_BLOK_TARIF = [
  {
    kode: '1A',
    nama: 'SOS.UMUM / CORSEN, R.IBADAH',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 900 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 900 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 900 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 1300 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 900 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 900 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 1400 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 2900 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 1000 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 1600 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 2300 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 5500 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2000 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 3600 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 5700 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 8800 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 3120 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 5520 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 8880 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 12840 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 3960 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 7200 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 11280 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 15120 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 4800 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 8880 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 13680 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 17400 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 3150 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 5700 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 9000 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 12750 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 4350 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 7950 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 13050 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 18900 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 6900 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 10800 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 16050 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 21600 },
    ],
  },
  {
    kode: '3C',
    nama: 'NIAGA KHUSUS',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 9450 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 13650 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 19050 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 24300 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 7350 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 11250 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 17550 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 21325 },
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
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 10200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 14400 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 19950 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 24450 },
    ],
  },
];

export async function seedMasterTarif() {
  console.log('=== SEEDING MASTER GOLONGAN & BLOK TARIF ===');
  const berlakuMulai = new Date('2024-01-01T00:00:00Z');

  for (const item of MASTER_GOLONGAN_DAN_BLOK_TARIF) {
    // 1. Upsert Golongan Tarif (pemakaianMinimumM3 = 5.00 sesuai bukti 96,1% data Tirtawening; default schema = 0)
    await db
      .insert(golonganTarif)
      .values({
        kode: item.kode,
        nama: item.nama,
        beaBeban: String(item.beaBeban),
        beaAdmin: String(item.beaAdmin),
        airKotor: String(item.airKotor),
        lainLain: String(item.lainLain),
        pemakaianMinimumM3: '5.00',
        tagihanSaatKelebihan: 'MINIMUM',
      })
      .onConflictDoUpdate({
        target: golonganTarif.kode,
        set: {
          nama: item.nama,
          beaBeban: String(item.beaBeban),
          beaAdmin: String(item.beaAdmin),
          airKotor: String(item.airKotor),
          lainLain: String(item.lainLain),
          pemakaianMinimumM3: '5.00',
          tagihanSaatKelebihan: 'MINIMUM',
        },
      });

    // 2. Upsert Blok Tarif Konsumsi Progresif
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
          catatan: 'Diekstrak dari rekonsiliasi data produksi Oktober (wajib dicocokkan dengan SK Tarif resmi)',
        })
        .onConflictDoUpdate({
          target: [tarifBlok.tarifKode, tarifBlok.blok, tarifBlok.berlakuMulai],
          set: {
            batasAwalM3: b.batasAwalM3,
            batasAkhirM3: b.batasAkhirM3,
            hargaPerM3: String(b.hargaPerM3),
            catatan: 'Diekstrak dari rekonsiliasi data produksi Oktober (wajib dicocokkan dengan SK Tarif resmi)',
          },
        });
    }
  }

  /**
   * 3. Seed Biaya Tetap (Bea Beban per Ukuran Meter, Bea Admin, Air Kotor)
   * CATATAN PENTING: Nilai referensi Bea Beban per ukuran meter di bawah ini diekstrak
   * dan direkonsiliasi 100% (22.524/22.524 baris cocok, 0 selisih) dari data produksi
   * ProgresCater-PW5.csv. Harus dicocokkan dengan SK Tarif Direksi resmi apabila ada pembaruan.
   */
  const BIAYA_TETAP_REFERENSI = [
    { id: 'bt-beban-1/2', jenis: 'BEA_BEBAN', ukuranMeter: '1/2', nominal: 7000 },
    { id: 'bt-beban-3/4', jenis: 'BEA_BEBAN', ukuranMeter: '3/4', nominal: 7000 },
    { id: 'bt-beban-1', jenis: 'BEA_BEBAN', ukuranMeter: '1', nominal: 43000 },
    { id: 'bt-beban-1-1/2', jenis: 'BEA_BEBAN', ukuranMeter: '1 1/2', nominal: 72000 },
    { id: 'bt-beban-2', jenis: 'BEA_BEBAN', ukuranMeter: '2', nominal: 129000 },
    { id: 'bt-beban-3', jenis: 'BEA_BEBAN', ukuranMeter: '3', nominal: 158000 },
    { id: 'bt-beban-4', jenis: 'BEA_BEBAN', ukuranMeter: '4', nominal: 187000 },
    { id: 'bt-admin-default', jenis: 'BEA_ADMIN', ukuranMeter: null, nominal: 10000 },
    { id: 'bt-airkotor-default', jenis: 'AIR_KOTOR', ukuranMeter: null, nominal: 11100 },
  ];

  for (const bt of BIAYA_TETAP_REFERENSI) {
    await db
      .insert(biayaTetap)
      .values({
        id: bt.id,
        jenis: bt.jenis,
        ukuranMeter: bt.ukuranMeter,
        nominal: String(bt.nominal),
        berlakuMulai,
      })
      .onConflictDoUpdate({
        target: biayaTetap.id,
        set: {
          jenis: bt.jenis,
          ukuranMeter: bt.ukuranMeter,
          nominal: String(bt.nominal),
          berlakuMulai,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`✓ Berhasil seeding 13 Golongan Tarif, 52 Blok Tarif Progresif, & ${BIAYA_TETAP_REFERENSI.length} Biaya Tetap Referensi.`);
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
