import { pgTable, varchar, numeric, integer, timestamp, text, index, unique } from 'drizzle-orm/pg-core';

// 1. Golongan Tarif PDAM (e.g. 2A4 = RMH.TANGGA GOL.A4, 3B = NIAGA MENENGAH/BESAR)
export const golonganTarif = pgTable('golongan_tarif', {
  kode: varchar('kode', { length: 10 }).primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  beaBeban: numeric('bea_beban', { precision: 12, scale: 2 }).default('0'),
  beaAdmin: numeric('bea_admin', { precision: 12, scale: 2 }).default('0'),
  airKotor: numeric('air_kotor', { precision: 12, scale: 2 }).default('0'),
  lainLain: numeric('lain_lain', { precision: 12, scale: 2 }).default('0'),
});

// 2. Tarif Blok Konsumsi Air Progresif (Tirtawening Tiered Tariff)
export const tarifBlok = pgTable(
  'tarif_blok',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tarifKode: varchar('tarif_kode', { length: 10 })
      .notNull()
      .references(() => golonganTarif.kode, { onDelete: 'cascade' }),
    blok: integer('blok').notNull(), // 1, 2, 3, 4
    batasAwalM3: integer('batas_awal_m3').notNull(), // e.g. 0, 11, 21, 31
    batasAkhirM3: integer('batas_akhir_m3'), // e.g. 10, 20, 30, null for >30
    hargaPerM3: numeric('harga_per_m3', { precision: 12, scale: 2 }).notNull(),
    berlakuMulai: timestamp('berlaku_mulai').notNull(),
    berlakuSampai: timestamp('berlaku_sampai'),
    catatan: text('catatan'), // Dasar hukum / SK Direksi
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    unique('tarif_blok_kode_blok_berlaku_unique').on(
      table.tarifKode,
      table.blok,
      table.berlakuMulai
    ),
    index('tarif_blok_kode_idx').on(table.tarifKode),
  ]
);

// 3. Biaya Tetap (Fixed Fee / Bea Beban berdasar ukuran meter)
export const biayaTetap = pgTable(
  'biaya_tetap',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jenis: varchar('jenis', { length: 30 }).notNull(), // 'BEA_BEBAN', 'BEA_ADMIN', 'AIR_KOTOR'
    ukuranMeter: varchar('ukuran_meter', { length: 20 }), // '1/2', '3/4', '1', null
    nominal: numeric('nominal', { precision: 12, scale: 2 }).notNull(),
    berlakuMulai: timestamp('berlaku_mulai').notNull(),
    berlakuSampai: timestamp('berlaku_sampai'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('biaya_tetap_jenis_berlaku_idx').on(table.jenis, table.berlakuMulai),
  ]
);

export type GolonganTarif = typeof golonganTarif.$inferSelect;
export type TarifBlok = typeof tarifBlok.$inferSelect;
export type NewTarifBlok = typeof tarifBlok.$inferInsert;
export type BiayaTetap = typeof biayaTetap.$inferSelect;
export type NewBiayaTetap = typeof biayaTetap.$inferInsert;
