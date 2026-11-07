import { pgTable, text, varchar, numeric, integer, timestamp, index, geometry } from 'drizzle-orm/pg-core';
import { pelanggan } from './pelanggan';
import { ruteCater, petugasCater } from './wilayah';
import { masterKondisiCatat } from './kondisi';
import { caterMandiriPelanggan } from './mandiri';
import { waterMeterMutasi } from './gwm';

// Transaksi Catat Meter Lapangan (Mobile -> Backend) & Baca Mandiri Terverifikasi
export const caterBacaMeter = pgTable(
  'cater_baca_meter',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    thbl: varchar('thbl', { length: 6 }).notNull(), // e.g. '202601'
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),
    ruteKode: varchar('rute_kode', { length: 20 }).references(() => ruteCater.kode),
    petugasId: varchar('petugas_id', { length: 50 }).references(() => petugasCater.id),
    stml: numeric('stml', { precision: 10, scale: 2 }).notNull(), // Stand Meter Lalu
    stma: numeric('stma', { precision: 10, scale: 2 }).notNull(), // Stand Meter Akhir
    pakaiM3: numeric('pakai_m3', { precision: 10, scale: 2 }).notNull(), // Pemakaian m3
    stmlRevisi: numeric('stml_revisi', { precision: 10, scale: 2 }),
    stmaRevisi: numeric('stma_revisi', { precision: 10, scale: 2 }),
    pakaiM3Revisi: numeric('pakai_m3_revisi', { precision: 10, scale: 2 }),
    ketCatatRevisi: varchar('ket_catat_revisi', { length: 50 }),
    standAngkatRevisi: numeric('stand_angkat_revisi', { precision: 10, scale: 2 }),
    standMeterBaruRevisi: numeric('stand_meter_baru_revisi', { precision: 10, scale: 2 }),
    pakaiLalu: numeric('pakai_lalu', { precision: 10, scale: 2 }), // Pemakaian bulan lalu
    
    // Pemakaian Tagihan & Taksasi (Hasil Business Domain Engine)
    pakaiTagih: numeric('pakai_tagih', { precision: 10, scale: 2 }), // Pemakaian yang ditagihkan setelah taksasi/Perdir
    alasanTaksir: varchar('alasan_taksir', { length: 50 }),           // MINIMUM_5M3 | TAKSIRAN_BULAN_LALU | NOL_TIDAK_ADA_AIR | OVERRIDE_MANUAL

    // Kode Kondisi STI & Keterangan Catat
    tmss: varchar('tmss', { length: 10 }).default(' ').references(() => masterKondisiCatat.kodeTmss),
    ketCatat: varchar('ket_catat', { length: 50 }).notNull().default('Normal'),
    metodeCatat: varchar('metode_catat', { length: 20 }).notNull().default('ONSITE'), // ONSITE / OFFSITE
    
    // Sumber Pencatatan & Relasi ke Mandiri / Ganti Meter
    sumberCatat: varchar('sumber_catat', { length: 30 }).notNull().default('PETUGAS_ONSITE'), // PETUGAS_ONSITE | PETUGAS_OFFSITE | MANDIRI_WEB | MANDIRI_APP
    caterMandiriId: text('cater_mandiri_id').references((): any => caterMandiriPelanggan.id, { onDelete: 'set null' }),
    waterMeterMutasiId: varchar('water_meter_mutasi_id', { length: 36 }).references((): any => waterMeterMutasi.id, { onDelete: 'set null' }),

    tglCatat: timestamp('tgl_catat').notNull().defaultNow(),
    durasiDetik: integer('durasi_detik').default(0),
    fotoMeterUrl: text('foto_meter_url'),
    fotoRumahUrl: text('foto_rumah_url'),
    lokasiGps: geometry('lokasi_gps', { type: 'point', mode: 'xy', srid: 4326 }),
    jarakPelangganMeter: numeric('jarak_pelanggan_meter', { precision: 8, scale: 2 }), // Geofence distance
    statusVerifikasi: varchar('status_verifikasi', { length: 30 }).notNull().default('SUBMITTED'), // DRAFT / SUBMITTED / VERIFIED / ANOMALY
    catatan: text('catatan'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('cater_thbl_nolg_idx').on(table.thbl, table.nolg),
    index('cater_rute_kode_idx').on(table.ruteKode),
    index('cater_petugas_idx').on(table.petugasId),
    index('cater_lokasi_gps_idx').using('gist', table.lokasiGps),
    index('cater_status_verifikasi_idx').on(table.statusVerifikasi),
    index('cater_tmss_idx').on(table.tmss),
    index('cater_sumber_catat_idx').on(table.sumberCatat),
  ]
);

export type CaterBacaMeter = typeof caterBacaMeter.$inferSelect;
export type NewCaterBacaMeter = typeof caterBacaMeter.$inferInsert;
