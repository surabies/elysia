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
import { masterKondisiCatat } from './kondisi';

// 1. Snapshot Versi Aturan Anomali
export const aturanAnomaliVersi = pgTable('aturan_anomali_versi', {
  versi: integer('versi').primaryKey(),
  snapshot: jsonb('snapshot').notNull(),
  alasan: text('alasan').notNull(),
  diterbitkanOleh: varchar('diterbitkan_oleh', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AturanAnomaliVersi = typeof aturanAnomaliVersi.$inferSelect;
export type NewAturanAnomaliVersi = typeof aturanAnomaliVersi.$inferInsert;

// 2. Master Aturan Anomali (Single Source of Truth, Dikelola Operator)
export const aturanAnomali = pgTable('aturan_anomali', {
  id: varchar('id', { length: 50 }).primaryKey(),
  kode: varchar('kode', { length: 50 }).notNull().unique(), // Immutable
  nama: varchar('nama', { length: 100 }).notNull(),
  tipeAturan: varchar('tipe_aturan', { length: 40 }).notNull(),
  // 'METER_MUNDUR' | 'LONJAKAN_ABSOLUT' | 'LONJAKAN_RELATIF' | 'PENURUNAN_RELATIF' | 'PEMAKAIAN_NOL' | 'DEVIASI' | 'KONDISI_FISIK' | 'KONDISI_MENDADAK' | 'KONDISI_BERKEPANJANGAN'
  arah: varchar('arah', { length: 10 }).notNull().default('KEDUANYA'), // 'NAIK' | 'TURUN' | 'KEDUANYA'
  acuanPembanding: varchar('acuan_pembanding', { length: 30 })
    .notNull()
    .default('PAKAI_LALU'), // 'PAKAI_LALU' | 'RATA_HISTORIS' | 'STAND_AWAL'
  periodeHistorisJml: integer('periode_historis_jml').notNull().default(3),
  syaratPakaiLaluMinM3: numeric('syarat_pakai_lalu_min_m3', {
    precision: 8,
    scale: 2,
  }),
  selisihMinM3: numeric('selisih_min_m3', { precision: 8, scale: 2 }),
  minM3: numeric('min_m3', { precision: 8, scale: 2 }),
  maxM3: numeric('max_m3', { precision: 8, scale: 2 }),
  minPersen: numeric('min_persen', { precision: 8, scale: 2 }),
  maxPersen: numeric('max_persen', { precision: 8, scale: 2 }),
  dihitungSebagaiAnomali: boolean('dihitung_sebagai_anomali')
    .notNull()
    .default(true),
  ringTingkat: integer('ring_tingkat').notNull().default(1), // 1: Staf, 2: Supervisor, 3: Manager
  tingkatKeparahan: varchar('tingkat_keparahan', { length: 20 })
    .notNull()
    .default('SEDANG'), // 'PERINGATAN' | 'SEDANG' | 'TINGGI' | 'KRITIS'
  badgeTone: varchar('badge_tone', { length: 30 })
    .notNull()
    .default('problem'), // 'problem' | 'warning' | 'neutral'
  urutan: integer('urutan').notNull().default(1),
  aktif: boolean('aktif').notNull().default(true),
  
  // Parameter Bersyarat & Dinamis (Tanpa Hardcode)
  syaratKondisiLalu: varchar('syarat_kondisi_lalu', { length: 50 }).notNull().default('ANY'), // 'ANY' | 'BASELINE_NORMAL' | 'SAMA' | 'BERBEDA'
  syaratPeriodeBerturut: integer('syarat_periode_berturut'), // Nilai N (e.g. 3) untuk kondisi berkepanjangan
  kecualikanJikaBerlanjut: boolean('kecualikan_jika_berlanjut').notNull().default(false), // Jika kondisi berlanjut, lewati aturan ini
  kecualikanJikaPakaiLaluDibawah: numeric('kecualikan_jika_pakai_lalu_dibawah', { precision: 8, scale: 2 }), // Jika pakai lalu < X, lewati aturan
  
  deskripsi: text('deskripsi'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AturanAnomali = typeof aturanAnomali.$inferSelect;
export type NewAturanAnomali = typeof aturanAnomali.$inferInsert;

// 3. Pemetaan Kondisi Fisik Meter (TMSS) ke Aturan Anomali
export const aturanKondisiMeterMap = pgTable(
  'aturan_kondisi_meter_map',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    kodeTmss: varchar('kode_tmss', { length: 10 })
      .notNull()
      .references(() => masterKondisiCatat.kodeTmss, { onDelete: 'cascade' }),
    aturanAnomaliId: varchar('aturan_anomali_id', { length: 50 })
      .notNull()
      .references(() => aturanAnomali.id, { onDelete: 'cascade' }),
    isBaselineNormal: boolean('is_baseline_normal').notNull().default(false), // Kondisi dianggap normal untuk baseline (H dan R = false di data)
    isPeriodeTidakAktif: boolean('is_periode_tidak_aktif').notNull().default(false), // Periode dikeluarkan dari rata-rata historis bila pakai = 0
    aktif: boolean('aktif').notNull().default(true),
    keterangan: text('keterangan'),
  },
  (table) => [
    unique('uq_kondisi_meter_map').on(table.kodeTmss, table.aturanAnomaliId),
  ]
);

export type AturanKondisiMeterMap = typeof aturanKondisiMeterMap.$inferSelect;
export type NewAturanKondisiMeterMap = typeof aturanKondisiMeterMap.$inferInsert;

// 4. Audit Log Perubahan Aturan Operator
export const aturanAnomaliAuditLog = pgTable('aturan_anomali_audit_log', {
  id: varchar('id', { length: 50 }).primaryKey(),
  aturanId: varchar('aturan_id', { length: 50 }).notNull(),
  aksi: varchar('aksi', { length: 20 }).notNull(), // 'CREATE' | 'UPDATE' | 'TOGGLE_AKTIF'
  nilaiLama: jsonb('nilai_lama'),
  nilaiBaru: jsonb('nilai_baru').notNull(),
  alasan: text('alasan').notNull(),
  diubahOleh: varchar('diubah_oleh', { length: 100 }).notNull(),
  waktu: timestamp('waktu').notNull().defaultNow(),
});

export type AturanAnomaliAuditLog = typeof aturanAnomaliAuditLog.$inferSelect;
export type NewAturanAnomaliAuditLog = typeof aturanAnomaliAuditLog.$inferInsert;
