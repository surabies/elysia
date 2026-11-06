import { pgTable, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

// Water Meter Asset (Aset Meter Air Pelanggan)
export const waterMeter = pgTable('water_meter', {
  noMeter: varchar('no_meter', { length: 50 }).primaryKey(),
  merk: varchar('merk', { length: 50 }), // e.g. 'ITR' (Itron), 'LIN'
  ukuran: varchar('ukuran', { length: 20 }).default('1/2'), // e.g. '1/2', '3/4'
  noSegel: varchar('no_segel', { length: 50 }),
  tglPasang: timestamp('tgl_pasang'),
  umurTahun: integer('umur_tahun').default(0),
  umurBulan: integer('umur_bulan').default(0),
  kondisi: varchar('kondisi', { length: 50 }).default('Normal'),
});

export type WaterMeter = typeof waterMeter.$inferSelect;
