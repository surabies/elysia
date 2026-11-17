import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export interface MediaBroadcastRecord {
  url: string;
  judul: string;
  keterangan?: string;
  tipe: 'BROSUR' | 'FOTO_KEGIATAN' | 'PETA_AREA' | 'DOKUMENTASI';
  publicId?: string;
}

export interface WilayahTerdampakRecord {
  kecamatan: string;
  kelurahan: string[];
}

export interface KontakBantuanRecord {
  label: string;
  nomor: string;
  waLink?: string;
}

export interface PromoDetailsRecord {
  highlightDiskon?: string;
  periode?: string;
  keunggulan?: string[];
  syaratKetentuan?: string[];
  langkahDaftar?: string[];
  ctaLink?: string;
  ctaText?: string;
}

/**
 * Tabel Broadcast / Siaran & Banner Iklan Landing Page
 * Melayani siaran gangguan air (darurat/pemeliharaan) dan banner promo/iklan (gebyar event)
 */
export const broadcast = pgTable(
  'broadcast',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    judul: text('judul').notNull(),
    ringkasan: text('ringkasan').notNull(),
    kategori: varchar('kategori', { length: 30 }).notNull().default('DARURAT'), // 'DARURAT' | 'PEMELIHARAAN' | 'EVENT' | 'INFORMASI' | 'KEGIATAN'
    lokasiWilayah: varchar('lokasi_wilayah', { length: 100 }).default('Pelayanan Wilayah 5'),
    status: varchar('status', { length: 30 }).notNull().default('DALAM_PENGERJAAN'), // 'DALAM_PENGERJAAN' | 'SELESAI' | 'TERJADWAL'
    progresPersen: integer('progres_persen').notNull().default(0),
    prioritas: varchar('prioritas', { length: 20 }).notNull().default('NORMAL'), // 'TINGGI' | 'SEDANG' | 'NORMAL'
    waktuMulai: text('waktu_mulai').notNull().default(''),
    estimasiSelesai: text('estimasi_selesai').notNull().default(''),
    penyebab: text('penyebab').notNull().default(''),
    dampak: text('dampak').notNull().default(''),
    tindakanPenanganan: text('tindakan_penanganan').notNull().default(''),
    wilayahTerdampak: jsonb('wilayah_terdampak').$type<WilayahTerdampakRecord[]>().notNull().default([]),
    kontakBantuan: jsonb('kontak_bantuan').$type<KontakBantuanRecord>(),
    gambarUtama: text('gambar_utama'),
    gambarUtamaPublicId: text('gambar_utama_public_id'),
    tipeGambarUtama: varchar('tipe_gambar_utama', { length: 30 }).default('FOTO_KEGIATAN'),
    galeriMedia: jsonb('galeri_media').$type<MediaBroadcastRecord[]>().notNull().default([]),
    promoDetails: jsonb('promo_details').$type<PromoDetailsRecord>(),
    aktif: boolean('aktif').notNull().default(true),
    tampilkanDiTicker: boolean('tampilkan_di_ticker').notNull().default(true),
    tampilkanDiSpotlight: boolean('tampilkan_di_spotlight').notNull().default(true),
    urutan: integer('urutan').notNull().default(0),
    diperbaruiPada: text('diperbarui_pada').notNull().default('Baru saja'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_broadcast_kategori').on(table.kategori),
    index('idx_broadcast_aktif').on(table.aktif),
    index('idx_broadcast_urutan').on(table.urutan),
  ]
);

export type BroadcastModel = typeof broadcast.$inferSelect;
export type NewBroadcastModel = typeof broadcast.$inferInsert;
