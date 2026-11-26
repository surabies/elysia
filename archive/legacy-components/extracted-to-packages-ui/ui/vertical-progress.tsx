"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface VerticalProgressSegment {
  ratio: number
  colorClass: string
  label?: string
}

export interface VerticalProgressProps {
  /** Nilai progres dalam persen 0 - 100 */
  value?: number
  /** Maksimum nilai jika bukan 100 */
  max?: number
  /** Jumlah strip bar vertikal (default: 20) */
  ticks?: number
  /** Warna tunggal jika tidak menggunakan segments */
  variant?: "default" | "green" | "emerald" | "blue" | "amber" | "red" | "rose"
  /** Multi-segmen warna (misal: normal vs anomali) */
  segments?: VerticalProgressSegment[]
  /** Label aksesibilitas */
  ariaLabel?: string
  /** Tinggi strip vertikal */
  heightClass?: string
  /** Gap antar strip vertikal */
  gapClass?: string
  className?: string
}

const VARIANT_COLOR_MAP: Record<string, string> = {
  default: "bg-foreground/80 dark:bg-foreground/90",
  green: "bg-emerald-500 dark:bg-emerald-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  blue: "bg-blue-600 dark:bg-blue-500",
  amber: "bg-amber-500 dark:bg-amber-400",
  red: "bg-rose-500 dark:bg-rose-400",
  rose: "bg-rose-500 dark:bg-rose-400",
}

export function VerticalProgress({
  value,
  max = 100,
  ticks = 20,
  variant = "emerald",
  segments,
  ariaLabel,
  heightClass = "h-2.5",
  gapClass = "gap-[2px]",
  className,
}: VerticalProgressProps) {
  const tickColors: string[] = []

  if (segments && segments.length > 0) {
    for (const seg of segments) {
      const clamped = Math.max(0, Math.min(1, seg.ratio))
      let count = Math.round(clamped * ticks)
      if (clamped > 0 && count === 0) count = 1
      for (let i = 0; i < count && tickColors.length < ticks; i++) {
        tickColors.push(seg.colorClass)
      }
    }
  } else {
    const rawVal = value ?? 0
    const ratio = Math.max(0, Math.min(1, max > 0 ? rawVal / max : 0))
    let count = Math.round(ratio * ticks)
    if (ratio > 0 && count === 0) count = 1
    const activeColor = VARIANT_COLOR_MAP[variant] || VARIANT_COLOR_MAP.emerald

    for (let i = 0; i < count && tickColors.length < ticks; i++) {
      tickColors.push(activeColor)
    }
  }

  while (tickColors.length < ticks) {
    tickColors.push("bg-border/80 dark:bg-muted/70")
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel || `${Math.round(value ?? 0)}%`}
      className={cn("flex w-full items-center", heightClass, gapClass, className)}
    >
      {tickColors.map((colorClass, idx) => (
        <span
          key={idx}
          className={cn(
            "h-full flex-1 rounded-[1.5px] transition-colors duration-200",
            colorClass
          )}
        />
      ))}
    </div>
  )
}
