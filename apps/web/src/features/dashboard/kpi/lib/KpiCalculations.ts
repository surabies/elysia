import type {
  CalculatedKpi,
  CalculatedObjective,
  CalculatedPerspective,
  CompanyScorecardSummary,
  Direction,
  FormatType,
  KpiItem,
  KpiStatus,
  Objective,
  Perspective,
} from "../types/KpiTypes"

export const STATUS_THRESHOLDS = {
  ON_TRACK_MIN: 70,
  WATCH_MIN: 45,
} as const

/**
 * Menentukan status berdasarkan persentase progres (0 - 100).
 */
export function getKpiStatus(progress: number | null): KpiStatus {
  if (progress === null || isNaN(progress)) return "no_actual"
  if (progress >= STATUS_THRESHOLDS.ON_TRACK_MIN) return "on_track"
  if (progress >= STATUS_THRESHOLDS.WATCH_MIN) return "watch"
  return "off_track"
}

/**
 * Single source of truth untuk styling warna status di semua komponen.
 */
export function getStatusStyling(status: KpiStatus): {
  label: string
  dotClass: string
  textClass: string
  bgClass: string
  badgeClass: string
  borderClass: string
} {
  switch (status) {
    case "on_track":
      return {
        label: "Sesuai Target",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700 dark:text-emerald-400",
        bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        borderClass: "border-emerald-500",
      }
    case "watch":
      return {
        label: "Perhatian",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-950/40",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        borderClass: "border-amber-500",
      }
    case "off_track":
      return {
        label: "Kritis",
        dotClass: "bg-rose-500",
        textClass: "text-rose-700 dark:text-rose-400",
        bgClass: "bg-rose-50 dark:bg-rose-950/40",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        borderClass: "border-rose-500",
      }
    case "no_actual":
    default:
      return {
        label: "Belum Ada Data",
        dotClass: "bg-zinc-400",
        textClass: "text-zinc-500 dark:text-zinc-400",
        bgClass: "bg-zinc-50 dark:bg-zinc-900/40",
        badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        borderClass: "border-zinc-400",
      }
  }
}

/**
 * Menghitung progres 1 KPI (0% - 100%).
 * Bila Value null -> null (no actual).
 */
export function calculateKpiProgress(
  baseline: number,
  value: number | null,
  target: number,
  direction: Direction
): number | null {
  if (value === null || isNaN(value)) return null

  let raw = 0
  if (direction === "higher") {
    const diff = target - baseline
    if (diff === 0) return 100
    raw = ((value - baseline) / diff) * 100
  } else {
    // lower is better
    const diff = baseline - target
    if (diff === 0) return 100
    raw = ((baseline - value) / diff) * 100
  }

  // Dibatasi 0% sampai 100%
  const clamped = Math.max(0, Math.min(100, raw))
  return Math.round(clamped)
}

/**
 * Menghitung nilai To Go = selisih absolut antara Target dan Value.
 */
export function calculateToGo(value: number | null, target: number): number | null {
  if (value === null || isNaN(value)) return null
  return Math.abs(target - value)
}

/**
 * Format representasi angka sesuai tipe KPI.
 */
export function formatKpiNumber(
  val: number | null,
  format: FormatType,
  options?: {
    currencySymbol?: string
    unitMultiplier?: number
    hideZeroDecimals?: boolean
  }
): string {
  if (val === null || isNaN(val)) return "-"

  const symbol = options?.currencySymbol ?? "$"
  const mult = options?.unitMultiplier ?? 1

  if (format === "currency") {
    if (mult === 1_000_000) {
      // Misal $18.40M
      const inM = val / 1_000_000
      return `${symbol}${inM.toFixed(2)}M`
    }
    return `${symbol}${val.toFixed(2)}`
  }

  if (format === "percent") {
    return `${val.toFixed(1)}%`
  }

  // decimal / regular number
  return val.toFixed(1)
}

/**
 * Parse teks input user ke number valid untuk format yang sesuai.
 */
export function parseKpiInputValue(
  rawInput: string,
  format: FormatType,
  unitMultiplier: number = 1
): number | null {
  const cleaned = rawInput
    .trim()
    .replace(/[$,%]/g, "")
    .replace(/[mM]$/g, "")
    .trim()

  if (!cleaned || cleaned === "-") return null

  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return null

  // Jika input dalam jutaan dan ada 'M' atau unitMultiplier
  const hadM = /[mM]$/.test(rawInput.trim())
  if (unitMultiplier === 1_000_000) {
    if (hadM || parsed < 1000) {
      return parsed * 1_000_000
    }
  }

  return parsed
}

/**
 * Menghitung seluruh turunan metrik sebuah objektif.
 */
