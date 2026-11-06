import { pgTable, varchar, boolean, text, timestamp } from 'drizzle-orm/pg-core';

// Master Data Kamus Kondisi Catat (Keterangan Catat & Kode Kelainan STI)
export const masterKondisiCatat = pgTable('master_kondisi_catat', {
  kodeTmss: varchar('kode_tmss', { length: 10 }).primaryKey(), // '-', 'H', 'R', 'N', 'Z', '2', '8', '7', etc.
  nama: varchar('nama', { length: 100 }).notNull(),          // 'Normal', 'DK', 'STAND TEMPEL', etc.
  kategori: varchar('kategori', { length: 50 }).notNull(),   // 'TERBACA' | 'KENDALA_AKSES' | 'KERUSAKAN_FISIK' | 'PELANGGARAN'
  isKendalaAkses: boolean('is_kendala_akses').notNull().default(false), // true untuk '2' (DK), 'N', 'E' (TERHALANG), 'Q' (ADA ANJING)
  triggerBacaMandiri: boolean('trigger_baca_mandiri').notNull().default(false), // true untuk DK dan STAND TEMPEL
  deskripsi: text('deskripsi'),
  aktif: boolean('aktif').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type MasterKondisiCatat = typeof masterKondisiCatat.$inferSelect;
export type NewMasterKondisiCatat = typeof masterKondisiCatat.$inferInsert;
