"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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

  // Inline editing state untuk setiap cell baris eksisting:
  // field: "name" | "value" | "weight" | "baseline" | "target"
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

  // Fokus ke input saat mulai edit cell inline
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

  // Handler Simpan Baris Baru
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
          {/* Header Tabel Sticky dengan Kolom Pertama (Tahapan Siklus M2C) */}
          <thead className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="w-[180px] border-r border-border p-2.5">
                Tahapan Siklus M2C
              </th>
              <th className="min-w-[240px] border-r border-border p-2.5">
                Sasaran &amp; Indikator KPI
              </th>
              <th className="w-[140px] border-r border-border p-2.5">
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

              return (
                <React.Fragment key={perspective.id}>
                  {/* 1. Baris Group Level 1: PERSPEKTIF (Lebar sama & sejajar dengan daftar di bawahnya) */}
                  <tr className="bg-muted/70 font-semibold border-y border-border hover:bg-muted/80 transition-colors">
                    {/* Col 1: Nama Perspektif & Tombol Collapse Arrow */}
                    <td className="border-r border-border px-2.5 py-1.5 text-foreground">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePerspective(perspective.id)}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title={
                            isPerspectiveCollapsed
                              ? "Buka tahapan siklus"
                              : "Tutup tahapan siklus"
                          }
                        >
                          {isPerspectiveCollapsed ? (
                            <ChevronRight className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </button>
                        <span className="font-bold text-[12px] truncate">
                          {perspective.name}
                        </span>
                      </div>
                    </td>

                    {/* Col 2: Keterangan Singkat */}
                    <td className="border-r border-border px-3 py-1.5 text-[11px] text-muted-foreground font-normal">
                      Bobot {perspective.scoreWeightPercent}% • {perspective.totalKpiCount} Indikator
                    </td>

                    {/* Col 3: Unit */}
                    <td className="border-r border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
                      Unit M2C
                    </td>

                    {/* Col 4: Bobot Total */}
                    <td className="border-r border-border px-2 py-1.5 text-right font-bold text-foreground text-[11px]">
                      {perspective.scoreWeightPercent}%
                    </td>

                    {/* Col 5 - 8: Grid Kolom Baseline s/d Selisih */}
                    <td className="border-r border-border px-2 py-1.5 text-right text-muted-foreground text-[11px]">
                      -
                    </td>
                    <td className="border-r border-border px-2 py-1.5 text-right text-muted-foreground text-[11px]">
                      -
                    </td>
                    <td className="border-r border-border px-2 py-1.5 text-right text-muted-foreground text-[11px]">
                      -
                    </td>
                    <td className="border-r border-border px-2 py-1.5 text-right text-muted-foreground text-[11px]">
                      -
                    </td>

                    {/* Col 9: Tren */}
                    <td className="border-r border-border px-2 py-1.5 text-[11px] text-muted-foreground">
                      -
                    </td>

                    {/* Col 10: Wilayah / Kritis */}
                    <td className="border-r border-border px-2.5 py-1.5 text-[11px]">
                      {perspective.offTrackCount > 0 ? (
                        <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                          {perspective.offTrackCount} kritis
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Col 11: Capaian Skor Perspektif */}
                    <td
                      className={`px-2 py-1.5 text-center font-bold text-xs ${pStyling.bgClass} ${pStyling.textClass}`}
                    >
                      {perspective.score !== null ? `${perspective.score}%` : "-"}
                    </td>
                  </tr>

                  {/* 2. Baris Group Level 2: SASARAN (OBJECTIVE) */}
                  {!isPerspectiveCollapsed &&
                    filteredObjectives.map((objective) => {
                      const isObjCollapsed =
                        collapsedObjectives[objective.id]
                      const objStyling = getStatusStyling(objective.status)
                      const isAddingHere =
                        addingInObjectiveId === objective.id

                      return (
                        <React.Fragment key={objective.id}>
                          {/* Header Baris Sasaran: Icon Arrow & Icon Plus di Kolom Pertama */}
                          <tr className="bg-muted/40 font-medium border-t border-border hover:bg-muted/50 transition-colors">
                            {/* Col 1: Icon Arrow + Icon Plus di Kolom Pertama */}
                            <td className="border-r border-border px-2.5 py-1.5">
                              <div className="flex items-center gap-1.5">
                                {/* Arrow Chevron */}
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

                                {/* Icon Plus di Kolom Pertama seperti Icon Arrow */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartInlineAdd(objective.id)
                                  }
                                  className="flex size-4.5 items-center justify-center rounded border border-border/80 bg-background text-muted-foreground hover:text-sky-600 hover:border-sky-500 transition-colors cursor-pointer"
                                  title="Tambah baris KPI baru di paling bawah sasaran ini"
                                >
                                  <Plus className="size-3" />
                                </button>

                                <span className="text-[11px] font-semibold text-muted-foreground truncate">
                                  {objective.kpis.length} Indikator
                                </span>
                              </div>
                            </td>

                            {/* Col 2: Judul Sasaran */}
                            <td
                              colSpan={8}
                              className="border-r border-border px-3 py-1.5 font-semibold text-foreground text-[12px]"
                            >
                              {objective.name}
                            </td>

                            {/* Col 10: Wilayah */}
                            <td className="border-r border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
                              Semua
                            </td>

                            {/* Col 11: Capaian Sasaran */}
                            <td
                              className={`px-2 py-1 text-center font-bold tabular-nums text-xs ${objStyling.bgClass} ${objStyling.textClass}`}
                            >
                              {objective.progress !== null
                                ? `${objective.progress}%`
                                : "-"}
                            </td>
                          </tr>

                          {/* 3. Baris-baris KPI Eksisting (Semua Aksi Inline di Cell Masing-Masing) */}
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
                                  {/* Col 1: Tahapan Siklus M2C (Garis Grid Rapi) */}
                                  <td className="border-r border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground truncate">
                                    {perspective.name.split(" ")[0]}
                                  </td>

                                  {/* Col 2: Nama KPI (Inline Edit Langsung di Cell) */}
                                  <td
                                    onClick={() =>
                                      handleStartEdit(kpi, "name")
                                    }
                                    className="border-r border-border/60 px-3 py-1.5 cursor-pointer"
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
                                        className="w-full rounded border border-sky-500 bg-background px-1.5 py-0 text-xs font-medium text-foreground focus:outline-none"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate font-medium text-foreground hover:underline">
                                          {kpi.name}
                                        </span>
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

                                  {/* Col 3: Owner (Dropdown Inline Langsung di Cell) */}
                                  <td className="border-r border-border/60 px-2 py-1">
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

                                  {/* Col 4: Bobot (Inline Edit Langsung di Cell) */}
                                  <td
                                    onClick={() =>
                                      handleStartEdit(kpi, "weight")
                                    }
                                    className="border-r border-border/60 px-2 py-1 text-right cursor-pointer"
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
                                        className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 focus:outline-none font-mono"
                                      />
                                    ) : (
                                      <span className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                                        {kpi.weight}%
                                      </span>
                                    )}
                                  </td>

                                  {/* Col 5: Baseline (Inline Edit Langsung di Cell) */}
                                  <td
                                    onClick={() =>
                                      handleStartEdit(kpi, "baseline")
                                    }
                                    className="border-r border-border/60 px-2 py-1 text-right cursor-pointer text-muted-foreground"
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
                                        className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-mono focus:outline-none"
                                      />
                                    ) : (
                                      <span className="hover:underline">
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

                                  {/* Col 6: Realisasi (Inline Edit Langsung di Cell) */}
                                  <td
                                    onClick={() =>
                                      handleStartEdit(kpi, "value")
                                    }
                                    className="border-r border-border/60 px-2 py-1 text-right cursor-pointer"
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
                                        className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 focus:outline-none font-mono"
                                      />
                                    ) : (
                                      <span
                                        className={`font-semibold hover:underline ${
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

                                  {/* Col 7: Target (Inline Edit Langsung di Cell) */}
                                  <td
                                    onClick={() =>
                                      handleStartEdit(kpi, "target")
                                    }
                                    className="border-r border-border/60 px-2 py-1 text-right cursor-pointer text-muted-foreground"
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
                                        className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-mono focus:outline-none"
                                      />
                                    ) : (
                                      <span className="hover:underline">
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

                                  {/* Col 8: Selisih (To Go) */}
                                  <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                    {formatKpiNumber(kpi.toGo, kpi.format, {
                                      unitMultiplier: kpi.unitMultiplier,
                                    })}
                                  </td>

                                  {/* Col 9: Tren with Sparkline & Delta */}
                                  <td className="border-r border-border/60 px-2 py-1">
                                    <div className="flex items-center gap-2">
                                      <MiniSparkline
                                        data={kpi.change.sparkline}
                                      />
                                      <TrendIndicator change={kpi.change} />
                                    </div>
                                  </td>

                                  {/* Col 10: Wilayah / Cabang Perhatian */}
                                  <td className="border-r border-border/60 px-2.5 py-1">
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

                                  {/* Col 11: Capaian Progress */}
                                  <td
                                    className={`px-2 py-1 text-center font-bold tabular-nums text-xs ${kpiStyling.bgClass} ${kpiStyling.textClass}`}
                                  >
                                    {kpi.progress !== null
                                      ? `${kpi.progress}%`
                                      : "-"}
                                  </td>
                                </tr>
                              )
                            })}

                          {/* 4. BARIS DI PALING BAWAH SAAT KLIK (+) PADA OBJECTIVE INI */}
                          {!isObjCollapsed && isAddingHere && (
                            <tr className="bg-sky-50/50 dark:bg-sky-950/20 border-t-2 border-sky-400 dark:border-sky-700 transition-colors">
                              {/* Col 1: Tahapan Siklus M2C */}
                              <td className="border-r border-border px-2.5 py-1 text-[11px] text-sky-600 font-semibold truncate">
                                + Input Baru
                              </td>

                              {/* Col 2: Input Nama KPI Baru */}
                              <td className="border-r border-border px-2 py-1">
                                <Input
                                  autoFocus
                                  placeholder="Nama indikator KPI baru..."
                                  value={newKpiName}
                                  onChange={(e) =>
                                    setNewKpiName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      void handleSaveInlineKpi(objective.id)
                                    } else if (e.key === "Escape") {
                                      handleCancelInlineAdd()
                                    }
                                  }}
                                  className="h-7 text-xs bg-background"
                                />
                              </td>

                              {/* Col 3: Dropdown Pemilik Inline */}
                              <td className="border-r border-border px-1.5 py-1">
                                <Select
                                  value={newKpiOwnerId}
                                  onValueChange={setNewKpiOwnerId}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background">
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

                              {/* Col 4: Input Bobot % */}
                              <td className="border-r border-border px-1.5 py-1 text-right">
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={newKpiWeight}
                                  onChange={(e) =>
                                    setNewKpiWeight(e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-mono font-semibold text-sky-600 bg-background"
                                />
                              </td>

                              {/* Col 5: Input Baseline */}
                              <td className="border-r border-border px-1.5 py-1 text-right">
                                <Input
                                  type="number"
                                  value={newKpiBaseline}
                                  onChange={(e) =>
                                    setNewKpiBaseline(e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-mono bg-background"
                                />
                              </td>

                              {/* Col 6: Input Realisasi */}
                              <td className="border-r border-border px-1.5 py-1 text-right">
                                <Input
                                  type="number"
                                  placeholder="-"
                                  value={newKpiValue}
                                  onChange={(e) =>
                                    setNewKpiValue(e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-mono font-semibold text-sky-600 bg-background"
                                />
                              </td>

                              {/* Col 7: Input Target */}
                              <td className="border-r border-border px-1.5 py-1 text-right">
                                <Input
                                  type="number"
                                  value={newKpiTarget}
                                  onChange={(e) =>
                                    setNewKpiTarget(e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-mono bg-background"
                                />
                              </td>

                              {/* Col 8: Selisih Pratinjau */}
                              <td className="border-r border-border px-2 py-1 text-right text-muted-foreground font-mono text-xs">
                                {newKpiValue !== "" && newKpiBaseline !== ""
                                  ? (
                                      Number(newKpiValue) -
                                      Number(newKpiBaseline)
                                    ).toFixed(1)
                                  : "-"}
                              </td>

                              {/* Col 9: Toggle Arah */}
                              <td className="border-r border-border px-1.5 py-1 text-center">
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

                              {/* Col 10: Wilayah */}
                              <td className="border-r border-border px-2 py-1 text-[11px] text-muted-foreground italic">
                                Semua
                              </td>

                              {/* Col 11: Aksi Simpan / Batal Langsung di Cell */}
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleSaveInlineKpi(objective.id)
                                    }
                                    disabled={savingInline}
                                    className="p-1 rounded text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors"
                                    title="Simpan baris KPI ini (Enter)"
                                  >
                                    <Check className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelInlineAdd}
                                    disabled={savingInline}
                                    className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                                    title="Batal (Esc)"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
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
                {summary.kpisOnTrackCount} dari {summary.totalScoredKpis} KPI sesuai target
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
          adalah input realisasi bulanan. Seluruh cell (Nama, Pemilik, Bobot, Baseline, Realisasi, Target) dapat diedit inline langsung di cell masing-masing, atau tekan{" "}
          <kbd className="rounded border border-border bg-muted px-1 text-[10px]">
            Ctrl+Z
          </kbd>{" "}
          untuk membatalkan.
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
