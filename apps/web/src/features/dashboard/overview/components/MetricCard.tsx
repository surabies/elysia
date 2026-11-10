import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
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
            color={data.visual.color}
          />
        )
      case "pills":
        return (
          <MetricVisualPills
            values={data.visual.values}
            tone={data.visual.tone}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-[220px] w-full flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card shadow-none select-none transition-colors">
      {/* Bagian Atas: Header, Nilai, Teks Bantu, dan Visual */}
      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-2">
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
        <div className="mt-auto pt-1">{renderVisual()}</div>
      </div>

      {/* 5. Footer Link Aksi (Tinggi 36px, latar #fafafa, border-t 1px) */}
      <Link
        href={data.footer.href}
        className="group flex h-[36px] w-full items-center justify-between border-t border-border bg-[#fafafa] dark:bg-muted/30 px-4 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-normal group-hover:text-foreground transition-colors">
          {data.footer.label}
        </span>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </Link>
    </div>
  )
}
