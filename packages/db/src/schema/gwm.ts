import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  geometry,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pelanggan } from './pelanggan';
import { user } from './auth';
import { zonaDistribusi } from './wilayah';

// ---------------------------------------------------------------------------
// 1. GWM SISI OPERASIONAL: GANTI WATER METER (Mutasi & Stand Angkat)
// ---------------------------------------------------------------------------

export const alasanGantiMeterEnum = pgEnum('alasan_ganti_meter_enum', [
  'RUSAK',          // Meter Rusak fisik / macet
  'MATI',           // Meter Mati (Kode STI '7 - MATI ADA AIR')
  'BURAM',          // Bodi / Kaca Buram (Kode STI '6 - BMK/BMB')
  'HILANG',         // Meter Tak Ada / Hilang (Kode STI '3 - MTA')
  'TERA_ULANG',     // Kalibrasi / Tera berkala metrologi
  'UKURAN_BERUBAH', // Penyesuaian ukuran meter / kebutuhan debit
  'LAINNYA',
]);

export const statusVerifikasiGwmEnum = pgEnum('status_verifikasi_gwm_enum', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

/// Mutasi Penggantian Water Meter Pelanggan (Ganti Water Meter)
/// Menampung Stand Angkat (meter lama) & Stand Pasang (meter baru)
/// Mencegah komplain pembengkakan tagihan / anomali kubikasi negatif.
export const waterMeterMutasi = pgTable(
  'water_meter_mutasi',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),
    periode: integer('periode').notNull(), // THBL mutasi, e.g. 202601
    tglGanti: timestamp('tgl_ganti').notNull().defaultNow(),
    alasan: alasanGantiMeterEnum('alasan').notNull().default('RUSAK'),
    keterangan: text('keterangan'),

    // --- DATA METER LAMA (DIANGKAT / DICABUT) ---
    noMeterLama: varchar('no_meter_lama', { length: 50 }).notNull(),
    standAngkat: integer('stand_angkat').notNull(), // Angka stand terakhir meter lama
    fotoStandAngkat: text('foto_stand_angkat'),     // Bukti foto meter lama dicabut

    // --- DATA METER BARU (DIPASANG) ---
    noMeterBaru: varchar('no_meter_baru', { length: 50 }).notNull(),
    merkBaru: varchar('merk_baru', { length: 50 }),
    ukuranBaru: varchar('ukuran_baru', { length: 20 }).default('1/2'),
    standPasang: integer('stand_pasang').notNull().default(0), // Stand awal meter baru (biasanya 0)
    noSegelBaru: varchar('no_segel_baru', { length: 50 }),
    fotoMeterBaru: text('foto_meter_baru'),         // Bukti foto meter baru terpasang

    // --- TIM LAPANGAN & VERIFIKASI SUPERVISOR ---
    petugasPasang: varchar('petugas_pasang', { length: 100 }), // Nama teknisi / petugas instalasi
    verifikatorId: text('verifikator_id').references(() => user.id, { onDelete: 'set null' }),
    statusVerifikasi: statusVerifikasiGwmEnum('status_verifikasi').notNull().default('PENDING'),
    catatanVerifikasi: text('catatan_verifikasi'),
    tglVerifikasi: timestamp('tgl_verifikasi'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('gwm_mutasi_nolg_idx').on(table.nolg),
    index('gwm_mutasi_periode_idx').on(table.periode),
    index('gwm_mutasi_status_idx').on(table.statusVerifikasi),
  ]
);

// ---------------------------------------------------------------------------
// 2. GWM SISI TEKNIK & DISTRIBUSI: GRAND WATER METER (Meter Induk DMA)
// ---------------------------------------------------------------------------

