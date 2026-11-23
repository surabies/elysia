// apps/web/src/features/dashboard/pengaduan/components/papan-pengaduan/TabelPengaduanGlide.tsx
// Tabel Pengaduan Layanan berbasis Enterprise Glide Data Grid (Canvas 60 FPS)
// Toolbar pencarian, filter REUI (+ Filter), filter Periode, dan sortir jumlah baris ditempel langsung
// ke Navbar atas lewat Portal (#pengaduan-navbar-controls) agar area tabel & panel bebas sesak.

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  type GridColumn,
  type Item,
  GridCellKind,
  type GridCell,
  type Theme,
  GridColumnIcon,
  GridColumnMenuIcon,
} from '@glideapps/glide-data-grid';
import {
  EnterpriseGlideGrid,
  FONT_MONO,
  FONT_SANS,
  type BadgeGridCell,
  type BadgeTone,
  type ActionButtonGridCell,
  createUserProfileCell,
  type SortConfiguration,
} from '@/components/glide-grid';
import { useTheme } from 'next-themes';
import { ambilList } from '@/features/dashboard/shared/api/api-dashboard';
import {
  LABEL_JENIS_PENGADUAN,
  formatSisaWaktu,
} from '@/features/public/lib/format';
import {
  LABEL_PRIORITAS_PENGADUAN,
  LABEL_STATUS_PENGADUAN_STAF_RINGKAS,
} from '@/features/dashboard/lib/LabelPengaduan';
import type { PeriodeOption } from '@/server/services/dashboard/dashboard.service';
import type {
  PengaduanBaris,
  StatusPengaduan,
  StatistikPengaduan,
} from '../../types/TipePengaduan';
import { ToolbarPengaduanNavbar } from './ToolbarPengaduanNavbar';
import type { FilterPengaduanState } from './SkemaFilterPengaduan';

interface TabelPengaduanGlideProps {
  initialSearch?: string;
  periode: string;
  availablePeriods?: PeriodeOption[];
  onPeriodeChange: (nextPeriode: string) => void;
  externalRefreshKey?: number;
  onRefreshStats?: () => void;
  selectedId?: string | null;
  onSelectRow?: (row: PengaduanBaris) => void;
  onRowsLoaded?: (rows: PengaduanBaris[]) => void;
  stat?: StatistikPengaduan | null;
  headerTerbuka?: boolean;
  onToggleHeader?: () => void;
  kpiTerbuka?: boolean;
  onToggleKpi?: () => void;
  detailTerbuka?: boolean;
  onToggleDetail?: () => void;
}

