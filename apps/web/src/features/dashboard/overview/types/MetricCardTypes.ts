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
  data: number[] // 14 titik volume
  color?: string
}

export interface MetricPillsVisual {
  type: "pills"
  values: number[] // 14 titik harian
  tone?: "problem" | "neutral"
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
  footer: {
    label: string
    href: string
  }
}
