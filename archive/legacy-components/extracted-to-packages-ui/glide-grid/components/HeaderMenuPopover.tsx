// apps/web/src/components/glide-grid/components/HeaderMenuPopover.tsx
// Popover Menu Kolom Header Enterprise (Pengurutan, Reset Lebar, Sembunyikan Kolom)
// Diadopsi dari CanvasTabelVerifikasi.tsx dengan token Vercel Geist

'use client';

import * as React from 'react';
import type { Rectangle } from '@glideapps/glide-data-grid';
import { ArrowDown, ArrowUp, Check, EyeOff, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface HeaderMenuData {
  colIndex: number;
  colId: string;
  title: string;
  posisi: Rectangle;
}

export interface SortConfiguration {
  colId: string;
  dir: 'asc' | 'desc';
}

export interface HeaderMenuPopoverProps {
  data: HeaderMenuData | null;
  sortConfig: SortConfiguration | null;
  onTutup: () => void;
  onSort: (colId: string, dir: 'asc' | 'desc') => void;
  onHapusSort: () => void;
  onResetLebar: (colId: string) => void;
  onSembunyikanKolom?: (colId: string) => void;
  onResetKolom?: () => void;
}

export function HeaderMenuPopover({
  data,
  sortConfig,
  onTutup,
  onSort,
  onHapusSort,
  onResetLebar,
  onSembunyikanKolom,
  onResetKolom,
}: HeaderMenuPopoverProps) {
  if (!data) return null;
  const { colId, title, posisi } = data;
  const isSortedAsc = sortConfig?.colId === colId && sortConfig.dir === 'asc';
  const isSortedDesc = sortConfig?.colId === colId && sortConfig.dir === 'desc';

  return (
    <Popover open onOpenChange={(open) => !open && onTutup()}>
      <PopoverTrigger asChild>
        <div
          style={{
            position: 'fixed',
            left: posisi.x,
            top: posisi.y + posisi.height,
            width: posisi.width,
            height: 1,
            pointerEvents: 'none',
            opacity: 0,
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-56 p-1 text-copy-13 shadow-xl z-50 border border-border bg-popover rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-copy-11 font-semibold tracking-wide text-muted-foreground uppercase border-b border-border/60 mb-1">
          {title}
        </div>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSort(colId, 'asc');
              onTutup();
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer',
              isSortedAsc && 'bg-primary/10 font-semibold text-primary'
            )}
          >
            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Urutkan Menaik (A→Z)</span>
            {isSortedAsc && <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onSort(colId, 'desc');
              onTutup();
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer',
              isSortedDesc && 'bg-primary/10 font-semibold text-primary'
            )}
          >
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Urutkan Menurun (Z→A)</span>
            {isSortedDesc && <Check className="h-3.5 w-3.5" />}
          </button>
          {(isSortedAsc || isSortedDesc) && (
            <button
              type="button"
              onClick={() => {
                onHapusSort();
                onTutup();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted text-muted-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Hapus Pengurutan</span>
            </button>
          )}

          <div className="my-1 border-t border-border/60" />

          <button
            type="button"
            onClick={() => {
              onResetLebar(colId);
              onTutup();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span>Reset Lebar Kolom</span>
          </button>

          {onSembunyikanKolom && (
            <button
              type="button"
              onClick={() => {
                onSembunyikanKolom(colId);
                onTutup();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-destructive/10 text-destructive cursor-pointer"
            >
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
              <span>Sembunyikan Kolom</span>
            </button>
          )}

          {onResetKolom && (
            <button
              type="button"
              onClick={() => {
                onResetKolom();
                onTutup();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted text-muted-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Reset Semua Kolom</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
