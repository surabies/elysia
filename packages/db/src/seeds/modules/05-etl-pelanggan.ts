import { db } from '../../client';
import { pelanggan } from '../../schema';
import { count } from 'drizzle-orm';
import { importProgresCater } from '../../etl/import-progres-cater';
import type { SeedModule, SeedOptions } from '../types';

export async function seedEtlPelanggan(options: SeedOptions) {
  const [existing] = await db.select({ total: count() }).from(pelanggan);
  const currentCount = existing ? Number(existing.total) : 0;

  if (currentCount > 0 && !options.forceEtl) {
    return {
      count: currentCount,
      message: `Tabel pelanggan sudah berisi ${currentCount.toLocaleString()} data. Lewati ETL (Gunakan --force-etl untuk menimpa).`,
    };
  }

  const result = await importProgresCater({
    limit: options.limit,
  });

  return {
    count: result.pelangganCount,
    message: `Berhasil ETL: ${result.pelangganCount.toLocaleString()} pelanggan, ${result.meterCount.toLocaleString()} meter, ${result.caterCount.toLocaleString()} baca meter, ${result.billingCount.toLocaleString()} rekening DRD.`,
  };
}

export const etlPelangganModule: SeedModule = {
  id: 'etl-pelanggan',
  name: 'ETL Pelanggan, Meter & Billing (CSV)',
  description: 'Normalisasi arsip ProgresCater & PBPK (22.549 pelanggan, rute, tarif, water meter, catat meter & DRD)',
  run: async (options: SeedOptions) => {
    return await seedEtlPelanggan(options);
  },
};
