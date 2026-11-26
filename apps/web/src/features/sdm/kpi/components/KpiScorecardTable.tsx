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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@cater/ui"

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

  // State tambah baris baru saat klik (+) pada objective
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

  // Handler simpan baris baru
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
      {/* Menggunakan shadcn/ui Table dengan container scroll invisible & tanpa scrollbar horizontal di bawah footer */}
      <Table
        containerClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        className="w-full table-fixed border-separate border-spacing-0 text-left text-xs tabular-nums select-none"
      >
        {/* Kolom Berukuran Persentase Agar Menyesuaikan Lebar Pembungkus 100% Secara Seamless */}
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "32px" }} />
        </colgroup>

        {/* Header Tabel Sticky shadcn/ui */}
        <TableHeader className="sticky top-0 z-40 bg-muted/95 backdrop-blur-xs text-xs font-semibold text-foreground">
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border ps-4 text-foreground font-semibold">
              Tahapan Siklus M2C
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border ps-3 text-foreground font-semibold">
              Sasaran &amp; Indikator KPI
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-foreground font-semibold">
              Penanggung Jawab
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-right text-foreground font-semibold">
              Bobot
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-right text-foreground font-semibold">
              Baseline
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
              Realisasi
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-right text-foreground font-semibold">
              Target
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-right text-foreground font-semibold">
              Selisih
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-foreground font-semibold">
              Tren
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-foreground font-semibold">
              Wilayah Perhatian
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-r border-border px-2 text-center text-foreground font-semibold">
              Capaian
            </TableHead>
            <TableHead className="sticky top-0 z-40 bg-muted h-7 py-0 border-b border-border p-0 text-center" aria-label="Aksi">
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
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

            // Hitung jumlah baris yang dinaungi oleh Panel Tahapan Siklus di Kolom Pertama
            const totalRowsForPerspective = isPerspectiveCollapsed
              ? 1
              : filteredObjectives.reduce((acc, o) => {
                  const isObjCollapsed = collapsedObjectives[o.id]
                  const kpisCount = isObjCollapsed ? 0 : o.kpis.length
                  const addingCount =
                    !isObjCollapsed && addingInObjectiveId === o.id ? 1 : 0
                  return acc + 1 + kpisCount + addingCount
                }, 0)

            // Jika Perspektif di-collapse:
            if (isPerspectiveCollapsed) {
              return (
                <TableRow
                  key={perspective.id}
                  className="bg-muted/50 border-b border-border hover:bg-muted/70 transition-colors h-9"
                >
                  <TableCell className="border-b border-r border-border p-2.5 align-top">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {perspective.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePerspective(perspective.id)}
                        className="inline-flex size-6 items-center justify-center rounded-none text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Tampilkan rincian tahapan"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Bobot {perspective.scoreWeightPercent}% dari skor total
                    </div>
                  </TableCell>
                  <TableCell
                    colSpan={9}
                    className="border-b border-r border-border px-3 py-1 text-muted-foreground text-xs"
                  >
                    {perspective.totalKpiCount} Indikator disembunyikan. Klik
                    (+) untuk melihat rincian tahapan.
                  </TableCell>
                  <TableCell
                    className={`border-b border-r border-border px-2 py-1 text-center font-bold text-xs ${pStyling.bgClass} ${pStyling.textClass}`}
                  >
                    {perspective.score !== null
                      ? `${perspective.score}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="border-b border-border p-0 text-center" />
                </TableRow>
              )
            }

            // Render Expanded: PANEL TAHAPAN SIKLUS M2C ASLI (KOLOM PERTAMA TETAP SAMA)
            return (
              <React.Fragment key={perspective.id}>
                {filteredObjectives.map((objective, objIdx) => {
                  const isObjCollapsed = collapsedObjectives[objective.id]
                  const objStyling = getStatusStyling(objective.status)
                  const isAddingHere = addingInObjectiveId === objective.id

                  return (
                    <React.Fragment key={objective.id}>
                      {/* Baris Objective Header di Tabel Tengah */}
                      <TableRow className="bg-muted/50 hover:bg-muted/70 font-semibold border-b border-border h-7 text-xs">
                        {/* PANEL TAHAPAN SIKLUS (TETAP SAMA SEPERTI ASLINYA) */}
                        {objIdx === 0 && (
                          <TableCell
                            rowSpan={totalRowsForPerspective}
                            className="align-top border-b border-r border-border bg-card p-3"
                          >
                            <div className="sticky top-9 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                                  {perspective.name}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() =>
                                    togglePerspective(perspective.id)
                                  }
                                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-none text-muted-foreground hover:bg-muted hover:text-foreground"
                                  title="Sembunyikan rincian tahapan"
                                >
                                  <Minus className="size-3.5" />
                                </button>
                              </div>

                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                                  {perspective.score !== null
                                    ? `${perspective.score}%`
                                    : "-"}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {perspective.scoreWeightPercent}% total
                                </span>
                              </div>

                              {/* Progress bar tipis ala Signal */}
                              <div className="h-1 w-full overflow-hidden rounded-none bg-muted">
                                <div
                                  className="h-full bg-amber-500 rounded-none transition-all"
                                  style={{
                                    width: `${perspective.score ?? 0}%`,
                                  }}
                                />
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="inline-flex items-center rounded-none px-1 py-0.25 text-[10px] font-medium leading-none border border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/20">
                                  {perspective.offTrackCount} kritis
                                </span>
                                <span className="text-muted-foreground">
                                  dari {perspective.totalKpiCount}
                                </span>
                              </div>

                              <p className="text-[11px] leading-relaxed text-foreground/75 line-clamp-4">
                                {perspective.description}
                              </p>
                            </div>
                          </TableCell>
                        )}

                        {/* TABEL DI TENGAH: Baris Sasaran dengan Arrow & Plus berdampingan ala ReUI Signal */}
                        <TableCell
                          colSpan={9}
                          className="border-b border-r border-border px-2 py-0 h-7"
                        >
                          <div className="flex items-center gap-1 h-full">
                            {/* Arrow Chevron Expand/Collapse */}
                            <button
                              type="button"
                              onClick={() =>
                                toggleObjective(objective.id)
                              }
                              className="inline-flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                              title={
                                isObjCollapsed
                                  ? "Buka sasaran"
                                  : "Tutup sasaran"
                              }
                            >
                              <ChevronDown
                                className={`size-3.5 transition-transform duration-200 ${
                                  isObjCollapsed ? "-rotate-90" : ""
                                }`}
                              />
                            </button>

                            {/* Nama Sasaran */}
                            <span className="font-semibold text-foreground text-xs truncate">
                              {objective.name}
                            </span>
                            <span className="font-normal text-muted-foreground text-[11px] tabular-nums shrink-0">
                              {objective.kpis.length}
                            </span>

                            {/* Icon Plus (+) tepat di samping nama sasaran */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStartAddRow(objective.id)
                              }
                              className="inline-flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-none"
                              title={`Tambah KPI ke ${objective.name}`}
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        </TableCell>

                        {/* Capaian Sasaran */}
                        <TableCell
                          className={`border-b border-r border-border p-0 text-center font-semibold tabular-nums text-xs ${objStyling.bgClass} ${objStyling.textClass} h-7`}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            {objective.progress !== null
                              ? `${objective.progress}%`
                              : "-"}
                          </div>
                        </TableCell>

                        {/* Kolom Aksi Kosong untuk Sasaran */}
                        <TableCell className="border-b border-border p-0 text-center" />
                      </TableRow>

                      {/* TABEL DI TENGAH: Baris-baris KPI di Bawah Sasaran (Tinggi Seragam h-7) */}
                      {!isObjCollapsed &&
                        objective.kpis.map((kpi) => {
                          const isEditingValue =
                            editingCell?.kpiId === kpi.id &&
                            editingCell?.field === "value"
                          const isEditingWeight =
                            editingCell?.kpiId === kpi.id &&
                            editingCell?.field === "weight"
                          const kpiStyling = getStatusStyling(kpi.status)

                          return (
                            <TableRow
                              key={kpi.id}
                              className="h-7 hover:bg-muted/30 transition-colors border-b border-border text-xs"
                            >
                              {/* Sasaran & Indikator KPI: Indented dengan ps-7 */}
                              <TableCell className="border-b border-r border-border ps-7 pe-2 py-0 h-7">
                                <div className="flex items-center gap-1.5 h-full">
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
                              </TableCell>

                              {/* Penanggung Jawab */}
                              <TableCell className="border-b border-r border-border px-2 py-0 h-7 text-foreground truncate">
                                <div className="flex items-center gap-1.5 h-full">
                                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                                    {(kpi.owner.name || "P").slice(0, 1).toUpperCase()}
                                  </span>
                                  <span className="truncate">{kpi.owner.name}</span>
                                </div>
                              </TableCell>

                              {/* Bobot: Cell Excel Murni */}
                              <TableCell
                                onClick={() =>
                                  handleStartEdit(kpi, "weight")
                                }
                                className="border-b border-r border-border p-0 text-right cursor-cell h-7"
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
                                    className="w-full h-full bg-background px-2 py-0 text-right text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-end px-2 py-0 font-medium text-blue-600 dark:text-blue-400 font-mono">
                                    {kpi.weight}%
                                  </div>
                                )}
                              </TableCell>

                              {/* Baseline */}
                              <TableCell className="border-b border-r border-border px-2 py-0 text-right text-muted-foreground font-mono h-7">
                                <div className="w-full h-full flex items-center justify-end">
                                  {formatKpiNumber(kpi.baseline, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </div>
                              </TableCell>

                              {/* Realisasi: Cell Excel Murni */}
                              <TableCell
                                onClick={() =>
                                  handleStartEdit(kpi, "value")
                                }
                                className="border-b border-r border-border p-0 text-right cursor-cell h-7"
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
                                    className="w-full h-full bg-background px-2 py-0 text-right text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-end px-2 py-0 font-semibold font-mono ${
                                      kpi.value !== null
                                        ? "text-blue-600 dark:text-blue-400"
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
                              </TableCell>

                              {/* Target */}
                              <TableCell className="border-b border-r border-border px-2 py-0 text-right text-muted-foreground font-mono h-7">
                                <div className="w-full h-full flex items-center justify-end">
                                  {formatKpiNumber(kpi.target, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </div>
                              </TableCell>

                              {/* Selisih */}
                              <TableCell className="border-b border-r border-border px-2 py-0 text-right text-muted-foreground font-mono h-7">
                                <div className="w-full h-full flex items-center justify-end">
                                  {formatKpiNumber(kpi.toGo, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </div>
                              </TableCell>

                              {/* Tren with Sparkline & Delta */}
                              <TableCell className="border-b border-r border-border px-2 py-0 h-7">
                                <div className="flex items-center gap-1.5 h-full">
                                  <MiniSparkline
                                    data={kpi.change.sparkline}
                                  />
                                  <TrendIndicator change={kpi.change} />
                                </div>
                              </TableCell>

                              {/* Wilayah Perhatian */}
                              <TableCell className="border-b border-r border-border px-2 py-0 text-xs truncate h-7">
                                <div className="flex items-center gap-1 h-full">
                                  {kpi.laggingMarket ? (
                                    <span className="font-medium text-foreground truncate">
                                      📍{" "}
                                      {kpi.laggingMarket.countryName ||
                                        kpi.laggingMarket.countryCode}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">
                                      Semua
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              {/* Capaian Progress */}
                              <TableCell
                                className={`border-b border-r border-border p-0 text-center font-semibold tabular-nums text-xs ${kpiStyling.bgClass} ${kpiStyling.textClass} h-7`}
                              >
                                <div className="w-full h-full flex items-center justify-center">
                                  {kpi.progress !== null
                                    ? `${kpi.progress}%`
                                    : "-"}
                                </div>
                              </TableCell>

                              {/* Menu Aksi (Titik Tiga) */}
                              <TableCell className="border-b border-border p-0 text-center h-7">
                                <div className="flex size-full items-center justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="inline-flex size-6 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground rounded-none"
                                        title="Aksi baris"
                                      >
                                        <MoreVertical className="size-3.5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-44 text-xs"
                                    >
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStartEdit(kpi, "value")
                                        }
                                        className="cursor-pointer"
                                      >
                                        Ubah Nilai Realisasi
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStartEdit(kpi, "weight")
                                        }
                                        className="cursor-pointer"
                                      >
                                        Ubah Bobot Kontribusi
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}

                      {/* TABEL DI TENGAH: Baris Baru saat Klik (+) di bawah daftar item yang ada */}
                      {!isObjCollapsed && isAddingHere && (
                        <TableRow className="h-7 bg-muted/20 border-b border-border text-xs">
                          {/* Sasaran & Indikator KPI: Input Excel Murni */}
                          <TableCell className="border-b border-r border-border p-0 h-7">
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
                              className="w-full h-full bg-background px-2 py-0 text-xs text-foreground outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                            />
                          </TableCell>

                          {/* Penanggung Jawab */}
                          <TableCell className="border-b border-r border-border p-0 h-7">
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
                              className="w-full h-full bg-background px-2 py-0 text-xs text-foreground outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                            />
                          </TableCell>

                          {/* Bobot */}
                          <TableCell className="border-b border-r border-border p-0 text-right h-7">
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
                              className="w-full h-full bg-background px-2 py-0 text-right text-xs font-mono font-semibold text-blue-600 outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                            />
                          </TableCell>

                          {/* Baseline */}
                          <TableCell className="border-b border-r border-border p-0 text-right h-7">
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
                              className="w-full h-full bg-background px-2 py-0 text-right text-xs font-mono outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                            />
                          </TableCell>

                          {/* Realisasi */}
                          <TableCell className="border-b border-r border-border p-0 text-right h-7">
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
                              className="w-full h-full bg-background px-2 py-0 text-right text-xs font-mono text-blue-600 font-semibold outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                            />
                          </TableCell>

                          {/* Target */}
                          <TableCell className="border-b border-r border-border p-0 text-right h-7">
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
                              className="w-full h-full bg-background px-2 py-0 text-right text-xs font-mono outline-none ring-1 ring-inset ring-blue-600 border-0 rounded-none"
                            />
                          </TableCell>

                          {/* Selisih */}
                          <TableCell className="border-b border-r border-border px-2 py-0 text-right text-muted-foreground text-xs font-mono h-7">
                            -
                          </TableCell>

                          {/* Tren */}
                          <TableCell className="border-b border-r border-border px-2 py-0 text-muted-foreground text-xs h-7">
                            -
                          </TableCell>

                          {/* Wilayah */}
                          <TableCell className="border-b border-r border-border px-2 py-0 text-[11px] text-muted-foreground italic h-7">
                            Semua
                          </TableCell>

                          {/* Capaian */}
                          <TableCell className="border-b border-r border-border px-2 py-0 text-center text-muted-foreground text-xs h-7">
                            -
                          </TableCell>

                          {/* Aksi Simpan */}
                          <TableCell className="border-b border-border p-0 text-center h-7">
                            <button
                              type="button"
                              onClick={() =>
                                void handleSaveRow(objective.id)
                              }
                              disabled={savingRow}
                              className="text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              {savingRow ? "..." : "Simpan"}
                            </button>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            );
          })}
        </TableBody>

        {/* Sticky Footer Total Scorecard: ReUI Signal Pattern dengan Sticky Bottom di Setiap Sel */}
        <TableFooter className="sticky bottom-0 z-40 bg-muted text-xs font-medium text-foreground">
          <TableRow className="hover:bg-transparent">
            {/* Kolom 1 & 2 Gabung (ColSpan 2) Sticky Start */}
            <TableCell
              colSpan={2}
              className="sticky bottom-0 start-0 z-50 bg-muted border-t border-r border-border px-4 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    TOTAL CAPAIAN SKOR M2C
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Sep 2026
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {summary.kpisOnTrackCount} dari {summary.totalScoredKpis} KPI on track,{" "}
                  {perspectives.reduce((a, p) => a + p.objectives.length, 0)} sasaran
                </div>
              </div>
            </TableCell>

            {/* Penanggung Jawab */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  5
                </span>
                <span className="text-[10px] text-muted-foreground">
                  peran aktor
                </span>
              </div>
            </TableCell>

            {/* Bobot */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2 text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  100%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  total
                </span>
              </div>
            </TableCell>

            {/* Baseline */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2 text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {summary.kpisOnTrackCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  tercapai
                </span>
              </div>
            </TableCell>

            {/* Realisasi */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2 text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                  {summary.kpisWatchCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  perhatian
                </span>
              </div>
            </TableCell>

            {/* Target */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2 text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  {summary.kpisOffTrackCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  kritis
                </span>
              </div>
            </TableCell>

            {/* Selisih */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2 text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  0
                </span>
                <span className="text-[10px] text-muted-foreground">
                  nihil
                </span>
              </div>
            </TableCell>

            {/* Tren */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tabular-nums">
                  <MiniSparkline data={[58, 59, 59.5, 60.2, 60.8, 61]} />
                  <span>+{summary.ptsChangeSinceLastMonth}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  poin bln lalu
                </span>
              </div>
            </TableCell>

            {/* Wilayah */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border px-2 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground truncate">
                  📍 Semua Wilayah
                </span>
                <span className="text-[10px] text-muted-foreground">
                  aktif termonitor
                </span>
              </div>
            </TableCell>

            {/* Capaian Skor Total */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-r border-border p-0">
              <div className="flex flex-col items-center justify-center h-full px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <span className="text-sm font-bold tabular-nums">
                  {summary.companyScore}%
                </span>
                <span className="text-[10px] font-medium opacity-85">
                  Perhatian
                </span>
              </div>
            </TableCell>

            {/* Aksi Kolom Kosong */}
            <TableCell className="sticky bottom-0 z-40 bg-muted border-t border-border p-0" />
          </TableRow>
        </TableFooter>
      </Table>

      {/* Legenda Baris Paling Bawah ala ReUI Signal */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Angka biru
          </span>{" "}
          adalah input. Klik cell untuk mengedit langsung, paste rentang nilai, Ctrl+Z untuk membatalkan.
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Sesuai Target &ge; 70%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Perhatian 45% - 69%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span>Kritis &lt; 45%</span>
          </span>
        </span>
      </div>
    </div>
  )
}
