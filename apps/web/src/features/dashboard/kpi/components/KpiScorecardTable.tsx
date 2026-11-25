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

  // Inline editing state untuk baris eksisting: { kpiId, field: "value" | "weight" }
  const [editingCell, setEditingCell] = React.useState<{
    kpiId: string
    field: "value" | "weight"
  } | null>(null)
  const [editValueText, setEditValueText] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // State Inline Tambah KPI Baru
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
  const [newKpiFormat, setNewKpiFormat] = React.useState<
    "percent" | "decimal" | "currency"
  >("percent")
  const [savingInline, setSavingInline] = React.useState(false)

  const togglePerspective = (id: string) => {
    setCollapsedPerspectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleObjective = (id: string) => {
    setCollapsedObjectives((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Fokus ke input saat mulai edit baris eksisting
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

  // Handler Mulai Tambah KPI Inline
  const handleStartInlineAdd = (objectiveId: string) => {
    // Pastikan grup sasaran terbuka jika sebelumnya tertutup
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
    setNewKpiFormat("percent")
  }

  // Handler Simpan KPI Inline ke Database
  const handleSaveInlineKpi = async (objectiveId: string) => {
    if (!newKpiName.trim()) {
      toast.error("Nama indikator KPI wajib diisi")
      return
    }

    setSavingInline(true)
    try {
      const selectedOwner = availableOwners.find(
        (o) => o.id === newKpiOwnerId
      )
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
          format: newKpiFormat,
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
          {/* Header Tabel Sticky */}
          <thead className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="min-w-[320px] border-r border-border p-2.5">
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
              <th className="w-[105px] border-r border-border p-2.5">Tren</th>
              <th className="w-[120px] border-r border-border p-2.5">
                Wilayah Perhatian
              </th>
              <th className="w-[80px] border-r border-border p-2.5 text-center">
                Capaian
              </th>
              <th className="w-[40px] p-2.5 text-center" aria-label="Aksi" />
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
                  {/* 1. Baris Group Level 1: PERSPEKTIF (Lebar sama & sejajar dengan kolom tabel) */}
                  <tr className="bg-muted/70 font-semibold border-y border-border hover:bg-muted/80 transition-colors">
                    {/* Col 1: Nama Perspektif dengan Tombol Arrow */}
                    <td className="border-r border-border px-3 py-2 text-foreground">
                      <div className="flex items-center gap-2">
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
                            <ChevronRight className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                        <span className="font-bold text-[12px] tracking-tight">
                          {perspective.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-normal border-border bg-background"
                        >
                          Bobot {perspective.scoreWeightPercent}%
                        </Badge>
                      </div>
                    </td>

                    {/* Col 2: Aktor / Unit */}
                    <td className="border-r border-border px-2.5 py-1.5 text-[11px] text-muted-foreground font-medium">
                      Unit Bisnis M2C
                    </td>

                    {/* Col 3: Bobot Perspektif */}
                    <td className="border-r border-border px-2 py-1.5 text-right font-bold text-foreground text-[11px]">
                      {perspective.scoreWeightPercent}%
                    </td>

                    {/* Col 4 - 8: Baseline, Realisasi, Target, Selisih, Tren (Garis Grid Rapi) */}
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
                    <td className="border-r border-border px-2 py-1.5 text-[11px] text-muted-foreground">
                      -
                    </td>

                    {/* Col 9: Status Wilayah / Indikator Kritis */}
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

                    {/* Col 10: Capaian Skor Perspektif */}
                    <td
                      className={`border-r border-border px-2 py-1.5 text-center font-bold text-xs ${pStyling.bgClass} ${pStyling.textClass}`}
                    >
                      {perspective.score !== null ? `${perspective.score}%` : "-"}
                    </td>

                    {/* Col 11: Aksi */}
                    <td className="p-1.5" />
                  </tr>

                  {/* 2. Baris Group Level 2: SASARAN (OBJECTIVE) & DAFTAR KPI DI BAWAHNYA */}
                  {!isPerspectiveCollapsed &&
                    filteredObjectives.map((objective) => {
                      const isObjCollapsed =
                        collapsedObjectives[objective.id]
                      const objStyling = getStatusStyling(objective.status)
                      const isAddingHere =
                        addingInObjectiveId === objective.id

                      return (
                        <React.Fragment key={objective.id}>
                          {/* Baris Sasaran (Objective Header) */}
                          <tr className="bg-muted/30 font-medium border-t border-border hover:bg-muted/40 transition-colors">
                            {/* Col 1: Arrow + Icon Plus di Kolom Pertama + Nama Sasaran */}
                            <td className="border-r border-border px-3 py-1.5">
                              <div className="flex items-center gap-1.5 pl-4">
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

                                {/* Icon Plus di kolom pertama seperti icon arrow */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartInlineAdd(objective.id)
                                  }
                                  className="flex size-4.5 items-center justify-center rounded border border-border/80 bg-background text-muted-foreground hover:text-sky-600 hover:border-sky-500 transition-colors cursor-pointer"
                                  title="Tambah baris KPI baru secara inline di sasaran ini"
                                >
                                  <Plus className="size-3" />
                                </button>

                                <span className="font-semibold text-foreground text-[12px]">
                                  {objective.name}
                                </span>
                                <span className="font-normal text-muted-foreground text-[11px]">
                                  ({objective.kpis.length} indikator)
                                </span>
                              </div>
                            </td>

                            {/* Col 2 - 9: Garis Grid Sesuai Struktur Tabel */}
                            <td className="border-r border-border px-2 py-1 text-[11px] text-muted-foreground">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-right text-muted-foreground text-[11px]">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-right text-muted-foreground text-[11px]">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-right text-muted-foreground text-[11px]">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-right text-muted-foreground text-[11px]">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-right text-muted-foreground text-[11px]">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-[11px] text-muted-foreground">
                              —
                            </td>
                            <td className="border-r border-border px-2 py-1 text-[11px] text-muted-foreground">
                              —
                            </td>

                            {/* Col 10: Progress Capaian Sasaran */}
                            <td
                              className={`border-r border-border px-2 py-1 text-center font-bold tabular-nums text-xs ${objStyling.bgClass} ${objStyling.textClass}`}
                            >
                              {objective.progress !== null
                                ? `${objective.progress}%`
                                : "-"}
                            </td>

                            {/* Col 11: Aksi */}
                            <td className="p-1 text-center" />
                          </tr>

                          {/* 3. Baris Input INLINE Tambah KPI Baru (Muncul Sesuai Relevansi Sasaran) */}
                          {!isObjCollapsed && isAddingHere && (
                            <tr className="bg-sky-50/50 dark:bg-sky-950/20 border-t border-sky-300 dark:border-sky-800 transition-colors">
                              {/* Col 1: Input Nama KPI Baru & Arah */}
                              <td className="border-r border-border px-3 py-1.5">
                                <div className="flex items-center gap-1.5 pl-10">
                                  <Input
                                    autoFocus
                                    placeholder="Ketik nama indikator KPI baru..."
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
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNewKpiDirection((d) =>
                                        d === "higher" ? "lower" : "higher"
                                      )
                                    }
                                    className="p-1 rounded text-muted-foreground hover:text-foreground shrink-0 border border-border bg-card"
                                    title={
                                      newKpiDirection === "higher"
                                        ? "Arah: Lebih tinggi lebih baik (↑)"
                                        : "Arah: Lebih rendah lebih baik (↓)"
                                    }
                                  >
                                    {newKpiDirection === "higher" ? (
                                      <ArrowUp className="size-3 text-emerald-600" />
                                    ) : (
                                      <ArrowDown className="size-3 text-amber-600" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Col 2: Dropdown Pemilik */}
                              <td className="border-r border-border px-2 py-1">
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

                              {/* Col 3: Input Bobot % */}
                              <td className="border-r border-border px-2 py-1 text-right">
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

                              {/* Col 4: Input Baseline */}
                              <td className="border-r border-border px-2 py-1 text-right">
                                <Input
                                  type="number"
                                  value={newKpiBaseline}
                                  onChange={(e) =>
                                    setNewKpiBaseline(e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-mono bg-background"
                                />
                              </td>

                              {/* Col 5: Input Nilai Realisasi */}
                              <td className="border-r border-border px-2 py-1 text-right">
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

                              {/* Col 6: Input Target */}
                              <td className="border-r border-border px-2 py-1 text-right">
                                <Input
                                  type="number"
                                  value={newKpiTarget}
                                  onChange={(e) =>
                                    setNewKpiTarget(e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-mono bg-background"
                                />
                              </td>

                              {/* Col 7: Selisih Pratinjau */}
                              <td className="border-r border-border px-2 py-1 text-right text-muted-foreground font-mono text-xs">
                                {newKpiValue !== "" && newKpiBaseline !== ""
                                  ? (
                                      Number(newKpiValue) -
                                      Number(newKpiBaseline)
                                    ).toFixed(1)
                                  : "-"}
                              </td>

                              {/* Col 8: Selector Format Satuan */}
                              <td className="border-r border-border px-2 py-1">
                                <Select
                                  value={newKpiFormat}
                                  onValueChange={(val: any) =>
                                    setNewKpiFormat(val)
                                  }
                                >
                                  <SelectTrigger className="h-7 text-[11px] bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="text-xs">
                                    <SelectItem value="percent">
                                      Persentase (%)
                                    </SelectItem>
                                    <SelectItem value="decimal">
                                      Angka Desimal
                                    </SelectItem>
                                    <SelectItem value="currency">
                                      Mata Uang (Rp)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* Col 9: Wilayah */}
                              <td className="border-r border-border px-2.5 py-1 text-[11px] text-muted-foreground italic">
                                Semua Wilayah
                              </td>

                              {/* Col 10: Status Pratinjau */}
                              <td className="border-r border-border px-2 py-1 text-center">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 text-sky-600 border-sky-300 dark:border-sky-800"
                                >
                                  Baris Baru
                                </Badge>
                              </td>

                              {/* Col 11: Tombol Simpan & Batal */}
                              <td className="px-1 py-1 text-center">
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
                                    title="Batalkan penambahan (Esc)"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* 4. Baris-baris KPI Eksisting di Bawah Objective */}
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
                                <tr
                                  key={kpi.id}
                                  className="h-7 hover:bg-muted/20 transition-colors border-t border-border/40"
                                >
                                  {/* Col 1: Nama KPI (Indented pl-10) */}
                                  <td className="border-r border-border/60 px-3 py-1.5">
                                    <div className="flex items-center gap-1.5 pl-10">
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

                                  {/* Col 2: Owner with Avatar & Dropdown */}
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

                                  {/* Col 3: Weight (Editable Blue Figure) */}
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
                                        className="w-full rounded border border-sky-500 bg-background px-1 py-0 text-right text-xs font-semibold text-sky-600 focus:outline-none"
                                      />
                                    ) : (
                                      <span className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                                        {kpi.weight}%
                                      </span>
                                    )}
                                  </td>

                                  {/* Col 4: Baseline */}
                                  <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                    {formatKpiNumber(
                                      kpi.baseline,
                                      kpi.format,
                                      {
                                        unitMultiplier: kpi.unitMultiplier,
                                      }
                                    )}
                                  </td>

                                  {/* Col 5: Realisasi (Editable Blue Figure) */}
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

                                  {/* Col 6: Target */}
                                  <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                    {formatKpiNumber(kpi.target, kpi.format, {
                                      unitMultiplier: kpi.unitMultiplier,
                                    })}
                                  </td>

                                  {/* Col 7: Selisih (To Go) */}
                                  <td className="border-r border-border/60 px-2 py-1 text-right text-muted-foreground">
                                    {formatKpiNumber(kpi.toGo, kpi.format, {
                                      unitMultiplier: kpi.unitMultiplier,
                                    })}
                                  </td>

                                  {/* Col 8: Tren with Sparkline & Delta */}
                                  <td className="border-r border-border/60 px-2.5 py-1">
                                    <div className="flex items-center gap-2">
                                      <MiniSparkline
                                        data={kpi.change.sparkline}
                                      />
                                      <TrendIndicator change={kpi.change} />
                                    </div>
                                  </td>

                                  {/* Col 9: Wilayah / Cabang Perhatian */}
                                  <td className="border-r border-border/60 px-2.5 py-1">
                                    {kpi.laggingMarket ? (
                                      <div className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted/70">
                                        <span className="text-xs">📍</span>
                                        <span className="font-semibold text-foreground">
                                          {kpi.laggingMarket.countryName ||
                                            kpi.laggingMarket.countryCode}
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
                                      <span className="text-muted-foreground text-[11px] italic">
                                        Semua Wilayah
                                      </span>
                                    )}
                                  </td>

                                  {/* Col 10: Capaian Progress */}
                                  <td
                                    className={`border-r border-border/60 px-2 py-1 text-center font-bold tabular-nums ${kpiStyling.bgClass} ${kpiStyling.textClass}`}
                                  >
                                    {kpi.progress !== null
                                      ? `${kpi.progress}%`
                                      : "-"}
                                  </td>

                                  {/* Col 11: Menu Aksi Baris */}
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
                  {summary.kpisOnTrackCount} dari {summary.totalScoredKpis} KPI
                  sesuai target
                </div>
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
                <div className="text-sm font-bold">
                  {summary.companyScore}%
                </div>
                <div className="text-[9px] uppercase font-semibold">
                  Perhatian
                </div>
              </td>
              <td className="p-2.5" />
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
          adalah input realisasi bulanan. Klik cell untuk mengedit langsung, paste
          dari Excel, atau tekan{" "}
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
