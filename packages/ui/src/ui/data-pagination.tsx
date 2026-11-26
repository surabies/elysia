import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/lib/utils";
import type { IPaginationContract } from "../contracts/component-contracts";

export interface DataPaginationProps extends IPaginationContract {
  className?: string;
}

/**
 * Vercel Geist Standard Table Data Pagination
 * Reference: https://vercel.com/geist/pagination
 */
export function DataPagination({
  pageIndex,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  disabled = false,
  className,
}: DataPaginationProps) {
  // Support 1-based pageIndex
  const safePageIndex = Math.max(1, pageIndex);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startItem = totalItems === 0 ? 0 : (safePageIndex - 1) * pageSize + 1;
  const endItem = Math.min(safePageIndex * pageSize, totalItems);

  return (
    <div
      data-slot="data-pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 py-2.5 text-xs text-muted-foreground select-none",
        className
      )}
    >
      {/* Kiri: Jumlah Baris per Halaman */}
      <div className="flex items-center gap-2">
        <span>Baris per halaman:</span>
        {onPageSizeChange ? (
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-card">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent align="start">
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="font-medium text-foreground">{pageSize}</span>
        )}
      </div>

      {/* Tengah: Indikator Item */}
      <div className="flex items-center gap-1">
        <span>Menampilkan</span>
        <span className="font-semibold text-foreground">
          {startItem}-{endItem}
        </span>
        <span>dari</span>
        <span className="font-semibold text-foreground">
          {totalItems.toLocaleString("id-ID")}
        </span>
        <span>data</span>
      </div>

      {/* Kanan: Navigasi Tombol */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Halaman pertama"
          onClick={() => onPageChange(1)}
          disabled={disabled || safePageIndex <= 1}
          className="size-7"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Halaman sebelumnya"
          onClick={() => onPageChange(safePageIndex - 1)}
          disabled={disabled || safePageIndex <= 1}
          className="size-7"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        <span className="px-2 text-xs font-medium text-foreground">
          {safePageIndex} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Halaman selanjutnya"
          onClick={() => onPageChange(safePageIndex + 1)}
          disabled={disabled || safePageIndex >= totalPages}
          className="size-7"
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Halaman terakhir"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || safePageIndex >= totalPages}
          className="size-7"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
