import { pgTable, text, varchar, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { pelanggan } from './pelanggan';
import { ruteCater, petugasCater } from './wilayah';

// DPM (Daftar Pelanggan Menjadi) - Target Beban Catat Meter Periode Berjalan
export const daftarCatat = pgTable(
  'daftar_catat',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    periode: varchar('periode', { length: 6 }).notNull(), // e.g. '202601'
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),
    ruteKode: varchar('rute_kode', { length: 20 }).references(() => ruteCater.kode, { onDelete: 'set null' }),
    petugasId: varchar('petugas_id', { length: 50 }).references(() => petugasCater.id, { onDelete: 'set null' }),
    urutan: integer('urutan').notNull().default(0),
    
    sumber: varchar('sumber', { length: 20 }).notNull().default('CARRY_OVER'), // 'CARRY_OVER' | 'PBPK' | 'MANUAL'
    status: varchar('status', { length: 30 }).notNull().default('BELUM_DICATAT'), // 'BELUM_DICATAT' | 'DICATAT' | 'TIDAK_TERCATAT' | 'DICABUT'
    selesaiAt: timestamp('selesai_at'),
    catatan: text('catatan'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    unique('daftar_catat_periode_nolg_unique').on(table.periode, table.nolg),
    index('daftar_catat_periode_petugas_idx').on(table.periode, table.petugasId),
    index('daftar_catat_periode_rute_idx').on(table.periode, table.ruteKode),
    index('daftar_catat_periode_status_idx').on(table.periode, table.status),
  ]
);

export type DaftarCatat = typeof daftarCatat.$inferSelect;
export type NewDaftarCatat = typeof daftarCatat.$inferInsert;
