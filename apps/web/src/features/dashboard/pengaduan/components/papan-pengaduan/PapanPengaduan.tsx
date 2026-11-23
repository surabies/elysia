"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/PapanPengaduan.tsx
// TATA LETAK FULL FLUID 2 KOLOM PENUH TINGGI LAYAR (Persis VerifikasiLapangan.tsx & DashboardShell.tsx):
// - KOLOM KIRI (flex-1, tinggi layar penuh):
//   1. Panel Judul Cockpit 2 Baris dengan judul & deskripsi ringkas (floating collapse button di border bawah)
//   2. 4 Kartu KPI Ringkas & Elegan ala /progres/ekstrim (floating collapse button di border bawah)
//   3. Daftar Tabel Pengaduan Glide Data Grid 60 FPS (flex-1 mengisi sisa tinggi layar penuh)
// - KOLOM KANAN (Resizable & Collapsible, tembus tinggi layar penuh dari atas sampai bawah):
//   * Panel Detail Pengaduan + Invisible Resize Handle dengan Floating Collapse Button persis Sidebar

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
import type { PengaduanBaris } from "../../types/TipePengaduan";

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

function simpanPreferensi(cookieName: string, storageKey: string, val: string) {
  try {
    document.cookie = `${cookieName}=${val}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    localStorage.setItem(storageKey, val);
  } catch {
    // Abaikan jika diblokir browser
  }
}

export interface PapanPengaduanProps {
  initialQ?: string;
  initialPeriode?: string;
  availablePeriods?: PeriodeOption[];
  defaultPanelWidth?: number;
  defaultPanelOpen?: boolean;
  defaultHeaderOpen?: boolean;
  defaultKpiOpen?: boolean;
}

export function PapanPengaduan({
  initialQ,
  initialPeriode = "SEMUA",
  availablePeriods = [],
  defaultPanelWidth = DEFAULT_PENGADUAN_PANEL_WIDTH,
  defaultPanelOpen = true,
  defaultHeaderOpen = true,
  defaultKpiOpen = true,
}: PapanPengaduanProps) {
  const [periode, setPeriode] = React.useState<string>(initialPeriode);
  const { stat, muat } = useStatistikPengaduan(periode);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // State visibilitas 3 bagian yang masing-masing bisa disembunyikan secara mandiri:
  // 1. Panel Judul (Kolom Kiri)
  // 2. Kartu KPI Pengaduan (Kolom Kiri)
  // 3. Panel Detail Pengaduan (Kolom Kanan)
  const [headerTerbuka, setHeaderTerbuka] =
    React.useState<boolean>(defaultHeaderOpen);
  const [kpiTerbuka, setKpiTerbuka] = React.useState<boolean>(defaultKpiOpen);
  const [detailTerbuka, setDetailTerbuka] =
    React.useState<boolean>(defaultPanelOpen);

  // State lebar panel kanan & status drag resize (disamakan persis dengan SidebarContext & DashboardShell)
  const [panelWidth, setPanelWidth] =
    React.useState<number>(defaultPanelWidth);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const [transitionsReady, setTransitionsReady] = React.useState<boolean>(false);

  // State baris tiket aktif (Master-Detail)
  const [rows, setRows] = React.useState<PengaduanBaris[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Tunda pengaktifan transisi CSS 150ms setelah mount agar initial render / reload
  // sama sekali tidak memicu kedipan / animasi membesar-mengecil (Zero Flash persis DashboardShell.tsx)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTransitionsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Sinkronisasi cookie & localStorage tanpa mengubah state SSR bila cookie sudah sesuai (persis SidebarContext.tsx)
  React.useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
      if (savedWidth !== null) {
        document.cookie = `${PANEL_WIDTH_COOKIE}=${savedWidth}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidth));
      }

      const savedOpen = localStorage.getItem(PANEL_OPEN_STORAGE_KEY);
      if (savedOpen !== null) {
        document.cookie = `${PANEL_OPEN_COOKIE}=${savedOpen}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(PANEL_OPEN_STORAGE_KEY, String(detailTerbuka));
      }

      const savedHeader = localStorage.getItem(HEADER_OPEN_STORAGE_KEY);
      if (savedHeader !== null) {
        document.cookie = `${HEADER_OPEN_COOKIE}=${savedHeader}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(HEADER_OPEN_STORAGE_KEY, String(headerTerbuka));
      }

      const savedKpi = localStorage.getItem(KPI_OPEN_STORAGE_KEY);
      if (savedKpi !== null) {
        document.cookie = `${KPI_OPEN_COOKIE}=${savedKpi}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        localStorage.setItem(KPI_OPEN_STORAGE_KEY, String(kpiTerbuka));
      }
    } catch {
      // Abaikan
    }
  }, [panelWidth, detailTerbuka, headerTerbuka, kpiTerbuka]);

  const toggleHeader = React.useCallback(() => {
    setHeaderTerbuka((prev) => {
      const next = !prev;
      simpanPreferensi(HEADER_OPEN_COOKIE, HEADER_OPEN_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const toggleKpi = React.useCallback(() => {
    setKpiTerbuka((prev) => {
      const next = !prev;
      simpanPreferensi(KPI_OPEN_COOKIE, KPI_OPEN_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const toggleDetail = React.useCallback(() => {
    setDetailTerbuka((prev) => {
      const next = !prev;
      simpanPreferensi(PANEL_OPEN_COOKIE, PANEL_OPEN_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const bukaDetail = React.useCallback(() => {
    setDetailTerbuka((prev) => {
      if (!prev) {
        simpanPreferensi(PANEL_OPEN_COOKIE, PANEL_OPEN_STORAGE_KEY, "true");
      }
      return true;
    });
  }, []);

  // Drag handler untuk resize panel kanan (menarik border kiri panel kanan)
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Hanya klik kiri
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
        simpanPreferensi(
          PANEL_WIDTH_COOKIE,
          PANEL_WIDTH_STORAGE_KEY,
          String(newWidth)
        );
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        setPanelWidth((finalWidth) => {
          simpanPreferensi(
            PANEL_WIDTH_COOKIE,
            PANEL_WIDTH_STORAGE_KEY,
            String(finalWidth)
          );
          return finalWidth;
        });
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [panelWidth]
  );

  // Saat daftar baris tabel selesai dimuat, pilih otomatis baris pertama bila belum ada yang dipilih
  const handleRowsLoaded = React.useCallback((loadedRows: PengaduanBaris[]) => {
    setRows(loadedRows);
    setSelectedId((prev) => {
      if (loadedRows.length === 0) return null;
      if (prev && loadedRows.some((r) => r.id === prev)) return prev;
      return loadedRows[0].id;
    });
  }, []);

  // Klik baris di tabel kiri: pilih tiket & buka panel detail kanan bila sedang tertutup
  const handleSelectRow = React.useCallback(
    (row: PengaduanBaris) => {
      setSelectedId(row.id);
      bukaDetail();
    },
    [bukaDetail]
  );

  // Navigasi keyboard ArrowUp / ArrowDown untuk berpindah baris aktif dengan cepat
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
          {/* Floating Expand Button di Tengah Border Atas Tabel saat Kartu KPI sedang disembunyikan */}
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
          Panel Detail Pengaduan + Invisible Resize Handle + Floating Collapse Button (Persis Sidebar)
          ========================================================================= */}
      {detailTerbuka ? (
        <aside
          aria-label="Panel detail tiket pengaduan"
          style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px` }}
          className={cn(
            "relative hidden lg:flex h-full min-h-0 shrink-0 flex-col rounded-lg border border-border bg-card shadow-panel",
            isResizing || !transitionsReady
              ? "transition-none select-none"
              : "transition-[width] duration-150 ease-out"
          )}
        >
          {/* Resize Handle di Border Kiri Panel Kanan + Floating Collapse Button di tengah handle (1:1 pola Sidebar DashboardShell.tsx) */}
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
            onMutated={handleRefreshAll}
          />
        </aside>
      ) : (
        /* Floating Expand Handle di tepi kanan layar saat Panel Kanan disembunyikan */
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
