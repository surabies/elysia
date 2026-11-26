import type { LucideIcon } from "lucide-react"

export type DeltaTone = "positive" | "negative" | "neutral"
export type DeltaDirection = "up" | "down" | "neutral"

export interface MetricDelta {
  text: string
  direction: DeltaDirection
  tone: DeltaTone
}

export interface MetricSegmentItem {
  id: string
  label: string
  value: number
  color: string
}

export interface MetricSegmentsVisual {
  type: "segments"
  items: MetricSegmentItem[]
}

export interface MetricSparklineVisual {
  type: "sparkline"
  data: number[] // titik volume
  labels?: string[] // label tanggal (e.g. "Tgl 1", "Tgl 23")
  color?: string
  unit?: string
}

export interface MetricPillsVisual {
  type: "pills"
  values: number[] // titik harian
  labels?: string[] // label tanggal (e.g. "Tgl 1", "Tgl 23")
  tone?: "problem" | "neutral"
  unit?: string
}

export type MetricVisualConfig =
  | MetricSegmentsVisual
  | MetricSparklineVisual
  | MetricPillsVisual

export interface MetricCardData {
  id: string
  title: string
  icon: LucideIcon
  rightLabel: string
  value: string
  denominator?: string
  unit?: string
  delta?: MetricDelta
  helperText: string
  visual: MetricVisualConfig
  footer?: {
    label: string
    href: string
  }
}
