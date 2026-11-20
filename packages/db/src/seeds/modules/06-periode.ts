import { db } from '../../client';
import { periodePenagihan } from '../../schema/periode';
import type { SeedModule, SeedOptions } from '../types';

export const SEED_PERIODE = [
  {
    periode: '202610',
    status: 'TERKUNCI',
    tanggalJatuhTempo: new Date('2026-10-20T00:00:00.000Z'),
    ditutupAt: new Date('2026-10-25T17:00:00.000Z'),
    ditutupById: 'user-superadmin',
    alasanBuka: null,
    jumlahSl: 22524,
    totalM3: '450890.00',
    totalTagihan: '1849100000.00',
  },
  {
    periode: '202611',
    status: 'BERJALAN',
    tanggalJatuhTempo: new Date('2026-11-20T00:00:00.000Z'),
    ditutupAt: null,
    ditutupById: null,
    alasanBuka: null,
    jumlahSl: 22524,
    totalM3: '452100.00',
    totalTagihan: '1855000000.00',
  },
];

export async function seedPeriode() {
  for (const item of SEED_PERIODE) {
    await db
      .insert(periodePenagihan)
      .values(item)
      .onConflictDoUpdate({
        target: periodePenagihan.periode,
        set: {
          status: item.status,
          tanggalJatuhTempo: item.tanggalJatuhTempo,
          ditutupAt: item.ditutupAt,
          jumlahSl: item.jumlahSl,
          totalM3: item.totalM3,
          totalTagihan: item.totalTagihan,
          updatedAt: new Date(),
        },
      });
  }

  return {
    count: SEED_PERIODE.length,
    message: `Seeded ${SEED_PERIODE.length} siklus periode penagihan (202611 BERJALAN & 202610 TERKUNCI).`,
  };
}

export const periodeModule: SeedModule = {
  id: 'periode',
  name: 'Periode Billing & Siklus Penagihan',
  description: 'Inisialisasi THBL aktif (202611 Berjalan) & riwayat penutupan rekening DRD',
  run: async (_options: SeedOptions) => {
    return await seedPeriode();
  },
};
