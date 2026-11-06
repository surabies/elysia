import { pgTable, text, varchar, numeric, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { pelanggan } from './pelanggan';

// Data Rekening DRD (Daftar Rekening Ditagih) & Billing
export const rekeningDrd = pgTable(
  'rekening_drd',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    thbl: varchar('thbl', { length: 6 }).notNull(), // e.g. '202601'
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),
    pakaiM3: numeric('pakai_m3', { precision: 10, scale: 2 }).default('0'),
    blokM3: integer('blok_m3').default(1),
    jmlHargaAir: numeric('jml_harga_air', { precision: 12, scale: 2 }).default('0'),
    beaBeban: numeric('bea_beban', { precision: 12, scale: 2 }).default('0'),
    beaAdmin: numeric('bea_admin', { precision: 12, scale: 2 }).default('0'),
    airKotor: numeric('air_kotor', { precision: 12, scale: 2 }).default('0'),
    lainLain: numeric('lain_lain', { precision: 12, scale: 2 }).default('0'),
    totalTagihan: numeric('total_tagihan', { precision: 12, scale: 2 }).notNull().default('0'),
    jmlRekNunggak: integer('jml_rek_nunggak').default(0),
    tagNunggak: numeric('tag_nunggak', { precision: 12, scale: 2 }).default('0'),
    potensialPenagihan: varchar('potensial_penagihan', { length: 50 }),
    potensialCater: varchar('potensial_cater', { length: 50 }),
    statusLunas: boolean('status_lunas').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('drd_thbl_nolg_idx').on(table.thbl, table.nolg),
    index('drd_status_lunas_idx').on(table.statusLunas),
  ]
);

export type RekeningDrd = typeof rekeningDrd.$inferSelect;
export type NewRekeningDrd = typeof rekeningDrd.$inferInsert;