export function TabelPengaduanGlide({
  initialSearch = '',
  periode,
  availablePeriods = [],
  onPeriodeChange,
  externalRefreshKey = 0,
  onRefreshStats,
  selectedId,
  onSelectRow,
  onRowsLoaded,
  stat,
  headerTerbuka = true,
  onToggleHeader,
  kpiTerbuka = true,
  onToggleKpi,
  detailTerbuka = true,
  onToggleDetail,
}: TabelPengaduanGlideProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Target portal di Navbar (#pengaduan-navbar-controls)
  const [targetPortal, setTargetPortal] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = document.getElementById('pengaduan-navbar-controls');
    if (el) {
      setTargetPortal(el);
    }
  }, []);

  // State Data & Sortir Per Baris
  const [data, setData] = React.useState<PengaduanBaris[]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [isLoading, setIsLoading] = React.useState(true);

  // State Filter & Pencarian
  const [search, setSearch] = React.useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialSearch);
  const [filterState, setFilterState] = React.useState<FilterPengaduanState>({
    status: 'SEMUA',
    prioritas: 'SEMUA',
    jenis: 'SEMUA',
    slaMelanggar: false,
  });
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // State Sort & Kolom
  const [sortConfig, setSortConfig] = React.useState<SortConfiguration | null>(null);
  const [manualColumnSizes, setManualColumnSizes] = React.useState<Record<string, number>>({});

  // Debounce input pencarian
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch data dari endpoint /pengaduan secara reaktif
  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const params: Record<string, any> = {
          page: 1,
          pageSize,
          q: debouncedSearch || undefined,
          periode: periode && periode !== 'SEMUA' ? periode : undefined,
          status: filterState.status !== 'SEMUA' ? filterState.status : undefined,
          prioritas: filterState.prioritas !== 'SEMUA' ? filterState.prioritas : undefined,
          jenis: filterState.jenis !== 'SEMUA' ? filterState.jenis : undefined,
          melanggarSla: filterState.slaMelanggar ? 'true' : undefined,
        };

        if (sortConfig) {
          params.sortBy = sortConfig.colId;
          params.sortDir = sortConfig.dir;
        }

        const res = await ambilList<PengaduanBaris>('/pengaduan', params);
        if (!ignore) {
          const rows = res.rows || [];
          setData(rows);
          setTotalRows(res.total || 0);
          onRowsLoaded?.(rows);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Gagal mengambil data pengaduan:', err);
          setData([]);
          setTotalRows(0);
          onRowsLoaded?.([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      ignore = true;
    };
  }, [
    pageSize,
    debouncedSearch,
    periode,
    filterState.status,
    filterState.prioritas,
    filterState.jenis,
    filterState.slaMelanggar,
    sortConfig,
    refreshTrigger,
    externalRefreshKey,
  ]);

  const handleRefresh = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    onRefreshStats?.();
  }, [onRefreshStats]);

  // Theme Overrides untuk Kanvas
  const monoTheme = React.useMemo<Partial<Theme>>(
    () => ({
      fontFamily: FONT_MONO,
      baseFontStyle: '500 13px',
      textDark: isDark ? '#93c5fd' : '#1d4ed8',
    }),
    [isDark]
  );

  const boldSansTheme = React.useMemo<Partial<Theme>>(
    () => ({
      fontFamily: FONT_SANS,
      baseFontStyle: '600 13px',
    }),
    []
  );

  // Format Tanggal
  const formatTanggal = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return isoStr || '-';
    }
  };

  // Definisi Kolom Glide Data Grid
  const columns = React.useMemo<GridColumn[]>(() => {
    return [
      {
        title: 'No. Tiket',
        id: 'nomorTiket',
        width: manualColumnSizes.nomorTiket ?? 150,
        icon: GridColumnIcon.HeaderString,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'No. Pelanggan',
        id: 'nomorLangganan',
        width: manualColumnSizes.nomorLangganan ?? 135,
        icon: GridColumnIcon.HeaderNumber,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Judul Pengaduan',
        id: 'judul',
        width: manualColumnSizes.judul ?? 260,
        icon: GridColumnIcon.HeaderString,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Jenis',
        id: 'jenis',
        width: manualColumnSizes.jenis ?? 140,
        icon: GridColumnIcon.HeaderString,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Prioritas',
        id: 'prioritas',
        width: manualColumnSizes.prioritas ?? 115,
        icon: GridColumnIcon.HeaderBoolean,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Status',
        id: 'status',
        width: manualColumnSizes.status ?? 150,
        icon: GridColumnIcon.HeaderBoolean,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Sisa SLA (Tenggat)',
        id: 'sla',
        width: manualColumnSizes.sla ?? 140,
        icon: GridColumnIcon.HeaderDate,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Petugas Lapangan',
        id: 'petugas',
        width: manualColumnSizes.petugas ?? 175,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Pelapor',
        id: 'pelapor',
        width: manualColumnSizes.pelapor ?? 130,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Waktu Masuk',
        id: 'createdAt',
        width: manualColumnSizes.createdAt ?? 145,
        icon: GridColumnIcon.HeaderDate,
        hasMenu: true,
        menuIcon: GridColumnMenuIcon.Dots,
      },
      {
        title: 'Aksi',
        id: 'aksi',
        width: manualColumnSizes.aksi ?? 85,
        hasMenu: false,
      },
    ];
  }, [manualColumnSizes]);

  // Provider Data Sel Canvas Glide
  const getCellContent = React.useCallback(
    ([col, row]: Item): GridCell => {
      const item = data[row];
      if (!item) {
        return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };
      }

      const isAktif = Boolean(selectedId && item.id === selectedId);
      const activeBg = isAktif
        ? isDark
          ? 'rgba(59, 130, 246, 0.22)'
          : 'rgba(37, 99, 235, 0.10)'
        : undefined;
      const baseThemeOverride: Partial<Theme> | undefined = activeBg
        ? { bgCell: activeBg }
        : undefined;

      switch (col) {
        case 0: // No. Tiket
          return {
            kind: GridCellKind.Text,
            data: item.nomorTiket || '-',
            displayData: item.nomorTiket || '-',
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: activeBg ? { ...monoTheme, bgCell: activeBg } : monoTheme,
          };

        case 1: {
          // No. Pelanggan
          const noPel =
            (item as any).nomorLangganan || (item as any).pelanggan?.nomorLangganan || '-';
          return {
            kind: GridCellKind.Text,
            data: noPel,
            displayData: noPel,
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: activeBg ? { ...monoTheme, bgCell: activeBg } : monoTheme,
          };
        }

        case 2: // Judul Pengaduan
          return {
            kind: GridCellKind.Text,
            data: item.judul || '-',
            displayData: item.judul || '-',
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: activeBg ? { ...boldSansTheme, bgCell: activeBg } : boldSansTheme,
          };

        case 3: {
          // Jenis
          const labelJenis = LABEL_JENIS_PENGADUAN[item.jenis] || item.jenis || '-';
          return {
            kind: GridCellKind.Text,
            data: labelJenis,
            displayData: labelJenis,
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: baseThemeOverride,
          };
        }

        case 4: {
          // Prioritas (Badge)
          let tone: BadgeTone = 'gray';
          if (item.prioritas === 'DARURAT') tone = 'red';
          else if (item.prioritas === 'TINGGI') tone = 'amber';
          else if (item.prioritas === 'NORMAL') tone = 'blue';

          const label = LABEL_PRIORITAS_PENGADUAN[item.prioritas] || item.prioritas;
          const cell: BadgeGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: label,
            themeOverride: baseThemeOverride,
            data: {
              kind: 'badge-cell',
              text: label,
              tone,
            },
          };
          return cell;
        }

        case 5: {
          // Status (Badge)
          let tone: BadgeTone = 'gray';
          if (item.status === 'SELESAI') tone = 'green';
          else if (['DIPROSES', 'DITUGASKAN', 'MENUJU_LOKASI'].includes(item.status))
            tone = 'amber';
          else if (['BARU', 'TERVERIFIKASI'].includes(item.status)) tone = 'blue';
          else if (['DITOLAK', 'DIBUKA_KEMBALI'].includes(item.status)) tone = 'red';

          const label =
            LABEL_STATUS_PENGADUAN_STAF_RINGKAS[item.status as StatusPengaduan] || item.status;
          const cell: BadgeGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: label,
            themeOverride: baseThemeOverride,
            data: {
              kind: 'badge-cell',
              text: label,
              tone,
            },
          };
          return cell;
        }

        case 6: {
          // Sisa SLA
          const sla = item.sla;
          if (!sla) {
            return {
              kind: GridCellKind.Text,
              data: '-',
              displayData: '-',
              allowOverlay: false,
              themeOverride: baseThemeOverride,
            };
          }
          if (item.status === 'SELESAI' || item.status === 'DITUTUP') {
            const cell: BadgeGridCell = {
              kind: GridCellKind.Custom,
              allowOverlay: false,
              copyData: 'Selesai',
              themeOverride: baseThemeOverride,
              data: {
                kind: 'badge-cell',
                text: 'Selesai',
                tone: 'green',
              },
            };
            return cell;
          }
          if (sla.terjeda) {
            const cell: BadgeGridCell = {
              kind: GridCellKind.Custom,
              allowOverlay: false,
              copyData: 'Dijeda',
              themeOverride: baseThemeOverride,
              data: {
                kind: 'badge-cell',
                text: 'Dijeda',
                tone: 'gray',
              },
            };
            return cell;
          }
          if (sla.melanggar) {
            const cell: BadgeGridCell = {
              kind: GridCellKind.Custom,
              allowOverlay: false,
              copyData: 'Terlambat SLA',
              themeOverride: baseThemeOverride,
              data: {
                kind: 'badge-cell',
                text: 'Terlambat',
                tone: 'red',
              },
            };
            return cell;
          }

          const sisa = formatSisaWaktu(sla.sisaMenit);
          const cell: BadgeGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: sisa,
            themeOverride: baseThemeOverride,
            data: {
              kind: 'badge-cell',
              text: sisa,
              tone: 'amber',
            },
          };
          return cell;
        }

        case 7: {
          // Petugas Lapangan (UserProfileCell)
          const namaPetugas = item.ditugaskanKe?.name || 'Belum Ditugaskan';
          if (!item.ditugaskanKe?.name) {
            return {
              kind: GridCellKind.Text,
              data: '-',
              displayData: 'Belum Ditugaskan',
              allowOverlay: false,
              contentAlign: 'left',
              themeOverride: {
                textDark: isDark ? '#71717a' : '#a1a1aa',
                ...(activeBg ? { bgCell: activeBg } : {}),
              },
            };
          }
          const profileCell = createUserProfileCell(namaPetugas, {
            avatarBg: isDark ? '#3b82f6' : '#2563eb',
          });
          return activeBg ? { ...profileCell, themeOverride: baseThemeOverride } : profileCell;
        }

        case 8: // Pelapor
          return {
            kind: GridCellKind.Text,
            data: item.pelapor || '-',
            displayData: item.pelapor || '-',
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: baseThemeOverride,
          };

        case 9: // Waktu Masuk
          return {
            kind: GridCellKind.Text,
            data: item.createdAt,
            displayData: formatTanggal(item.createdAt),
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: baseThemeOverride,
          };

        case 10: {
          // Aksi Detail (ActionButtonCell)
          const cell: ActionButtonGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: 'Detail',
            themeOverride: baseThemeOverride,
            data: {
              kind: 'action-button-cell',
              action: 'view',
              label: 'Detail',
            },
          };
          return cell;
        }

        default:
          return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };
      }
    },
    [data, monoTheme, boldSansTheme, isDark, selectedId]
  );

  // Klik Baris atau Tombol Detail
  const handleCellClicked = React.useCallback(
    ([col, row]: Item) => {
      const selected = data[row];
      if (!selected) return;

      if (onSelectRow) {
        onSelectRow(selected);
        return;
      }

      if (col === 10 || col === 0) {
        router.push(`/pengaduan/${selected.id}`);
      }
    },
    [data, router, onSelectRow]
  );

  const handleCellActivated = React.useCallback(
    ([, row]: Item) => {
      const selected = data[row];
      if (!selected) return;
      if (onSelectRow) {
        onSelectRow(selected);
        return;
      }
      router.push(`/pengaduan/${selected.id}`);
    },
    [data, router, onSelectRow]
  );

  const handleColumnResize = React.useCallback((col: GridColumn, newSize: number) => {
    const colId = col.id;
    if (colId) {
      setManualColumnSizes((prev) => ({ ...prev, [colId]: newSize }));
    }
  }, []);

  const toolbarContent = (
    <ToolbarPengaduanNavbar
      search={search}
      onSearchChange={setSearch}
      filterState={filterState}
      onFilterStateChange={setFilterState}
      periode={periode}
      availablePeriods={availablePeriods}
      onPeriodeChange={onPeriodeChange}
      pageSize={pageSize}
      jumlahTampil={data.length}
      totalRows={totalRows}
      onPageSizeChange={setPageSize}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      stat={stat}
      headerTerbuka={headerTerbuka}
      onToggleHeader={onToggleHeader ?? (() => {})}
      kpiTerbuka={kpiTerbuka}
      onToggleKpi={onToggleKpi ?? (() => {})}
      detailTerbuka={detailTerbuka}
      onToggleDetail={onToggleDetail ?? (() => {})}
    />
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* 1. Render Toolbar Compact & Premium ke Navbar via Portal */}
      {targetPortal && createPortal(toolbarContent, targetPortal)}

      {/* 2. Kontainer Rounded Card Murni: Header Tabel Menempel 100% ke Border Atas Panel Tabel */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-card shadow-panel overflow-hidden">
        <EnterpriseGlideGrid
          className="h-full w-full rounded-none border-0"
          columns={columns}
          rows={data.length}
          freezeColumns={2}
          memuat={isLoading}
          getCellContent={getCellContent}
          onCellClicked={handleCellClicked}
          onCellActivated={handleCellActivated}
          onColumnResize={handleColumnResize}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          emptyTitle="Belum Ada Pengaduan"
          emptyMessage="Tidak ada tiket pengaduan yang cocok dengan filter saat ini."
        />
      </div>
    </div>
  );
}
