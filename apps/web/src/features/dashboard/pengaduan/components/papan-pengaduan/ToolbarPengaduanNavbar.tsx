"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/ToolbarPengaduanNavbar.tsx
// Toolbar Navbar Pengaduan Modern, Terpadu, Compact & Premium (dipasang lewat Portal ke #pengaduan-navbar-controls).
// - Kiri: Kotak Cari Cepat + REUI Filters (+ Filter Status, Prioritas, Jenis, Lewat SLA)
// - Kanan: Ringkasan Sebaris (saat KPI dilipat) + Tombol Restore Panel yang sedang tersembunyi
//          + Filter Periode (persis Panel Dashboard) + Segarkan + Indicator Dot Status Baris + Sortir Per Baris (Tanpa Paginasi)

import * as React from "react";
import {
  BarChart3,
  LayoutTemplate,
  PanelRight,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { cn } from "@/lib/utils";
import type { PeriodeOption } from "@/server/services/dashboard/dashboard.service";
import {
  buatSkemaFilterPengaduan,
  filterPengaduanToQuery,
  queryToFilterPengaduan,
  type FilterPengaduanState,
} from "./SkemaFilterPengaduan";
import { RingkasanPengaduanSebaris } from "./KartuStatistik";
import type { StatistikPengaduan } from "../../types/TipePengaduan";

export const PILIHAN_UKURAN_PENGADUAN = [25, 50, 100, 200, 500] as const;

export interface ToolbarPengaduanNavbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterState: FilterPengaduanState;
  onFilterStateChange: (next: FilterPengaduanState) => void;
  periode: string;
  availablePeriods?: PeriodeOption[];
  onPeriodeChange: (nextPeriode: string) => void;
  pageSize: number;
  jumlahTampil: number;
  totalRows: number;
  onPageSizeChange: (nextSize: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
  stat?: StatistikPengaduan | null;
  headerTerbuka: boolean;
  onToggleHeader: () => void;
  kpiTerbuka: boolean;
  onToggleKpi: () => void;
  detailTerbuka: boolean;
  onToggleDetail: () => void;
}

export function ToolbarPengaduanNavbar({
  search,
  onSearchChange,
  filterState,
  onFilterStateChange,
  periode,
  availablePeriods = [],
  onPeriodeChange,
  pageSize,
  jumlahTampil,
  totalRows,
  onPageSizeChange,
  isLoading,
  onRefresh,
  stat,
  headerTerbuka,
  onToggleHeader,
  kpiTerbuka,
  onToggleKpi,
  detailTerbuka,
  onToggleDetail,
}: ToolbarPengaduanNavbarProps) {
  const filterSchema = React.useMemo(() => buatSkemaFilterPengaduan(), []);

  const [filterQuery, setFilterQuery] = React.useState<FilterQuery>(() =>
    filterPengaduanToQuery(filterState)
  );

  React.useEffect(() => {
    setFilterQuery(filterPengaduanToQuery(filterState));
  }, [
    filterState.status,
    filterState.prioritas,
    filterState.jenis,
    filterState.slaMelanggar,
  ]);

  return (
    <div className="flex items-center justify-between w-full min-w-0 overflow-visible py-1 gap-2">
      {/* SISI KIRI: Kotak Cari Cepat & REUI Filters (+ Filter) */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-visible">
        {/* Kotak Cari Compact */}
        <div className="relative w-44 sm:w-56 shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari tiket, jenis, pelapor…"
            className="h-8 pl-8 pr-7 text-xs bg-background border-border/60 hover:border-border rounded-md shadow-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* REUI Filters Bar (+ Filter Status, Prioritas, Jenis, Tenggat SLA) */}
        <div className="flex items-center">
          <Filters
            fields={filterSchema}
            query={filterQuery}
            onQueryChange={(nextQuery) => {
              setFilterQuery(nextQuery);
              const nextState = queryToFilterPengaduan(nextQuery);
              onFilterStateChange(nextState);
            }}
            showClear
            size="sm"
          />
        </div>
      </div>

      {/* SISI KANAN: Ringkasan Sebaris + Restore Trigger + Filter Periode (persis Panel Dashboard) + Status Baris + Sortir Per Baris */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!kpiTerbuka && stat && <RingkasanPengaduanSebaris stat={stat} />}

        <div
          className="flex items-center gap-1 shrink-0"
          role="toolbar"
          aria-label="Kontrol Pemulihan Panel & Filter Periode"
        >
          {!headerTerbuka && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Tampilkan panel judul"
                  onClick={onToggleHeader}
                  className="h-8 w-8 relative shrink-0 transition-colors duration-150 cursor-pointer border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-none"
                >
                  <LayoutTemplate className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Tampilkan Panel Judul
              </TooltipContent>
            </Tooltip>
          )}

          {!kpiTerbuka && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Tampilkan kartu KPI"
                  onClick={onToggleKpi}
                  className="h-8 w-8 relative shrink-0 transition-colors duration-150 cursor-pointer border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-none"
                >
                  <BarChart3 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Tampilkan Kartu KPI
              </TooltipContent>
            </Tooltip>
          )}

          {!detailTerbuka && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Tampilkan panel detail kanan"
                  onClick={onToggleDetail}
                  className="h-8 w-8 relative shrink-0 transition-colors duration-150 cursor-pointer border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-none"
                >
                  <PanelRight className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Tampilkan Panel Detail Kanan
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pemilih Periode (Disamakan dengan Panel Dashboard RingkasanHeader.tsx) */}
          <Select value={periode} onValueChange={onPeriodeChange}>
            <SelectTrigger
              size="sm"
              aria-label="Pilih periode pengaduan"
              className="h-8 min-w-[156px] rounded-md border-border/60 bg-background px-2.5 font-sans text-xs font-medium text-foreground shadow-none cursor-pointer hover:bg-muted/60 transition-colors"
            >
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent position="popper" align="end" className="z-50">
              <SelectItem value="SEMUA">
                <span className="flex items-center gap-2">
                  <span>Semua Periode</span>
                </span>
              </SelectItem>
              {availablePeriods.map((item) => (
                <SelectItem key={item.thbl} value={item.thbl}>
                  <span className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.isCurrentMonth && !item.hasData ? (
                      <span className="text-[11px] text-muted-foreground">
                        (Belum di-import)
                      </span>
                    ) : item.isCurrentMonth ? (
                      <span className="text-[11px] text-(--ds-green-900)">
                        (Berjalan)
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Muat ulang data pengaduan"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 w-8 relative shrink-0 transition-colors duration-150 cursor-pointer border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-none"
              >
                <RotateCcw
                  className={cn("size-3.5", isLoading && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Muat ulang antrean &amp; statistik
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator */}
        <div
          className="h-4 w-px bg-border/60 shrink-0 mx-0.5"
          aria-hidden="true"
        />

        {/* Status Baris Premium dengan Indicator Dot Permanen */}
        <div
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md bg-muted/40 border border-border/50 text-[11px] font-mono tabular-nums text-muted-foreground shrink-0 select-none transition-colors"
          title={
            isLoading
              ? "Sedang menyinkronkan data..."
              : `Data siap: ${jumlahTampil.toLocaleString("id-ID")} dari ${totalRows.toLocaleString("id-ID")} tiket`
          }
        >
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0 transition-colors duration-300",
              isLoading
                ? "bg-amber-500 animate-pulse ring-2 ring-amber-500/20"
                : "bg-emerald-500 ring-2 ring-emerald-500/20"
            )}
          />
          <span className="font-medium text-foreground">
            {jumlahTampil.toLocaleString("id-ID")}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span>{totalRows.toLocaleString("id-ID")}</span>
        </div>

        {/* Pilihan Ukuran Baris (Sortir Per Baris) */}
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger
            size="sm"
            aria-label="Baris per halaman"
            className="w-auto h-8 text-xs shrink-0 cursor-pointer border-border/60 bg-background hover:bg-muted/60 transition-colors shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="z-50">
            {PILIHAN_UKURAN_PENGADUAN.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n.toLocaleString("id-ID")} baris
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
