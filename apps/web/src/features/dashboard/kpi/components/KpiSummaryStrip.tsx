"use client"

import * as React from "react"
import type { CompanyScorecardSummary } from "../types/KpiTypes"
import { getStatusStyling } from "../lib/KpiCalculations"

interface KpiSummaryStripProps {
  summary: CompanyScorecardSummary
}

export function KpiSummaryStrip({ summary }: KpiSummaryStripProps) {
  const companyStyling = getStatusStyling(summary.companyStatus)

  return (
    <div className="grid grid-cols-1 divide-y divide-border border-b border-border bg-card/60 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
      {/* Sel 1: Skor Efektivitas M2C */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Skor Efektivitas M2C
        </span>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {summary.companyScore !== null ? `${summary.companyScore}%` : "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            <span className={`font-semibold ${companyStyling.textClass}`}>
              {companyStyling.label}
            </span>
            , +{summary.ptsChangeSinceLastMonth} poin dari bln lalu
          </span>
        </div>
      </div>

      {/* Sel 2: Indikator Sesuai Target */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Indikator Sesuai Target
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {summary.kpisOnTrackCount}
          </span>
          <span className="text-xs text-muted-foreground">
            dari {summary.totalScoredKpis} indikator aktif
          </span>
        </div>
      </div>

      {/* Sel 3: Perspektif Perlu Perhatian */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Tahapan Perlu Perhatian
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {summary.weakestPerspectiveScore !== null
              ? `${summary.weakestPerspectiveScore}%`
              : "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {summary.weakestPerspectiveName ?? "N/A"},{" "}
            {summary.weakestPerspectiveOffTrackCount} indikator kritis
          </span>
        </div>
      </div>

      {/* Sel 4: Distribusi Status Indikator */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Status Indikator
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {summary.kpisOnTrackCount}{" "}
            <span className="text-muted-foreground/50 font-normal">/</span>{" "}
            {summary.kpisWatchCount}{" "}
            <span className="text-muted-foreground/50 font-normal">/</span>{" "}
            {summary.kpisOffTrackCount}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            Sesuai Target
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" />
            Perhatian
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-rose-500" />
            Kritis
          </span>
        </div>
      </div>
    </div>
  )
}
