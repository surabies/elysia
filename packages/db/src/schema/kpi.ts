import { sql } from "drizzle-orm"
import {
  check,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

/**
 * 1. Perspektif Balanced Scorecard (BSC) PDAM:
 * - Keuangan (Financial)
 * - Pelanggan & Layanan (Customer)
 * - Operasional Teknis & Distribusi (Internal Operations)
 * - SDM, Budaya & Lapangan (Growth / People)
 */
export const kpiPerspektif = pgTable("kpi_perspektif", {
  id: varchar("id", { length: 50 }).primaryKey(),
  nama: varchar("nama", { length: 100 }).notNull(),
  bobotSkor: integer("bobot_skor").notNull().default(25), // % kontribusi skor
  deskripsi: text("deskripsi"),
  urutan: integer("urutan").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/**
 * 2. Sasaran Strategis (Objective) di bawah setiap perspektif
 */
export const kpiObjektif = pgTable("kpi_objektif", {
  id: varchar("id", { length: 100 }).primaryKey(),
  perspektifId: varchar("perspektif_id", { length: 50 })
    .notNull()
    .references(() => kpiPerspektif.id, { onDelete: "cascade" }),
  nama: varchar("nama", { length: 150 }).notNull(),
  urutan: integer("urutan").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/**
 * 3. Indikator Kinerja Utama (KPI Item)
 */
export const kpiIndikator = pgTable(
  "kpi_indikator",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    objektifId: varchar("objektif_id", { length: 100 })
      .notNull()
      .references(() => kpiObjektif.id, { onDelete: "cascade" }),
    nama: varchar("nama", { length: 200 }).notNull(),
    arah: varchar("arah", { length: 10 }).notNull().default("higher"), // 'higher' | 'lower'
    pemilikId: varchar("pemilik_id", { length: 50 }).notNull(),
    pemilikNama: varchar("pemilik_nama", { length: 100 }).notNull(),
    pemilikInisial: varchar("pemilik_inisial", { length: 10 }).notNull(),
    bobot: integer("bobot").notNull().default(10), // 0 - 100%
    baseline: doublePrecision("baseline").notNull().default(0),
    target: doublePrecision("target").notNull().default(0),
    format: varchar("format", { length: 20 }).notNull().default("percent"), // 'percent' | 'currency' | 'decimal'
    simbolMataUang: varchar("simbol_mata_uang", { length: 10 }).default("Rp"),
    pengaliSatuan: doublePrecision("pengali_satuan").default(1),
    sumberData: varchar("sumber_data", { length: 50 }).default("manual"), // 'manual' | 'rekening_drd' | 'catat_meter' | 'pengaduan' | 'mandiri'
    urutan: integer("urutan").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check("kpi_indikator_bobot_range", sql`${table.bobot} >= 0 AND ${table.bobot} <= 100`),
  ]
)

/**
 * 4. Capaian Realisasi Aktual (Actual) per Periode Bulanan
 */
export const kpiRealisasi = pgTable(
  "kpi_realisasi",
  {
    id: varchar("id", { length: 120 }).primaryKey(), // `${indikatorId}_${periode}`
    indikatorId: varchar("indikator_id", { length: 100 })
      .notNull()
      .references(() => kpiIndikator.id, { onDelete: "cascade" }),
    periode: varchar("periode", { length: 30 }).notNull(), // misal "Nov 2026" atau "202611"
    nilaiAktual: doublePrecision("nilai_aktual"), // null jika "not reported"
    sparkline: text("sparkline"), // JSON array string
    catatan: text("catatan"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kpi_realisasi_indikator_periode_idx").on(
      table.indikatorId,
      table.periode
    ),
  ]
)

/**
 * 5. Pengaturan Parameter Rumusan & Kebijakan Insentif Bulanan (Perumda Air Minum)
 */
export const kpiAturanInsentif = pgTable(
  "kpi_aturan_insentif",
  {
    id: varchar("id", { length: 100 }).primaryKey(), // misal "aturan-202611" atau "global"
    periode: varchar("periode", { length: 30 }).notNull(), // "202611" atau "Nov 2026"
    insentifDasar: integer("insentif_dasar").notNull().default(500000), // Rp 500.000
    tarifPerSl: integer("tarif_per_sl").notNull().default(400), // Rp 400/SL
    bobotCapaianSl: integer("bobot_capaian_sl").notNull().default(40), // 40%
    bobotAkurasiGps: integer("bobot_akurasi_gps").notNull().default(25), // 25%
    bobotKualitasBaca: integer("bobot_kualitas_baca").notNull().default(20), // 20%
    bobotKecepatan: integer("bobot_kecepatan").notNull().default(15), // 15%
    targetDurasiDetik: integer("target_durasi_detik").notNull().default(45), // <= 45 detik
    thresholdGradeA: integer("threshold_grade_a").notNull().default(90),
    thresholdGradeB: integer("threshold_grade_b").notNull().default(75),
    thresholdGradeC: integer("threshold_grade_c").notNull().default(60),
    pengaliGradeA: doublePrecision("pengali_grade_a").notNull().default(1.1),
    pengaliGradeB: doublePrecision("pengali_grade_b").notNull().default(1.0),
    pengaliGradeC: doublePrecision("pengali_grade_c").notNull().default(0.65),
    minIndeksBeban: doublePrecision("min_indeks_beban").notNull().default(0.7),
    maxIndeksBeban: doublePrecision("max_indeks_beban").notNull().default(1.4),
    catatan: text("catatan"),
    updatedBy: varchar("updated_by", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kpi_aturan_insentif_periode_idx").on(table.periode),
  ]
)

/**
 * 6. Alokasi Beban Kerja & Penugasan Personel Lapangan per Periode
 */
export const kpiAlokasiBebanPetugas = pgTable(
  "kpi_alokasi_beban_petugas",
  {
    id: varchar("id", { length: 120 }).primaryKey(), // `${periode}_${petugasId}`
    periode: varchar("periode", { length: 30 }).notNull(), // "202611"
    petugasId: varchar("petugas_id", { length: 50 }).notNull(),
    targetSlPenugasan: integer("target_sl_penugasan"), // override target SL spesifik jika ada
    faktorKesulitanMedan: doublePrecision("faktor_kesulitan_medan")
      .notNull()
      .default(1.0), // 0.8 s/d 1.5 pengali topografi
    statusTugas: varchar("status_tugas", { length: 30 })
      .notNull()
      .default("AKTIF"), // 'AKTIF' | 'CUTI' | 'SAKIT' | 'BANTUAN_KHUSUS'
    catatan: text("catatan"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kpi_alokasi_beban_petugas_periode_petugas_idx").on(
      table.periode,
      table.petugasId
    ),
  ]
)

/**
 * 7. Faktor Kesulitan Medan per Kode Rute (Topografi, Aksesibilitas, & Hambatan Geografis)
 */
export const kpiFaktorKesulitanRute = pgTable(
  "kpi_faktor_kesulitan_rute",
  {
    ruteKode: varchar("rute_kode", { length: 20 }).primaryKey(),
    faktorKesulitanMedan: doublePrecision("faktor_kesulitan_medan")
      .notNull()
      .default(1.0),
    kategoriMedan: varchar("kategori_medan", { length: 50 }).notNull().default("NORMAL"),
    keterangan: text("keterangan"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
)

export type KpiFaktorKesulitanRute = typeof kpiFaktorKesulitanRute.$inferSelect;
export type NewKpiFaktorKesulitanRute = typeof kpiFaktorKesulitanRute.$inferInsert;

