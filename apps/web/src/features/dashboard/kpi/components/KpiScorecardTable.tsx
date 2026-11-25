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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface KpiScorecardTableProps {
  perspectives: CalculatedPerspective[]
  summary: CompanyScorecardSummary
  searchQuery: string
  availableOwners?: KpiOwner[]
  onUpdateKpiValue: (kpiId: string, newValue: number | null) => void
  onUpdateKpiWeight: (kpiId: string, newWeight: number) => void
  onUpdateKpiOwner: (kpiId: string, newOwner: KpiOwner) => void
  onUpdateKpiDetail?: (
    kpiId: string,
    data: {
      nama?: string
      bobot?: number
      baseline?: number
      target?: number
      arah?: "higher" | "lower"
    }
  ) => void
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
  availableOwners = [],
  onUpdateKpiValue,
  onUpdateKpiWeight,
  onUpdateKpiOwner,
  onUpdateKpiDetail,
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

  // Excel/Google Sheet-style inline editing state untuk cell baris eksisting:
  const [editingCell, setEditingCell] = React.useState<{
    kpiId: string
    field: "name" | "value" | "weight" | "baseline" | "target"
  } | null>(null)
  const [editValueText, setEditValueText] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // State Inline Tambah KPI Baru (muncul di baris paling bawah saat klik +)
  const [addingInObjectiveId, setAddingInObjectiveId] = React.useState<
    string | null
  >(null)
  const [newKpiName, setNewKpiName] = React.useState("")
  const [newKpiOwnerId, setNewKpiOwnerId] = React.useState("")
  const [newKpiWeight, setNewKpiWeight] = React.useState("10")
  const [newKpiBaseline, setNewKpiBaseline] = React.useState("0")
  const [newKpiValue, setNewKpiValue] = React.useState("")
  const [newKpiTarget, setNewKpiTarget] = React.useState("100")
  const [newKpiDirection, setNewKpiDirection] = React.useState<
    "higher" | "lower"
  >("higher")
  const [savingInline, setSavingInline] = React.useState(false)

  const togglePerspective = (id: string) => {
    setCollapsedPerspectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleObjective = (id: string) => {
    setCollapsedObjectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Fokus dan select seluruh teks saat mulai edit cell (seperti Excel/Google Sheet)
  React.useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  const handleStartEdit = (
    kpi: CalculatedKpi,
    field: "name" | "value" | "weight" | "baseline" | "target"
  ) => {
    setEditingCell({ kpiId: kpi.id, field })
    if (field === "name") {
      setEditValueText(kpi.name)
    } else if (field === "value") {
      setEditValueText(kpi.value !== null ? String(kpi.value) : "")
    } else if (field === "weight") {
      setEditValueText(String(kpi.weight))
    } else if (field === "baseline") {
      setEditValueText(String(kpi.baseline))
    } else if (field === "target") {
      setEditValueText(String(kpi.target))
    }
  }

  // Commit dan simpan langsung ke database (Enter / Blur)
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
    } else if (field === "weight") {
      const parsed = parseFloat(editValueText.replace(/[%]/g, "").trim())
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdateKpiWeight(kpi.id, Math.round(parsed))
      }
    } else if (field === "name") {
      const trimmed = editValueText.trim()
      if (trimmed && trimmed !== kpi.name && onUpdateKpiDetail) {
        onUpdateKpiDetail(kpi.id, { nama: trimmed })
      }
    } else if (field === "baseline") {
      const parsed = parseFloat(editValueText.trim())
      if (!isNaN(parsed) && onUpdateKpiDetail) {
        onUpdateKpiDetail(kpi.id, { baseline: parsed })
      }
    } else if (field === "target") {
      const parsed = parseFloat(editValueText.trim())
      if (!isNaN(parsed) && onUpdateKpiDetail) {
        onUpdateKpiDetail(kpi.id, { target: parsed })
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
      // Batal edit dan kembalikan nilai asal
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

  // Handler Mulai Tambah KPI Inline di baris paling bawah
  const handleStartInlineAdd = (objectiveId: string) => {
    setCollapsedObjectives((prev) => ({ ...prev, [objectiveId]: false }))
    setAddingInObjectiveId(objectiveId)
    setNewKpiName("")
    const defaultOwnerId = availableOwners[0]?.id || "admin"
    setNewKpiOwnerId(defaultOwnerId)
    setNewKpiWeight("10")
    setNewKpiBaseline("0")
    setNewKpiValue("")
    setNewKpiTarget("100")
    setNewKpiDirection("higher")
  }

  // Handler Simpan Baris Baru (Enter / Blur)
  const handleSaveInlineKpi = async (objectiveId: string) => {
    if (!newKpiName.trim()) {
      toast.error("Nama indikator KPI wajib diisi")
      return
    }

    setSavingInline(true)
    try {
      const selectedOwner = availableOwners.find((o) => o.id === newKpiOwnerId)
      if (onAddKpiInline) {
        await onAddKpiInline({
          name: newKpiName.trim(),
          objectiveId,
          ownerId: newKpiOwnerId || availableOwners[0]?.id || "admin",
          direction: newKpiDirection,
          weight: Number(newKpiWeight) || 10,
          baseline: Number(newKpiBaseline) || 0,
          target: Number(newKpiTarget) || 100,
          value: newKpiValue.trim() !== "" ? Number(newKpiValue) : null,
          format: "percent",
          ownerDetails: selectedOwner
            ? { name: selectedOwner.name, initials: selectedOwner.initials }
            : undefined,
        })
      }
      setAddingInObjectiveId(null)
      setNewKpiName("")
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan KPI")
    } finally {
      setSavingInline(false)
    }
  }

  const handleCancelInlineAdd = () => {
    setAddingInObjectiveId(null)
    setNewKpiName("")
  }

  // Filter KPI berdasarkan pencarian
  const query = searchQuery.trim().toLowerCase()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left text-[12px] tabular-nums select-none">
          {/* Header Tabel Sticky: Kolom 1 = Tahapan Siklus M2C (Perspective) */}
          <thead className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="w-[190px] border-r border-border p-2.5">
                Tahapan Siklus M2C
              </th>
              <th className="min-w-[240px] border-r border-border p-2.5">
                Sasaran &amp; Indikator KPI
              </th>
              <th className="w-[130px] border-r border-border p-2.5">
                Penanggung Jawab
              </th>
              <th className="w-[70px] border-r border-border p-2.5 text-right">
                Bobot
              </th>
              <th className="w-[75px] border-r border-border p-2.5 text-right">
                Baseline
              </th>
              <th className="w-[85px] border-r border-border p-2.5 text-right text-sky-600 dark:text-sky-400">
                Realisasi
              </th>
              <th className="w-[75px] border-r border-border p-2.5 text-right">
                Target
              </th>
              <th className="w-[70px] border-r border-border p-2.5 text-right">
                Selisih
              </th>
              <th className="w-[100px] border-r border-border p-2.5">Tren</th>
              <th className="w-[115px] border-r border-border p-2.5">
                Wilayah Perhatian
              </th>
              <th className="w-[80px] p-2.5 text-center">Capaian</th>
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

              // Hitung jumlah baris untuk rowSpan kolom Perspective di sisi kiri
              const totalRowsForPerspective = isPerspectiveCollapsed
                ? 1
                : filteredObjectives.reduce((acc, o) => {
                    const isObjCollapsed = collapsedObjectives[o.id]
                    const kpisCount = isObjCollapsed ? 0 : o.kpis.length
                    const addingCount =
                      !isObjCollapsed && addingInObjectiveId === o.id ? 1 : 0
                    return acc + 1 + kpisCount + addingCount
                  }, 0)

              // Jika seluruh perspektif di-collapse:
              if (isPerspectiveCollapsed) {
                return (
                  <tr
                    key={perspective.id}
                    className="bg-muted/50 border-t border-border hover:bg-muted/70 transition-colors"
                  >
                    <td className="border-r border-border p-2.5 align-top">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[12px] text-foreground truncate">
                          {perspective.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePerspective(perspective.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Tampilkan rincian tahapan"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Bobot {perspective.scoreWeightPercent}%
                      </div>
                    </td>
                    <td
                      colSpan={9}
                      className="border-r border-border p-2.5 text-muted-foreground text-xs font-normal"
                    >
                      {perspective.totalKpiCount} Indikator disembunyikan. Klik
                      tombol (+) untuk membuka sasaran dan indikator.
                    </td>
                    <td
                      className={`p-2.5 text-center font-bold text-xs ${pStyling.bgClass} ${pStyling.textClass}`}
                    >
                      {perspective.score !== null
                        ? `${perspective.score}%`
                        : "-"}
                    </td>
                  </tr>
                )
              }

              // Render Expanded Perspective dengan Kolom Pertama Berisi rowSpan
              return (
                <React.Fragment key={perspective.id}>
                  {filteredObjectives.map((objective, objIdx) => {
                    const isObjCollapsed = collapsedObjectives[objective.id]
                    const objStyling = getStatusStyling(objective.status)
                    const isAddingHere = addingInObjectiveId === objective.id

                    return (
                      <React.Fragment key={objective.id}>
                        {/* Baris Header Objective (Sasaran) */}
                        <tr className="bg-muted/40 font-medium border-t border-border/80 hover:bg-muted/50 transition-colors">
                          {/* Kolom Pertama: PERSPECTIVE (Tahapan Siklus M2C) dengan rowSpan */}
                          {objIdx === 0 && (
                            <td
                              rowSpan={totalRowsForPerspective}
                              className="align-top border-r border-border bg-card/60 p-2.5 text-left"
                            >
                              <div className="sticky top-12 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-xs font-bold text-foreground leading-tight">
                                    {perspective.name}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePerspective(perspective.id)
                                    }
                                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                                    title="Sembunyikan rincian tahapan"
                                  >
                                    <Minus className="size-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                                    {perspective.score !== null
                                      ? `${perspective.score}%`
                                      : "-"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {perspective.scoreWeightPercent}% dari skor
                                  </span>
                                </div>

                                {/* Progress bar tipis */}
                                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{
                                      width: `${perspective.score ?? 0}%`,
                                    }}
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="inline-flex items-center rounded-sm px-1.5 py-0.2 font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
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

                          {/* Kolom 2 s/d 10: Nama Sasaran dengan Chevron Arrow & Icon Plus Berdampingan */}
                          <td
                            colSpan={9}
                            className="border-r border-border px-2.5 py-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {/* Chevron Arrow */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleObjective(objective.id)
                                  }
                                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                                  title={
                                    isObjCollapsed
                                      ? "Buka sasaran"
                                      : "Tutup sasaran"
                                  }
                                >
                                  {isObjCollapsed ? (
                                    <ChevronRight className="size-3.5" />
                                  ) : (
                                    <ChevronDown className="size-3.5" />
                                  )}
                                </button>

                                {/* Icon Plus (+) Berada Tepat di Samping Arrow */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartInlineAdd(objective.id)
                                  }
                                  className="p-0.5 rounded text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                                  title="Tambah baris KPI baru di bawah sasaran ini"
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
                            </div>
                          </td>

                          {/* Kolom 11: Capaian Objective */}
                          <td
                            className={`p-1.5 text-center font-bold text-xs tabular-nums ${objStyling.bgClass} ${objStyling.textClass}`}
                          >
                            {objective.progress !== null
                              ? `${objective.progress}%`
                              : "-"}
                          </td>
                        </tr>

                        {/* Baris-baris KPI di Bawah Sasaran (Direct Inline Edit seperti Excel/Google Sheets) */}
                        {!isObjCollapsed &&
                          objective.kpis.map((kpi) => {
                            const isEditingName =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "name"
                            const isEditingValue =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "value"
                            const isEditingWeight =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "weight"
                            const isEditingBaseline =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "baseline"
                            const isEditingTarget =
                              editingCell?.kpiId === kpi.id &&
                              editingCell?.field === "target"
                            const kpiStyling = getStatusStyling(kpi.status)

                            return (
                              <tr
                                key={kpi.id}
                                className="h-7 hover:bg-muted/20 transition-colors border-t border-border/40"
                              >
                                {/* Kolom 2: Nama KPI (Klik cell langsung edit seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "name")
                                  }
                                  className="border-r border-border/60 px-2.5 py-1 cursor-text"
                                >
                                  {isEditingName ? (
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
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0.5 text-xs font-medium text-foreground outline-none ring-1 ring-sky-500"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate font-medium text-foreground hover:underline">
                                        {kpi.name}
                                      </span>
                                      {/* Icon arah target: klik langsung switch higher/lower */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const nextArah =
                                            kpi.direction === "higher"
                                              ? "lower"
                                              : "higher"
                                          if (onUpdateKpiDetail) {
                                            onUpdateKpiDetail(kpi.id, {
                                              arah: nextArah,
                                            })
                                          }
                                        }}
                                        className="text-muted-foreground/80 hover:text-foreground shrink-0 p-0.5"
                                        title={`Arah: ${
                                          kpi.direction === "higher"
                                            ? "Lebih tinggi lebih baik (klik untuk ubah)"
                                            : "Lebih rendah lebih baik (klik untuk ubah)"
                                        }`}
                                      >
                                        {kpi.direction === "higher" ? (
                                          <ArrowUp className="size-3 text-emerald-600" />
                                        ) : (
                                          <ArrowDown className="size-3 text-amber-600" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </td>

                                {/* Kolom 3: Penanggung Jawab (Dropdown cell langsung di tempat) */}
                                <td className="border-r border-border/60 px-2 py-0.5">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-[11px] hover:bg-muted/60"
                                      >
                                        <span className="flex items-center gap-1.5 truncate">
                                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-[9px] font-semibold text-zinc-700 dark:text-zinc-200">
                                            {kpi.owner.initials}
                                          </span>
                                          <span className="truncate">
                                            {kpi.owner.name}
                                          </span>
                                        </span>
                                        <ChevronDown className="size-2.5 text-muted-foreground shrink-0" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="start"
                                      className="w-48 max-h-60 overflow-y-auto text-xs"
                                    >
                                      {(availableOwners.length > 0
                                        ? availableOwners
                                        : [kpi.owner]
                                      ).map((owner) => (
                                        <DropdownMenuItem
                                          key={owner.id}
                                          onClick={() =>
                                            onUpdateKpiOwner(kpi.id, owner)
                                          }
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
                                            {owner.initials}
                                          </span>
                                          <span className="truncate">
                                            {owner.name}
                                          </span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>

                                {/* Kolom 4: Bobot (Klik cell langsung edit seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "weight")
                                  }
                                  className="border-r border-border/60 px-2 py-0.5 text-right cursor-text"
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
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 outline-none ring-1 ring-sky-500 font-mono"
                                    />
                                  ) : (
                                    <span className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                                      {kpi.weight}%
                                    </span>
                                  )}
                                </td>

                                {/* Kolom 5: Baseline (Klik cell langsung edit seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "baseline")
                                  }
                                  className="border-r border-border/60 px-2 py-0.5 text-right cursor-text text-muted-foreground"
                                >
                                  {isEditingBaseline ? (
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
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-mono outline-none ring-1 ring-sky-500"
                                    />
                                  ) : (
                                    <span className="hover:underline font-mono">
                                      {formatKpiNumber(
                                        kpi.baseline,
                                        kpi.format,
                                        {
                                          unitMultiplier:
                                            kpi.unitMultiplier,
                                        }
                                      )}
                                    </span>
                                  )}
                                </td>

                                {/* Kolom 6: Realisasi (Klik cell langsung edit seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "value")
                                  }
                                  className="border-r border-border/60 px-2 py-0.5 text-right cursor-text"
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
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 outline-none ring-1 ring-sky-500 font-mono"
                                    />
                                  ) : (
                                    <span
                                      className={`font-semibold font-mono hover:underline ${
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
                                    </span>
                                  )}
                                </td>

                                {/* Kolom 7: Target (Klik cell langsung edit seperti Excel) */}
                                <td
                                  onClick={() =>
                                    handleStartEdit(kpi, "target")
                                  }
                                  className="border-r border-border/60 px-2 py-0.5 text-right cursor-text text-muted-foreground"
                                >
                                  {isEditingTarget ? (
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
                                      className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-mono outline-none ring-1 ring-sky-500"
                                    />
                                  ) : (
                                    <span className="hover:underline font-mono">
                                      {formatKpiNumber(
                                        kpi.target,
                                        kpi.format,
                                        {
                                          unitMultiplier:
                                            kpi.unitMultiplier,
                                        }
                                      )}
                                    </span>
                                  )}
                                </td>

                                {/* Kolom 8: Selisih (To Go) */}
                                <td className="border-r border-border/60 px-2 py-0.5 text-right text-muted-foreground font-mono">
                                  {formatKpiNumber(kpi.toGo, kpi.format, {
                                    unitMultiplier: kpi.unitMultiplier,
                                  })}
                                </td>

                                {/* Kolom 9: Tren with Sparkline & Delta */}
                                <td className="border-r border-border/60 px-2 py-0.5">
                                  <div className="flex items-center gap-2">
                                    <MiniSparkline
                                      data={kpi.change.sparkline}
                                    />
                                    <TrendIndicator change={kpi.change} />
                                  </div>
                                </td>

                                {/* Kolom 10: Wilayah / Cabang Perhatian */}
                                <td className="border-r border-border/60 px-2.5 py-0.5">
                                  {kpi.laggingMarket ? (
                                    <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted/70">
                                      <span className="text-xs">📍</span>
                                      <span className="font-semibold text-foreground truncate">
                                        {kpi.laggingMarket.countryName ||
                                          kpi.laggingMarket.countryCode}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-[11px] italic">
                                      Semua Wilayah
                                    </span>
                                  )}
                                </td>

                                {/* Kolom 11: Capaian Progress */}
                                <td
                                  className={`px-2 py-0.5 text-center font-bold tabular-nums text-xs ${kpiStyling.bgClass} ${kpiStyling.textClass}`}
                                >
                                  {kpi.progress !== null
                                    ? `${kpi.progress}%`
                                    : "-"}
                                </td>
                              </tr>
                            )
                          })}

                        {/* Baris Baru di Posisi Paling Bawah saat Klik (+) pada Sasaran ini */}
                        {!isObjCollapsed && isAddingHere && (
                          <tr className="bg-sky-50/40 dark:bg-sky-950/20 border-t-2 border-sky-400 dark:border-sky-600 transition-colors">
                            {/* Kolom 2: Input Nama KPI Baru */}
                            <td className="border-r border-border/60 px-1 py-1">
                              <input
                                autoFocus
                                placeholder="Nama indikator (tekan Enter untuk simpan)..."
                                value={newKpiName}
                                onChange={(e) => setNewKpiName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    void handleSaveInlineKpi(objective.id)
                                  } else if (e.key === "Escape") {
                                    handleCancelInlineAdd()
                                  }
                                }}
                                className="w-full rounded border border-sky-500 bg-background px-1.5 py-0.5 text-xs font-medium text-foreground outline-none ring-1 ring-sky-500 placeholder:text-muted-foreground/60"
                              />
                            </td>

                            {/* Kolom 3: Dropdown Pemilik Inline */}
                            <td className="border-r border-border/60 px-1 py-1">
                              <Select
                                value={newKpiOwnerId}
                                onValueChange={setNewKpiOwnerId}
                              >
                                <SelectTrigger className="h-6 text-xs bg-background py-0 px-1.5">
                                  <SelectValue placeholder="Pilih pemilik" />
                                </SelectTrigger>
                                <SelectContent className="text-xs max-h-56">
                                  {availableOwners.map((owner) => (
                                    <SelectItem
                                      key={owner.id}
                                      value={owner.id}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                                          {owner.initials}
                                        </span>
                                        <span className="truncate">
                                          {owner.name}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Kolom 4: Input Bobot % */}
                            <td className="border-r border-border/60 px-1 py-1 text-right">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={newKpiWeight}
                                onChange={(e) =>
                                  setNewKpiWeight(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    void handleSaveInlineKpi(objective.id)
                                  } else if (e.key === "Escape") {
                                    handleCancelInlineAdd()
                                  }
                                }}
                                className="w-full rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-mono font-semibold text-sky-600 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />
                            </td>

                            {/* Kolom 5: Input Baseline */}
                            <td className="border-r border-border/60 px-1 py-1 text-right">
                              <input
                                type="number"
                                value={newKpiBaseline}
                                onChange={(e) =>
                                  setNewKpiBaseline(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    void handleSaveInlineKpi(objective.id)
                                  } else if (e.key === "Escape") {
                                    handleCancelInlineAdd()
                                  }
                                }}
                                className="w-full rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-mono outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />
                            </td>

                            {/* Kolom 6: Input Realisasi */}
                            <td className="border-r border-border/60 px-1 py-1 text-right">
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
                                    void handleSaveInlineKpi(objective.id)
                                  } else if (e.key === "Escape") {
                                    handleCancelInlineAdd()
                                  }
                                }}
                                className="w-full rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-mono font-semibold text-sky-600 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />
                            </td>

                            {/* Kolom 7: Input Target */}
                            <td className="border-r border-border/60 px-1 py-1 text-right">
                              <input
                                type="number"
                                value={newKpiTarget}
                                onChange={(e) =>
                                  setNewKpiTarget(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    void handleSaveInlineKpi(objective.id)
                                  } else if (e.key === "Escape") {
                                    handleCancelInlineAdd()
                                  }
                                }}
                                className="w-full rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-mono outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />
                            </td>

                            {/* Kolom 8: Selisih Pratinjau */}
                            <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground font-mono text-xs">
                              {newKpiValue !== "" && newKpiBaseline !== ""
                                ? (
                                    Number(newKpiValue) -
                                    Number(newKpiBaseline)
                                  ).toFixed(1)
                                : "-"}
                            </td>

                            {/* Kolom 9: Toggle Arah */}
                            <td className="border-r border-border/60 px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setNewKpiDirection((d) =>
                                    d === "higher" ? "lower" : "higher"
                                  )
                                }
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[11px] text-muted-foreground hover:text-foreground"
                                title="Klik untuk ubah arah target"
                              >
                                {newKpiDirection === "higher" ? (
                                  <ArrowUp className="size-3 text-emerald-600" />
                                ) : (
                                  <ArrowDown className="size-3 text-amber-600" />
                                )}
                                <span>
                                  {newKpiDirection === "higher"
                                    ? "Naik"
                                    : "Turun"}
                                </span>
                              </button>
                            </td>

                            {/* Kolom 10: Wilayah */}
                            <td className="border-r border-border/60 px-2 py-1 text-[11px] text-muted-foreground italic">
                              Semua
                            </td>

                            {/* Kolom 11: Prompt Simpan (Excel-like commit via Enter / Esc) */}
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleSaveInlineKpi(objective.id)
                                }
                                disabled={savingInline}
                                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                                title="Tekan Enter untuk menyimpan"
                              >
                                ↵ Simpan
                              </button>
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
              <td className="border-r border-border p-2.5">
                <div className="font-bold uppercase tracking-wider text-[11px]">
                  TOTAL SKOR M2C
                </div>
              </td>
              <td className="border-r border-border p-2.5 text-muted-foreground">
                {summary.kpisOnTrackCount} dari {summary.totalScoredKpis} KPI
                sesuai target
              </td>
              <td className="border-r border-border p-2.5 text-muted-foreground">
                Semua Aktor
              </td>
              <td className="border-r border-border p-2.5 text-right font-bold text-foreground">
                100%
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
                -
              </td>
              <td className="border-r border-border p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <MiniSparkline data={[58, 59, 59.5, 60.2, 60.8, 61]} />
                  <span>+{summary.ptsChangeSinceLastMonth} poin</span>
                </div>
              </td>
              <td className="border-r border-border p-2.5">
                <div className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                  <span>📍</span>
                  <span>Semua wilayah</span>
                </div>
              </td>
              <td className="p-2.5 text-center bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <div className="text-sm font-bold">{summary.companyScore}%</div>
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
          adalah input realisasi bulanan. Seluruh cell (Nama, Pemilik, Bobot,
          Baseline, Realisasi, Target) dapat diedit inline langsung di cell
          masing-masing seperti spreadsheet (tekan <kbd className="rounded border border-border bg-muted px-1 text-[10px]">Enter</kbd> untuk menyimpan, <kbd className="rounded border border-border bg-muted px-1 text-[10px]">Esc</kbd> untuk membatalkan).
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Sesuai Target (&ge; 70%)</span>
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
