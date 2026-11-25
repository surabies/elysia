"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { toast } from "sonner"
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

interface KpiScorecardTableProps {
  perspectives: CalculatedPerspective[]
  summary: CompanyScorecardSummary
  searchQuery: string
  availableOwners?: KpiOwner[]
  onUpdateKpiValue: (kpiId: string, newValue: number | null) => void
  onUpdateKpiWeight: (kpiId: string, newWeight: number) => void
  onUpdateKpiOwner: (kpiId: string, newOwner: KpiOwner) => void
  onPasteRange: (
    startKpiId: string,
    field: "value" | "weight",
    values: string[]
  ) => void
  onAddKpiInline?: (kpi: {
    name: string
    objectiveId: string
    ownerId: string
    direction: "higher" | "lower"
    weight: number
    baseline: number
    target: number
    value: number | null
    format: "percent" | "decimal" | "currency"
    ownerDetails?: { name: string; initials: string }
  }) => Promise<void> | void
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
    <svg
      className="inline-block shrink-0 overflow-visible"
      width={width}
      height={height}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
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
  availableOwners = [],
  onUpdateKpiValue,
  onUpdateKpiWeight,
  onUpdateKpiOwner,
  onPasteRange,
  onAddKpiInline,
}: KpiScorecardTableProps) {
  // Collapse state per perspective dan per objective
  const [collapsedPerspectives, setCollapsedPerspectives] = React.useState<
    Record<string, boolean>
  >({})
  const [collapsedObjectives, setCollapsedObjectives] = React.useState<
    Record<string, boolean>
  >({})

  // Inline editing state untuk realisasi (value) & bobot (weight)
  const [editingCell, setEditingCell] = React.useState<{
    kpiId: string
    field: "value" | "weight"
  } | null>(null)
  const [editValueText, setEditValueText] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // State tambah baris baru saat klik (+) pada objective (perilaku Excel: ditulis sendiri, tanpa select menu)
  const [addingInObjectiveId, setAddingInObjectiveId] = React.useState<
    string | null
  >(null)
  const [newKpiName, setNewKpiName] = React.useState("")
  const [newKpiOwnerName, setNewKpiOwnerName] = React.useState("")
  const [newKpiWeight, setNewKpiWeight] = React.useState("10")
  const [newKpiBaseline, setNewKpiBaseline] = React.useState("0")
  const [newKpiValue, setNewKpiValue] = React.useState("")
  const [newKpiTarget, setNewKpiTarget] = React.useState("100")
  const [savingRow, setSavingRow] = React.useState(false)

  const togglePerspective = (id: string) => {
    setCollapsedPerspectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleObjective = (id: string) => {
    setCollapsedObjectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Fokus ke input saat mulai edit cell
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
      const parsed = parseKpiInputValue(
        editValueText,
        kpi.format,
        kpi.unitMultiplier
      )
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
    const text = e.clipboardData.getData("text/plain")
    if (text && (text.includes("\n") || text.includes("\t"))) {
      e.preventDefault()
      const rows = text
        .split(/\r\n|\n|\r/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
      onPasteRange(kpiId, field, rows)
      setEditingCell(null)
    }
  }

  // Handler klik (+) untuk memunculkan baris baru di bawah daftar yang sudah ada
  const handleStartAddRow = (objectiveId: string) => {
    setCollapsedObjectives((prev) => ({ ...prev, [objectiveId]: false }))
    setAddingInObjectiveId(objectiveId)
    setNewKpiName("")
    setNewKpiOwnerName(availableOwners[0]?.name || "Petugas")
    setNewKpiWeight("10")
    setNewKpiBaseline("0")
    setNewKpiValue("")
    setNewKpiTarget("100")
  }

  // Handler simpan baris baru (ditulis sendiri seperti di Excel, simpan saat tekan Enter)
  const handleSaveRow = async (objectiveId: string) => {
    if (!newKpiName.trim()) {
      toast.error("Nama indikator KPI wajib diisi")
      return
    }

    setSavingRow(true)
    try {
      const trimmedOwner = newKpiOwnerName.trim()
      const matchedOwner = availableOwners.find(
        (o) => o.name.toLowerCase() === trimmedOwner.toLowerCase()
      )
      const ownerId = matchedOwner?.id || availableOwners[0]?.id || "admin"

      if (onAddKpiInline) {
        await onAddKpiInline({
          name: newKpiName.trim(),
          objectiveId,
          ownerId,
          direction: "higher",
          weight: Number(newKpiWeight) || 10,
          baseline: Number(newKpiBaseline) || 0,
          target: Number(newKpiTarget) || 100,
          value: newKpiValue.trim() !== "" ? Number(newKpiValue) : null,
          format: "percent",
          ownerDetails: {
            name: trimmedOwner || "Petugas",
            initials: (trimmedOwner || "P").slice(0, 2).toUpperCase(),
          },
        })
      }
      setAddingInObjectiveId(null)
      setNewKpiName("")
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan baris baru")
    } finally {
      setSavingRow(false)
    }
  }

  // Filter KPI berdasarkan pencarian
  const query = searchQuery.trim().toLowerCase()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left text-[12px] tabular-nums select-none">
          {/* Header Tabel Sticky (Perilaku Excel: Garis grid lurus tanpa rounded) */}
          <thead className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="w-[190px] border-r border-border p-2">
                Tahapan Siklus M2C
              </th>
              <th className="min-w-[240px] border-r border-border p-2">
                Sasaran &amp; Indikator KPI
              </th>
              <th className="w-[130px] border-r border-border p-2">
                Penanggung Jawab
              </th>
              <th className="w-[70px] border-r border-border p-2 text-right">
                Bobot
              </th>
              <th className="w-[75px] border-r border-border p-2 text-right">
                Baseline
              </th>
              <th className="w-[85px] border-r border-border p-2 text-right text-sky-600 dark:text-sky-400">
                Realisasi
              </th>
              <th className="w-[75px] border-r border-border p-2 text-right">
                Target
              </th>
              <th className="w-[70px] border-r border-border p-2 text-right">
                Selisih
              </th>
              <th className="w-[100px] border-r border-border p-2">Tren</th>
              <th className="w-[115px] border-r border-border p-2">
                Wilayah Perhatian
              </th>
              <th className="w-[80px] p-2 text-center">Capaian</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {perspectives.map((perspective) => {
              const isPerspectiveCollapsed =
                collapsedPerspectives[perspective.id]
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
                  {filteredObjectives.map((objective, objIdx) => {
                    const isObjCollapsed = collapsedObjectives[objective.id]
                    const objStyling = getStatusStyling(objective.status)
                    const isAddingHere = addingInObjectiveId === objective.id

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
                                        (collapsedObjectives[o.id]
                                          ? 0
                                          : o.kpis.length +
                                            (addingInObjectiveId === o.id
                                              ? 1
                                              : 0)),
                                      0
                                    )
                              }
                              className="align-top border-r border-border bg-card p-3"
                            >
                              <div className="sticky top-12 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-xs font-bold text-foreground">
                                    {perspective.name}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePerspective(perspective.id)
                                    }
                                    className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    title={
                                      isPerspectiveCollapsed
                                        ? "Tampilkan rincian tahapan"
                                        : "Sembunyikan rincian tahapan"
                                    }
                                  >
                                    {isPerspectiveCollapsed ? (
                                      <Plus className="size-3.5" />
                                    ) : (
                                      <Minus className="size-3.5" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                                    {perspective.score !== null
                                      ? `${perspective.score}%`
                                      : "-"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {perspective.scoreWeightPercent}% skor
                                  </span>
                                </div>

                                {/* Progress bar tipis */}
                                <div className="h-1 w-full overflow-hidden bg-muted">
                                  <div
                                    className="h-full bg-amber-500"
                                    style={{
                                      width: `${perspective.score ?? 0}%`,
                                    }}
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="px-1 py-0.2 font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                                    {perspective.offTrackCount} kritis
                                  </span>
                                  <span className="text-muted-foreground">
                                    dari {perspective.totalKpiCount} indikator
                                  </span>
                                </div>

                                <p className="text-[10px] leading-relaxed text-muted-foreground">
                                  {perspective.description}
                                </p>
                              </div>
                            </td>
                          )}

                          {/* Objective Title & Controls (Icon Plus di samping Icon Arrow) */}
                          <td
                            colSpan={9}
                            className="border-r border-border p-2"
                          >
                            <div className="flex items-center gap-1.5">
                              {/* Icon Arrow Chevron */}
                              <button
                                type="button"
                                onClick={() =>
                                  toggleObjective(objective.id)
                                }
                                className="p-0.5 text-muted-foreground hover:text-foreground"
                                title={
                                  isObjCollapsed
                                    ? "Buka sasaran"
                                    : "Tutup sasaran"
                                }
                              >
                                {isObjCollapsed ? (
                                  <ChevronRight className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                )}
                              </button>

                              {/* Icon Plus (+) di samping Arrow */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartAddRow(objective.id)
                                }
                                className="p-0.5 text-muted-foreground hover:text-sky-600 hover:bg-muted"
                                title="Tambah baris baru di bawah daftar"
                              >
                                <Plus className="size-3.5 stroke-[2.5]" />
                              </button>

                              {/* Nama Sasaran */}
                              <span className="font-semibold text-foreground text-xs ml-0.5">
                                {objective.name}
                              </span>
                              <span className="font-normal text-muted-foreground text-[11px]">
                                ({objective.kpis.length} indikator)
                              </span>
                            </div>
                          </td>

                          {/* Progress Objective */}
                          <td
                            className={`p-2 text-center font-bold tabular-nums text-xs ${objStyling.bgClass} ${objStyling.textClass}`}
                          >
                            {objective.progress !== null
                              ? `${objective.progress}%`
                              : "-"}
                          </td>
                        </tr>

                        {/* Baris-baris KPI di bawah Objective (Perilaku Excel: Grid lurus, teks langsung) */}
                        {!isPerspectiveCollapsed &&
                          !isObjCollapsed &&
                          objective.kpis.map((kpi) => {
                            const isEditingValue =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "value"
                            const isEditingWeight =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "weight"
                            const kpiStyling = getStatusStyling(kpi.status)

                            return (
                              <tr
                                key={kpi.id}
                                className="h-7 hover:bg-muted/20 transition-colors border-t border-border/40"
                              >
                                {/* Objective and KPI Name */}
                                <td className="border-r border-border/60 px-2.5 py-1">
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
                                        <ArrowUp className="size-3 text-emerald-600" />
                                      ) : (
                                        <ArrowDown className="size-3 text-amber-600" />
                                      )}
                                    </span>
                                  </div>
                                </td>

                                {/* Penanggung Jawab (Teks murni layaknya Excel, tanpa rounded badge atau select) */}
                                <td className="border-r border-border/60 px-2 py-1 text-foreground text-xs truncate">
                                  {kpi.owner.name}
                                </td>

                                {/* Weight (Editable Blue Figure - Input edge-to-edge seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "weight")
                                  }
                                  className="border-r border-border/60 p-0 text-right cursor-cell"
                                >
                                  {isEditingWeight ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={editValueText}
                                      onChange={(e) =>
                                        setEditValueText(e.target.value)
                                      }
                                      onBlur={() => handleCommitEdit(kpi)}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, kpi)
                                      }
                                      onPaste={(e) =>
                                        handlePaste(e, kpi.id, "weight")
                                      }
                                      className="w-full h-full bg-background px-2 py-1 text-right text-xs font-semibold text-sky-600 outline-none ring-2 ring-inset ring-sky-600 border-0 font-mono"
                                    />
                                  ) : (
                                    <div className="px-2 py-1 font-semibold text-sky-600 dark:text-sky-400 font-mono">
                                      {kpi.weight}%
                                    </div>
                                  )}
                                </td>

                                {/* Baseline */}
                                <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground font-mono">
                                  {formatKpiNumber(kpi.baseline, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* Value (Editable Blue Figure - Input edge-to-edge seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "value")
                                  }
                                  className="border-r border-border/60 p-0 text-right cursor-cell"
                                >
                                  {isEditingValue ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={editValueText}
                                      onChange={(e) =>
                                        setEditValueText(e.target.value)
                                      }
                                      onBlur={() => handleCommitEdit(kpi)}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, kpi)
                                      }
                                      onPaste={(e) =>
                                        handlePaste(e, kpi.id, "value")
                                      }
                                      className="w-full h-full bg-background px-2 py-1 text-right text-xs font-semibold text-sky-600 outline-none ring-2 ring-inset ring-sky-600 border-0 font-mono"
                                    />
                                  ) : (
                                    <div
                                      className={`px-2 py-1 font-semibold font-mono ${
                                        kpi.value !== null
                                          ? "text-sky-600 dark:text-sky-400"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {formatKpiNumber(
                                        kpi.value,
                                        kpi.format,
                                        {
                                          unitMultiplier:
                                            kpi.unitMultiplier,
                                        }
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Target */}
                                <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground font-mono">
                                  {formatKpiNumber(kpi.target, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* Selisih (To Go) */}
                                <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground font-mono">
                                  {formatKpiNumber(kpi.toGo, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* Tren with Sparkline & Delta */}
                                <td className="border-r border-border/60 px-2 py-1">
                                  <div className="flex items-center gap-2">
                                    <MiniSparkline
                                      data={kpi.change.sparkline}
                                    />
                                    <TrendIndicator change={kpi.change} />
                                  </div>
                                </td>

                                {/* Wilayah / Cabang Perhatian */}
                                <td className="border-r border-border/60 px-2.5 py-1 text-xs">
                                  {kpi.laggingMarket ? (
                                    <span className="font-semibold text-foreground truncate">
                                      📍{" "}
                                      {kpi.laggingMarket.countryName ||
                                        kpi.laggingMarket.countryCode}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">
                                      Semua
                                    </span>
                                  )}
                                </td>

                                {/* Capaian Progress */}
                                <td
                                  className={`p-1 text-center font-bold tabular-nums text-xs ${kpiStyling.bgClass} ${kpiStyling.textClass}`}
                                >
                                  {kpi.progress !== null
                                    ? `${kpi.progress}%`
                                    : "-"}
                                </td>
                              </tr>
                            )
                          })}

                        {/* Baris Baru di Bawah Daftar (Perilaku Excel: Seluruh input ditulis sendiri di cell, Enter untuk simpan) */}
                        {!isPerspectiveCollapsed &&
                          !isObjCollapsed &&
                          isAddingHere && (
                            <tr className="h-7 bg-muted/20 border-t border-border/60">
                              {/* Kolom 2: Nama KPI (Input sel polos) */}
                              <td className="border-r border-border/60 p-0">
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="Nama KPI..."
                                  value={newKpiName}
                                  onChange={(e) =>
                                    setNewKpiName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveRow(objective.id)
                                    } else if (e.key === "Escape") {
                                      setAddingInObjectiveId(null)
                                    }
                                  }}
                                  className="w-full h-full bg-background px-2 py-1 text-xs text-foreground outline-none ring-2 ring-inset ring-sky-600 border-0"
                                />
                              </td>

                              {/* Kolom 3: Penanggung Jawab (Ditulis sendiri, tanpa select menu) */}
                              <td className="border-r border-border/60 p-0">
                                <input
                                  type="text"
                                  placeholder="Penanggung Jawab..."
                                  value={newKpiOwnerName}
                                  onChange={(e) =>
                                    setNewKpiOwnerName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveRow(objective.id)
                                    } else if (e.key === "Escape") {
                                      setAddingInObjectiveId(null)
                                    }
                                  }}
                                  className="w-full h-full bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600 border-0"
                                />
                              </td>

                              {/* Kolom 4: Bobot */}
                              <td className="border-r border-border/60 p-0 text-right">
                                <input
                                  type="number"
                                  value={newKpiWeight}
                                  onChange={(e) =>
                                    setNewKpiWeight(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveRow(objective.id)
                                    } else if (e.key === "Escape") {
                                      setAddingInObjectiveId(null)
                                    }
                                  }}
                                  className="w-full h-full bg-background px-2 py-1 text-right text-xs font-mono font-semibold text-sky-600 outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600 border-0"
                                />
                              </td>

                              {/* Kolom 5: Baseline */}
                              <td className="border-r border-border/60 p-0 text-right">
                                <input
                                  type="number"
                                  value={newKpiBaseline}
                                  onChange={(e) =>
                                    setNewKpiBaseline(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveRow(objective.id)
                                    } else if (e.key === "Escape") {
                                      setAddingInObjectiveId(null)
                                    }
                                  }}
                                  className="w-full h-full bg-background px-2 py-1 text-right text-xs font-mono outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600 border-0"
                                />
                              </td>

                              {/* Kolom 6: Realisasi */}
                              <td className="border-r border-border/60 p-0 text-right">
                                <input
                                  type="number"
                                  placeholder="-"
                                  value={newKpiValue}
                                  onChange={(e) =>
                                    setNewKpiValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveRow(objective.id)
                                    } else if (e.key === "Escape") {
                                      setAddingInObjectiveId(null)
                                    }
                                  }}
                                  className="w-full h-full bg-background px-2 py-1 text-right text-xs font-mono text-sky-600 font-semibold outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600 border-0"
                                />
                              </td>

                              {/* Kolom 7: Target */}
                              <td className="border-r border-border/60 p-0 text-right">
                                <input
                                  type="number"
                                  value={newKpiTarget}
                                  onChange={(e) =>
                                    setNewKpiTarget(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveRow(objective.id)
                                    } else if (e.key === "Escape") {
                                      setAddingInObjectiveId(null)
                                    }
                                  }}
                                  className="w-full h-full bg-background px-2 py-1 text-right text-xs font-mono outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600 border-0"
                                />
                              </td>

                              {/* Kolom 8: Selisih */}
                              <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground text-xs font-mono">
                                -
                              </td>

                              {/* Kolom 9: Tren */}
                              <td className="border-r border-border/60 px-2 py-1 text-muted-foreground text-xs">
                                -
                              </td>

                              {/* Kolom 10: Wilayah */}
                              <td className="border-r border-border/60 px-2 py-1 text-[11px] text-muted-foreground italic">
                                Semua
                              </td>

                              {/* Kolom 11: Capaian (Indikator tekan Enter untuk simpan) */}
                              <td className="p-1 text-center text-[10px] text-sky-600 font-medium">
                                {savingRow ? "Menyimpan..." : "↵ Enter"}
                              </td>
                            </tr>
                          )}
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
              <td className="border-r border-border p-2">
                <div className="font-bold uppercase tracking-wider text-[11px]">
                  TOTAL CAPAIAN SKOR M2C
                </div>
                <div className="text-[10px] font-normal text-muted-foreground">
                  {summary.kpisOnTrackCount} dari {summary.totalScoredKpis} KPI
                  sesuai target
                </div>
              </td>
              <td className="border-r border-border p-2 text-muted-foreground">
                5 Peran Aktor
              </td>
              <td className="border-r border-border p-2 text-muted-foreground">
                —
              </td>
              <td className="border-r border-border p-2 text-right font-bold text-foreground">
                100% Total
              </td>
              <td className="border-r border-border p-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                {summary.kpisOnTrackCount} tercapai
              </td>
              <td className="border-r border-border p-2 text-right text-amber-600 dark:text-amber-400 font-semibold">
                {summary.kpisWatchCount} perhatian
              </td>
              <td className="border-r border-border p-2 text-right text-rose-600 dark:text-rose-400 font-semibold">
                {summary.kpisOffTrackCount} kritis
              </td>
              <td className="border-r border-border p-2 text-right text-muted-foreground font-normal">
                -
              </td>
              <td className="border-r border-border p-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <MiniSparkline data={[58, 59, 59.5, 60.2, 60.8, 61]} />
                  <span>+{summary.ptsChangeSinceLastMonth} poin bln lalu</span>
                </div>
              </td>
              <td className="border-r border-border p-2">
                <div className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                  <span>📍</span>
                  <span>Semua wilayah aktif</span>
                </div>
              </td>
              <td className="p-2 text-center bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <div className="text-sm font-bold">{summary.companyScore}%</div>
                <div className="text-[9px] uppercase font-semibold">
                  Perhatian
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legenda Baris Paling Bawah */}
      <div className="flex flex-col gap-2 border-t border-border bg-card p-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground">
          <span className="font-semibold text-sky-600 dark:text-sky-400">
            Angka biru
          </span>{" "}
          adalah input realisasi bulanan. Klik cell untuk mengedit langsung layaknya spreadsheet (tekan <kbd className="border border-border bg-muted px-1 text-[10px]">Enter</kbd> untuk menyimpan, <kbd className="border border-border bg-muted px-1 text-[10px]">Esc</kbd> untuk membatalkan).
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-emerald-500" />
            <span>Sesuai Target (&ge; 70%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-amber-500" />
            <span>Perhatian (45% - 69%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-rose-500" />
            <span>Kritis (&lt; 45%)</span>
          </span>
        </div>
      </div>
    </div>
  )
}
