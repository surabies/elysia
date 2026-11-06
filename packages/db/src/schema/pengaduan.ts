import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  geometry,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { pelanggan } from './pelanggan';

// 1. Enums Pengaduan
export const klasifikasiPengaduanEnum = pgEnum('klasifikasi_pengaduan_enum', [
  'NILAI_TAGIHAN_REKENING',
  'BUKAN_NILAI_TAGIHAN_REKENING',
]);

export const jenisPengaduanEnum = pgEnum('jenis_pengaduan_enum', [
  'LAPOR_STAND_METER',
  'MUTASI_GOLONGAN_TARIF',
  'TIDAK_MAMPU_BAYAR',
  'PENCATATAN_METER_TIDAK_SESUAI',
  'LONJAKAN_PEMAKAIAN_AIR',
  'GANTI_STOP_KRAN',
  'BOCOR_PIPA_DINAS',
  'PASANGAN_LIAR',
  'TIDAK_ADA_AIR',
  'AIR_KERUH_BAU_BERWARNA',
  'PINDAH_JARINGAN',
  'LAINNYA',
]);

export const prioritasPengaduanEnum = pgEnum('prioritas_pengaduan_enum', [
  'RENDAH',
  'NORMAL',
  'TINGGI',
  'DARURAT',
]);

export const statusPengaduanEnum = pgEnum('status_pengaduan_enum', [
  'BARU',
  'TERVERIFIKASI',
  'DITUGASKAN',
  'MENUJU_LOKASI',
  'DIPROSES',
  'MENUNGGU_PELANGGAN',
  'SELESAI',
  'DITUTUP',
  'DITOLAK',
  'DIBUKA_KEMBALI',
]);

export const aksiPengaduanEnum = pgEnum('aksi_pengaduan_enum', [
  'DIBUAT',
  'DITUGASKAN',
  'STATUS_DIUBAH',
  'CATATAN',
  'ESKALASI',
  'DIKONFIRMASI',
  'DIBUKA_KEMBALI',
  'DINILAI',
  'DIVERIFIKASI',
  'CHAT',
  'DITUTUP_OTOMATIS',
]);

// 2. Tabel Utama Pengaduan
export const pengaduan = pgTable(
  'pengaduan',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nomorTiket: varchar('nomor_tiket', { length: 30 }).notNull().unique(), // Format: TW-YYMM-XXXXXX (Base32 Crockford)
    clientRequestId: varchar('client_request_id', { length: 100 }).unique(),
    pelangganId: varchar('pelanggan_id', { length: 20 }).references(() => pelanggan.nolg),
    nomorLangganan: varchar('nomor_langganan', { length: 20 }),
    klasifikasi: klasifikasiPengaduanEnum('klasifikasi')
      .notNull()
      .default('BUKAN_NILAI_TAGIHAN_REKENING'),
    jenis: jenisPengaduanEnum('jenis').notNull(),
    judul: varchar('judul', { length: 255 }).notNull(),
    deskripsi: text('deskripsi').notNull(),
    koordinat: geometry('koordinat', { type: 'point', mode: 'xy', srid: 4326 }),
    alamatKejadian: text('alamat_kejadian'),
    prioritas: prioritasPengaduanEnum('prioritas').notNull().default('NORMAL'),
    status: statusPengaduanEnum('status').notNull().default('BARU'),
    pelapor: varchar('pelapor', { length: 150 }).notNull(),
    kontakPelapor: varchar('kontak_pelapor', { length: 50 }),
    fotoUrl: text('foto_url'),
    fotoPublicId: varchar('foto_public_id', { length: 255 }),
    videoUrl: text('video_url'),
    videoPublicId: varchar('video_public_id', { length: 255 }),
    ditugaskanKeId: text('ditugaskan_ke_id').references(() => user.id),
    ditanganiMulai: timestamp('ditangani_mulai'),
    selesaiAt: timestamp('selesai_at'),
    catatanPenyelesaian: text('catatan_penyelesaian'),
    fotoPenyelesaianUrl: text('foto_penyelesaian_url'),
    fotoPenyelesaianPublicId: varchar('foto_penyelesaian_public_id', { length: 255 }),
    targetResponsAt: timestamp('target_respons_at'),
    targetSelesaiAt: timestamp('target_selesai_at'),
    responsAt: timestamp('respons_at'),
    jedaMulaiAt: timestamp('jeda_mulai_at'),
    jedaTotalMenit: integer('jeda_total_menit').notNull().default(0),
    ratingKepuasan: integer('rating_kepuasan'),
    komentarKepuasan: text('komentar_kepuasan'),
    ratingAt: timestamp('rating_at'),
    jumlahDibukaKembali: integer('jumlah_dibuka_kembali').notNull().default(0),
    konfirmasiBatasAt: timestamp('konfirmasi_batas_at'),
    verifikasiAt: timestamp('verifikasi_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pengaduan_nomor_tiket_idx').on(table.nomorTiket),
    index('pengaduan_pelanggan_idx').on(table.pelangganId),
    index('pengaduan_nomor_langganan_idx').on(table.nomorLangganan),
    index('pengaduan_jenis_status_idx').on(table.jenis, table.status),
    index('pengaduan_status_prioritas_idx').on(table.status, table.prioritas),
    index('pengaduan_created_at_idx').on(table.createdAt),
    index('pengaduan_ditugaskan_idx').on(table.ditugaskanKeId),
    index('pengaduan_koordinat_idx').using('gist', table.koordinat),
  ]
);

// 3. Tabel Linimasa Riwayat Pengaduan (Audit & Thread Interaksi)
export const riwayatPengaduan = pgTable(
  'riwayat_pengaduan',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pengaduanId: text('pengaduan_id')
      .notNull()
      .references(() => pengaduan.id, { onDelete: 'cascade' }),
    aksi: aksiPengaduanEnum('aksi').notNull(),
    statusDari: statusPengaduanEnum('status_dari'),
    statusKe: statusPengaduanEnum('status_ke'),
    petugasId: text('petugas_id').references(() => user.id),
    catatan: text('catatan'),
    fotoUrl: text('foto_url'),
    fotoPublicId: varchar('foto_public_id', { length: 255 }),
    isPublik: boolean('is_publik').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('riwayat_pengaduan_id_idx').on(table.pengaduanId),
    index('riwayat_pengaduan_created_at_idx').on(table.createdAt),
  ]
);

export type PengaduanRow = typeof pengaduan.$inferSelect;
export type NewPengaduanRow = typeof pengaduan.$inferInsert;
export type RiwayatPengaduanRow = typeof riwayatPengaduan.$inferSelect;
export type NewRiwayatPengaduanRow = typeof riwayatPengaduan.$inferInsert;
