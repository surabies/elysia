import { pgTable, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

// 1. Wilayah Administrasi (e.g. C = CIBEUNYING, K = KAREES)
export const wilayahAdministrasi = pgTable('wilayah_administrasi', {
  kode: varchar('kode', { length: 10 }).primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
});

// 2. Kecamatan (e.g. CD = SUMUR BANDUNG, KC = LENGKONG)
export const kecamatan = pgTable('kecamatan', {
  kode: varchar('kode', { length: 10 }).primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  wiladmKode: varchar('wiladm_kode', { length: 10 }).references(() => wilayahAdministrasi.kode),
});

// 3. Kelurahan (e.g. CD1 = BRAGA, KC2 = CIKAWAO)
export const kelurahan = pgTable('kelurahan', {
  kode: varchar('kode', { length: 10 }).primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  kecamatanKode: varchar('kecamatan_kode', { length: 10 }).references(() => kecamatan.kode),
});

// 4. Zona Distribusi & DMA (District Metered Area Teknis)
export const zonaDistribusi = pgTable('zona_distribusi', {
  kode: varchar('kode', { length: 20 }).primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  wildistKode: varchar('wildist_kode', { length: 20 }),
  wildistNama: varchar('wildist_nama', { length: 100 }),
  dmaKode: varchar('dma_kode', { length: 20 }),
});

// 5. Petugas Catat Meter (Pencatat / Cater Officer)
export const petugasCater = pgTable('petugas_cater', {
  id: varchar('id', { length: 50 }).primaryKey(), // Nama / NIP e.g. 'DADANG', 'PERIYADI'
  nama: varchar('nama', { length: 100 }).notNull(),
  noHp: varchar('no_hp', { length: 30 }),
  aktif: boolean('aktif').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 6. Rute Catat Meter (e.g. CD104, KC207)
export const ruteCater = pgTable('rute_cater', {
  kode: varchar('kode', { length: 20 }).primaryKey(),
  seksiKode: varchar('seksi_kode', { length: 20 }), // e.g. 'C4'
  seksiNama: varchar('seksi_nama', { length: 100 }), // e.g. 'WIL CATER 4'
  pencatatDefault: varchar('pencatat_default', { length: 50 }).references(() => petugasCater.id),
});

export type WilayahAdministrasi = typeof wilayahAdministrasi.$inferSelect;
export type Kecamatan = typeof kecamatan.$inferSelect;
export type Kelurahan = typeof kelurahan.$inferSelect;
export type ZonaDistribusi = typeof zonaDistribusi.$inferSelect;
export type PetugasCater = typeof petugasCater.$inferSelect;
export type RuteCater = typeof ruteCater.$inferSelect;
