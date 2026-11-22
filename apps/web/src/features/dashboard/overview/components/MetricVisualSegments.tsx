"use client"

import * as React from "react"
import type { MetricSegmentItem } from "../types/MetricCardTypes"
import { calculateSegmentPercentages } from "../lib/metric-visual-helpers"

interface MetricVisualSegmentsProps {
  items: MetricSegmentItem[]
}

export function MetricVisualSegments({ items }: MetricVisualSegmentsProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const segmentRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const [tooltipLeft, setTooltipLeft] = React.useState<number>(0)

  const calculated = React.useMemo(() => {
    return calculateSegmentPercentages(items)
  }, [items])

  const handleMouseEnterSegment = (idx: number) => {
    setHoverIdx(idx)
    const segEl = segmentRefs.current[idx]
    const containerEl = containerRef.current
    if (segEl && containerEl) {
      const segRect = segEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      const center = segRect.left - containerRect.left + segRect.width / 2
      // Batasi tooltip agar tidak meluber keluar tepi card
      const clampedLeft = Math.max(54, Math.min(containerRect.width - 54, center))
      setTooltipLeft(clampedLeft)
    }
  }

  const activeCalculated = hoverIdx !== null ? calculated[hoverIdx] : null

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoverIdx(null)}
      className="relative flex h-[72px] w-full flex-col justify-end select-none"
    >
      {/* Tooltip interaktif floating (identik dengan kartu lainnya) */}
      {activeCalculated && activeCalculated.item.value > 0 ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-popover-foreground shadow-xs whitespace-nowrap transition-[left] duration-75"
          style={{
            left: `${tooltipLeft}px`,
          }}
        >
          {activeCalculated.item.label}: {activeCalculated.item.value.toLocaleString("id-ID")} SL ({activeCalculated.percent.toFixed(1)}%)
        </div>
      ) : null}

      {/* Bar Segmen Horizontal (Tinggi 10px, ujung rounded-[2px] bar kotak, gap 3px) */}
      <div className="flex h-2.5 w-full items-center gap-1 overflow-hidden rounded-[2px] bg-muted/40">
        {calculated.map(({ item, percent }, idx) => {
          if (item.value <= 0) return null
          const isHovered = hoverIdx === idx
          const isOtherHovered = hoverIdx !== null && !isHovered

          return (
            <div
              key={item.id}
              ref={(el) => {
                segmentRefs.current[idx] = el
              }}
              onMouseEnter={() => handleMouseEnterSegment(idx)}
              className={`h-full rounded-[2px] cursor-pointer transition-all duration-200 ${
                isHovered
                  ? "brightness-110 shadow-xs ring-1 ring-border"
                  : isOtherHovered
                    ? "opacity-50"
                    : ""
              }`}
              style={{
                width: `${percent}%`,
                minWidth: "8px",
                backgroundColor: item.color,
              }}
              title={`${item.label}: ${item.value.toLocaleString("id-ID")} (${percent.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      {/* Legenda 2 Kolom (rapi, tinggi proporsional 18px per baris) */}
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex h-[18px] items-center justify-between text-[12px]"
          >
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-muted-foreground font-normal">
                {item.label}
              </span>
            </div>
            <span className="shrink-0 font-medium text-foreground tabular-nums">
              {item.value.toLocaleString("id-ID")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
