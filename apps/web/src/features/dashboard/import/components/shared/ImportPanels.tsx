// features/dashboard/import/components/shared/ImportPanels.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { ImportSearchInput } from "./ImportSearchInput";

const PANEL_CLASS = "rounded-lg border border-border bg-card";

export interface ImportControlPanelProps {
  title: string;
  badge?: React.ReactNode;
  description: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  hasData?: boolean;
  className?: string;
}

/** Bilah kontrol utama konsisten di setiap halaman import (Header, Aksi, Filter, dan Pencarian). */
export function ImportControlPanel({
  title,
  badge,
  description,
  actions,
  filters,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  hasData = false,
  className,
}: ImportControlPanelProps) {
  return (
    <div className={cn(PANEL_CLASS, "space-y-4 p-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-heading-16 text-foreground">{title}</h2>
            {badge}
          </div>
          <p className="text-copy-13 text-muted-foreground">{description}</p>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {hasData && (filters || onSearchChange) && (
        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div>{filters}</div>
          {onSearchChange && (
            <ImportSearchInput
              value={searchQuery ?? ""}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Bilah kontrol (tombol aksi + filter) di atas tabel. */
export function ImportActionBar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        PANEL_CLASS,
        "flex flex-wrap items-center justify-between gap-3 p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Kelompok tombol dalam ImportActionBar. */
export function ImportActionGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

interface ImportTablePanelProps {
  /** Ringkasan di header panel; dipisah titik tengah otomatis. */
  summary: React.ReactNode[];
  aside?: React.ReactNode;
  children: React.ReactNode;
}

export function ImportTablePanel({
  summary,
  aside,
  children,
}: ImportTablePanelProps) {
  return (
    <section className={cn(PANEL_CLASS, "overflow-hidden")}>
      <header className="flex items-center justify-between gap-3 border-b border-border bg-table-head px-4 py-2 text-label-12 text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {summary.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span aria-hidden>·</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
