import { pgTable, text, varchar, numeric, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { pelanggan } from './pelanggan';

// Riwayat Pemakaian Historis (e.g. Export 12 Bulan dari Infolang / Legacy System)
// Digunakan untuk menghitung akumulasi_taksasi_m3 secara kumulatif sejak pembacaan fisik terakhir
export const riwayatPemakaianHistoris = pgTable(
  'riwayat_pemakaian_historis',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),
    periode: varchar('periode', { length: 6 }).notNull(), // e.g. '202609'
    standAwal: numeric('stand_awal', { precision: 10, scale: 2 }).notNull().default('0'),
    standAkhir: numeric('stand_akhir', { precision: 10, scale: 2 }).notNull().default('0'),
    pakaiM3: numeric('pakai_m3', { precision: 10, scale: 2 }).notNull().default('0'),
    kodeKondisi: varchar('kode_kondisi', { length: 10 }).default('-'),
    namaKondisi: varchar('nama_kondisi', { length: 50 }).default('Normal'),
    isTaksasi: boolean('is_taksasi').notNull().default(false),
    sumber: varchar('sumber', { length: 50 }).notNull().default('INFOLANG'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    unique('riwayat_pemakaian_periode_nolg_unique').on(table.periode, table.nolg),
    index('riwayat_pemakaian_nolg_periode_idx').on(table.nolg, table.periode),
  ]
);

export type RiwayatPemakaianHistoris = typeof riwayatPemakaianHistoris.$inferSelect;
export type NewRiwayatPemakaianHistoris = typeof riwayatPemakaianHistoris.$inferInsert;
