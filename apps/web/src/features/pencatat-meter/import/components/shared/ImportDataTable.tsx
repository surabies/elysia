// features/dashboard/import/components/shared/ImportDataTable.tsx
"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cater/ui";
import { cn } from "@/lib/utils";
import {
  IMPORT_TABLE_CONTAINER_CLASS,
  IMPORT_TABLE_HEADER_CLASS,
} from "../../lib/import-ui";

export interface ImportColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  /** Diterapkan pada header dan sel (lebar, perataan). */
  className?: string;
  /** Hanya diterapkan pada sel (tipografi data). */
  cellClassName?: string;
}

export interface ImportEmptyState {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
}

interface ImportDataTableProps<T> {
  columns: readonly ImportColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T, index: number) => string;
  empty: ImportEmptyState;
  rowClassName?: (row: T) => string | undefined;
}

export function ImportDataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
  rowClassName,
}: ImportDataTableProps<T>) {
  const EmptyIcon = empty.icon;

  return (
    <Table containerClassName={IMPORT_TABLE_CONTAINER_CLASS}>
      <TableHeader className={IMPORT_TABLE_HEADER_CLASS}>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-40 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <EmptyIcon
                  className="size-8 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="text-label-14 text-foreground">{empty.title}</p>
                <p className="text-copy-13 text-muted-foreground">
                  {empty.description}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow
              key={getRowKey(row, index)}
              className={rowClassName?.(row)}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(column.className, column.cellClassName)}
                >
                  {column.cell(row, index)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