export function calculateObjectiveMetrics(objective: Objective): CalculatedObjective {
  const calculatedKpis: CalculatedKpi[] = objective.kpis.map((kpi) => {
    const progress = calculateKpiProgress(kpi.baseline, kpi.value, kpi.target, kpi.direction)
    const toGo = calculateToGo(kpi.value, kpi.target)
    const status = getKpiStatus(progress)
    return {
      ...kpi,
      progress,
      toGo,
      status,
    }
  })

  // Hitung rata-rata berbobot KPI yang memiliki nilai (scored)
  let weightedProgressSum = 0
  let totalValidWeight = 0

  for (const k of calculatedKpis) {
    if (k.progress !== null) {
      weightedProgressSum += (k.progress * k.weight) / 100
      totalValidWeight += k.weight
    }
  }

  const objProgress =
    totalValidWeight > 0 ? Math.round((weightedProgressSum / totalValidWeight) * 100) : null

  return {
    id: objective.id,
    name: objective.name,
    progress: objProgress,
    status: getKpiStatus(objProgress),
    kpis: calculatedKpis,
    totalWeight: objective.kpis.reduce((acc, k) => acc + k.weight, 0),
  }
}

/**
 * Menghitung seluruh turunan metrik sebuah perspektif.
 */
export function calculatePerspectiveMetrics(perspective: Perspective): CalculatedPerspective {
  const calculatedObjectives = perspective.objectives.map(calculateObjectiveMetrics)

  let offTrackCount = 0
  let totalScoredCount = 0
  let totalKpiCount = 0
  let weightedScoreSum = 0
  let totalScoredWeight = 0

  for (const obj of calculatedObjectives) {
    for (const kpi of obj.kpis) {
      totalKpiCount++
      if (kpi.status !== "no_actual") {
        totalScoredCount++
        if (kpi.status === "off_track") {
          offTrackCount++
        }
      }
    }

    if (obj.progress !== null) {
      // Bobot rata objektif dalam perspektif
      weightedScoreSum += obj.progress
      totalScoredWeight += 1
    }
  }

  const score = totalScoredWeight > 0 ? Math.round(weightedScoreSum / totalScoredWeight) : null

  return {
    id: perspective.id,
    name: perspective.name,
    scoreWeightPercent: perspective.scoreWeightPercent,
    description: perspective.description,
    score,
    status: getKpiStatus(score),
    offTrackCount,
    totalScoredCount,
    totalKpiCount,
    objectives: calculatedObjectives,
  }
}

/**
 * Menghitung ringkasan perusahaan secara menyeluruh (Company Scorecard Summary).
 */
export function calculateCompanySummary(
  perspectives: Perspective[],
  ptsChangeSinceLastMonth: number = 2
): {
  calculatedPerspectives: CalculatedPerspective[]
  summary: CompanyScorecardSummary
} {
  const calculatedPerspectives = perspectives.map(calculatePerspectiveMetrics)

  let totalWeightedScore = 0
  let totalPerspectiveWeight = 0
  let kpisOnTrackCount = 0
  let kpisWatchCount = 0
  let kpisOffTrackCount = 0
  let totalScoredKpis = 0
  let totalKpis = 0

  let weakestPerspectiveName: string | null = null
  let weakestPerspectiveScore: number | null = null
  let weakestPerspectiveOffTrackCount = 0

  for (const p of calculatedPerspectives) {
    if (p.score !== null) {
      totalWeightedScore += (p.score * p.scoreWeightPercent) / 100
      totalPerspectiveWeight += p.scoreWeightPercent

      if (weakestPerspectiveScore === null || p.score < weakestPerspectiveScore) {
        weakestPerspectiveScore = p.score
        weakestPerspectiveName = p.name
        weakestPerspectiveOffTrackCount = p.offTrackCount
      }
    }

    for (const obj of p.objectives) {
      for (const k of obj.kpis) {
        totalKpis++
        if (k.status === "on_track") {
          kpisOnTrackCount++
          totalScoredKpis++
        } else if (k.status === "watch") {
          kpisWatchCount++
          totalScoredKpis++
        } else if (k.status === "off_track") {
          kpisOffTrackCount++
          totalScoredKpis++
        }
      }
    }
  }

  const companyScore =
    totalPerspectiveWeight > 0 ? Math.round((totalWeightedScore / totalPerspectiveWeight) * 100) : null

  const summary: CompanyScorecardSummary = {
    companyScore,
    companyStatus: getKpiStatus(companyScore),
    ptsChangeSinceLastMonth,
    kpisOnTrackCount,
    kpisWatchCount,
    kpisOffTrackCount,
    totalScoredKpis,
    totalKpis,
    weakestPerspectiveName,
    weakestPerspectiveScore,
    weakestPerspectiveOffTrackCount,
  }

  return {
    calculatedPerspectives,
    summary,
  }
}
