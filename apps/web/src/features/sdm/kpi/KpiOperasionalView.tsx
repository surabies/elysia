"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calculator,
  SlidersHorizontal,
  Target,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { KpiInsentifPetugasTab } from "./components/KpiInsentifPetugasTab"
import { KpiPengaturanInsentifTab } from "./components/KpiPengaturanInsentifTab"

interface KpiOperasionalViewProps {
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

export function KpiOperasionalView({
  initialPeriod = "Nov 2026",
}: KpiOperasionalViewProps = {}) {
  const [activeTab, setActiveTab] = React.useState<"insentif" | "pengaturan">("insentif")
  const [selectedPeriod, setSelectedPeriod] = React.useState(initialPeriod)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {/* 1. Cockpit Header (Fixed di atas / shrink-0) */}
      <div className="flex shrink-0 flex-col gap-2.5 rounded-lg border border-border bg-card p-3 shadow-none">
        {/* Baris 1: Mode Switcher Tabs + Navigasi ke Scorecard & Docs */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-2.5">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
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
              <span>1. Evaluasi &amp; Insentif Petugas</span>
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
              <span>2. Pengaturan Rumusan &amp; Alokasi Beban</span>
            </button>
          </div>

          {/* Navigasi Tambahan: Scorecard Perusahaan & Buku Panduan */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link href="/kpi/scorecard">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs bg-card hover:bg-muted"
                title="Buka halaman Balanced Scorecard 4 Perspektif Perusahaan"
              >
                <Target className="size-3.5 text-(--ds-blue-700)" />
                <span>Scorecard Perusahaan &rarr;</span>
              </Button>
            </Link>

            <Link href="/docs/kpi-insentif">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs bg-card hover:bg-muted"
                title="Buka dokumentasi dan panduan penggunaan modul KPI"
              >
                <BookOpen className="size-3.5 text-amber-500" />
                <span>Buku Panduan (Docs)</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Baris 2: Subtitle Konteks + Filter Periode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-500 shrink-0" />
            <span className="text-copy-13 text-muted-foreground font-normal">
              {activeTab === "insentif"
                ? "Pantau realisasi pencatatan, akurasi GPS, faktor kesulitan medan rute, dan kalkulasi insentif bulanan."
                : "Konfigurasi tarif dasar insentif, faktor kesulitan medan per rute, alokasi beban SL, dan bobot KPI."}
            </span>
          </div>

          {/* Filter Periode */}
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
                    onClick={() => setSelectedPeriod(periode)}
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

      {/* 2. Konten Utama: Mengisi Penuh Tinggi Layar (flex-1 min-h-0) */}
      {activeTab === "insentif" ? (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden w-full">
          <KpiInsentifPetugasTab selectedPeriod={selectedPeriod} />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden w-full max-w-full">
          <KpiPengaturanInsentifTab selectedPeriod={selectedPeriod} />
        </div>
      )}
    </div>
  )
}
