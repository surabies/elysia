import { pgTable, varchar, numeric } from 'drizzle-orm/pg-core';

// Golongan Tarif PDAM (e.g. 2A4 = RMH.TANGGA GOL.A4, 3B = NIAGA MENENGAH/BESAR)
export const golonganTarif = pgTable('golongan_tarif', {
  kode: varchar('kode', { length: 10 }).primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  beaBeban: numeric('bea_beban', { precision: 12, scale: 2 }).default('0'),
  beaAdmin: numeric('bea_admin', { precision: 12, scale: 2 }).default('0'),
  airKotor: numeric('air_kotor', { precision: 12, scale: 2 }).default('0'),
  lainLain: numeric('lain_lain', { precision: 12, scale: 2 }).default('0'),
});

export type GolonganTarif = typeof golonganTarif.$inferSelect;
