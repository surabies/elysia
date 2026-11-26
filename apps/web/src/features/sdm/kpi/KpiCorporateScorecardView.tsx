"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  Undo2,
  RefreshCw,
  Target,
  FileText,
  ArrowLeft,
  Calendar,
} from "lucide-react"
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Card,
} from "@cater/ui"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { kpiApi } from "./api"
import type { KpiOwner, Perspective } from "./types/KpiTypes"
import { calculateCompanySummary } from "./lib/KpiCalculations"
import { KpiSummaryStrip } from "./components/KpiSummaryStrip"
import { KpiScorecardTable } from "./components/KpiScorecardTable"

interface KpiCorporateScorecardViewProps {
  initialPerspectives?: Perspective[]
  initialOwners?: KpiOwner[]
  initialPeriod?: string
}

const DAFTAR_PERIODE = [
  "Nov 2026",
  "Okt 2026",
  "Sep 2026",
  "Agu 2026",
  "Jul 2026",
  "Jun 2026",
  "Mei 2026",
  "Apr 2026",
  "Mar 2026",
  "Feb 2026",
  "Jan 2026",
]

export function KpiCorporateScorecardView({
  initialPerspectives,
  initialOwners,
  initialPeriod = "Nov 2026",
}: KpiCorporateScorecardViewProps = {}) {
  const [perspectives, setPerspectives] = React.useState<Perspective[]>(
    initialPerspectives && initialPerspectives.length > 0
      ? initialPerspectives
      : []
  )
  const [ownersList, setOwnersList] = React.useState<KpiOwner[]>(
    initialOwners && initialOwners.length > 0 ? initialOwners : []
  )
  const [history, setHistory] = React.useState<Perspective[][]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedPeriod, setSelectedPeriod] = React.useState(initialPeriod)
  const [syncingDb, setSyncingDb] = React.useState(false)
  const [isFormulaOpen, setIsFormulaOpen] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)

  // Ambil pemilik riil jika belum diisi dari SSR
  React.useEffect(() => {
    if (ownersList.length === 0) {
      kpiApi
        .getOwners()
        .then((owners) => {
          if (owners && owners.length > 0) setOwnersList(owners)
        })
        .catch(() => {})
    }
  }, [ownersList.length])

  // Ambil data perspektif riil dari API jika awal kosong
  React.useEffect(() => {
    if (perspectives.length === 0) {
      kpiApi
        .getByPeriode(selectedPeriod)
        .then((data) => {
          if (data && data.length > 0) setPerspectives(data)
        })
        .catch(() => {})
    }
  }, [perspectives.length, selectedPeriod])

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
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

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
      const data = await kpiApi.getByPeriode(newPeriod)
      if (Array.isArray(data) && data.length > 0) {
        setPerspectives(data)
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data periode:", err)
    }
  }

  // Handler Tarik & Sinkronkan Realisasi Otomatis dari Laporan Database Riil
  const handleSyncFromRealReports = async () => {
    setSyncingDb(true)
    try {
      const res = await kpiApi.syncRealisasiDariDatabase(selectedPeriod)
      if (res.perspectives && res.perspectives.length > 0) {
        pushHistory(res.perspectives)
      }
      toast.success(
        `Realisasi KPI berhasil ditarik dari laporan database riil (Periode ${res.thbl})`
      )
    } catch (err: any) {
      toast.error(err.message || "Gagal menyinkronkan data dari laporan database")
    } finally {
      setSyncingDb(false)
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

    kpiApi.updateNilai(kpiId, selectedPeriod, newValue).catch((err) => {
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

    kpiApi.updateBobot(kpiId, newWeight).catch((err) => {
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

    kpiApi.updatePemilik(kpiId, newOwner).catch((err) => {
      console.error("Gagal simpan pemilik ke DB:", err)
    })
  }

  // Handler tambah KPI baru secara inline langsung dari tabel
  const handleAddNewKpiInline = async (input: {
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
  }) => {
    try {
      await kpiApi.createKpi({
        ...input,
        periode: selectedPeriod,
      })

      const refreshed = await kpiApi.getByPeriode(selectedPeriod)
      if (refreshed && refreshed.length > 0) {
        pushHistory(refreshed)
      }
      toast.success(`KPI "${input.name}" berhasil ditambahkan`)
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan KPI baru")
    }
  }

  // Handler paste range nilai dari spreadsheet
  const handlePasteRange = (
    startKpiId: string,
    field: "value" | "weight",
    values: string[]
  ) => {
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
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {/* 1. Header Cockpit (Fixed di atas / shrink-0) */}
      <div className="flex shrink-0 flex-col gap-2.5 rounded-lg border border-border bg-card p-3 shadow-none">
        {/* Baris 1: Tombol Navigasi Kembali & Aksi Utama */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Link href="/kpi">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs bg-card hover:bg-muted"
              >
                <ArrowLeft className="size-3.5 text-muted-foreground" />
                <span>Kinerja &amp; Insentif Petugas</span>
              </Button>
            </Link>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40">
                <Target className="size-4 text-(--ds-blue-700)" />
              </div>
              <div>
                <h1 className="text-label-13 font-semibold text-foreground leading-none">
                  Balanced Scorecard Perusahaan (M2C)
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Evaluasi strategis 4 perspektif kinerja unit berbasis data riil transaksi.
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Sinkronisasi Laporan Riil, Panduan Rumus & Undo */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormulaOpen(true)}
              className="h-8 gap-1.5 text-xs bg-card hover:bg-muted"
            >
              <FileText className="size-3.5 text-(--ds-blue-700)" />
              <span>Metodologi &amp; Rumus KPI</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncFromRealReports}
              disabled={syncingDb}
              className="h-8 gap-1.5 text-xs bg-card hover:bg-muted"
              title="Tarik nilai aktual otomatis dari laporan baca meter, geofence GPS, koreksi, dan DRD"
            >
              <RefreshCw
                className={cn(
                  "size-3.5 text-(--ds-green-700)",
                  syncingDb && "animate-spin"
                )}
              />
              <span>Sinkronkan dari Laporan Riil</span>
            </Button>

            {history.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="h-8 gap-1 px-2 text-xs"
                title="Batalkan perubahan terakhir (Ctrl+Z)"
              >
                <Undo2 className="size-3.5" />
                <span>Undo</span>
              </Button>
            )}
          </div>
        </div>

        {/* Baris 2: Pencarian & Filter Periode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Cari indikator sasaran / KPI strategis... (tekan '/' untuk fokus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-full border-border bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-label-11 uppercase tracking-wider text-muted-foreground">
              Periode:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-border bg-card px-2.5 text-xs font-mono font-medium hover:bg-muted"
                >
                  <Calendar className="size-3 text-muted-foreground" />
                  <span>{selectedPeriod}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {DAFTAR_PERIODE.map((periode) => (
                  <DropdownMenuItem
                    key={periode}
                    onClick={() => handleChangePeriod(periode)}
                    className={cn(
                      "text-xs font-mono",
                      selectedPeriod === periode && "font-semibold bg-muted"
                    )}
                  >
                    {periode}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 2. Konten Utama: Card Scorecard Mengisi Sisa Layar */}
      <Card className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-none">
        {/* Strip Ringkasan 4 Sel (Fixed / shrink-0 di atas tabel) */}
        <KpiSummaryStrip summary={summary} />

        {/* Tabel KPI Scorecard: Hanya tabel ini yang di-scroll */}
        <KpiScorecardTable
          perspectives={calculatedPerspectives}
          summary={summary}
          searchQuery={searchQuery}
          availableOwners={ownersList}
          onUpdateKpiValue={handleUpdateKpiValue}
          onUpdateKpiWeight={handleUpdateKpiWeight}
          onUpdateKpiOwner={handleUpdateKpiOwner}
          onPasteRange={handlePasteRange}
          onAddKpiInline={handleAddNewKpiInline}
        />
      </Card>

      {/* Dialog Metodologi & Rumus Presentasi KPI */}
      <Dialog open={isFormulaOpen} onOpenChange={setIsFormulaOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-heading-18">
              Metodologi Balanced Scorecard Unit (M2C)
            </DialogTitle>
            <DialogDescription className="text-copy-13">
              Indikator kinerja korporasi diturunkan dari 4 perspektif Balanced Scorecard berdasarkan data transaksi riil sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-copy-13">
            <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
              <h3 className="text-label-13 font-semibold text-foreground">
                Empat Perspektif Balanced Scorecard Unit (Bobot 100%)
              </h3>
              <ul className="space-y-1.5 text-copy-12 text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Pencatatan Meter Lapangan (35%)</strong>: Tingkat Keterbacaan Rute (Read Rate 40%), Kepatuhan Titik GPS &le;50m (35%), dan Produktivitas Harian LPS (25%).
                </li>
                <li>
                  <strong className="text-foreground">Verifikasi &amp; Screening Anomali (30%)</strong>: SLA Verifikasi V1 Supervisor (40%), Resolusi Cek Fisik/Anomali (30%), dan Kualitas Tanpa Revisi / First-Time Right (30%).
                </li>
                <li>
                  <strong className="text-foreground">Closing &amp; Penagihan DRD (20%)</strong>: Kesiapan Kunci Billing (35%), Ketepatan Waktu Closing (30%), dan Rasio Realisasi Kubikasi DRD (35%).
                </li>
                <li>
                  <strong className="text-foreground">Master Spasial &amp; Respons Layanan (15%)</strong>: Cakupan Geotagging GPS &amp; Kontak WhatsApp Valid (50%), serta Tindak Lanjut Ganti Meter GWM (50%).
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
