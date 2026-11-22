"use client"

import * as React from "react"
import { calculatePillHeights } from "../lib/metric-visual-helpers"

interface MetricVisualPillsProps {
  values: number[]
  labels?: string[]
  tone?: "problem" | "neutral"
  unit?: string
}

export function MetricVisualPills({
  values,
  labels,
  tone = "neutral",
  unit,
}: MetricVisualPillsProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const barRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const [tooltipLeft, setTooltipLeft] = React.useState<number>(0)

  // Hitung tinggi tiap bar (maksimal 52px dari total container 72px)
  const heights = React.useMemo(() => {
    return calculatePillHeights(values, 52, 6)
  }, [values])

  const handleMouseEnterBar = (idx: number) => {
    setHoverIdx(idx)
    const barEl = barRefs.current[idx]
    const containerEl = containerRef.current
    if (barEl && containerEl) {
      const barRect = barEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      const center = barRect.left - containerRect.left + barRect.width / 2
      // Batasi tooltip agar tidak meluber keluar tepi card
      const clampedLeft = Math.max(38, Math.min(containerRect.width - 38, center))
      setTooltipLeft(clampedLeft)
    }
  }

  const handleMouseLeave = () => {
    setHoverIdx(null)
  }

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
      className="relative flex h-[72px] w-full flex-col justify-end select-none"
    >
      {/* Tooltip interaktif floating (identik dengan kartu Kubikasi Air) */}
      {hoverIdx !== null ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-popover-foreground shadow-xs whitespace-nowrap transition-[left] duration-75"
          style={{
            left: `${tooltipLeft}px`,
          }}
        >
          {labels && labels[hoverIdx] ? labels[hoverIdx] : `Tgl ${hoverIdx + 1}`}: {(values[hoverIdx] ?? 0).toLocaleString("id-ID")}
          {unit ? ` ${unit}` : ""}
        </div>
      ) : null}

      {/* Grid Bar Kotak (sudut rounded-[2px], tidak bulat kapsul, tidak tajam 0px) */}
      <div className="flex h-[52px] w-full items-end justify-between gap-[5px]">
        {heights.map((height, idx) => {
          const isHovered = hoverIdx === idx
          const isOtherHovered = hoverIdx !== null && !isHovered
          const isLast = idx === heights.length - 1
          const val = values[idx] ?? 0

          // Penentuan warna isi bar kotak
          let fillClass = ""
          if (tone === "problem") {
            if (isHovered) {
              fillClass = "bg-rose-500 shadow-xs brightness-110"
            } else if (isLast) {
              fillClass = isOtherHovered ? "bg-rose-500/70" : "bg-rose-500"
            } else {
              fillClass = isOtherHovered
                ? "bg-rose-500/30"
                : "bg-rose-500/60 dark:bg-rose-500/50"
            }
          } else {
            if (isHovered) {
              fillClass = "bg-[#0070f3] dark:bg-[var(--ds-blue-700)] shadow-xs brightness-110"
            } else if (isLast) {
              fillClass = isOtherHovered ? "bg-[#0070f3]/70 dark:bg-[var(--ds-blue-700)]/70" : "bg-[#0070f3] dark:bg-[var(--ds-blue-700)]"
            } else {
              fillClass = isOtherHovered
                ? "bg-[#0070f3]/25 dark:bg-[var(--ds-blue-700)]/20"
                : "bg-[#0070f3]/80 dark:bg-[var(--ds-blue-700)]/70"
            }
          }

          return (
            <div
              key={idx}
              ref={(el) => {
                barRefs.current[idx] = el
              }}
              onMouseEnter={() => handleMouseEnterBar(idx)}
              className={`group/bar relative flex h-[52px] flex-1 flex-col justify-end overflow-hidden rounded-[2px] cursor-pointer transition-colors ${
                isHovered
                  ? "bg-muted/90 dark:bg-muted/70 ring-1 ring-border"
                  : "bg-muted/40 dark:bg-muted/30"
              }`}
              title={`${labels && labels[idx] ? labels[idx] : `Tgl ${idx + 1}`}: ${val.toLocaleString("id-ID")}${unit ? ` ${unit}` : ""}`}
            >
              {height > 0 && (
                <div
                  className={`w-full rounded-[2px] transition-all duration-200 ${fillClass}`}
                  style={{ height: `${height}px` }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
