import { db } from '../../client';
import { periodePenagihan } from '../../schema/periode';
import type { SeedModule, SeedOptions } from '../types';

export const SEED_PERIODE = [
  {
    periode: '202512',
    status: 'TERKUNCI',
    tanggalJatuhTempo: new Date('2025-12-20T00:00:00.000Z'),
    ditutupAt: new Date('2025-12-25T17:00:00.000Z'),
    ditutupById: 'user-superadmin',
    alasanBuka: null,
    jumlahSl: 22480,
    totalM3: '448910.00',
    totalTagihan: '1841200000.00',
  },
  {
    periode: '202601',
    status: 'BERJALAN',
    tanggalJatuhTempo: new Date('2026-01-20T00:00:00.000Z'),
    ditutupAt: null,
    ditutupById: null,
    alasanBuka: null,
    jumlahSl: 22549,
    totalM3: '451230.50',
    totalTagihan: '1850420000.00',
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
    message: `Seeded ${SEED_PERIODE.length} siklus periode penagihan (202512 TERKUNCI & 202601 BERJALAN).`,
  };
}

export const periodeModule: SeedModule = {
  id: 'periode',
  name: 'Periode Billing & Siklus Penagihan',
  description: 'Inisialisasi THBL aktif (202601 Berjalan) & riwayat penutupan rekening DRD',
  run: async (_options: SeedOptions) => {
    return await seedPeriode();
  },
};
