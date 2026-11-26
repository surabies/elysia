import * as React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { MetricCardData } from "../types/MetricCardTypes"
import { MetricVisualSegments } from "./MetricVisualSegments"
import { MetricVisualSparkline } from "./MetricVisualSparkline"
import { MetricVisualPills } from "./MetricVisualPills"

interface MetricCardProps {
  data: MetricCardData
}

export function MetricCard({ data }: MetricCardProps) {
  const Icon = data.icon

  // Styling delta (arah panah dan warna terpisah)
  const renderDelta = () => {
    if (!data.delta) return null
    const { text, direction, tone } = data.delta

    let toneColor = "text-muted-foreground"
    if (tone === "positive") {
      toneColor = "text-[#12b76a] dark:text-emerald-400"
    } else if (tone === "negative") {
      toneColor = "text-[#e5202e] dark:text-rose-400"
    }

    return (
      <span className={`inline-flex items-center gap-0.5 font-mono text-[12px] font-medium ${toneColor}`}>
        {direction === "up" && <ArrowUp className="size-3 stroke-[2]" />}
        {direction === "down" && <ArrowDown className="size-3 stroke-[2]" />}
        <span>{text}</span>
      </span>
    )
  }

  // Render zona visual sesuai varian
  const renderVisual = () => {
    switch (data.visual.type) {
      case "segments":
        return <MetricVisualSegments items={data.visual.items} />
      case "sparkline":
        return (
          <MetricVisualSparkline
            data={data.visual.data}
            labels={data.visual.labels}
            color={data.visual.color}
            unit={data.visual.unit || data.unit}
          />
        )
      case "pills":
        return (
          <MetricVisualPills
            values={data.visual.values}
            labels={data.visual.labels}
            tone={data.visual.tone}
            unit={data.visual.unit || (data.id === "laju-harian" ? "SL" : data.unit)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-[196px] w-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 shadow-none select-none transition-all hover:border-foreground/20 hover:shadow-xs">
      {/* Bagian Atas: Header, Nilai, Teks Bantu, dan Visual */}
      <div className="flex flex-1 flex-col">
        {/* 1. Baris Judul (Ikon 16px di kiri + Judul 15px/500 + Label Kanan 12.5px) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="size-4 shrink-0 text-foreground/85 stroke-[1.5]" />
            <h3 className="truncate text-[15px] font-medium text-foreground tracking-tight">
              {data.title}
            </h3>
          </div>
          <span className="shrink-0 text-[12.5px] font-normal text-muted-foreground">
            {data.rightLabel}
          </span>
        </div>

        {/* 2. Baris Nilai & Delta (Angka 28px/600, Penyebut 18px/400, Delta 12px) */}
        <div className="mt-1 flex items-baseline gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-semibold text-foreground tracking-tight tabular-nums leading-none">
              {data.value}
            </span>
            {data.denominator && (
              <span className="text-[18px] font-normal text-muted-foreground tabular-nums">
                {data.denominator}
              </span>
            )}
            {data.unit && (
              <span className="text-[16px] font-normal text-muted-foreground">
                {data.unit}
              </span>
            )}
          </div>
          {renderDelta()}
        </div>

        {/* 3. Teks Bantu (13px abu-abu) */}
        <p className="mt-0.5 text-[13px] text-muted-foreground truncate">
          {data.helperText}
        </p>

        {/* 4. Zona Visual (y≈108 - 184) */}
        <div className="mt-auto pt-3">{renderVisual()}</div>
      </div>
    </div>
  )
}
