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
    periode: varchar("periode", { length: 30 }).notNull(), // misal "Sep 2026"
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
