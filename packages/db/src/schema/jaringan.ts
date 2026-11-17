import { pgTable, text, integer, doublePrecision, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export interface MultiLineStringGeometry {
  type: 'MultiLineString';
  coordinates: number[][][];
}

// 1. Master Sumber Air & Instalasi Pengolahan Air (IPA)
export const sumberAir = pgTable('sumber_air', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. 'IPA_BADAK_SINGA', 'BSP01', 'MA_CISURUPAN'
  nama: varchar('nama', { length: 150 }).notNull(),
  tipe: varchar('tipe', { length: 50 }).notNull(), // IPA, MATA_AIR, SUMUR_BOR, RESERVOIR, BOOSTER_PUMP_BSP
  wilayah: varchar('wilayah', { length: 100 }), // e.g. 'Pelayanan Wilayah 5', 'Produksi'
  kapasitasLps: doublePrecision('kapasitas_lps'),
  status: varchar('status', { length: 50 }).default('Aktif').notNull(),
  keterangan: text('keterangan'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 2. Jaringan Pipa Distribusi & Transmisi Air Minum PDAM (12.100+ segmen GIS)
export const pipaJaringan = pgTable(
  'pipa_jaringan',
  {
    id: integer('id').primaryKey(),
    fid: integer('fid'),
    kodePipa: varchar('kode_pipa', { length: 100 }),
    jenisPipa: varchar('jenis_pipa', { length: 100 }),
    material: varchar('material', { length: 100 }),
    diameter: varchar('diameter', { length: 100 }),
    diameterDalam: varchar('diameter_dalam', { length: 100 }),
    kedalaman: varchar('kedalaman', { length: 100 }),
    tahunPasang: varchar('tahun_pasang', { length: 50 }),
    tahunGanti: varchar('tahun_ganti', { length: 50 }),
    lokasi: text('lokasi'),
    pelaksana: varchar('pelaksana', { length: 150 }),
    pelayanan: varchar('pelayanan', { length: 100 }),
    jenisJaringan: varchar('jenis_jaringan', { length: 100 }),
    jenisMaterial: varchar('jenis_material', { length: 150 }),
    sumberData: varchar('sumber_data', { length: 100 }),
    posisiPipa: varchar('posisi_pipa', { length: 100 }),
    fungsi: varchar('fungsi', { length: 100 }),
    steptest: varchar('steptest', { length: 100 }),
    jaringanDma: varchar('jaringan_dma', { length: 100 }),
    dma: varchar('dma', { length: 100 }),
    sumberAir: varchar('sumber_air', { length: 150 }),
    petugasUpdate: varchar('petugas_update', { length: 150 }),
    panjangMeter: doublePrecision('panjang_meter'),
    statusPipa: varchar('status_pipa', { length: 100 }),
    keterangan: text('keterangan'),
    geometry: jsonb('geometry').$type<MultiLineStringGeometry>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pipa_pelayanan_idx').on(table.pelayanan),
    index('pipa_material_idx').on(table.material),
    index('pipa_dma_idx').on(table.dma),
    index('pipa_sumber_air_idx').on(table.sumberAir),
  ]
);

export type SumberAir = typeof sumberAir.$inferSelect;
export type NewSumberAir = typeof sumberAir.$inferInsert;
export type PipaJaringan = typeof pipaJaringan.$inferSelect;
export type NewPipaJaringan = typeof pipaJaringan.$inferInsert;
