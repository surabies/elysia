import { pgTable, varchar, text, boolean, integer, timestamp, index, geometry } from 'drizzle-orm/pg-core';
import { golonganTarif } from './tarif';
import { kelurahan, ruteCater } from './wilayah';
import { waterMeter } from './meter';

// Master Data Pelanggan PDAM
export const pelanggan = pgTable(
  'pelanggan',
  {
    nolg: varchar('nolg', { length: 20 }).primaryKey(), // Nomor Langganan
    nprs: varchar('nprs', { length: 30 }),               // Nomor Pelanggan Rute Sambungan
    nama: varchar('nama', { length: 150 }).notNull(),
    alamat: text('alamat').notNull(),
    rt: varchar('rt', { length: 10 }),
    rw: varchar('rw', { length: 10 }),
    noTelp: varchar('no_telp', { length: 30 }),
    jmlPenghuni: integer('jml_penghuni').default(0),
    isMbr: boolean('is_mbr').notNull().default(false),  // Masyarakat Berpenghasilan Rendah
    status: varchar('status', { length: 30 }).notNull().default('PELANGGAN AKTIF'),
    tarifKode: varchar('tarif_kode', { length: 10 }).references(() => golonganTarif.kode),
    kelurahanKode: varchar('kelurahan_kode', { length: 10 }).references(() => kelurahan.kode),
    ruteKode: varchar('rute_kode', { length: 20 }).references(() => ruteCater.kode),
    noUrutRute: integer('no_urut_rute').default(0),
    noMeter: varchar('no_meter', { length: 50 }).references(() => waterMeter.noMeter),
    titikLokasi: geometry('titik_lokasi', { type: 'point', mode: 'xy', srid: 4326 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pelanggan_titik_lokasi_idx').using('gist', table.titikLokasi),
    index('pelanggan_rute_kode_idx').on(table.ruteKode),
    index('pelanggan_tarif_kode_idx').on(table.tarifKode),
    index('pelanggan_kelurahan_kode_idx').on(table.kelurahanKode),
  ]
);

export type Pelanggan = typeof pelanggan.$inferSelect;
export type NewPelanggan = typeof pelanggan.$inferInsert;
