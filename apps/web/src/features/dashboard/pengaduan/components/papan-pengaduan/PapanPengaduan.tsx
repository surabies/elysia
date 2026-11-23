"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/PapanPengaduan.tsx
// TATA LETAK FULL FLUID 2 KOLOM PENUH TINGGI LAYAR (1:1 Pola SidebarContext.tsx & DashboardShell.tsx):
// - State lebar & buka/tutup panel kanan meniru 100% arsitektur Sidebar di DashboardShell.tsx & SidebarContext.tsx:
//   * <aside> selalu ter-mount (tidak pernah di-unmount saat dilipat)
//   * Saat drag resize (onMouseMove), komponen anak di kolom kiri & dalam panel kanan di-memoize (seperti {children} di DashboardShell)
//     sehingga hanya style.width pada <aside> yang berubah (60 FPS murni tanpa re-render tabel/header/form dan tanpa kedip/bounce).

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
const PANEL_WIDTH_STORAGE_KEY = "elysia-pengaduan-panel-width";

const PANEL_OPEN_COOKIE = "pengaduan_panel_open";
const PANEL_OPEN_STORAGE_KEY = "elysia-pengaduan-panel-open";

const HEADER_OPEN_COOKIE = "pengaduan_header_open";
const HEADER_OPEN_STORAGE_KEY = "elysia-pengaduan-header-open";

