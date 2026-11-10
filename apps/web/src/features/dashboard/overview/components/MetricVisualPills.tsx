import * as React from "react"
import { calculatePillHeights } from "../lib/metric-visual-helpers"

interface MetricVisualPillsProps {
  values: number[]
  tone?: "problem" | "neutral"
}

export function MetricVisualPills({
  values,
  tone = "neutral",
}: MetricVisualPillsProps) {
  const heights = React.useMemo(() => {
    return calculatePillHeights(values, 56, 8)
  }, [values])

  return (
    <div className="flex h-[56px] w-full items-end justify-between gap-[5px] select-none">
      {heights.map((height, idx) => {
        const isLast = idx === heights.length - 1
        const val = values[idx] ?? 0

        // Penentuan warna isi pil
        let fillClass = ""
        if (tone === "problem") {
          fillClass = isLast ? "bg-rose-500" : "bg-rose-500/45"
        } else {
          fillClass = isLast
            ? "bg-foreground"
            : "bg-foreground/40 dark:bg-foreground/35"
        }

        return (
          <div
            key={idx}
            className="flex h-[56px] flex-1 flex-col justify-end overflow-hidden rounded-full bg-[#f0f0f0] dark:bg-muted"
            title={`Hari ${idx + 1}: ${val}`}
          >
            {height > 0 && (
              <div
                className={`w-full rounded-full transition-all duration-300 ${fillClass}`}
                style={{ height: `${height}px` }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
