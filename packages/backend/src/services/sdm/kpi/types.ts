export type Direction = "higher" | "lower"

export type FormatType = "currency" | "percent" | "decimal"

export type KpiStatus = "on_track" | "watch" | "off_track" | "no_actual"

export interface LaggingMarket {
  countryCode: string
  countryName: string
  flagEmoji: string
  progress: number
}

export interface KpiOwner {
  id: string
  name: string
  avatarUrl?: string
  initials: string
}

export interface SparklinePoint {
  val: number
}

export interface TrendChange {
  direction: "up" | "down" | "neutral"
  diff: number
  sparkline: number[]
}

export interface KpiItem {
  id: string
  name: string
  direction: Direction
  owner: KpiOwner
  weight: number
  baseline: number
  value: number | null
  target: number
  format: FormatType
  currencySymbol?: string
  unitMultiplier?: number
  change: TrendChange
  laggingMarket: LaggingMarket | null
}

export interface Objective {
  id: string
  name: string
  kpis: KpiItem[]
}

export interface Perspective {
  id: string
  name: string
  scoreWeightPercent: number
  description: string
  objectives: Objective[]
}

export interface ParsedNewKpi {
  name: string
  objectiveId: string
  ownerId: string
  direction: Direction
  weight: number
  baseline: number
  target: number
  value: number | null
  format: FormatType
}

export type TopografiKategori =
  | "DATAR"
  | "BERGELOMBANG"
  | "BERBUKIT"
  | "CURAM_TANGGA"
  | "EKSTREM"

export type ModaAkses = "MOTOR_PENUH" | "CAMPURAN" | "JALAN_KAKI_MURNI"

export interface RuteFaktorMedanConfig {
  ruteKode: string
  seksiKode?: string
  seksiNama?: string
  pencatatDefault?: string
  pencatatNama?: string
  jumlahSL: number
  topografi: TopografiKategori
  modaAkses: ModaAkses
  faktorMedan: number
  hambatanKhusus: string[]
  catatan?: string
  updatedAt?: string
  updatedBy?: string
}

export const FAKTOR_TOPOGRAFI_STANDAR: Record<TopografiKategori, number> = {
  DATAR: 1.0,
  BERGELOMBANG: 1.1,
  BERBUKIT: 1.2,
  CURAM_TANGGA: 1.3,
  EKSTREM: 1.4,
}

export const FAKTOR_MODA_AKSES_STANDAR: Record<ModaAkses, number> = {
  MOTOR_PENUH: 1.0,
  CAMPURAN: 1.06,
  JALAN_KAKI_MURNI: 1.12,
}

export const DAFTAR_HAMBATAN_KHUSUS = [
  { id: "PAGAR_GEMBOK", label: "Pagar Gembok / Penghuni Kerja" },
  { id: "ADA_ANJING", label: "Anjing Penjaga / Area Rawan" },
  { id: "TANGGA_CURAM", label: "Anak Tangga Curam / Tebing" },
  { id: "GANG_SEMPIT", label: "Gang Sempit < 1 Meter" },
  { id: "METER_DALAM", label: "Meter di Dalam Bangunan / Kolong" },
  { id: "RAWAN_BANJIR", label: "Bantaran Sungai / Rawan Becek" },
] as const