const KPI_OPEN_COOKIE = "pengaduan_kpi_open";
const KPI_OPEN_STORAGE_KEY = "elysia-pengaduan-kpi-open";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 tahun

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
  initialDetail = null,
  initialPetugas = [],
  defaultPanelWidth = DEFAULT_PENGADUAN_PANEL_WIDTH,
  defaultPanelOpen = true,
  defaultHeaderOpen = true,
  defaultKpiOpen = true,
}: PapanPengaduanProps) {
  const asideRef = React.useRef<HTMLElement | null>(null);
  const [periode, setPeriode] = React.useState<string>(initialPeriode);
  const { stat, muat } = useStatistikPengaduan(periode, initialStat);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // State visibilitas & lebar panel (diadopsi 1:1 dari SidebarContext.tsx)
  const [headerTerbuka, setHeaderTerbukaState] =
    React.useState<boolean>(defaultHeaderOpen);
  const [kpiTerbuka, setKpiTerbukaState] =
    React.useState<boolean>(defaultKpiOpen);
  const [detailTerbuka, setDetailTerbukaState] =
    React.useState<boolean>(defaultPanelOpen);
  const [panelWidth, setPanelWidthState] =
    React.useState<number>(defaultPanelWidth);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const [transitionsReady, setTransitionsReady] = React.useState<boolean>(false);

  // State baris tiket aktif
  const [rows, setRows] = React.useState<PengaduanBaris[]>(initialRows);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => initialDetail?.id ?? initialRows[0]?.id ?? null
  );

  // Tunda pengaktifan transisi CSS 150ms setelah mount (persis DashboardShell.tsx)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTransitionsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Inisialisasi properti CSS di sisi client dan sinkronisasi cookie & localStorage (1:1 SidebarContext.tsx)
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--pengaduan-panel-width",
      `${panelWidth}px`
    );

    try {
      const savedState = localStorage.getItem(PANEL_OPEN_STORAGE_KEY);
      const savedWidth = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
      const savedHeader = localStorage.getItem(HEADER_OPEN_STORAGE_KEY);
      const savedKpi = localStorage.getItem(KPI_OPEN_STORAGE_KEY);

      if (savedState !== null) {
        document.cookie = `${PANEL_OPEN_COOKIE}=${savedState}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(PANEL_OPEN_STORAGE_KEY, String(detailTerbuka));
      }

      if (savedWidth !== null) {
        document.cookie = `${PANEL_WIDTH_COOKIE}=${savedWidth}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidth));
      }

      if (savedHeader !== null) {
        document.cookie = `${HEADER_OPEN_COOKIE}=${savedHeader}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(HEADER_OPEN_STORAGE_KEY, String(headerTerbuka));
      }

      if (savedKpi !== null) {
        document.cookie = `${KPI_OPEN_COOKIE}=${savedKpi}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(KPI_OPEN_STORAGE_KEY, String(kpiTerbuka));
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, [detailTerbuka, panelWidth, headerTerbuka, kpiTerbuka]);

  const setPanelWidth = React.useCallback((width: number) => {
    const clamped = Math.max(
      MIN_PENGADUAN_PANEL_WIDTH,
      Math.min(MAX_PENGADUAN_PANEL_WIDTH, Math.round(width))
    );
    setPanelWidthState(clamped);
    document.documentElement.style.setProperty(
      "--pengaduan-panel-width",
      `${clamped}px`
    );
    try {
      localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(clamped));
      document.cookie = `${PANEL_WIDTH_COOKIE}=${clamped}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    } catch {
      // Abaikan
    }
  }, []);

  const toggleHeader = React.useCallback(() => {
    setHeaderTerbukaState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HEADER_OPEN_STORAGE_KEY, String(next));
        document.cookie = `${HEADER_OPEN_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch {}
      return next;
    });
  }, []);

  const toggleKpi = React.useCallback(() => {
    setKpiTerbukaState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KPI_OPEN_STORAGE_KEY, String(next));
        document.cookie = `${KPI_OPEN_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch {}
      return next;
    });
  }, []);

  const toggleDetail = React.useCallback(() => {
    setDetailTerbukaState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PANEL_OPEN_STORAGE_KEY, String(next));
        document.cookie = `${PANEL_OPEN_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch {}
      return next;
    });
  }, []);

  const bukaDetail = React.useCallback(() => {
    setDetailTerbukaState((prev) => {
      if (!prev) {
        try {
          localStorage.setItem(PANEL_OPEN_STORAGE_KEY, "true");
          document.cookie = `${PANEL_OPEN_COOKIE}=true; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
        } catch {}
      }
      return true;
    });
  }, []);

  // Handle dragging untuk resize panel kanan (1:1 pola DashboardShell.tsx: tanpa dependency panelWidth)
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Hanya klik kiri
      e.preventDefault();

      const rightEdge =
        asideRef.current?.getBoundingClientRect().right ??
        window.innerWidth - 12;

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(
          MIN_PENGADUAN_PANEL_WIDTH,
          Math.min(
            MAX_PENGADUAN_PANEL_WIDTH,
            Math.round(rightEdge - moveEvent.clientX)
          )
        );
        setPanelWidth(newWidth);
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
    [setPanelWidth]
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

  // Memoize konten kolom kiri & konten dalam panel kanan agar TIDAK ikut re-render
  // saat panelWidth / isResizing berubah pada setiap pixel mousemove (persis {children} di DashboardShell.tsx)
  const kolomKiriElement = React.useMemo(
    () => (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
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
    ),
    [
      stat,
      handleRefreshAll,
      headerTerbuka,
      transitionsReady,
      toggleHeader,
      kpiTerbuka,
      toggleKpi,
      initialQ,
      periode,
      availablePeriods,
      refreshKey,
      muat,
      selectedId,
      handleSelectRow,
      handleRowsLoaded,
      detailTerbuka,
      toggleDetail,
    ]
  );

  const isiPanelKananElement = React.useMemo(
    () => (
      <PanelDetailPengaduan
        pengaduanId={selectedId}
        initialDetail={initialDetail}
        initialPetugas={initialPetugas}
        onMutated={handleRefreshAll}
      />
    ),
    [selectedId, initialDetail, initialPetugas, handleRefreshAll]
  );

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-row gap-3 p-3 overflow-hidden">
      {/* KOLOM KIRI */}
      {kolomKiriElement}

      {/* KOLOM KANAN: Selalu ter-mount (1:1 pola <aside> Sidebar di DashboardShell.tsx) */}
      <aside
        ref={asideRef}
        aria-label="Panel detail tiket pengaduan"
        style={{
          width: detailTerbuka ? `${panelWidth}px` : undefined,
          minWidth: detailTerbuka ? `${panelWidth}px` : undefined,
        }}
        className={cn(
          "relative hidden lg:flex h-full min-h-0 shrink-0 flex-col rounded-lg border border-border bg-card shadow-panel",
          isResizing || !transitionsReady
            ? "transition-none select-none"
            : "transition-[width,opacity] duration-200 ease-in-out",
          detailTerbuka
            ? "shrink-0 opacity-100"
            : "pointer-events-none lg:w-0 lg:min-w-0 lg:opacity-0 lg:overflow-hidden lg:border-none lg:-ml-3"
        )}
      >
        {/* Resize Handle di Border Kiri Panel Kanan + Tombol Collapse di tengah handle (1:1 DashboardShell.tsx) */}
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

        {isiPanelKananElement}
      </aside>

      {/* Floating Expand Handle di tepi kanan layar saat Panel Kanan disembunyikan */}
      {!detailTerbuka && (
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
