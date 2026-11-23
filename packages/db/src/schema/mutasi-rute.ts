import { pgTable, text, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { pelanggan } from './pelanggan';
import { ruteCater } from './wilayah';

// Tabel Audit Log Riwayat Mutasi & Penggabungan Rute Pelanggan
export const mutasiRute = pgTable(
  'mutasi_rute',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text('batch_id')
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    tipe: varchar('tipe', { length: 20 }).notNull(), // 'mutasi' | 'penggabungan'
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),
    namaPelanggan: varchar('nama_pelanggan', { length: 150 }).notNull(),
    tglPasang: varchar('tgl_pasang', { length: 30 }),
    wilayahLama: varchar('wilayah_lama', { length: 50 }).notNull(),
    ruteLama: varchar('rute_lama', { length: 20 })
      .notNull()
      .references(() => ruteCater.kode, { onDelete: 'cascade' }),
    urutLama: integer('urut_lama').notNull(),
    wilayahBaru: varchar('wilayah_baru', { length: 50 }).notNull(),
    ruteBaru: varchar('rute_baru', { length: 20 })
      .notNull()
      .references(() => ruteCater.kode, { onDelete: 'cascade' }),
    urutBaru: integer('urut_baru').notNull(),
    zonaBaru: varchar('zona_baru', { length: 50 }),
    inputBy: text('input_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('mutasi_rute_batch_id_idx').on(table.batchId),
    index('mutasi_rute_nolg_idx').on(table.nolg),
    index('mutasi_rute_rute_baru_idx').on(table.ruteBaru),
    index('mutasi_rute_created_at_idx').on(table.createdAt),
  ]
);

export type MutasiRute = typeof mutasiRute.$inferSelect;
export type NewMutasiRute = typeof mutasiRute.$inferInsert;