/// Master Grand Water Meter (Meter Induk Zona Distribusi / DMA)
/// Mengukur debit total air bersih yang masuk ke suatu zona
export const grandWaterMeter = pgTable(
  'grand_water_meter',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kodeGwm: varchar('kode_gwm', { length: 50 }).notNull().unique(), // e.g. 'GWM-PW5-001'
    nama: varchar('nama', { length: 100 }).notNull(),                // e.g. 'Master Meter Intake Cibeunying'
    zonaKode: varchar('zona_kode', { length: 20 }).references(() => zonaDistribusi.kode),
    dmaKode: varchar('dma_kode', { length: 20 }),
    ukuranPipa: varchar('ukuran_pipa', { length: 20 }),               // e.g. '4"', '6"', '8"'
    merk: varchar('merk', { length: 50 }),
    noSeri: varchar('no_seri', { length: 50 }),
    titikLokasi: geometry('titik_lokasi', { type: 'point', mode: 'xy', srid: 4326 }),
    alamat: text('alamat'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('grand_water_meter_zona_idx').on(table.zonaKode),
    index('grand_water_meter_lokasi_idx').using('gist', table.titikLokasi),
  ]
);

/// Pencatatan Debit Rutin Grand Water Meter per Periode Bulan
/// Digunakan untuk menghitung Water Balance (Neraca Air) & NRW (Tingkat Kebocoran)
export const gwmBacaMeter = pgTable(
  'gwm_baca_meter',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    gwmId: varchar('gwm_id', { length: 36 })
      .notNull()
      .references(() => grandWaterMeter.id, { onDelete: 'cascade' }),
    periode: integer('periode').notNull(), // THBL, e.g. 202601
    tglBaca: timestamp('tgl_baca').notNull().defaultNow(),
    standAwal: integer('stand_awal').notNull(),
    standAkhir: integer('stand_akhir').notNull(),
    totalDebitM3: integer('total_debit_m3').notNull(), // standAkhir - standAwal (Debit masuk zona)
    petugasId: text('petugas_id').references(() => user.id, { onDelete: 'set null' }),
    fotoStand: text('foto_stand'),
    titikLokasi: geometry('titik_lokasi', { type: 'point', mode: 'xy', srid: 4326 }),
    catatan: text('catatan'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('gwm_baca_meter_gwm_periode_idx').on(table.gwmId, table.periode),
    index('gwm_baca_meter_lokasi_idx').using('gist', table.titikLokasi),
  ]
);

// ---------------------------------------------------------------------------
// RELATIONS
// ---------------------------------------------------------------------------

export const waterMeterMutasiRelations = relations(waterMeterMutasi, ({ one }) => ({
  pelanggan: one(pelanggan, {
    fields: [waterMeterMutasi.nolg],
    references: [pelanggan.nolg],
  }),
  verifikator: one(user, {
    fields: [waterMeterMutasi.verifikatorId],
    references: [user.id],
  }),
}));

export const grandWaterMeterRelations = relations(grandWaterMeter, ({ one, many }) => ({
  zona: one(zonaDistribusi, {
    fields: [grandWaterMeter.zonaKode],
    references: [zonaDistribusi.kode],
  }),
  bacaMeterLogs: many(gwmBacaMeter),
}));

export const gwmBacaMeterRelations = relations(gwmBacaMeter, ({ one }) => ({
  gwm: one(grandWaterMeter, {
    fields: [gwmBacaMeter.gwmId],
    references: [grandWaterMeter.id],
  }),
  petugas: one(user, {
    fields: [gwmBacaMeter.petugasId],
    references: [user.id],
  }),
}));

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type WaterMeterMutasi = typeof waterMeterMutasi.$inferSelect;
export type NewWaterMeterMutasi = typeof waterMeterMutasi.$inferInsert;
export type GrandWaterMeter = typeof grandWaterMeter.$inferSelect;
export type NewGrandWaterMeter = typeof grandWaterMeter.$inferInsert;
export type GwmBacaMeter = typeof gwmBacaMeter.$inferSelect;
export type NewGwmBacaMeter = typeof gwmBacaMeter.$inferInsert;
