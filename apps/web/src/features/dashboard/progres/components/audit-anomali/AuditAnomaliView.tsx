"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Columns2, LayoutGrid } from "lucide-react";
import { PageContainer } from "@/components/layout/page/PageContainer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PERIODE_TERKUNCI_KANTOR } from "@/config/periode";
import type { PeriodeOption } from "@/server/services/dashboard/dashboard.service";
import type { AuditAnomaliResult } from "@/server/services/cater/cater-progress.service";
import { AuditAnomaliHeader } from "./AuditAnomaliHeader";
import { AuditKpiGrid } from "./AuditKpiGrid";
import { AuditChartsSection } from "./AuditChartsSection";
import { AuditAturanTable } from "./AuditAturanTable";
import { AuditPelangganTable } from "./AuditPelangganTable";
import { AuditSplitExplorer } from "./AuditSplitExplorer";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface AuditAnomaliViewProps {
  initialPeriode?: string;
  availablePeriods?: PeriodeOption[];
}

export function AuditAnomaliView({
  initialPeriode,
  availablePeriods = [],
}: AuditAnomaliViewProps) {
  const router = useRouter();
  const [data, setData] = React.useState<AuditAnomaliResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState(initialPeriode || PERIODE_TERKUNCI_KANTOR);
  const [viewMode, setViewMode] = React.useState<"split" | "matriks">("split");
  const [filterKode, setFilterKode] = React.useState<string | null>(null);
  const [filterKategori, setFilterKategori] = React.useState<"all" | "anomali" | "warning" | "normal">("all");
  const [search, setSearch] = React.useState("");
  const [offset, setOffset] = React.useState(0);
  const limit = 50;

  React.useEffect(() => {
    if (initialPeriode && initialPeriode !== periode) {
      setPeriode(initialPeriode);
    }
  }, [initialPeriode]);

  const periodeLabel = React.useMemo(() => {
    const found = availablePeriods.find((p) => p.thbl === periode);
    if (found) return found.label;
    if (periode.length === 6) {
      const yr = periode.substring(0, 4);
      const mo = parseInt(periode.substring(4, 6), 10);
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      if (mo >= 1 && mo <= 12) {
        return `${monthNames[mo - 1]} ${yr}`;
      }
    }
    return periode;
  }, [periode, availablePeriods]);

  const handlePeriodChange = (nextThbl: string) => {
    if (!nextThbl || nextThbl === periode) return;
    setPeriode(nextThbl);
    setFilterKode(null);
    setOffset(0);
    router.push(`/progres/audit?periode=${encodeURIComponent(nextThbl)}`, {
      scroll: false,
    });
  };

  const handleSelectFilterKategori = (nextKat: "all" | "anomali" | "warning" | "normal") => {
    setFilterKategori(nextKat);
    setFilterKode(null);
    setOffset(0);
  };

  const handleSelectKode = (kode: string | null) => {
    setFilterKode(kode);
    setOffset(0);
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
      const kodeParam = filterKode ? `&kode=${encodeURIComponent(filterKode)}` : "";
      const katParam = filterKategori !== "all" ? `&kategori=${filterKategori}` : "";
      const res = await fetch(
        `/api/cater/progress/audit-anomali?thbl=${periode}${kodeParam}${katParam}${q}&limit=${limit}&offset=${offset}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat audit anomali:", err);
    } finally {
      setLoading(false);
    }
  }, [periode, filterKode, filterKategori, search, offset, limit]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpi = data?.kpi ?? {
    totalTercatat: 0,
    totalAnomali: 0,
    totalWarning: 0,
    totalNormal: 0,
    persenAnomali: 0,
    persenWarning: 0,
    persenNormal: 0,
  };

  return (
    <PageContainer className="space-y-4">
      {/* 1. Header Cockpit Telemetri */}
      <AuditAnomaliHeader
        periodeThbl={periode}
        periodeLabel={periodeLabel}
        availablePeriods={availablePeriods}
        onPeriodChange={handlePeriodChange}
        onRefresh={fetchData}
        loading={loading}
        kpi={data?.kpi}
      />

      {/* 2. Top Workspace Ribbon: Mode Switcher & Quick Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-card/60 backdrop-blur-sm">
        {/* Ringkasan Satu Baris */}
        <div className="flex flex-wrap items-center gap-2 text-label-12 text-muted-foreground font-mono">
          <span className="font-sans font-semibold text-foreground">Status 2 Pilar:</span>
          <span>
            Total: <strong className="text-foreground">{numberFormat.format(kpi.totalTercatat)}</strong> SL
          </span>
          <span className="text-border">•</span>
          <span className="text-amber-700 dark:text-amber-400">
            Pilar 1 (Anomali): <strong>{numberFormat.format(kpi.totalAnomali)}</strong> ({kpi.persenAnomali}%)
          </span>
          <span className="text-border">•</span>
          <span className="text-blue-700 dark:text-blue-400">
            Pilar 2 (Kendala): <strong>{numberFormat.format(kpi.totalWarning)}</strong> ({kpi.persenWarning}%)
          </span>
          <span className="text-border">•</span>
          <span className="text-emerald-700 dark:text-emerald-400">
            Normal: <strong>{numberFormat.format(kpi.totalNormal)}</strong> ({kpi.persenNormal}%)
          </span>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/50 border border-border shrink-0">
          <Button
            type="button"
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setViewMode("split")}
            className="gap-1.5 h-7 text-label-12 font-medium"
          >
            <Columns2 className="size-3.5 text-foreground/80" />
            <span>2 Kolom (Master-Detail)</span>
          </Button>

          <Button
            type="button"
            variant={viewMode === "matriks" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setViewMode("matriks")}
            className="gap-1.5 h-7 text-label-12 font-medium"
          >
            <LayoutGrid className="size-3.5 text-foreground/80" />
            <span>Matriks &amp; Grafik Penuh</span>
          </Button>
        </div>
      </div>

      {/* 3. Render Mode Sesuai Pilihan */}
      {viewMode === "split" ? (
        /* MODE 1: TAMPILAN 2 KOLOM TERPISAH (MASTER-DETAIL) - REKOMENDASI UTAMA */
        <section aria-label="Eksplorasi 2 Kolom Master-Detail">
          <AuditSplitExplorer
            breakdown={data?.aturanBreakdown ?? []}
            pelanggan={data?.pelanggan ?? []}
            totalPelangganCount={data?.totalPelangganCount ?? 0}
            selectedKode={filterKode}
            onSelectKode={handleSelectKode}
            selectedKategori={filterKategori === "normal" ? "all" : filterKategori}
            onSelectKategori={(kat) => handleSelectFilterKategori(kat)}
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setOffset(0);
            }}
            limit={limit}
            offset={offset}
            onPageChange={setOffset}
            loading={loading}
          />
        </section>
      ) : (
        /* MODE 2: TAMPILAN MATRIKS & GRAFIK LENGKAP */
        <div className="space-y-6">
          <section aria-label="Ringkasan KPI Audit Anomali">
            <AuditKpiGrid
              kpi={kpi}
              activeFilter={filterKategori}
              onSelectFilter={handleSelectFilterKategori}
            />
          </section>

          <section aria-label="Visual Observabilitas Stand Meter">
            <AuditChartsSection
              kpi={kpi}
              breakdown={data?.aturanBreakdown ?? []}
              selectedKode={filterKode}
              onSelectKode={handleSelectKode}
            />
          </section>

          <section aria-label="Matriks Aturan Anomali">
            <AuditAturanTable
              breakdown={data?.aturanBreakdown ?? []}
              selectedKode={filterKode}
              onSelectKode={handleSelectKode}
            />
          </section>

          <section aria-label="Daftar Pelanggan Terdampak">
            {loading && !data ? (
              <div className="flex h-48 w-full items-center justify-center">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : (
              <AuditPelangganTable
                pelanggan={data?.pelanggan ?? []}
                totalCount={data?.totalPelangganCount ?? 0}
                search={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setOffset(0);
                }}
                selectedKode={filterKode}
                selectedKategori={filterKategori}
                limit={limit}
                offset={offset}
                onPageChange={setOffset}
              />
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
