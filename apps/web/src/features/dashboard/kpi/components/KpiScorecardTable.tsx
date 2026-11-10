"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import type {
  CalculatedKpi,
  CalculatedPerspective,
  CompanyScorecardSummary,
  KpiOwner,
  TrendChange,
} from "../types/KpiTypes"
import {
  formatKpiNumber,
  getStatusStyling,
  parseKpiInputValue,
} from "../lib/KpiCalculations"
import { KPI_OWNERS } from "../data/KpiMockData"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface KpiScorecardTableProps {
  perspectives: CalculatedPerspective[]
  summary: CompanyScorecardSummary
  searchQuery: string
  onUpdateKpiValue: (kpiId: string, newValue: number | null) => void
  onUpdateKpiWeight: (kpiId: string, newWeight: number) => void
  onUpdateKpiOwner: (kpiId: string, newOwner: KpiOwner) => void
  onPasteRange: (startKpiId: string, field: "value" | "weight", values: string[]) => void
  onOpenAddKpi?: (objectiveId: string) => void
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 32
  const height = 12

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg className="inline-block shrink-0 overflow-visible" width={width} height={height}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/60"
        points={points}
      />
    </svg>
  )
}

function TrendIndicator({ change }: { change: TrendChange }) {
  if (change.direction === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="size-3 stroke-[2.5]" />
        +{change.diff}
      </span>
    )
  }
  if (change.direction === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
        <ArrowDownRight className="size-3 stroke-[2.5]" />
        {change.diff}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
      <ArrowRight className="size-3 stroke-[2]" />
      {change.diff === 0 ? "0" : change.diff}
    </span>
  )
}

