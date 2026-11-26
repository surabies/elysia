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
      <div
        onClick={() => onSelectFilter("all")}
        className={cn(
          "p-4 rounded-lg border border-transparent cursor-pointer transition-all",
          activeFilter === "all"
            ? "bg-(--ds-gray-200) ring-1 ring-(--ds-gray-700)/25 shadow-xs"
            : "bg-(--ds-gray-100) hover:bg-(--ds-gray-200)"
        )}
      >
        <div className="flex items-center justify-between text-(--ds-gray-900)">
          <span className="text-label-12 font-medium">Total Pembacaan Masuk</span>
          <div className="flex items-center gap-1.5">
            {activeFilter === "all" && (
              <span className="size-1.5 rounded-full bg-(--ds-gray-700) animate-pulse" />
            )}
            <FileSpreadsheet className="size-4 text-(--ds-gray-700)" />
          </div>
        </div>
        <div className="mt-2 text-heading-24 font-mono font-bold tabular-nums text-(--ds-gray-1000)">
          {numberFormat.format(kpi.totalTercatat)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-(--ds-gray-900)/70">
            SL
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-(--ds-gray-900)/80">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          <span>100% data transaksi bulan penagihan</span>
        </div>
      </div>

      {/* 2. Pilar 1: Anomali Validasi Meter */}
      <div
        onClick={() => onSelectFilter("anomali")}
        className={cn(
          "p-4 rounded-lg border border-transparent cursor-pointer transition-all",
          activeFilter === "anomali"
            ? "bg-(--ds-amber-200) ring-1 ring-(--ds-amber-700)/25 shadow-xs"
            : "bg-(--ds-amber-100) hover:bg-(--ds-amber-200)"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-label-12 font-medium text-(--ds-amber-900)">
            Pilar 1: Anomali Validasi
          </span>
          <div className="flex items-center gap-1.5">
            {activeFilter === "anomali" && (
              <span className="size-1.5 rounded-full bg-(--ds-amber-700) animate-pulse" />
            )}
            <AlertTriangle className="size-4 text-(--ds-amber-700)" />
          </div>
        </div>
        <div className="mt-2 text-heading-24 font-mono font-bold tabular-nums text-(--ds-amber-900)">
          {numberFormat.format(kpi.totalAnomali)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-(--ds-amber-900)/70">
            Kasus ({kpi.persenAnomali}%)
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-(--ds-amber-900)/80">
          <span className="inline-block size-1.5 rounded-full bg-amber-500" />
          <span><code>is_anomali = true</code> • Wajib Verifikasi</span>
        </div>
      </div>

      {/* 3. Pilar 2: Catatan Lapangan & Peringatan */}
      <div
        onClick={() => onSelectFilter("warning")}
        className={cn(
          "p-4 rounded-lg border border-transparent cursor-pointer transition-all",
          activeFilter === "warning"
            ? "bg-(--ds-blue-200) ring-1 ring-(--ds-blue-700)/25 shadow-xs"
            : "bg-(--ds-blue-100) hover:bg-(--ds-blue-200)"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-label-12 font-medium text-(--ds-blue-900)">
            Pilar 2: Kendala &amp; Peringatan
          </span>
          <div className="flex items-center gap-1.5">
            {activeFilter === "warning" && (
              <span className="size-1.5 rounded-full bg-(--ds-blue-700) animate-pulse" />
            )}
            <Info className="size-4 text-(--ds-blue-700)" />
          </div>
        </div>
        <div className="mt-2 text-heading-24 font-mono font-bold tabular-nums text-(--ds-blue-900)">
          {numberFormat.format(kpi.totalWarning)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-(--ds-blue-900)/70">
            Kasus ({kpi.persenWarning}%)
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-(--ds-blue-900)/80">
          <span className="inline-block size-1.5 rounded-full bg-blue-500" />
          <span><code>WARN_*</code> • Catatan akses / stand wajar</span>
        </div>
      </div>

      {/* 4. Stand Normal Bersih */}
      <div
        onClick={() => onSelectFilter("normal")}
        className={cn(
          "p-4 rounded-lg border border-transparent cursor-pointer transition-all",
          activeFilter === "normal"
            ? "bg-(--ds-green-200) ring-1 ring-(--ds-green-700)/25 shadow-xs"
            : "bg-(--ds-green-100) hover:bg-(--ds-green-200)"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-label-12 font-medium text-(--ds-green-900)">
            Stand Wajar Murni (Normal)
          </span>
          <div className="flex items-center gap-1.5">
            {activeFilter === "normal" && (
              <span className="size-1.5 rounded-full bg-(--ds-green-700) animate-pulse" />
            )}
            <CheckCircle2 className="size-4 text-(--ds-green-700)" />
          </div>
        </div>
        <div className="mt-2 text-heading-24 font-mono font-bold tabular-nums text-(--ds-green-900)">
          {numberFormat.format(kpi.totalNormal)}
          <span className="ml-1.5 text-label-12 font-sans font-normal text-(--ds-green-900)/70">
            SL ({kpi.persenNormal}%)
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-copy-12 text-(--ds-green-900)/80">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          <span>Tidak ada catatan kelainan catat</span>
        </div>
      </div>
    </div>
  );
}
