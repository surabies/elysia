// apps/web/src/components/glide-grid/EnterpriseGlideGrid.tsx
// Wrapper Enterprise Glide Data Grid (Canvas 60 FPS) dengan Tema Vercel Geist Sempurna
// Mengadopsi arsitektur modular, cell renderers (Badge, Action Button), menu kolom enterprise, dan auto-fit lebar penuh tanpa kolom kosong.

'use client';

import * as React from 'react';
import DataEditor, {
  type DataEditorProps,
  type GridColumn,
  type DrawHeaderCallback,
  type DrawCellCallback,
  GridCellKind,
  type Rectangle,
} from '@glideapps/glide-data-grid';
import { useTheme } from 'next-themes';
import { useGeistGlideTheme, FONT_SANS } from './theme';
import { allEnterpriseCellRenderers } from './cells/all-cells';
import {
  HeaderMenuPopover,
  type HeaderMenuData,
  type SortConfiguration,
} from './components/HeaderMenuPopover';
import { drawSortIndicator } from './renderers/canvas-drawers';
import { potongTeksDenganEllipsis } from './utils/measure';
import { cn } from '@/lib/utils';

export interface EnterpriseGlideGridProps
  extends Omit<DataEditorProps, 'theme' | 'width' | 'height'> {
  className?: string;
  minHeight?: number | string;
  fillHeight?: boolean;
  memuat?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  sortConfig?: SortConfiguration | null;
  onSortChange?: (sort: SortConfiguration | null) => void;
  onResetLebarKolom?: (colId: string) => void;
  onSembunyikanKolom?: (colId: string) => void;
  onResetSemuaKolom?: () => void;
  /** Kolom yang akan otomatis meregang untuk mengisi sisa ruang jika lebar total kolom < lebar kontainer */
  flexColumnId?: string;
  /** Jumlah kolom kiri yang dibekukan saat scroll horizontal (Frozen Columns) */
  freezeColumns?: number;
}

