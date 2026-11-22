"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface AuditKpiGridProps {
  kpi: {
    totalTercatat: number;
    totalAnomali: number;
    totalWarning: number;
    totalNormal: number;
    persenAnomali: number;
    persenWarning: number;
    persenNormal: number;
  };
  activeFilter: "all" | "anomali" | "warning" | "normal";
  onSelectFilter: (filter: "all" | "anomali" | "warning" | "normal") => void;
}

export function AuditKpiGrid({
  kpi,
  activeFilter,
  onSelectFilter,
}: AuditKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Total Bacaan */}
      <Card
        onClick={() => onSelectFilter("all")}
        className={cn(
          "p-4 border-border bg-card cursor-pointer transition-all hover:border-foreground/40",
          activeFilter === "all" && "ring-2 ring-foreground/20 border-foreground shadow-sm"
        )}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-label-12 font-medium">Total Pembacaan Masuk</span>
          <FileSpreadsheet className="size-4 text-foreground/70" />
        </div>
        <div className="mt-2 text-heading-24 font-mono font-semibold tabular-nums text-foreground">
          {numberFormat.format(kpi.totalTercatat)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-muted-foreground">
            SL
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          <span>100% data transaksi bulan penagihan</span>
        </div>
      </Card>

      {/* 2. Pilar 1: Anomali Validasi Meter */}
      <Card
        onClick={() => onSelectFilter("anomali")}
        className={cn(
          "p-4 border-border bg-card cursor-pointer transition-all hover:border-amber-500/60",
          activeFilter === "anomali" && "ring-2 ring-amber-500/40 border-amber-500 bg-amber-500/[0.03] shadow-sm"
        )}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-label-12 font-medium text-amber-700 dark:text-amber-400">
            Pilar 1: Anomali Validasi
          </span>
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-2 text-heading-24 font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-300">
          {numberFormat.format(kpi.totalAnomali)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-muted-foreground">
            Kasus ({kpi.persenAnomali}%)
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-amber-500" />
          <span><code>is_anomali = true</code> • Wajib Verifikasi</span>
        </div>
      </Card>

      {/* 3. Pilar 2: Catatan Lapangan & Peringatan */}
      <Card
        onClick={() => onSelectFilter("warning")}
        className={cn(
          "p-4 border-border bg-card cursor-pointer transition-all hover:border-blue-500/60",
          activeFilter === "warning" && "ring-2 ring-blue-500/40 border-blue-500 bg-blue-500/[0.03] shadow-sm"
        )}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-label-12 font-medium text-blue-700 dark:text-blue-400">
            Pilar 2: Kendala &amp; Peringatan
          </span>
          <Info className="size-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="mt-2 text-heading-24 font-mono font-semibold tabular-nums text-blue-700 dark:text-blue-300">
          {numberFormat.format(kpi.totalWarning)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-muted-foreground">
            Kasus ({kpi.persenWarning}%)
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-blue-500" />
          <span><code>WARN_*</code> • Catatan akses / stand wajar</span>
        </div>
      </Card>

      {/* 4. Stand Normal Bersih */}
      <Card
        onClick={() => onSelectFilter("normal")}
        className={cn(
          "p-4 border-border bg-card cursor-pointer transition-all hover:border-emerald-500/60",
          activeFilter === "normal" && "ring-2 ring-emerald-500/40 border-emerald-500 bg-emerald-500/[0.03] shadow-sm"
        )}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-label-12 font-medium text-emerald-700 dark:text-emerald-400">
            Stand Wajar Murni (Normal)
          </span>
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 text-heading-24 font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
          {numberFormat.format(kpi.totalNormal)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-muted-foreground">
            SL ({kpi.persenNormal}%)
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          <span>Tidak ada catatan kelainan catat</span>
        </div>
      </Card>
    </div>
  );
}
