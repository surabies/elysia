"use client"

import * as React from "react"
import {
  Search,
  Share2,
  SlidersHorizontal,
  Filter,
  Columns3,
  Download,
  Plus,
  Calendar,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { KpiItem, KpiOwner, Perspective } from "./types/KpiTypes"
import { INITIAL_SCORECARD_PERSPECTIVES, KPI_OWNERS } from "./data/KpiMockData"
import { calculateCompanySummary } from "./lib/KpiCalculations"
import type { ParsedNewKpi } from "./lib/KpiFormValidation"
import { KpiSummaryStrip } from "./components/KpiSummaryStrip"
import { KpiScorecardTable } from "./components/KpiScorecardTable"
import { AddKpiSheet } from "./components/AddKpiSheet"

interface KpiScorecardViewProps {
  initialPerspectives?: Perspective[]
  initialPeriod?: string
}

export function KpiScorecardView({
  initialPerspectives,
  initialPeriod = "Sep 2026",
}: KpiScorecardViewProps = {}) {
  const [perspectives, setPerspectives] = React.useState<Perspective[]>(
    initialPerspectives && initialPerspectives.length > 0
      ? initialPerspectives
      : INITIAL_SCORECARD_PERSPECTIVES
  )
  const [history, setHistory] = React.useState<Perspective[][]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedPeriod, setSelectedPeriod] = React.useState(initialPeriod)
  const [isAddKpiOpen, setIsAddKpiOpen] = React.useState(false)
  const [preselectedObjectiveId, setPreselectedObjectiveId] = React.useState<string | null>(null)
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)

  const ownersList = React.useMemo<KpiOwner[]>(() => {
    return Object.values(KPI_OWNERS)
  }, [])

  // Hitung metrik dinamis
  const { calculatedPerspectives, summary } = React.useMemo(() => {
    return calculateCompanySummary(perspectives)
  }, [perspectives])

  // Simpan state ke history sebelum perubahan (untuk Undo)
  const pushHistory = (newPerspectives: Perspective[]) => {
    setHistory((prev) => [perspectives, ...prev.slice(0, 19)])
    setPerspectives(newPerspectives)
  }

  const handleUndo = React.useCallback(() => {
    if (history.length === 0) {
      toast.info("Tidak ada lagi perubahan untuk dibatalkan")
      return
    }
    const previous = history[0]
    setHistory((prev) => prev.slice(1))
    setPerspectives(previous)
    toast.success("Perubahan terakhir berhasil dibatalkan (Undo)")
  }, [history])

  // Keyboard shortcut: '/' fokus ke search, Ctrl+Z untuk undo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut '/'
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Shortcut Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault()
          handleUndo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleUndo])

  // Handler ganti periode dari dropdown
  const handleChangePeriod = async (newPeriod: string) => {
    setSelectedPeriod(newPeriod)
    try {
      const res = await fetch(`/api/kpi?periode=${encodeURIComponent(newPeriod)}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setPerspectives(json.data)
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data periode:", err)
    }
  }

  // Handler update value KPI
  const handleUpdateKpiValue = (kpiId: string, newValue: number | null) => {
    const next = perspectives.map((p) => ({
      ...p,
      objectives: p.objectives.map((obj) => ({
        ...obj,
        kpis: obj.kpis.map((kpi) => {
          if (kpi.id === kpiId) {
            return { ...kpi, value: newValue }
          }
          return kpi
        }),
      })),
    }))
    pushHistory(next)

    // Sync ke PostgreSQL database via Elysia API
    fetch(`/api/kpi/${kpiId}/nilai`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periode: selectedPeriod,
        nilai: newValue,
      }),
    }).catch((err) => {
      console.error("Gagal simpan nilai aktual ke DB:", err)
    })
  }

  // Handler update weight KPI
  const handleUpdateKpiWeight = (kpiId: string, newWeight: number) => {
    const next = perspectives.map((p) => ({
      ...p,
      objectives: p.objectives.map((obj) => ({
        ...obj,
        kpis: obj.kpis.map((kpi) => {
          if (kpi.id === kpiId) {
            return { ...kpi, weight: newWeight }
          }
          return kpi
        }),
      })),
    }))
    pushHistory(next)

    // Sync ke PostgreSQL database via Elysia API
    fetch(`/api/kpi/${kpiId}/bobot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bobot: newWeight }),
    }).catch((err) => {
      console.error("Gagal simpan bobot ke DB:", err)
    })
  }

  // Handler update owner KPI
  const handleUpdateKpiOwner = (kpiId: string, newOwner: KpiOwner) => {
    const next = perspectives.map((p) => ({
      ...p,
      objectives: p.objectives.map((obj) => ({
        ...obj,
        kpis: obj.kpis.map((kpi) => {
          if (kpi.id === kpiId) {
            return { ...kpi, owner: newOwner }
          }
          return kpi
        }),
      })),
    }))
    pushHistory(next)

    // Sync ke PostgreSQL database via Elysia API
    fetch(`/api/kpi/${kpiId}/pemilik`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pemilikId: newOwner.id,
        pemilikNama: newOwner.name,
        pemilikInisial: newOwner.initials,
      }),
    }).catch((err) => {
      console.error("Gagal simpan pemilik ke DB:", err)
    })
  }

  // Handler buka sheet Add KPI
  const handleOpenAddKpi = (objectiveId?: string) => {
    setPreselectedObjectiveId(objectiveId ?? null)
    setIsAddKpiOpen(true)
  }

  // Handler tambah KPI baru
  const handleAddNewKpi = (parsed: ParsedNewKpi) => {
    const foundOwner = ownersList.find((o) => o.id === parsed.ownerId) || {
      id: parsed.ownerId,
      name: parsed.ownerId,
      initials: parsed.ownerId.slice(0, 1).toUpperCase(),
    }

    const generatedId = `kpi-${Date.now()}`
    const newKpi: KpiItem = {
      id: generatedId,
      name: parsed.name,
      direction: parsed.direction,
      owner: foundOwner,
      weight: parsed.weight,
      baseline: parsed.baseline,
      value: parsed.value,
      target: parsed.target,
      format: parsed.format,
      currencySymbol: parsed.format === "currency" ? "$" : undefined,
      change: {
        direction: "neutral",
        diff: 0,
        sparkline: [parsed.baseline, parsed.baseline, parsed.value ?? parsed.baseline],
      },
      laggingMarket: null,
    }

    const next = perspectives.map((p) => ({
      ...p,
      objectives: p.objectives.map((obj) => {
        if (obj.id === parsed.objectiveId) {
          return {
            ...obj,
            kpis: [...obj.kpis, newKpi],
          }
        }
        return obj
      }),
    }))

    pushHistory(next)
    toast.success("Indikator KPI berhasil disimpan ke database")

    // Sync ke PostgreSQL database via Elysia API
    fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed,
        periode: selectedPeriod,
        ownerDetails: {
          name: foundOwner.name,
          initials: foundOwner.initials,
        },
      }),
    }).catch((err) => {
      console.error("Gagal persist KPI ke database:", err)
      toast.error("Gagal menyimpan ke database")
    })
  }

  // Handler paste range nilai dari spreadsheet (tab/newline separated)
  const handlePasteRange = (
    startKpiId: string,
    field: "value" | "weight",
    values: string[]
  ) => {
    // Kumpulkan seluruh KPI terurut dalam daftar flat
    const flatKpis: { kpiId: string }[] = []
    perspectives.forEach((p) => {
      p.objectives.forEach((obj) => {
        obj.kpis.forEach((kpi) => {
          flatKpis.push({ kpiId: kpi.id })
        })
      })
    })

    const startIndex = flatKpis.findIndex((k) => k.kpiId === startKpiId)
    if (startIndex === -1) return

    const valueMap = new Map<string, string>()
    values.forEach((val, idx) => {
      const targetKpi = flatKpis[startIndex + idx]
      if (targetKpi) {
        valueMap.set(targetKpi.kpiId, val)
      }
    })

    const next = perspectives.map((p) => ({
      ...p,
      objectives: p.objectives.map((obj) => ({
        ...obj,
        kpis: obj.kpis.map((kpi) => {
          if (valueMap.has(kpi.id)) {
            const raw = valueMap.get(kpi.id)!
            if (field === "value") {
              const cleaned = raw.replace(/[$,%]/g, "").trim()
              const parsed = cleaned ? parseFloat(cleaned) : null
              return { ...kpi, value: parsed !== null && !isNaN(parsed) ? parsed : null }
            } else {
              const cleaned = raw.replace(/[%]/g, "").trim()
              const parsed = parseFloat(cleaned)
              return { ...kpi, weight: !isNaN(parsed) ? Math.round(parsed) : kpi.weight }
            }
          }
          return kpi
        }),
      })),
    }))

    pushHistory(next)
    toast.success(`Berhasil menempelkan ${valueMap.size} baris data dari Excel`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6 lg:p-7">
      {/* A. Header Halaman */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb M2C Tirtawening > Kinerja & Evaluasi > Strategy Scorecard (KPI) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="size-2 rounded-full bg-sky-600 shadow-sm" />
            <span>M2C Tirtawening</span>
          </div>
          <span>&gt;</span>
          <span className="hover:text-foreground">Kinerja & Evaluasi</span>
          <span>&gt;</span>
          <span className="font-semibold text-foreground">Strategy Scorecard (KPI)</span>
        </div>

        {/* Updated timestamp & Share Button */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            Sinkronisasi Database Aktif • {selectedPeriod}
          </span>
          {history.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className="h-7 gap-1 px-2 text-xs"
              title="Batalkan perubahan terakhir (Ctrl+Z)"
            >
              <Undo2 className="size-3" />
              <span>Batal (Undo)</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium px-3 text-xs"
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href)
                toast.success("Tautan scorecard berhasil disalin ke clipboard")
              }
            }}
          >
            <Share2 className="size-3.5" />
            <span>Bagikan</span>
          </Button>
        </div>
      </div>

      {/* B. Kartu Utama Strategy Scorecard */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Toolbar Kartu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 sm:p-4">
          <div>
            <h1 className="text-base font-bold text-foreground">
              Strategy Scorecard (KPI Baca Meter)
            </h1>
            <p className="text-xs text-muted-foreground">
              Target Tahunan & Realisasi Bulanan: Pencatat, Verifikasi, Closing DRD & Distribusi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Input Search KPIs */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari indikator KPI atau penanggung jawab..."
                className="h-8 w-56 pl-8 pr-7 text-xs bg-muted/40 sm:w-64"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1 py-0.2 text-[9px] font-semibold text-muted-foreground">
                /
              </kbd>
            </div>

            {/* Dropdown Periode */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>{selectedPeriod}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {["Sep 2026", "Agt 2026", "Jul 2026", "Q3 2026", "Target Akhir 2026"].map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => handleChangePeriod(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Empat Tombol Ikon (Filter, Sliders, Kolom, Download) */}
            <div className="flex items-center gap-1 border-x border-border px-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Saring data scorecard"
              >
                <Filter className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Penyesuaian target"
              >
                <SlidersHorizontal className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Pilih kolom tampilan"
              >
                <Columns3 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Unduh laporan scorecard"
                onClick={() => toast.success("Menyiapkan berkas laporan scorecard...")}
              >
                <Download className="size-3.5" />
              </Button>
            </div>

            {/* Tombol Hitam + Tambah KPI */}
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium px-3 text-xs"
              onClick={() => handleOpenAddKpi()}
            >
              <Plus className="size-3.5" />
              <span>Tambah KPI</span>
            </Button>
          </div>
        </div>

        {/* Strip Ringkasan 4 Sel */}
        <KpiSummaryStrip summary={summary} />

        {/* C. Tabel KPI Scorecard */}
        <KpiScorecardTable
          perspectives={calculatedPerspectives}
          summary={summary}
          searchQuery={searchQuery}
          onUpdateKpiValue={handleUpdateKpiValue}
          onUpdateKpiWeight={handleUpdateKpiWeight}
          onUpdateKpiOwner={handleUpdateKpiOwner}
          onPasteRange={handlePasteRange}
          onOpenAddKpi={handleOpenAddKpi}
        />
      </div>

      {/* Sheet Add KPI */}
      <AddKpiSheet
        open={isAddKpiOpen}
        onOpenChange={setIsAddKpiOpen}
        perspectives={perspectives}
        owners={ownersList}
        selectedPeriod={selectedPeriod}
        preselectedObjectiveId={preselectedObjectiveId}
        onAddKpi={handleAddNewKpi}
      />
    </div>
  )
}
