import * as React from "react"
import type { MetricSegmentItem } from "../types/MetricCardTypes"
import { calculateSegmentPercentages } from "../lib/metric-visual-helpers"

interface MetricVisualSegmentsProps {
  items: MetricSegmentItem[]
}

export function MetricVisualSegments({ items }: MetricVisualSegmentsProps) {
  const calculated = React.useMemo(() => {
    return calculateSegmentPercentages(items)
  }, [items])

  return (
    <div className="flex flex-col justify-center w-full">
      {/* Bar Segmen Horizontal (Tinggi 8px, ujung rounded-full, gap 4px) */}
      <div className="flex h-2 w-full items-center gap-1 overflow-hidden">
        {calculated.map(({ item, percent }) => {
          if (item.value <= 0) return null
          return (
            <div
              key={item.id}
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percent}%`,
                minWidth: "8px",
                backgroundColor: item.color,
              }}
              title={`${item.label}: ${item.value.toLocaleString("id-ID")}`}
            />
          )
        })}
      </div>

      {/* Legenda 2 Kolom (Mulai y≈131, gap-x 16px, tinggi baris 20px) */}
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex h-5 items-center justify-between text-[13px]"
          >
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <span
                className="size-2 shrink-0 rounded-full"
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
