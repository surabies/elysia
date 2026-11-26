"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Copy,
  RotateCw,
} from "lucide-react";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusDot,
} from "@cater/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CaterStats, PeriodeOption } from "../types";

export interface CaterMonitoringHeaderProps {
  periodThbl: string;
  periodLabel: string;
  availablePeriods?: PeriodeOption[];
  onPeriodChange: (nextThbl: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  stats?: CaterStats | null;
  routesCount?: number;
  anomaliTotal?: number;
}

export function CaterMonitoringHeader({
  periodThbl,
  periodLabel,
  availablePeriods = [],
  onPeriodChange,
  onRefresh,
  loading = false,
  stats,
  routesCount = 0,
  anomaliTotal = 0,
}: CaterMonitoringHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  // Tanggal kalender hari ini
  const todayLabel = React.useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  const handlePeriodSelect = (nextThbl: string) => {
    if (!nextThbl || nextThbl === periodThbl) return;
    onPeriodChange(nextThbl);
    router.push(`/cater?periode=${encodeURIComponent(nextThbl)}`, { scroll: false });
  };

  const handleCopyThbl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(periodThbl);
      setCopied(true);
      toast.success(`Kode THBL ${periodThbl} disalin`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalPelanggan = stats?.totalPelanggan ?? 0;
  const totalTercatat = stats?.totalTercatat ?? 0;
  const persenCapaian =
    totalPelanggan > 0 ? ((totalTercatat / totalPelanggan) * 100).toFixed(1) : "0.0";

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:bg-card/40 dark:shadow-none">
      {/* 1. Ambient Lighting Highlights (Vercel Style) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/12 via-indigo-500/6 to-transparent blur-3xl dark:from-blue-500/18 dark:via-indigo-500/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-tr from-cyan-500/6 via-teal-500/6 to-transparent blur-3xl dark:from-cyan-500/12 dark:via-teal-500/6" />

      {/* 2. Micro-dot Grid Texture Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Row 1: Telemetry & System Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-3">
          {/* Heartbeat Status */}
          <div className="flex items-center gap-2.5">
            <StatusDot state="ready" size="sm" showPulse />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
              PDAM Tirtawening
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Live Operasional
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">/</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                Monitoring Rute &amp; Catat Meter
              </span>
            </div>
          </div>

          {/* Telemetry Controls: Period Switcher, THBL, Segarkan, Tanggal (semua h-8 seragam) */}
          <div className="flex flex-wrap items-center gap-2 text-label-12">
            {availablePeriods && availablePeriods.length > 0 ? (
              <Select value={periodThbl} onValueChange={handlePeriodSelect}>
                <SelectTrigger
                  size="sm"
                  aria-label="Pilih periode monitoring"
                  className="h-8 min-w-[172px] rounded-md border-border bg-background px-2.5 font-sans text-label-12 font-medium text-foreground shadow-none cursor-pointer"
                >
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent align="end">
                  {availablePeriods.map((item) => (
                    <SelectItem key={item.thbl} value={item.thbl}>
                      <span className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.isCurrentMonth && !item.hasData ? (
                          <span className="text-[11px] text-muted-foreground">
                            (Belum di-import)
                          </span>
                        ) : item.isCurrentMonth ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            (Berjalan)
                          </span>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {/* THBL Chip with Copy */}
            <button
              type="button"
              onClick={handleCopyThbl}
              title="Klik untuk menyalin kode THBL"
              className="group inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 font-mono text-label-12 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground cursor-pointer"
            >
              <span className="text-[10.5px] font-medium text-muted-foreground">THBL</span>
              <span className="font-semibold text-foreground tracking-tight tabular-nums">
                {periodThbl}
              </span>
              {copied ? (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="size-3 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
              )}
            </button>

            {/* Tombol Segarkan */}
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 gap-1.5 rounded-md border-border bg-background px-2.5 font-sans text-label-12 font-medium text-muted-foreground hover:text-foreground shadow-none cursor-pointer"
              >
                <RotateCw className={cn("size-3.5 text-muted-foreground", loading && "animate-spin")} />
                <span>Segarkan</span>
              </Button>
            )}

            {/* Tanggal Kalender Chip */}
            <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 font-mono text-label-12 text-muted-foreground">
              <Calendar className="size-3.5 text-muted-foreground/80" />
              <span className="tabular-nums font-medium text-foreground">
                {todayLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Header Content & Summary Badges */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="blue-subtle" size="sm">
                Operasional
              </Badge>
              <span className="text-label-12 text-muted-foreground">
                Periode Aktif {periodLabel}
              </span>
            </div>

            <h1 className="mt-1.5 text-heading-20 font-semibold tracking-tight text-foreground">
              Monitoring Baca Meter &amp; Produktivitas Petugas
            </h1>
            <p className="mt-0.5 text-copy-13 text-muted-foreground max-w-3xl">
              Pusat kendali operasional pembacaan stand meter, evaluasi progres rute harian petugas, dan deteksi anomali di lapangan.
            </p>
          </div>

          {/* Quick Visual KPI Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background/60 px-2.5 py-1 text-label-12 backdrop-blur-sm">
              <span className="text-muted-foreground">Pelanggan:</span>
              <span className="font-semibold text-foreground font-mono">
                {totalPelanggan > 0 ? totalPelanggan.toLocaleString("id-ID") : "-"} SL
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background/60 px-2.5 py-1 text-label-12 backdrop-blur-sm">
              <span className="text-muted-foreground">Tercatat:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                {totalTercatat > 0 ? totalTercatat.toLocaleString("id-ID") : "-"}
              </span>
              {totalPelanggan > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  ({persenCapaian}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background/60 px-2.5 py-1 text-label-12 backdrop-blur-sm">
              <span className="text-muted-foreground">Rute:</span>
              <span className="font-semibold text-foreground font-mono">
                {stats?.totalRute ?? routesCount} Rute
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background/60 px-2.5 py-1 text-label-12 backdrop-blur-sm">
              <span className="text-muted-foreground">Petugas:</span>
              <span className="font-semibold text-foreground font-mono">
                {stats?.totalPetugas ?? 9} Aktif
              </span>
            </div>

            {anomaliTotal > 0 && (
              <Badge variant="amber-subtle" size="md" className="font-mono">
                Perlu Ditinjau: {anomaliTotal} Anomali
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