export function KpiScorecardTable({
  perspectives,
  summary,
  searchQuery,
  onUpdateKpiValue,
  onUpdateKpiWeight,
  onUpdateKpiOwner,
  onPasteRange,
  onOpenAddKpi,
}: KpiScorecardTableProps) {
  // Collapse state per perspective dan per objective
  const [collapsedPerspectives, setCollapsedPerspectives] = React.useState<Record<string, boolean>>({})
  const [collapsedObjectives, setCollapsedObjectives] = React.useState<Record<string, boolean>>({})

  // Inline editing state: { kpiId, field: "value" | "weight" }
  const [editingCell, setEditingCell] = React.useState<{
    kpiId: string
    field: "value" | "weight"
  } | null>(null)
  const [editValueText, setEditValueText] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const togglePerspective = (id: string) => {
    setCollapsedPerspectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleObjective = (id: string) => {
    setCollapsedObjectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Fokus ke input saat mulai edit
  React.useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  const handleStartEdit = (kpi: CalculatedKpi, field: "value" | "weight") => {
    setEditingCell({ kpiId: kpi.id, field })
    if (field === "value") {
      setEditValueText(kpi.value !== null ? String(kpi.value) : "")
    } else {
      setEditValueText(String(kpi.weight))
    }
  }

  const handleCommitEdit = (kpi: CalculatedKpi) => {
    if (!editingCell) return
    const { field } = editingCell
    if (field === "value") {
      const parsed = parseKpiInputValue(editValueText, kpi.format, kpi.unitMultiplier)
      onUpdateKpiValue(kpi.id, parsed)
    } else {
      const parsed = parseFloat(editValueText.replace(/[%]/g, "").trim())
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdateKpiWeight(kpi.id, Math.round(parsed))
      }
    }
    setEditingCell(null)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    kpi: CalculatedKpi
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCommitEdit(kpi)
    } else if (e.key === "Escape") {
      setEditingCell(null)
    }
  }

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    kpiId: string,
    field: "value" | "weight"
  ) => {
    const text = e.clipboardData.getData("text")
    if (text.includes("\n") || text.includes("\t")) {
      e.preventDefault()
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
      onPasteRange(kpiId, field, lines)
      setEditingCell(null)
    }
  }

  // Filter KPI berdasarkan pencarian
  const query = searchQuery.trim().toLowerCase()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left text-[12px] tabular-nums select-none">
          {/* Header Tabel Sticky */}
          <thead className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="w-[200px] border-r border-border p-2.5">Tahapan Siklus M2C</th>
              <th className="min-w-[220px] border-r border-border p-2.5">Sasaran & Indikator KPI</th>
              <th className="w-[125px] border-r border-border p-2.5">Penanggung Jawab</th>
              <th className="w-[65px] border-r border-border p-2.5 text-right">Bobot</th>
              <th className="w-[75px] border-r border-border p-2.5 text-right">Baseline</th>
              <th className="w-[85px] border-r border-border p-2.5 text-right text-sky-600 dark:text-sky-400">
                Realisasi
              </th>
              <th className="w-[75px] border-r border-border p-2.5 text-right">Target</th>
              <th className="w-[70px] border-r border-border p-2.5 text-right">Selisih</th>
              <th className="w-[105px] border-r border-border p-2.5">Tren</th>
              <th className="w-[120px] border-r border-border p-2.5">Wilayah Perhatian</th>
              <th className="w-[80px] border-r border-border p-2.5 text-center">Capaian</th>
              <th className="w-[36px] p-2.5 text-center" aria-label="Aksi" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {perspectives.map((perspective) => {
              const isPerspectiveCollapsed = collapsedPerspectives[perspective.id]
              const pStyling = getStatusStyling(perspective.status)

              // Filter objectives & kpis
              const filteredObjectives = perspective.objectives
                .map((obj) => ({
                  ...obj,
                  kpis: obj.kpis.filter((k) =>
                    !query
                      ? true
                      : k.name.toLowerCase().includes(query) ||
                        obj.name.toLowerCase().includes(query) ||
                        k.owner.name.toLowerCase().includes(query)
                  ),
                }))
                .filter((obj) => !query || obj.kpis.length > 0)

              if (query && filteredObjectives.length === 0) return null

              return (
                <React.Fragment key={perspective.id}>
                  {/* Outer Perspective Wrapper */}
                  {filteredObjectives.map((objective, objIdx) => {
                    const isObjCollapsed = collapsedObjectives[objective.id]
                    const objStyling = getStatusStyling(objective.status)

                    return (
                      <React.Fragment key={objective.id}>
                        {/* Baris Objective Header */}
                        <tr className="bg-muted/40 font-medium border-t border-border/80">
                          {/* Perspective Cell hanya dirender di objective pertama jika belum collapse */}
                          {objIdx === 0 && (
                            <td
                              rowSpan={
                                isPerspectiveCollapsed
                                  ? 1
                                  : filteredObjectives.reduce(
                                      (acc, o) =>
                                        acc +
                                        1 +
                                        (collapsedObjectives[o.id] ? 0 : o.kpis.length),
                                      0
                                    )
                              }
                              className="align-top border-r border-border bg-card p-3.5"
                            >
                              <div className="sticky top-12 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-sm font-bold text-foreground">
                                    {perspective.name}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => togglePerspective(perspective.id)}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    title={isPerspectiveCollapsed ? "Tampilkan rincian tahapan" : "Sembunyikan rincian tahapan"}
                                  >
                                    {isPerspectiveCollapsed ? (
                                      <Plus className="size-3.5" />
                                    ) : (
                                      <Minus className="size-3.5" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                                    {perspective.score !== null ? `${perspective.score}%` : "-"}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {perspective.scoreWeightPercent}% dari skor total
                                  </span>
                                </div>

                                {/* Progress bar tipis */}
                                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${perspective.score ?? 0}%` }}
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                                    {perspective.offTrackCount} kritis
                                  </span>
                                  <span className="text-muted-foreground">
                                    dari {perspective.totalKpiCount} indikator
                                  </span>
                                </div>

                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                  {perspective.description}
                                </p>
                              </div>
                            </td>
                          )}

                          {/* Objective Title & Controls */}
                          <td colSpan={9} className="border-r border-border p-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => toggleObjective(objective.id)}
                                className="flex items-center gap-1.5 text-left text-[12px] font-semibold text-foreground hover:text-foreground/80"
                              >
                                {isObjCollapsed ? (
                                  <ChevronRight className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                )}
                                <span>{objective.name}</span>
                                <span className="font-normal text-muted-foreground text-[11px]">
                                  ({objective.kpis.length} indikator)
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenAddKpi?.(objective.id)}
                                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Tambah KPI ke sasaran ini"
                              >
                                <Plus className="size-3" />
                                <span className="text-[10px]">Tambah KPI</span>
                              </button>
                            </div>
                          </td>

                          {/* Progress Objective */}
                          <td
                            className={`border-r border-border p-2 text-center font-bold tabular-nums ${objStyling.bgClass} ${objStyling.textClass}`}
                          >
                            {objective.progress !== null ? `${objective.progress}%` : "-"}
                          </td>
                          <td className="p-2 text-center" />
                        </tr>

                        {/* Baris KPI di bawah Objective */}
                        {!isPerspectiveCollapsed &&
                          !isObjCollapsed &&
                          objective.kpis.map((kpi) => {
                            const isEditingValue =
                              editingCell?.kpiId === kpi.id && editingCell?.field === "value"
                            const isEditingWeight =
                              editingCell?.kpiId === kpi.id && editingCell?.field === "weight"
                            const kpiStyling = getStatusStyling(kpi.status)

                            return (
                              <tr
                                key={kpi.id}
                                className="h-7 hover:bg-muted/20 transition-colors border-t border-border/40"
                              >
                                {/* Objective and KPI Name */}
                                <td className="border-r border-border/60 px-3 py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-medium text-foreground">
                                      {kpi.name}
                                    </span>
                                    <span
                                      className="text-muted-foreground/80 shrink-0"
                                      title={
                                        kpi.direction === "higher"
                                          ? "Higher is better (↑)"
                                          : "Lower is better (↓)"
                                      }
                                    >
                                      {kpi.direction === "higher" ? (
                                        <ArrowUp className="size-3" />
                                      ) : (
                                        <ArrowDown className="size-3" />
                                      )}
                                    </span>
                                  </div>
                                </td>

                                {/* Owner with Avatar & Dropdown */}
                                <td className="border-r border-border/60 px-2.5 py-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-[11px] hover:bg-muted/60"
                                      >
                                        <span className="flex items-center gap-1.5 truncate">
                                          <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-[9px] font-semibold text-zinc-700 dark:text-zinc-200">
                                            {kpi.owner.initials}
                                          </span>
                                          <span className="truncate">{kpi.owner.name}</span>
                                        </span>
                                        <ChevronDown className="size-2.5 text-muted-foreground shrink-0" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-36 text-xs">
                                      {Object.values(KPI_OWNERS).map((owner) => (
                                        <DropdownMenuItem
                                          key={owner.id}
                                          onClick={() => onUpdateKpiOwner(kpi.id, owner)}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
                                            {owner.initials}
                                          </span>
                                          <span>{owner.name}</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>

                                {/* Weight (Editable Blue Figure) */}
                                <td
                                  onClick={() => handleStartEdit(kpi, "weight")}
                                  className="border-r border-border/60 px-2 py-1 text-right cursor-pointer"
                                >
                                  {isEditingWeight ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={editValueText}
                                      onChange={(e) => setEditValueText(e.target.value)}
                                      onBlur={() => handleCommitEdit(kpi)}
                                      onKeyDown={(e) => handleKeyDown(e, kpi)}
                                      onPaste={(e) => handlePaste(e, kpi.id, "weight")}
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 focus:outline-none"
                                    />
                                  ) : (
                                    <span className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                                      {kpi.weight}%
                                    </span>
                                  )}
                                </td>

                                {/* Baseline */}
                                <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                  {formatKpiNumber(kpi.baseline, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* Value (Editable Blue Figure) */}
                                <td
                                  onClick={() => handleStartEdit(kpi, "value")}
                                  className="border-r border-border/60 px-2 py-1 text-right cursor-pointer"
                                >
                                  {isEditingValue ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={editValueText}
                                      onChange={(e) => setEditValueText(e.target.value)}
                                      onBlur={() => handleCommitEdit(kpi)}
                                      onKeyDown={(e) => handleKeyDown(e, kpi)}
                                      onPaste={(e) => handlePaste(e, kpi.id, "value")}
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 focus:outline-none"
                                    />
                                  ) : (
                                    <span
                                      className={`font-semibold hover:underline ${
                                        kpi.value !== null
                                          ? "text-sky-600 dark:text-sky-400"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {formatKpiNumber(kpi.value, kpi.format, {
                                        unitMultiplier: kpi.unitMultiplier,
                                      })}
                                    </span>
                                  )}
                                </td>

                                {/* Target */}
                                <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                  {formatKpiNumber(kpi.target, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* To Go */}
                                <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                  {formatKpiNumber(kpi.toGo, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* Change with Sparkline & Delta */}
                                <td className="border-r border-border/60 px-2.5 py-1">
                                  <div className="flex items-center gap-2">
                                    <MiniSparkline data={kpi.change.sparkline} />
                                    <TrendIndicator change={kpi.change} />
                                  </div>
                                </td>

                                {/* Wilayah / Cabang Perhatian */}
                                <td className="border-r border-border/60 px-2.5 py-1">
                                  {kpi.laggingMarket ? (
                                    <div className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted/70">
                                      <span className="text-xs">📍</span>
                                      <span className="font-semibold text-foreground">
                                        {kpi.laggingMarket.countryName || kpi.laggingMarket.countryCode}
                                      </span>
                                      <span
                                        className={`rounded px-1 text-[10px] ${
                                          kpi.laggingMarket.progress >= 70
                                            ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                                            : kpi.laggingMarket.progress >= 45
                                            ? "text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300"
                                            : "text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
                                        }`}
                                      >
                                        {kpi.laggingMarket.progress}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-[11px] italic">Semua Wilayah</span>
                                  )}
                                </td>

                                {/* Progress */}
                                <td
                                  className={`border-r border-border/60 px-2 py-1 text-center font-bold tabular-nums ${kpiStyling.bgClass} ${kpiStyling.textClass}`}
                                >
                                  {kpi.progress !== null ? `${kpi.progress}%` : "-"}
                                </td>

                                {/* Actions Menu */}
                                <td className="px-1 py-1 text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        title="Aksi baris"
                                      >
                                        <MoreVertical className="size-3.5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 text-xs">
                                      <DropdownMenuItem
                                        onClick={() => handleStartEdit(kpi, "value")}
                                        className="cursor-pointer"
                                      >
                                        Ubah Nilai Realisasi
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleStartEdit(kpi, "weight")}
                                        className="cursor-pointer"
                                      >
                                        Ubah Bobot Kontribusi
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            )
                          })}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>

          {/* Sticky Footer Total Scorecard */}
          <tfoot className="sticky bottom-0 z-20 border-t-2 border-border bg-muted/90 backdrop-blur-sm font-semibold text-[11px] text-foreground">
            <tr>
              <td className="border-r border-border p-2.5">
                <div className="font-bold uppercase tracking-wider text-[11px]">
                  TOTAL CAPAIAN SKOR M2C
                </div>
                <div className="text-[10px] font-normal text-muted-foreground">
                  {summary.kpisOnTrackCount} dari {summary.totalScoredKpis} KPI sesuai target
                </div>
              </td>
              <td className="border-r border-border p-2.5 text-muted-foreground">
                5 Peran Aktor
              </td>
              <td className="border-r border-border p-2.5 text-muted-foreground">
                —
              </td>
              <td className="border-r border-border p-2.5 text-right font-bold text-foreground">
                100% Total
              </td>
              <td className="border-r border-border p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                {summary.kpisOnTrackCount} tercapai
              </td>
              <td className="border-r border-border p-2.5 text-right text-amber-600 dark:text-amber-400 font-semibold">
                {summary.kpisWatchCount} perhatian
              </td>
              <td className="border-r border-border p-2.5 text-right text-rose-600 dark:text-rose-400 font-semibold">
                {summary.kpisOffTrackCount} kritis
              </td>
              <td className="border-r border-border p-2.5 text-right text-muted-foreground font-normal">
                1 belum ada data
              </td>
              <td className="border-r border-border p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <MiniSparkline data={[58, 59, 59.5, 60.2, 60.8, 61]} />
                  <span>+{summary.ptsChangeSinceLastMonth} poin bln lalu</span>
                </div>
              </td>
              <td className="border-r border-border p-2.5">
                <div className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                  <span>📍</span>
                  <span>Semua wilayah aktif</span>
                </div>
              </td>
              <td className="border-r border-border p-2.5 text-center bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <div className="text-sm font-bold">{summary.companyScore}%</div>
                <div className="text-[9px] uppercase font-semibold">Perhatian</div>
              </td>
              <td className="p-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legenda Baris Paling Bawah */}
      <div className="flex flex-col gap-2 border-t border-border bg-card p-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground">
          <span className="font-semibold text-sky-600 dark:text-sky-400">Angka biru</span> adalah input realisasi bulanan. Klik cell untuk mengedit langsung, paste dari Excel, atau tekan <kbd className="rounded border border-border bg-muted px-1 text-[10px]">Ctrl+Z</kbd> untuk membatalkan.
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Sesuai Target (≥ 70%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Perhatian (45% - 69%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span>Kritis (&lt; 45%)</span>
          </span>
        </div>
      </div>
    </div>
  )
}
