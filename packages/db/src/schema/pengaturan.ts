import { pgTable, text, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const pengaturanKonten = pgTable('pengaturan_konten', {
  kunci: varchar('kunci', { length: 100 }).primaryKey(),
  nilai: jsonb('nilai').notNull(),
  kategori: varchar('kategori', { length: 50 }).notNull().default('umum'),
  keterangan: text('keterangan'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by'),
});

export type PengaturanKonten = typeof pengaturanKonten.$inferSelect;
export type NewPengaturanKonten = typeof pengaturanKonten.$inferInsert;
