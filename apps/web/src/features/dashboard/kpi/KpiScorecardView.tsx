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
  RefreshCw,
  Target,
  Calculator,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { kpiApi } from "./api"
import type { KpiItem, KpiOwner, Perspective } from "./types/KpiTypes"
import { calculateCompanySummary } from "./lib/KpiCalculations"
import { KpiSummaryStrip } from "./components/KpiSummaryStrip"
import { KpiScorecardTable } from "./components/KpiScorecardTable"
import { KpiInsentifPetugasTab } from "./components/KpiInsentifPetugasTab"
import { KpiPengaturanInsentifTab } from "./components/KpiPengaturanInsentifTab"

interface KpiScorecardViewProps {
  initialPerspectives?: Perspective[]
  initialOwners?: KpiOwner[]
  initialPeriod?: string
}

export function KpiScorecardView({
  initialPerspectives,
  initialOwners,
  initialPeriod = "Nov 2026",
}: KpiScorecardViewProps = {}) {
  const [activeTab, setActiveTab] = React.useState<
    "scorecard" | "insentif" | "pengaturan"
  >("scorecard")
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
      kpiApi.getOwners().then((owners) => {
        if (owners && owners.length > 0) setOwnersList(owners)
      }).catch(() => {})
    }
  }, [ownersList.length])

  // Ambil data perspektif riil dari API jika awal kosong
  React.useEffect(() => {
    if (perspectives.length === 0) {
      kpiApi.getByPeriode(selectedPeriod).then((data) => {
        if (data && data.length > 0) setPerspectives(data)
      }).catch(() => {})
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

  // Handler Tarik & Sinkronkan Realisasi Otomatis dari Laporan Transaksi Database Riil
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
      toast.success(`Indikator "${input.name}" berhasil ditambahkan`)
      const data = await kpiApi.getByPeriode(selectedPeriod)
      if (data && data.length > 0) {
        setPerspectives(data)
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan KPI")
      throw err
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6 lg:p-7">
      {/* A. Header Halaman & Switcher Mode */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Mode Switcher Tabs (Putih Bersih) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("scorecard")}
            className={cn(
              "h-8 px-3 rounded-md border text-label-12 font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-card",
              activeTab === "scorecard"
                ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Target className="size-3.5 text-(--ds-blue-700)" />
            <span>1. Balanced Scorecard Unit (M2C)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("insentif")}
            className={cn(
              "h-8 px-3 rounded-md border text-label-12 font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-card",
              activeTab === "insentif"
                ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Calculator className="size-3.5 text-(--ds-green-700)" />
            <span>2. Matriks Beban Kerja &amp; Insentif Petugas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pengaturan")}
            className={cn(
              "h-8 px-3 rounded-md border text-label-12 font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-card",
              activeTab === "pengaturan"
                ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5 text-(--ds-amber-700)" />
            <span>3. Pengaturan Rumusan &amp; Alokasi Beban</span>
          </button>
        </div>

        {/* Tombol Sinkronisasi Laporan Riil, Panduan Rumus & Share */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFormulaOpen(true)}
            className="h-8 gap-1.5 text-xs bg-card"
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
            className="h-8 gap-1.5 text-xs bg-card"
            title="Tarik nilai aktual otomatis dari laporan baca meter, geofence GPS, koreksi, dan DRD"
          >
            <RefreshCw className={cn("size-3.5 text-(--ds-green-700)", syncingDb && "animate-spin")} />
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

      {/* B. Kartu Utama Strategy Scorecard / Matriks Insentif */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Toolbar Kartu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 sm:p-4">
          <div>
            <h1 className="text-base font-bold text-foreground">
              {activeTab === "scorecard"
                ? "Strategy Scorecard (KPI Siklus Meter-to-Cash)"
                : "Matriks Evaluasi KPI & Simulasi Insentif Berbasis Beban Kerja"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeTab === "scorecard"
                ? "Evaluasi 4 Perspektif Operasional: Pencatatan Lapangan (35%), Verifikasi V1/V2 (30%), Closing DRD (20%), dan Master Spasial (15%)"
                : "Perhitungan objektif insentif petugas berdasarkan Indeks Beban Kerja (SL) × Skor Capaian Kinerja (Kuantitas, GPS, Kualitas & Durasi)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "scorecard" && (
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
            )}

            {/* Dropdown Periode */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>{selectedPeriod}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {["Nov 2026", "Okt 2026", "Sep 2026", "Agt 2026", "Jul 2026", "Target Akhir 2026"].map((p) => (
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

            {activeTab === "scorecard" && (
              <>
                <div className="flex items-center gap-1 border-x border-border px-1.5">
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
              </>
            )}
          </div>
        </div>

        {activeTab === "scorecard" ? (
          <>
            {/* Strip Ringkasan 4 Sel */}
            <KpiSummaryStrip summary={summary} />

            {/* Tabel KPI Scorecard */}
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
          </>
        ) : activeTab === "insentif" ? (
          <KpiInsentifPetugasTab selectedPeriod={selectedPeriod} />
        ) : (
          <KpiPengaturanInsentifTab
            selectedPeriod={selectedPeriod}
            onUpdated={() => {
              kpiApi
                .getByPeriode(selectedPeriod)
                .then((data) => {
                  if (data && data.length > 0) setPerspectives(data)
                })
                .catch(() => {})
            }}
          />
        )}
      </div>

      {/* Dialog Metodologi & Rumus Presentasi KPI & Insentif */}
      <Dialog open={isFormulaOpen} onOpenChange={setIsFormulaOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-heading-18">
              Metodologi KPI &amp; Formulasi Insentif Berbasis Beban Kerja
            </DialogTitle>
            <DialogDescription className="text-copy-13">
              Seluruh indikator KPI ditarik langsung dari 7 modul laporan operasional yang berjalan di sistem (dokumentasi lengkap tersedia di <code>docs/PRESENTASI_KPI_DAN_INSENTIF.md</code>).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-copy-13">
            <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5 space-y-2">
              <h3 className="text-label-13 font-semibold text-foreground">
                1. Empat Perspektif Balanced Scorecard Unit (Bobot 100%)
              </h3>
              <ul className="space-y-1 text-copy-12 text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Pencatatan Meter Lapangan (35%)</strong>: Read Rate Rute (40%), Kepatuhan Titik GPS &le;50m (35%), Produktivitas Harian LPS (25%).
                </li>
                <li>
                  <strong className="text-foreground">Verifikasi &amp; Screening Anomali (30%)</strong>: SLA Verifikasi V1 Supervisor (40%), Resolusi Cek Fisik/Anomali (30%), Kualitas Tanpa Revisi / First-Time Right (30%).
                </li>
                <li>
                  <strong className="text-foreground">Closing &amp; Penagihan DRD (20%)</strong>: Kesiapan Kunci Billing (35%), Ketepatan Waktu Closing (30%), Rasio Realisasi Kubikasi DRD (35%).
                </li>
                <li>
                  <strong className="text-foreground">Master Spasial &amp; Respons Layanan (15%)</strong>: Cakupan Geotagging GPS &amp; Kontak WhatsApp Valid (50%), Tindak Lanjut Ganti Meter GWM (50%).
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5 space-y-2">
              <h3 className="text-label-13 font-semibold text-foreground">
                2. Rumus Insentif Individu (Keadilan Beban Kerja × Kualitas Capaian)
              </h3>
              <p className="text-copy-12 text-muted-foreground">
                Mengatasi ketimpangan antara petugas rute padat dan rute ringan serta mencegah praktik tembak angka tanpa foto/GPS:
              </p>
              <div className="p-2.5 rounded bg-card border border-border font-mono text-xs space-y-1">
                <div>1. Indeks Beban = Clamp(Target SL Petugas / Rata-rata Target SL, 0.70, 1.40)</div>
                <div>2. Skor KPI = (40% × %SL) + (25% × %GPS) + (20% × %Kualitas) + (15% × %Kecepatan)</div>
                <div>3. Total Insentif = (Pagu Dasar + [SL Terbaca × Tarif/SL]) × Indeks Beban × Pengali Grade</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-copy-12">
                <div className="p-2 rounded bg-card border border-border">
                  <strong className="block text-(--ds-green-800)">Grade A (&ge;90)</strong>
                  <span className="font-mono text-xs">Pengali 110%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <strong className="block text-(--ds-blue-800)">Grade B (75–89)</strong>
                  <span className="font-mono text-xs">Pengali 100%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <strong className="block text-(--ds-amber-900)">Grade C (60–74)</strong>
                  <span className="font-mono text-xs">Pengali 65%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <strong className="block text-(--ds-red-800)">Grade D (&lt;60)</strong>
                  <span className="font-mono text-xs">Pengali 0%</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
