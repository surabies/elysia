"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/PapanPengaduan.tsx
// TATA LETAK FULL FLUID 2 KOLOM PENUH TINGGI LAYAR (Zero Flash Reload):
// - Menerima initialStat, initialRows, initialTotal, initialDetail, & initialPetugas langsung dari Server Component
//   sehingga saat reload halaman tidak ada kedipan skeleton, tidak ada pergantian state kosong,
//   dan lebar panel kanan terkunci presisi dari cookie SSR.

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GeistChevronLeft,
  GeistChevronRight,
} from "@/components/layout/navigation/sidebar/lib/GeistIcons";
import type { PeriodeOption } from "@/server/services/dashboard/dashboard.service";
import { PengaduanHeader } from "./PengaduanHeader";
import { KartuStatistik } from "./KartuStatistik";
import { TabelPengaduanGlide } from "./TabelPengaduanGlide";
import { PanelDetailPengaduan } from "./PanelDetailPengaduan";
import { useStatistikPengaduan } from "../../hooks/UseStatistikPengaduan";
import type {
  PengaduanBaris,
  PengaduanDetail,
  PetugasRingkas,
  StatistikPengaduan,
} from "../../types/TipePengaduan";

export const MIN_PENGADUAN_PANEL_WIDTH = 340;
export const MAX_PENGADUAN_PANEL_WIDTH = 640;
export const DEFAULT_PENGADUAN_PANEL_WIDTH = 420;

const PANEL_WIDTH_COOKIE = "pengaduan_panel_width";
const PANEL_OPEN_COOKIE = "pengaduan_panel_open";
const HEADER_OPEN_COOKIE = "pengaduan_header_open";
const KPI_OPEN_COOKIE = "pengaduan_kpi_open";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 tahun

