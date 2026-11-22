// apps/web/src/features/dashboard/pengaduan/components/papan-pengaduan/TabelPengaduanGlide.tsx
// Tabel Pengaduan Layanan berbasis Enterprise Glide Data Grid (Canvas 60 FPS)
// Menggantikan AG Grid dengan performa tinggi, Smart Text Ellipsis, Badge Cell, & User Profile

'use client';

import * as React from 'react';
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
  type UserProfileGridCell,
  createUserProfileCell,
  createBadgeCell,
  type SortConfiguration,
} from '@/components/glide-grid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
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
import type {
  PengaduanBaris,
  StatusPengaduan,
  PrioritasPengaduan,
} from '../../types/TipePengaduan';

interface TabelPengaduanGlideProps {
  initialSearch?: string;
}

export function TabelPengaduanGlide({ initialSearch = '' }: TabelPengaduanGlideProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // State Data & Paginasi
  const [data, setData] = React.useState<PengaduanBaris[]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 50;
  const [isLoading, setIsLoading] = React.useState(true);

  // State Filter & Pencarian
  const [search, setSearch] = React.useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialSearch);
  const [statusFilter, setStatusFilter] = React.useState<string>('SEMUA');
  const [prioritasFilter, setPrioritasFilter] = React.useState<string>('SEMUA');
  const [jenisFilter, setJenisFilter] = React.useState<string>('SEMUA');
  const [slaMelanggar, setSlaMelanggar] = React.useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // State Sort & Kolom
  const [sortConfig, setSortConfig] = React.useState<SortConfiguration | null>(null);
  const [manualColumnSizes, setManualColumnSizes] = React.useState<Record<string, number>>({});

  // Debounce input pencarian
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
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
          page,
          pageSize,
          q: debouncedSearch || undefined,
          status: statusFilter !== 'SEMUA' ? statusFilter : undefined,
          prioritas: prioritasFilter !== 'SEMUA' ? prioritasFilter : undefined,
          jenis: jenisFilter !== 'SEMUA' ? jenisFilter : undefined,
          melanggarSla: slaMelanggar ? 'true' : undefined,
        };

        if (sortConfig) {
          params.sortBy = sortConfig.colId;
          params.sortDir = sortConfig.dir;
        }

        const res = await ambilList<PengaduanBaris>('/pengaduan', params);
        if (!ignore) {
          setData(res.rows || []);
          setTotalRows(res.total || 0);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Gagal mengambil data pengaduan:', err);
          setData([]);
          setTotalRows(0);
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
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    prioritasFilter,
    jenisFilter,
    slaMelanggar,
    sortConfig,
    refreshTrigger,
  ]);

  const handleRefresh = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Theme Overrides untuk Kanvas
  const monoTheme = React.useMemo<Partial<Theme>>(() => ({
    fontFamily: FONT_MONO,
    baseFontStyle: '500 13px',
    textDark: isDark ? '#93c5fd' : '#1d4ed8',
  }), [isDark]);

  const boldSansTheme = React.useMemo<Partial<Theme>>(() => ({
    fontFamily: FONT_SANS,
    baseFontStyle: '600 13px',
  }), []);

  // Format Tanggal
  const formatTanggal = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
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

      switch (col) {
        case 0: // No. Tiket
          return {
            kind: GridCellKind.Text,
            data: item.nomorTiket || '-',
            displayData: item.nomorTiket || '-',
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: monoTheme,
          };

        case 1: { // No. Pelanggan
          const noPel = (item as any).nomorLangganan || (item as any).pelanggan?.nomorLangganan || '-';
          return {
            kind: GridCellKind.Text,
            data: noPel,
            displayData: noPel,
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: monoTheme,
          };
        }

        case 2: // Judul Pengaduan
          return {
            kind: GridCellKind.Text,
            data: item.judul || '-',
            displayData: item.judul || '-',
            allowOverlay: false,
            contentAlign: 'left',
            themeOverride: boldSansTheme,
          };

        case 3: { // Jenis
          const labelJenis = LABEL_JENIS_PENGADUAN[item.jenis] || item.jenis || '-';
          return {
            kind: GridCellKind.Text,
            data: labelJenis,
            displayData: labelJenis,
            allowOverlay: false,
            contentAlign: 'left',
          };
        }

        case 4: { // Prioritas (Badge)
          let tone: BadgeTone = 'gray';
          if (item.prioritas === 'DARURAT') tone = 'red';
          else if (item.prioritas === 'TINGGI') tone = 'amber';
          else if (item.prioritas === 'NORMAL') tone = 'blue';

          const label = LABEL_PRIORITAS_PENGADUAN[item.prioritas] || item.prioritas;
          const cell: BadgeGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: label,
            data: {
              kind: 'badge-cell',
              text: label,
              tone,
            },
          };
          return cell;
        }

        case 5: { // Status (Badge)
          let tone: BadgeTone = 'gray';
          if (item.status === 'SELESAI') tone = 'green';
          else if (['DIPROSES', 'DITUGASKAN', 'MENUJU_LOKASI'].includes(item.status)) tone = 'amber';
          else if (['BARU', 'TERVERIFIKASI'].includes(item.status)) tone = 'blue';
          else if (['DITOLAK', 'DIBUKA_KEMBALI'].includes(item.status)) tone = 'red';

          const label = LABEL_STATUS_PENGADUAN_STAF_RINGKAS[item.status as StatusPengaduan] || item.status;
          const cell: BadgeGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: label,
            data: {
              kind: 'badge-cell',
              text: label,
              tone,
            },
          };
          return cell;
        }

        case 6: { // Sisa SLA
          const sla = item.sla;
          if (!sla) {
            return { kind: GridCellKind.Text, data: '-', displayData: '-', allowOverlay: false };
          }
          if (item.status === 'SELESAI' || item.status === 'DITUTUP') {
            const cell: BadgeGridCell = {
              kind: GridCellKind.Custom,
              allowOverlay: false,
              copyData: 'Selesai',
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
            data: {
              kind: 'badge-cell',
              text: sisa,
              tone: 'amber',
            },
          };
          return cell;
        }

        case 7: { // Petugas Lapangan (UserProfileCell)
          const namaPetugas = item.ditugaskanKe?.name || 'Belum Ditugaskan';
          if (!item.ditugaskanKe?.name) {
            return {
              kind: GridCellKind.Text,
              data: '-',
              displayData: 'Belum Ditugaskan',
              allowOverlay: false,
              contentAlign: 'left',
              themeOverride: { textDark: isDark ? '#71717a' : '#a1a1aa' },
            };
          }
          return createUserProfileCell(namaPetugas, {
            avatarBg: isDark ? '#3b82f6' : '#2563eb',
          });
        }

        case 8: // Pelapor
          return {
            kind: GridCellKind.Text,
            data: item.pelapor || '-',
            displayData: item.pelapor || '-',
            allowOverlay: false,
            contentAlign: 'left',
          };

        case 9: // Waktu Masuk
          return {
            kind: GridCellKind.Text,
            data: item.createdAt,
            displayData: formatTanggal(item.createdAt),
            allowOverlay: false,
            contentAlign: 'left',
          };

        case 10: { // Aksi Detail (ActionButtonCell)
          const cell: ActionButtonGridCell = {
            kind: GridCellKind.Custom,
            allowOverlay: false,
            copyData: 'Detail',
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
    [data, monoTheme, boldSansTheme, isDark]
  );

  // Klik Baris atau Tombol Detail
  const handleCellClicked = React.useCallback(
    ([col, row]: Item) => {
      const selected = data[row];
      if (!selected) return;

      if (col === 10 || col === 0) {
        // Kolom Aksi atau No Tiket: langsung buka halaman detail tiket
        router.push(`/pengaduan/${selected.id}`);
      }
    },
    [data, router]
  );

  const handleCellActivated = React.useCallback(
    ([, row]: Item) => {
      const selected = data[row];
      if (selected) router.push(`/pengaduan/${selected.id}`);
    },
    [data, router]
  );

  const handleColumnResize = React.useCallback((col: GridColumn, newSize: number) => {
    const colId = col.id;
    if (colId) {
      setManualColumnSizes((prev) => ({ ...prev, [colId]: newSize }));
    }
  }, []);

  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  return (
    <div className="flex h-full min-h-[500px] flex-1 flex-col gap-3 rounded-none border border-border bg-card overflow-hidden">
      {/* 1. Toolbar Filter & Pencarian Cepat */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Kotak Cari */}
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, tiket, pelapor…"
              className="h-8 pl-8 text-xs bg-background rounded"
            />
          </div>

          {/* Filter Status */}
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger className="h-8 w-36 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA">Semua Status</SelectItem>
              <SelectItem value="BARU">Baru</SelectItem>
              <SelectItem value="TERVERIFIKASI">Terverifikasi</SelectItem>
              <SelectItem value="DITUGASKAN">Ditugaskan</SelectItem>
              <SelectItem value="MENUJU_LOKASI">Menuju Lokasi</SelectItem>
              <SelectItem value="DIPROSES">Diproses</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
              <SelectItem value="DITUTUP">Ditutup</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Prioritas */}
          <Select value={prioritasFilter} onValueChange={(val) => { setPrioritasFilter(val); setPage(1); }}>
            <SelectTrigger className="h-8 w-32 text-xs bg-background">
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA">Semua Prioritas</SelectItem>
              <SelectItem value="DARURAT">Darurat</SelectItem>
              <SelectItem value="TINGGI">Tinggi</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="RENDAH">Rendah</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Jenis */}
          <Select value={jenisFilter} onValueChange={(val) => { setJenisFilter(val); setPage(1); }}>
            <SelectTrigger className="h-8 w-36 text-xs bg-background">
              <SelectValue placeholder="Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA">Semua Jenis</SelectItem>
              {Object.entries(LABEL_JENIS_PENGADUAN).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Toggle SLA */}
          <Button
            type="button"
            variant={slaMelanggar ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => { setSlaMelanggar((p) => !p); setPage(1); }}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <AlertTriangle className="size-3" />
            Lewat SLA
          </Button>

          {/* Refresh */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Counter & Paginasi */}
        <div className="flex items-center gap-3">
          <Badge variant="gray-subtle" className="text-xs font-mono">
            {totalRows.toLocaleString('id-ID')} Tiket
          </Badge>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="size-7"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="text-xs font-mono text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="size-7"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Glide Data Grid Kanvas 60 FPS */}
      <div className="flex-1 min-h-0 h-full relative overflow-hidden">
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
