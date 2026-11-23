import { db } from '../../client';
import { masterKondisiCatat } from '../../schema/kondisi';
import type { SeedModule, SeedOptions } from '../types';
import { DEFAULT_KONDISI_CATAT } from '../../seed-kondisi';

export { DEFAULT_KONDISI_CATAT };

export async function seedMasterKondisi() {
  for (const item of DEFAULT_KONDISI_CATAT) {
    await db
      .insert(masterKondisiCatat)
      .values({
        kodeTmss: item.kodeTmss,
        nama: item.nama,
        kategori: item.kategori,
        modeHitung: item.modeHitung,
        isKendalaAkses: item.isKendalaAkses,
        triggerBacaMandiri: item.triggerBacaMandiri,
        deskripsi: item.deskripsi,
        aktif: true,
      })
      .onConflictDoUpdate({
        target: masterKondisiCatat.kodeTmss,
        set: {
          nama: item.nama,
          kategori: item.kategori,
          modeHitung: item.modeHitung,
          isKendalaAkses: item.isKendalaAkses,
          triggerBacaMandiri: item.triggerBacaMandiri,
          deskripsi: item.deskripsi,
        },
      });
  }

  return {
    count: DEFAULT_KONDISI_CATAT.length,
    message: `Seeded ${DEFAULT_KONDISI_CATAT.length} master kondisi catat STI.`,
  };
}

export const kondisiModule: SeedModule = {
  id: 'kondisi',
  name: 'Master Kondisi Catat STI',
  description: '26 Kode kondisi catat meter resmi PDAM (Normal, DK, MB, Rumah Kosong, Stand Minus, dll.)',
  run: async (_options: SeedOptions) => {
    return await seedMasterKondisi();
  },
};
