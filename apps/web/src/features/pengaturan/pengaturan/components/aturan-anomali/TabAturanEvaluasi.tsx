// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/TabAturanEvaluasi.tsx
// Tab 1: Tabel Aturan Evaluasi Anomali dengan TanStack Table
// Arsitektur Ringan, Responsif, Interaktif, dan Selaras Desain Sistem Vercel Geist

'use client';

import * as React from 'react';
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Sliders,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RuleItem } from './types';

interface TabAturanEvaluasiProps {
  rules: RuleItem[];
  canEdit: boolean;
  isLoading?: boolean;
  pendingToggleId?: string | null;
  onSelectRule: (rule: RuleItem) => void;
  onToggleAktif: (rule: RuleItem) => void;
}

const aturanTableFeatures = tableFeatures({
  rowSortingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
});

type AturanTableFeatures = typeof aturanTableFeatures;
const columnHelper = createColumnHelper<AturanTableFeatures, RuleItem>();

export function TabAturanEvaluasi({
  rules,
  canEdit,
  isLoading = false,
  pendingToggleId = null,
  onSelectRule,
  onToggleAktif,
}: TabAturanEvaluasiProps) {
  // State pengurutan TanStack Table
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'urutan', desc: false },
  ]);

  // Format deskripsi parameter ambang batas
  const formatAmbang = React.useCallback((r: RuleItem): string => {
    const parts: string[] = [];
    if (r.minM3 !== null && r.maxM3 !== null) parts.push(`${r.minM3} - ${r.maxM3} m³`);
    else if (r.minM3 !== null) parts.push(`>${r.minM3} m³`);
    else if (r.maxM3 !== null) parts.push(`<${r.maxM3} m³`);

    if (r.minPersen !== null && r.maxPersen !== null) parts.push(`${r.minPersen}% s.d. ${r.maxPersen}%`);
    else if (r.minPersen !== null) parts.push(`≥${r.minPersen}%`);

    if (r.selisihMinM3 !== null) parts.push(`Selisih ≥${r.selisihMinM3} m³`);
    const syaratLalu = r.syaratPakaiLaluMinM3 ?? r.syaratPakaiLaluDibawah ?? r.kecualikanJikaPakaiLaluDibawah;
    if (syaratLalu !== null && syaratLalu !== undefined) {
      parts.push(`Lalu ≥${syaratLalu} m³`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Kondisi fisik / aturan';
  }, []);

  // Definisi Kolom TanStack Table via columnHelper
  const columns = React.useMemo<ColumnDef<AturanTableFeatures, RuleItem, any>[]>(() => {
    return [
      columnHelper.accessor('urutan', {
        header: 'No',
        size: 55,
        cell: (info) => (
          <span className="font-mono text-label-12 text-muted-foreground tabular-nums">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('kode', {
        header: 'Kode Aturan (SSOT)',
        size: 200,
        cell: (info) => (
          <span
            className="font-mono text-label-12 font-semibold text-primary truncate block"
            title={info.getValue()}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('nama', {
        header: 'Nama Aturan & Logika',
        size: 280,
        cell: (info) => {
          const rule = info.row.original;
          return (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span
                className="font-medium text-foreground text-label-13 truncate"
                title={rule.nama}
              >
                {rule.nama}
              </span>
              {rule.deskripsi && (
                <span
                  className="text-copy-12 text-muted-foreground truncate"
                  title={rule.deskripsi}
                >
                  {rule.deskripsi}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('ringTingkat', {
        header: 'Ring',
        size: 95,
        cell: (info) => {
          const ring = info.getValue();
          const variant = ring === 3 ? 'red-subtle' : ring === 2 ? 'amber-subtle' : 'blue-subtle';
          return (
            <Badge variant={variant} className="font-mono text-[11px]">
              Ring {ring}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('tingkatKeparahan', {
        header: 'Keparahan',
        size: 110,
        cell: (info) => {
          const kep = info.getValue();
          const variant =
            kep === 'KRITIS'
              ? 'red-subtle'
              : kep === 'TINGGI'
                ? 'amber-subtle'
                : kep === 'SEDANG'
                  ? 'blue-subtle'
                  : 'gray-subtle';
          return (
            <Badge variant={variant} className="text-[11px] font-medium">
              {kep}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: 'parameter',
        header: 'Parameter & Ambang Batas',
        size: 260,
        cell: (info) => {
          const ambang = formatAmbang(info.row.original);
          return (
            <span
              className="font-mono text-label-12 text-foreground/90 bg-muted/40 px-2 py-0.5 rounded border border-border/60 block truncate"
              title={ambang}
            >
              {ambang}
            </span>
          );
        },
      }),
      columnHelper.accessor('aktif', {
        header: 'Status',
        size: 130,
        cell: (info) => {
          const rule = info.row.original;
          const isPending = pendingToggleId === rule.id;

          return (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                size="sm"
                checked={rule.aktif}
                disabled={!canEdit || isPending}
                onCheckedChange={() => onToggleAktif(rule)}
                aria-label={`Toggle status aturan ${rule.kode}`}
              />
              <div className="flex items-center gap-1.5 min-w-[70px]">
                {isPending ? (
                  <Loader2 className="size-3 animate-spin text-primary" />
                ) : (
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      rule.aktif ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                    )}
                  />
                )}
                <span
                  className={cn(
                    'text-label-12 font-medium',
                    rule.aktif ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {rule.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'aksi',
        header: 'Aksi',
        size: 85,
        cell: (info) => {
          const rule = info.row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectRule(rule)}
                className="h-7 px-2.5 text-label-12 gap-1.5 cursor-pointer hover:bg-muted"
              >
                {canEdit ? (
                  <>
                    <Sliders className="size-3 text-primary" />
                    <span>Ubah</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-3 text-muted-foreground" />
                    <span>Detail</span>
                  </>
                )}
              </Button>
            </div>
          );
        },
      }),
    ];
  }, [canEdit, pendingToggleId, formatAmbang, onToggleAktif, onSelectRule]);

  // Inisialisasi TanStack Table Hook
  const table = useTable({
    features: aturanTableFeatures,
    data: rules,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <Card className="h-full min-h-0 flex-1 flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header Kartu Bergaya Vercel */}
      <CardHeader className="shrink-0 p-3.5 pb-2.5 border-b border-border flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-label-14 font-semibold text-foreground flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            12 Aturan Deteksi Anomali & Peringatan (SSOT)
          </CardTitle>
          <CardDescription className="text-copy-13 text-muted-foreground" suppressHydrationWarning>
            Evaluasi berlapis berbasis urutan prioritas. Klik baris atau tombol Aksi untuk simulasi dampak dry-run.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gray-subtle" className="text-[11px] font-mono">
            {rules.length} Aturan Terdaftar
          </Badge>
        </div>
      </CardHeader>

      {/* Kontainer Tabel TanStack dengan Sticky Header Sempurna & Lebar Kolom Rigid */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative">
        <Table containerClassName="overflow-visible w-full" className="w-full min-w-[1150px] table-fixed border-collapse">
          <TableHeader className="sticky top-0 z-20 bg-(--ds-gray-100) dark:bg-card border-b border-border shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-(--ds-gray-100) dark:[&_th]:bg-card">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  const widthClass =
                    header.id === 'urutan'
                      ? 'w-[55px]'
                      : header.id === 'kode'
                        ? 'w-[200px]'
                        : header.id === 'nama'
                          ? 'w-[280px]'
                          : header.id === 'ringTingkat'
                            ? 'w-[100px]'
                            : header.id === 'tingkatKeparahan'
                              ? 'w-[110px]'
                              : header.id === 'parameter'
                                ? 'w-[260px]'
                                : header.id === 'aktif'
                                  ? 'w-[140px]'
                                  : 'w-[95px]';

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'sticky top-0 z-20 bg-(--ds-gray-100) dark:bg-card border-b border-r border-border/60 last:border-r-0 shadow-xs h-9 px-3 text-label-12 font-medium text-muted-foreground select-none overflow-hidden',
                        widthClass,
                        header.id === 'urutan' && 'text-center',
                        header.id === 'aksi' && 'text-right'
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="group inline-flex items-center gap-1.5 cursor-pointer font-medium hover:text-foreground transition-colors"
                        >
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3 text-foreground" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3 text-foreground" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="divide-y divide-border">
            {isLoading && rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-label-12">Memuat konfigurasi SSOT aturan...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="size-5 text-muted-foreground/60" />
                    <span className="text-label-13 font-medium">Tidak ada aturan yang cocok</span>
                    <span className="text-copy-12">Coba ubah kata kunci pencarian pada bilah atas.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onSelectRule(row.original)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'py-2 px-3 align-middle border-r border-border/60 last:border-r-0 overflow-hidden',
                        cell.column.id === 'urutan' && 'text-center',
                        cell.column.id === 'aksi' && 'text-right'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