function simpanCookie(cookieName: string, val: string) {
  try {
    document.cookie = `${cookieName}=${val}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Abaikan jika diblokir browser
  }
}

export interface PapanPengaduanProps {
  initialQ?: string;
  initialPeriode?: string;
  availablePeriods?: PeriodeOption[];
  initialStat?: StatistikPengaduan | null;
  initialRows?: PengaduanBaris[];
  initialTotal?: number;
  initialDetail?: PengaduanDetail | null;
  initialPetugas?: PetugasRingkas[];
  defaultPanelWidth?: number;
  defaultPanelOpen?: boolean;
  defaultHeaderOpen?: boolean;
  defaultKpiOpen?: boolean;
}

export function PapanPengaduan({
  initialQ,
  initialPeriode = "SEMUA",
  availablePeriods = [],
  initialStat = null,
  initialRows = [],
  initialTotal = 0,
  initialDetail = null,
  initialPetugas = [],
  defaultPanelWidth = DEFAULT_PENGADUAN_PANEL_WIDTH,
  defaultPanelOpen = true,
  defaultHeaderOpen = true,
  defaultKpiOpen = true,
}: PapanPengaduanProps) {
  const [periode, setPeriode] = React.useState<string>(initialPeriode);
  const { stat, muat } = useStatistikPengaduan(periode, initialStat);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // State visibilitas 3 bagian langsung dari Cookie SSR (Single Source of Truth = Cookie, Zero Flash)
  const [headerTerbuka, setHeaderTerbuka] =
    React.useState<boolean>(defaultHeaderOpen);
  const [kpiTerbuka, setKpiTerbuka] = React.useState<boolean>(defaultKpiOpen);
  const [detailTerbuka, setDetailTerbuka] =
    React.useState<boolean>(defaultPanelOpen);

  // State lebar panel kanan langsung dari Cookie SSR (Tanpa transisi CSS width agar tidak pernah berkedip membesar/mengecil)
  const [panelWidth, setPanelWidth] =
    React.useState<number>(defaultPanelWidth);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const [transitionsReady, setTransitionsReady] = React.useState<boolean>(false);

  // State baris tiket aktif diinisialisasi langsung dari baris pertama SSR (Zero Flash di Panel Kanan)
  const [rows, setRows] = React.useState<PengaduanBaris[]>(initialRows);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => initialDetail?.id ?? initialRows[0]?.id ?? null
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTransitionsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const toggleHeader = React.useCallback(() => {
    setHeaderTerbuka((prev) => {
      const next = !prev;
      simpanCookie(HEADER_OPEN_COOKIE, String(next));
      return next;
    });
  }, []);

  const toggleKpi = React.useCallback(() => {
    setKpiTerbuka((prev) => {
      const next = !prev;
      simpanCookie(KPI_OPEN_COOKIE, String(next));
      return next;
    });
  }, []);

  const toggleDetail = React.useCallback(() => {
    setDetailTerbuka((prev) => {
      const next = !prev;
      simpanCookie(PANEL_OPEN_COOKIE, String(next));
      return next;
    });
  }, []);

  const bukaDetail = React.useCallback(() => {
    setDetailTerbuka((prev) => {
      if (!prev) {
        simpanCookie(PANEL_OPEN_COOKIE, "true");
      }
      return true;
    });
  }, []);

  // Drag handler untuk resize panel kanan (menarik border kiri panel kanan)
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const startX = e.clientX;
      const startWidth = panelWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const newWidth = Math.max(
          MIN_PENGADUAN_PANEL_WIDTH,
          Math.min(MAX_PENGADUAN_PANEL_WIDTH, Math.round(startWidth + delta))
        );
        setPanelWidth(newWidth);
        simpanCookie(PANEL_WIDTH_COOKIE, String(newWidth));
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [panelWidth]
  );

  const handleRowsLoaded = React.useCallback((loadedRows: PengaduanBaris[]) => {
    setRows(loadedRows);
    setSelectedId((prev) => {
      if (loadedRows.length === 0) return null;
      if (prev && loadedRows.some((r) => r.id === prev)) return prev;
      return loadedRows[0].id;
    });
  }, []);

  const handleSelectRow = React.useCallback(
    (row: PengaduanBaris) => {
      setSelectedId(row.id);
      bukaDetail();
    },
    [bukaDetail]
  );

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (rows.length === 0) return;

      e.preventDefault();
      const currentIdx = rows.findIndex((r) => r.id === selectedId);
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const nextIdx =
        currentIdx < 0
          ? 0
          : Math.min(rows.length - 1, Math.max(0, currentIdx + dir));
      const nextRow = rows[nextIdx];
      if (nextRow) {
        setSelectedId(nextRow.id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rows, selectedId]);

  const handleRefreshAll = React.useCallback(() => {
    muat();
    setRefreshKey((k) => k + 1);
  }, [muat]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-row gap-3 p-3 overflow-hidden">
      {/* =========================================================================
          KOLOM KIRI (flex-1, Tinggi Layar Penuh):
          1. Panel Judul Cockpit 2 Baris (floating collapse button di border bawah)
          2. Kartu KPI Ringkas ala /progres/ekstrim (floating collapse button di border bawah)
          3. Daftar Tabel Pengaduan (flex-1 mengisi penuh sisa tinggi kolom kiri)
          ========================================================================= */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3">
        <PengaduanHeader
          stat={stat}
          onRefresh={handleRefreshAll}
          terbuka={headerTerbuka}
          transitionsReady={transitionsReady}
          onToggle={toggleHeader}
        />

        <KartuStatistik
          stat={stat}
          terbuka={kpiTerbuka}
          transitionsReady={transitionsReady}
          onToggle={toggleKpi}
          headerTerbuka={headerTerbuka}
          onToggleHeader={toggleHeader}
        />

        <div className="relative group/table-top flex min-h-0 min-w-0 flex-1 flex-col">
          {!kpiTerbuka && (
            <button
              type="button"
              aria-label="Tampilkan kartu KPI"
              title="Tampilkan kartu KPI"
              onClick={toggleKpi}
              className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 z-30",
                "size-6 rounded-full border border-border bg-card",
                "grid place-content-center cursor-pointer transition-opacity duration-150",
                "opacity-0 group-hover/table-top:opacity-100 focus-visible:opacity-100 shadow-xs",
                "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          )}

          <TabelPengaduanGlide
            initialSearch={initialQ}
            periode={periode}
            availablePeriods={availablePeriods}
            onPeriodeChange={setPeriode}
            externalRefreshKey={refreshKey}
            onRefreshStats={muat}
            selectedId={selectedId}
            onSelectRow={handleSelectRow}
            onRowsLoaded={handleRowsLoaded}
            stat={stat}
            headerTerbuka={headerTerbuka}
            onToggleHeader={toggleHeader}
            kpiTerbuka={kpiTerbuka}
            onToggleKpi={toggleKpi}
            detailTerbuka={detailTerbuka}
            onToggleDetail={toggleDetail}
          />
        </div>
      </div>

      {/* =========================================================================
          KOLOM KANAN (Resizable & Bisa Disembunyikan, Tembus Tinggi Layar Penuh):
          Tanpa transition-[width] agar lebar terkunci instan 1:1 saat reload maupun saat drag
          ========================================================================= */}
      {detailTerbuka ? (
        <aside
          aria-label="Panel detail tiket pengaduan"
          style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px` }}
          className={cn(
            "relative hidden lg:flex h-full min-h-0 shrink-0 flex-col rounded-lg border border-border bg-card shadow-panel",
            isResizing && "select-none"
          )}
        >
          {/* Resize Handle di Border Kiri Panel Kanan + Floating Collapse Button di tengah handle */}
          <div
            aria-hidden="true"
            onMouseDown={handleMouseDown}
            className="group/handle hidden lg:block absolute top-0 -left-2 h-full w-4 cursor-col-resize z-50 select-none"
          >
            <button
              type="button"
              aria-label="Tutup panel detail"
              title="Tutup panel detail"
              onClick={(e) => {
                e.stopPropagation();
                toggleDetail();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "size-6 rounded-full border border-border bg-card",
                "grid place-content-center cursor-pointer transition-opacity duration-150",
                "opacity-0 group-hover/handle:opacity-100 focus-visible:opacity-100 shadow-xs",
                "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800",
                isResizing && "!opacity-0 pointer-events-none"
              )}
            >
              <GeistChevronRight
                size={14}
                className="size-3.5 text-muted-foreground"
              />
            </button>
          </div>

          <PanelDetailPengaduan
            pengaduanId={selectedId}
            initialDetail={initialDetail}
            initialPetugas={initialPetugas}
            onMutated={handleRefreshAll}
          />
        </aside>
      ) : (
        <div
          aria-hidden="true"
          className="group/handle-right hidden lg:block absolute inset-y-0 right-0 w-5 z-40 select-none"
        >
          <button
            type="button"
            aria-label="Buka panel detail"
            title="Buka panel detail"
            onClick={toggleDetail}
            className={cn(
              "absolute right-1.5 top-1/2 -translate-y-1/2",
              "size-6 rounded-full border border-border bg-card",
              "grid place-content-center cursor-pointer transition-opacity duration-150",
              "opacity-0 group-hover/handle-right:opacity-100 focus-visible:opacity-100 shadow-xs",
              "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
            )}
          >
            <GeistChevronLeft
              size={14}
              className="size-3.5 text-muted-foreground"
            />
          </button>
        </div>
      )}
    </div>
  );
}
