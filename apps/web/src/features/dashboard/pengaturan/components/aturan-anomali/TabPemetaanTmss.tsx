// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/TabPemetaanTmss.tsx
// Tab 2: Pemetaan Kondisi Fisik Meter (TMSS) dengan TanStack Table
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KondisiMapItem } from './types';

interface TabPemetaanTmssProps {
  kondisiMaps: KondisiMapItem[];
  canEdit: boolean;
  isLoading?: boolean;
}

const pemetaanTableFeatures = tableFeatures({
  rowSortingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
});

type PemetaanTableFeatures = typeof pemetaanTableFeatures;
const columnHelper = createColumnHelper<PemetaanTableFeatures, KondisiMapItem>();

export function TabPemetaanTmss({
  kondisiMaps,
  canEdit: _canEdit,
  isLoading = false,
}: TabPemetaanTmssProps) {
  // State pengurutan TanStack Table
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'kodeTmss', desc: false },
  ]);

  // Definisi Kolom TanStack Table via columnHelper
  const columns = React.useMemo<ColumnDef<PemetaanTableFeatures, KondisiMapItem, any>[]>(() => {
    return [
      columnHelper.accessor('kodeTmss', {
        header: 'Kode TMSS',
        size: 110,
        cell: (info) => (
          <span className="font-mono text-label-12 font-bold text-foreground">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => row.keteranganKondisi || row.keterangan || '',
        {
          id: 'keterangan',
          header: 'Kondisi Fisik Lapangan',
          size: 320,
          cell: (info) => {
            const row = info.row.original;
            const text = row.keteranganKondisi || row.keterangan || '-';
            return (
              <span className="font-medium text-foreground text-label-13 truncate block" title={text}>
                {text}
              </span>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => row.aturanKode || row.aturanAnomaliId || '',
        {
          id: 'aturanTarget',
          header: 'Aturan Target Asosiasi',
          size: 260,
          cell: (info) => {
            const row = info.row.original;
            const kode = row.aturanKode || row.aturanAnomaliId || '-';
            let variant:
              | 'red-subtle'
              | 'amber-subtle'
              | 'purple-subtle'
              | 'teal-subtle'
              | 'blue-subtle' = 'blue-subtle';

            if (kode.includes('KERUSAKAN')) variant = 'red-subtle';
            else if (kode.includes('KENDALA')) variant = 'amber-subtle';
            else if (kode.includes('TIDAK_ADA_AIR')) variant = 'purple-subtle';
            else if (kode.includes('DEVIASI')) variant = 'teal-subtle';

            return (
              <Badge variant={variant} className="font-mono text-[11px]">
                {kode}
              </Badge>
            );
          },
        }
      ),
      columnHelper.accessor('isBaselineNormal', {
        header: 'Baseline Normal',
        size: 140,
        cell: (info) => {
          const isNormal = Boolean(info.getValue());
          return (
            <Badge variant={isNormal ? 'green-subtle' : 'gray-subtle'} className="text-[11px]">
              {isNormal ? 'Ya (Normal)' : 'Bukan Normal'}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('isPeriodeTidakAktif', {
        header: 'Periode Tidak Aktif',
        size: 160,
        cell: (info) => {
          const isInactive = Boolean(info.getValue());
          return (
            <Badge variant={isInactive ? 'amber-subtle' : 'gray-subtle'} className="text-[11px]">
              {isInactive ? 'Ya (Kecualikan)' : 'Tetap Dihitung'}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('aktif', {
        header: 'Status',
        size: 110,
        cell: (info) => {
          const isAktif = Boolean(info.getValue());
          return (
            <Badge variant={isAktif ? 'green-subtle' : 'gray-subtle'} className="text-[11px]">
              {isAktif ? 'Aktif' : 'Nonaktif'}
            </Badge>
          );
        },
      }),
    ];
  }, []);

  // Inisialisasi TanStack Table Hook
  const table = useTable({
    features: pemetaanTableFeatures,
    data: kondisiMaps,
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
            <Layers className="size-4 text-primary" />
            Pemetaan Kondisi Meter Lapangan (26 Kode TMSS)
          </CardTitle>
          <CardDescription className="text-copy-13 text-muted-foreground" suppressHydrationWarning>
            Asosiasi kode kondisi pencatatan lapangan ke kategori anomali, baseline normal, dan pengecualian historis.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gray-subtle" className="text-[11px] font-mono">
            {kondisiMaps.length} Pemetaan Terdaftar
          </Badge>
        </div>
      </CardHeader>

      {/* Kontainer Tabel TanStack dengan Sticky Header Sempurna & Lebar Kolom Rigid */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative">
        <Table containerClassName="overflow-visible w-full" className="w-full min-w-[1100px] table-fixed border-collapse">
          <TableHeader className="sticky top-0 z-20 bg-(--ds-gray-100) dark:bg-card border-b border-border shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-(--ds-gray-100) dark:[&_th]:bg-card">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  const widthClass =
                    header.id === 'kodeTmss'
                      ? 'w-[110px]'
                      : header.id === 'keterangan'
                        ? 'w-[320px]'
                        : header.id === 'aturanTarget'
                          ? 'w-[260px]'
                          : header.id === 'isBaselineNormal'
                            ? 'w-[140px]'
                            : header.id === 'isPeriodeTidakAktif'
                              ? 'w-[160px]'
                              : 'w-[110px]';

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'sticky top-0 z-20 bg-(--ds-gray-100) dark:bg-card border-b border-r border-border/60 last:border-r-0 shadow-xs h-9 px-3 text-label-12 font-medium text-muted-foreground select-none overflow-hidden',
                        widthClass,
                        header.id === 'kodeTmss' && 'text-center'
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
            {isLoading && kondisiMaps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-label-12">Memuat daftar pemetaan kondisi TMSS...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="size-5 text-muted-foreground/60" />
                    <span className="text-label-13 font-medium">Belum ada pemetaan yang terdaftar</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'py-2 px-3 align-middle border-r border-border/60 last:border-r-0 overflow-hidden',
                        cell.column.id === 'kodeTmss' && 'text-center'
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
