import {
  pgTable,
  text,
  varchar,
  numeric,
  boolean,
  timestamp,
  index,
  geometry,
} from 'drizzle-orm/pg-core';
import { pelanggan } from './pelanggan';
import { user } from './auth';

// Pengajuan Hasil Baca Meter Mandiri oleh Pelanggan (Web & Mobile)
export const caterMandiriPelanggan = pgTable(
  'cater_mandiri_pelanggan',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    thbl: varchar('thbl', { length: 6 }).notNull(), // e.g. '202601'
    nolg: varchar('nolg', { length: 20 })
      .notNull()
      .references(() => pelanggan.nolg, { onDelete: 'cascade' }),

    // Hasil Baca Mandiri
    stma: numeric('stma', { precision: 10, scale: 2 }).notNull(),
    pakaiM3: numeric('pakai_m3', { precision: 10, scale: 2 }),
    fotoMeterUrl: text('foto_meter_url').notNull(),
    fotoRumahUrl: text('foto_rumah_url'),

    // Geofencing PostGIS (Validasi Titik Rumah Pelanggan)
    lokasiGps: geometry('lokasi_gps', { type: 'point', mode: 'xy', srid: 4326 }),
    jarakDariRumahMeter: numeric('jarak_dari_rumah_meter', { precision: 8, scale: 2 }),
    isLokasiValid: boolean('is_lokasi_valid').notNull().default(true), // true jika <= 50 meter dari titik pelanggan

    channel: varchar('channel', { length: 20 }).notNull().default('WEB_PORTAL'), // 'WEB_PORTAL' | 'MOBILE_APP'
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Status Verifikasi oleh Petugas Kantor
    statusVerifikasi: varchar('status_verifikasi', { length: 30 })
      .notNull()
      .default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
    alasanPenolakan: text('alasan_penolakan'),
    verifiedBy: text('verified_by').references(() => user.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('cater_mandiri_thbl_nolg_idx').on(table.thbl, table.nolg),
    index('cater_mandiri_status_idx').on(table.statusVerifikasi),
    index('cater_mandiri_gps_idx').using('gist', table.lokasiGps),
  ]
);

export type CaterMandiriPelanggan = typeof caterMandiriPelanggan.$inferSelect;
export type NewCaterMandiriPelanggan = typeof caterMandiriPelanggan.$inferInsert;
