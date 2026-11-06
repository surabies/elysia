import { pgTable, text, varchar, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth';

// Status Siklus Periode Penagihan Bulanan (THBL Closing Lock)
export const periodePenagihan = pgTable(
  'periode_penagihan',
  {
    periode: varchar('periode', { length: 6 }).primaryKey(), // e.g. '202601'
    status: varchar('status', { length: 20 }).notNull().default('BERJALAN'), // 'BERJALAN' | 'TERKUNCI'
    tanggalJatuhTempo: timestamp('tanggal_jatuh_tempo'),
    ditutupAt: timestamp('ditutup_at'),
    ditutupById: text('ditutup_by_id').references(() => user.id, { onDelete: 'set null' }),
    dibukaAt: timestamp('dibuka_at'),
    dibukaById: text('dibuka_by_id').references(() => user.id, { onDelete: 'set null' }),
    alasanBuka: text('alasan_buka'),
    
    // Snapshot Hasil Closing Bulanan (DRD)
    jumlahSl: integer('jumlah_sl'),
    totalM3: numeric('total_m3', { precision: 12, scale: 2 }),
    totalTagihan: numeric('total_tagihan', { precision: 15, scale: 2 }),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('periode_penagihan_status_idx').on(table.status),
  ]
);

export type PeriodePenagihan = typeof periodePenagihan.$inferSelect;
export type NewPeriodePenagihan = typeof periodePenagihan.$inferInsert;