export function EnterpriseGlideGrid({
  className,
  minHeight,
  fillHeight = true,
  memuat = false,
  emptyTitle = 'Tidak Ada Data',
  emptyMessage = 'Belum ada baris data yang cocok dengan kriteria saat ini.',
  emptyIcon,
  customRenderers,
  rows,
  columns,
  sortConfig,
  onSortChange,
  onResetLebarKolom,
  onSembunyikanKolom,
  onResetSemuaKolom,
  flexColumnId,
  freezeColumns,
  drawHeader: customDrawHeader,
  drawCell: customDrawCell,
  onHeaderMenuClick: customOnHeaderMenuClick,
  ...props
}: EnterpriseGlideGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const theme = useGeistGlideTheme();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [isMounted, setIsMounted] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [menuKolom, setMenuKolom] = React.useState<HeaderMenuData | null>(null);

  // Pastikan DataEditor (yang mengakses window.navigator) hanya dirender di browser setelah mount
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Responsif terhadap ukuran container dengan ResizeObserver
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height > 0 ? rect.height : (typeof minHeight === 'number' ? minHeight : 450)),
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(height > 0 ? height : (typeof minHeight === 'number' ? minHeight : 450)),
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [minHeight, rows, memuat, isMounted]);

  // Kalkulasi kolom dengan auto-fit: jika total lebar kolom < lebar kontainer,
  // tambahkan sisa lebar ke flexColumnId (hanya jika ditentukan secara eksplisit)
  const computedColumns = React.useMemo<GridColumn[]>(() => {
    if (!columns || columns.length === 0) return [];
    if (!flexColumnId || dimensions.width <= 0) return [...columns];

    const getColWidth = (c: GridColumn): number => {
      return 'width' in c && typeof c.width === 'number' ? c.width : 100;
    };

    const totalWidth = columns.reduce((acc, col) => acc + getColWidth(col), 0);
    const sisaLebar = dimensions.width - totalWidth;

    // Hanya renggangkan jika sisaLebar positif dan signifikan (> 12px)
    if (sisaLebar > 12) {
      return columns.map((col) => {
        if (col.id === flexColumnId) {
          return {
            ...col,
            width: getColWidth(col) + sisaLebar - 4, // buffer 4px agar tidak memicu scrollbar horizontal semu
          } as GridColumn;
        }
        return col;
      });
    }

    return [...columns];
  }, [columns, dimensions.width, flexColumnId]);

  const mergedRenderers = React.useMemo(() => {
    return [...allEnterpriseCellRenderers, ...(customRenderers || [])];
  }, [customRenderers]);

  // Header Menu Click Handler
  const handleHeaderMenuClick = React.useCallback(
    (colIndex: number, screenPosition: Rectangle) => {
      if (customOnHeaderMenuClick) {
        customOnHeaderMenuClick(colIndex, screenPosition);
        return;
      }
      const colDef = computedColumns[colIndex];
      if (!colDef || !colDef.id) return;

      setMenuKolom({
        colIndex,
        colId: colDef.id,
        title: colDef.title,
        posisi: screenPosition,
      });
    },
    [computedColumns, customOnHeaderMenuClick]
  );

  // Gambar Header Otomatis dengan Indikator Sort (dilengkapi fallback aman jika cache color-parser terputus saat HMR)
  const internalDrawHeader = React.useCallback<DrawHeaderCallback>(
    (args, defaultDraw) => {
      if (customDrawHeader) {
        customDrawHeader(args, defaultDraw);
        return;
      }
      const { ctx, rect, column, columnIndex, theme: headerTheme } = args;
      try {
        defaultDraw();
      } catch {
        ctx.save();
        ctx.fillStyle = headerTheme.bgHeader || (isDark ? '#18181b' : '#f4f4f5');
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = headerTheme.textHeader || (isDark ? '#f4f4f5' : '#09090b');
        ctx.font = `${headerTheme.headerFontStyle || '600 13px'} ${headerTheme.fontFamily || FONT_SANS}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const padX = headerTheme.cellHorizontalPadding || 12;
        ctx.fillText(column.title, rect.x + padX, Math.round(rect.y + rect.height / 2));
        ctx.restore();
      }

      const columnDef = computedColumns[columnIndex];
      if (!columnDef) return;

      if (sortConfig && sortConfig.colId === columnDef.id) {
        drawSortIndicator(ctx, rect, sortConfig.dir, isDark);
      }
    },
    [customDrawHeader, computedColumns, sortConfig, isDark]
  );

  // Gambar Sel Otomatis dengan Smart Text Ellipsis (...) untuk mencegah teks terpotong kasar oleh garis vertikal kolom
  const internalDrawCell = React.useCallback<DrawCellCallback>(
    (args, defaultDraw) => {
      if (customDrawCell) {
        customDrawCell(args, defaultDraw);
        return;
      }

      const { cell, ctx, rect, theme } = args;

      // Smart Text Ellipsis untuk Text & Number Cells bawaan Glide
      if (
        (cell.kind === GridCellKind.Text || cell.kind === GridCellKind.Number) &&
        cell.displayData
      ) {
        const paddingX = theme.cellHorizontalPadding || 8;
        const availableWidth = rect.width - paddingX * 2;
        const font = `${cell.themeOverride?.baseFontStyle || theme.baseFontStyle || '13px'} ${cell.themeOverride?.fontFamily || theme.fontFamily || FONT_SANS}`;

        ctx.save();
        ctx.font = font;
        const textWidth = ctx.measureText(cell.displayData).width;

        if (textWidth > availableWidth && availableWidth > 15) {
          // Bersihkan latar belakang sel
          ctx.fillStyle =
            cell.themeOverride?.bgCell ||
            theme.bgCell ||
            (isDark ? '#09090b' : '#ffffff');
          ctx.fillRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);

          // Potong teks dengan rapi menggunakan ellipsis (...)
          const truncated = potongTeksDenganEllipsis(ctx, cell.displayData, availableWidth);
          ctx.fillStyle =
            cell.themeOverride?.textDark ||
            theme.textDark ||
            (isDark ? '#ededed' : '#171717');
          ctx.textAlign = (cell.contentAlign as CanvasTextAlign) || 'left';
          ctx.textBaseline = 'middle';

          const drawX =
            cell.contentAlign === 'center'
              ? rect.x + rect.width / 2
              : cell.contentAlign === 'right'
                ? rect.x + rect.width - paddingX
                : rect.x + paddingX;

          ctx.fillText(truncated, drawX, Math.round(rect.y + rect.height / 2));
          ctx.restore();
          return;
        }
        ctx.restore();
      }

      defaultDraw();
    },
    [customDrawCell, isDark]
  );

  return (
    <div
      ref={containerRef}
      style={minHeight ? { minHeight } : undefined}
      className={cn(
        'relative w-full h-full min-h-0 flex-1 rounded-none bg-card overflow-hidden shadow-none select-none',
        className
      )}
    >
      {/* 1. Tampilan Skeleton saat SSR (!isMounted) atau saat data sedang dimuat */}
      {!isMounted || (rows === 0 && memuat) ? (
        <div className="flex h-full w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-9 w-full shrink-0 items-center border-b border-border bg-muted/20 px-3">
            <div className="flex items-center gap-3 w-full">
              <div className="h-3.5 w-8 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-36 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-48 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-20 rounded bg-muted animate-pulse ml-auto" />
            </div>
          </div>
          <div className="flex flex-1 flex-col divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex h-10 items-center gap-3 px-3">
                <div className="h-3.5 w-6 rounded bg-muted/60 animate-pulse" />
                <div className="h-3.5 w-20 rounded bg-muted/60 animate-pulse" />
                <div className="h-3.5 w-40 rounded bg-muted/60 animate-pulse" />
                <div className="h-3.5 w-52 rounded bg-muted/60 animate-pulse" />
                <div className="h-3.5 w-16 rounded bg-muted/60 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : rows === 0 && !memuat ? (
        /* 2. Tampilan Empty State saat data kosong */
        <div className="flex h-full w-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-none border border-border bg-muted/50 text-muted-foreground">
            {emptyIcon ?? (
              <svg
                className="size-6 text-muted-foreground/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>
          <h3 className="text-heading-16 font-semibold text-foreground">{emptyTitle}</h3>
          <p className="mt-1.5 max-w-md text-copy-13 text-muted-foreground leading-relaxed">
            {emptyMessage}
          </p>
        </div>
      ) : (
        /* 3. Glide Data Grid Canvas */
        <DataEditor
          key={isDark ? 'grid-dark' : 'grid-light'}
          {...props}
          columns={computedColumns}
          rows={rows}
          freezeColumns={freezeColumns ?? 0}
          width="100%"
          height="100%"
          theme={theme}
          customRenderers={mergedRenderers}
          drawHeader={internalDrawHeader}
          drawCell={internalDrawCell}
          onHeaderMenuClick={handleHeaderMenuClick}
          rowHeight={props.rowHeight ?? 40}
          headerHeight={props.headerHeight ?? 36}
          groupHeaderHeight={props.groupHeaderHeight ?? 28}
          rowMarkers={props.rowMarkers ?? 'none'}
          cellActivationBehavior="double-click"
          smoothScrollX
          smoothScrollY
          verticalBorder
          fixedShadowX
          isDraggable={false}
        />
      )}

      {/* Popover Menu Kolom Header Enterprise */}
      <HeaderMenuPopover
        data={menuKolom}
        sortConfig={sortConfig ?? null}
        onTutup={() => setMenuKolom(null)}
        onSort={(colId, dir) => onSortChange?.({ colId, dir })}
        onHapusSort={() => onSortChange?.(null)}
        onResetLebar={(colId) => onResetLebarKolom?.(colId)}
        onSembunyikanKolom={onSembunyikanKolom}
        onResetKolom={onResetSemuaKolom}
      />
    </div>
  );
}
