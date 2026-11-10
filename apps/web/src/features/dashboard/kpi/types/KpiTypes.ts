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
  weight: number // 0 - 100 (%)
  baseline: number
  value: number | null // null = no actual
  target: number
  format: FormatType
  currencySymbol?: string
  unitMultiplier?: number // e.g. 1_000_000 for $18.40M
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
  scoreWeightPercent: number // e.g. 30% of company score
  description: string
  objectives: Objective[]
}

export interface CalculatedKpi extends KpiItem {
  progress: number | null // 0 - 100 (%) or null if no actual
  toGo: number | null
  status: KpiStatus
}

export interface CalculatedObjective {
  id: string
  name: string
  progress: number | null
  status: KpiStatus
  kpis: CalculatedKpi[]
  totalWeight: number
}

export interface CalculatedPerspective {
  id: string
  name: string
  scoreWeightPercent: number
  description: string
  score: number | null
  status: KpiStatus
  offTrackCount: number
  totalScoredCount: number
  totalKpiCount: number
  objectives: CalculatedObjective[]
}

export interface CompanyScorecardSummary {
  companyScore: number | null
  companyStatus: KpiStatus
  ptsChangeSinceLastMonth: number
  kpisOnTrackCount: number
  kpisWatchCount: number
  kpisOffTrackCount: number
  totalScoredKpis: number
  totalKpis: number
  weakestPerspectiveName: string | null
  weakestPerspectiveScore: number | null
  weakestPerspectiveOffTrackCount: number
}

export interface ScorecardHistoryState {
  perspectives: Perspective[]
}

export type KpiUnitOption = "percent" | "currency" | "decimal"

export interface NewKpiFormData {
  name: string
  objectiveId: string
  ownerId: string
  unit: KpiUnitOption
  weight: string
  baseline: string
  target: string
  actual: string
}

export type KpiFormErrors = Partial<Record<keyof NewKpiFormData, string>>

export interface ObjectiveOption {
  id: string
  name: string
  perspectiveName: string
}

