import {
  pgTable,
  varchar,
  numeric,
  integer,
  boolean,
  text,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';

// 1. Target Bulanan per Wilayah & Periode Tahun
export const capaianTargetBulanan = pgTable(
  'capaian_target_bulanan',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // e.g. '5-2026-1'
    wilayahId: varchar('wilayah_id', { length: 20 }).notNull(),
    tahun: integer('tahun').notNull(),
    bulan: integer('bulan').notNull(), // 1 s.d 12
    targetSl: integer('target_sl').notNull().default(0),
    targetM3: numeric('target_m3', { precision: 14, scale: 2 }).notNull().default('0'),
    versi: integer('versi').notNull().default(1),
    catatan: text('catatan'),
    diubahOleh: varchar('diubah_oleh', { length: 100 }).notNull().default('SYSTEM'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    unique('capaian_target_bulanan_wilayah_tahun_bulan_idx').on(
      table.wilayahId,
      table.tahun,
      table.bulan
    ),
  ]
);

export type CapaianTargetBulanan = typeof capaianTargetBulanan.$inferSelect;
export type NewCapaianTargetBulanan = typeof capaianTargetBulanan.$inferInsert;

// 2. Realisasi Bulanan per Wilayah & Periode Tahun
// Bulan 0 = Desember Tahun Lalu (Snapshot Baseline untuk Perhitungan M3/SL/Hari Januari)
// Bulan 1..12 = Januari..Desember
export const capaianRealisasiBulanan = pgTable(
  'capaian_realisasi_bulanan',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // e.g. '5-2026-1' atau '5-2026-0'
    wilayahId: varchar('wilayah_id', { length: 20 }).notNull(),
    tahun: integer('tahun').notNull(),
    bulan: integer('bulan').notNull(), // 0 = Des tahun lalu, 1..12 = Jan..Des
    realisasiSl: integer('realisasi_sl').notNull().default(0),
    realisasiM3: numeric('realisasi_m3', { precision: 14, scale: 2 }).notNull().default('0'),
    sumber: varchar('sumber', { length: 20 }).notNull().default('OTOMATIS'), // 'OTOMATIS' | 'MANUAL'
    dikunci: boolean('dikunci').notNull().default(false),
    versi: integer('versi').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    unique('capaian_realisasi_bulanan_wilayah_tahun_bulan_idx').on(
      table.wilayahId,
      table.tahun,
      table.bulan
    ),
  ]
);

export type CapaianRealisasiBulanan = typeof capaianRealisasiBulanan.$inferSelect;
export type NewCapaianRealisasiBulanan = typeof capaianRealisasiBulanan.$inferInsert;

// 3. Pengaturan Konfigurasi Parameter Capaian per Wilayah & Tahun
export const capaianPengaturan = pgTable(
  'capaian_pengaturan',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // e.g. '5-2026'
    wilayahId: varchar('wilayah_id', { length: 20 }).notNull(),
    tahun: integer('tahun').notNull(),
    hariAcuanLps: integer('hari_acuan_lps').notNull().default(30), // default 30 hari untuk perhitungan LPS
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    unique('capaian_pengaturan_wilayah_tahun_idx').on(
      table.wilayahId,
      table.tahun
    ),
  ]
);

export type CapaianPengaturan = typeof capaianPengaturan.$inferSelect;
export type NewCapaianPengaturan = typeof capaianPengaturan.$inferInsert;

// 4. Audit Log / Riwayat Perubahan Target & Realisasi
export const capaianRiwayat = pgTable('capaian_riwayat', {
  id: varchar('id', { length: 50 }).primaryKey(), // UUID
  wilayahId: varchar('wilayah_id', { length: 20 }).notNull(),
  tahun: integer('tahun').notNull(),
  aksi: varchar('aksi', { length: 50 }).notNull(), // 'UPDATE_TARGET' | 'UPDATE_REALISASI' | 'SYNC_OTOMATIS' | 'RESET'
  dataSebelum: jsonb('data_sebelum'),
  dataSesudah: jsonb('data_sesudah'),
  diubahOleh: varchar('diubah_oleh', { length: 100 }).notNull().default('SYSTEM'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type CapaianRiwayat = typeof capaianRiwayat.$inferSelect;
export type NewCapaianRiwayat = typeof capaianRiwayat.$inferInsert;
