"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Copy,
  Download,
  FileEdit,
  Gauge,
  RotateCw,
  TrendingDown,
  TrendingUp,
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
import type { PeriodeOption } from "@/server/services/dashboard/dashboard.service";

export interface KoreksiStandHeaderProps {
  periodeThbl: string;
  periodeLabel: string;
  availablePeriods?: PeriodeOption[];
  onPeriodChange: (nextThbl: string) => void;
  onRefresh?: () => void;
  onExportCsv?: () => void;
  canExport?: boolean;
  loading?: boolean;
  summary?: {
    totalKoreksi: number;
    totalM3Tambah: number;
    totalM3Kurang: number;
    nettoM3: number;
    totalMeterBaru?: number;
    totalRollover?: number;
  };
}

export function KoreksiStandHeader({
  periodeThbl,
  periodeLabel,
  availablePeriods = [],
  onPeriodChange,
  onRefresh,
  onExportCsv,
  canExport = false,
  loading = false,
  summary,
}: KoreksiStandHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const todayLabel = React.useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  const handlePeriodSelect = (nextThbl: string) => {
    if (!nextThbl || nextThbl === periodeThbl) return;
    onPeriodChange(nextThbl);
    router.push(`/progres/koreksi?periode=${encodeURIComponent(nextThbl)}`, {
      scroll: false,
    });
  };

  const handleCopyThbl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(periodeThbl);
      setCopied(true);
      toast.success(`Kode THBL ${periodeThbl} disalin`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalKoreksi = summary?.totalKoreksi ?? 0;
  const totalMeterBaru = summary?.totalMeterBaru ?? 0;
  const totalRollover = summary?.totalRollover ?? 0;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:bg-card/40 dark:shadow-none">
      {/* 1. Ambient Lighting Highlights (Vercel Style) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/12 via-emerald-500/6 to-transparent blur-3xl dark:from-blue-500/18 dark:via-emerald-500/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-tr from-violet-500/6 via-cyan-500/6 to-transparent blur-3xl dark:from-violet-500/12 dark:via-cyan-500/6" />

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
          <div className="flex items-center gap-2.5">
            <StatusDot state="ready" size="sm" showPulse />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
              PDAM Tirtawening
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Audit Trail Resmi
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">/</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                Koreksi Stand, Meter Baru &amp; Rollover
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-label-12">
            {availablePeriods && availablePeriods.length > 0 ? (
              <Select value={periodeThbl} onValueChange={handlePeriodSelect}>
                <SelectTrigger
                  size="sm"
                  aria-label="Pilih periode monitoring koreksi stand"
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

            <button
              type="button"
              onClick={handleCopyThbl}
              title="Klik untuk menyalin kode THBL"
              className="group inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 font-mono text-label-12 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground cursor-pointer"
            >
              <span className="text-[10.5px] font-medium text-muted-foreground">THBL</span>
              <span className="font-semibold text-foreground tracking-tight tabular-nums">
                {periodeThbl}
              </span>
              {copied ? (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="size-3 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
              )}
            </button>

            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 gap-1.5 rounded-md border-border bg-background px-2.5 font-sans text-label-12 font-medium text-muted-foreground hover:text-foreground shadow-none cursor-pointer"
              >
                <RotateCw
                  className={cn("size-3.5 text-muted-foreground", loading && "animate-spin")}
                />
                <span>Segarkan</span>
              </Button>
            )}

            {onExportCsv && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                disabled={loading || !canExport}
                className="h-8 gap-1.5 rounded-md border-border bg-background px-2.5 font-sans text-label-12 font-medium text-foreground shadow-none cursor-pointer"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Ekspor CSV</span>
              </Button>
            )}

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
                Audit Verifikasi &amp; Penagihan
              </Badge>
              <span className="text-label-12 text-muted-foreground">
                Periode Aktif {periodeLabel}
              </span>
            </div>

            <h1 className="mt-1.5 text-heading-20 font-semibold tracking-tight text-foreground">
              Monitoring Koreksi Stand &amp; Audit Trail
            </h1>
            <p className="mt-0.5 text-copy-13 text-muted-foreground max-w-3xl">
              Rekapitulasi resmi penyesuaian angka stand meter, pengesahan Meter Baru (MB), Muda Kembali (Rollover), dan taksasi pemakaian oleh Verifikator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="pill" size="md" className="gap-1.5 font-normal">
              <FileEdit className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground">Dikoreksi:</span>
              <span className="font-semibold text-foreground font-mono">
                {totalKoreksi.toLocaleString("id-ID")} SL
              </span>
            </Badge>

            {totalMeterBaru > 0 && (
              <Badge variant="blue-subtle" size="md" className="gap-1.5 font-normal">
                <Gauge className="size-3 text-(--ds-blue-700)" />
                <span className="text-(--ds-blue-900)/80">Meter Baru:</span>
                <span className="font-semibold text-(--ds-blue-900) font-mono">
                  {totalMeterBaru.toLocaleString("id-ID")}
                </span>
              </Badge>
            )}

            {totalRollover > 0 && (
              <Badge variant="amber-subtle" size="md" className="gap-1.5 font-normal">
                <span className="text-(--ds-amber-900)/80">Rollover:</span>
                <span className="font-semibold text-(--ds-amber-900) font-mono">
                  {totalRollover.toLocaleString("id-ID")}
                </span>
              </Badge>
            )}

            <Badge variant="green-subtle" size="md" className="gap-1.5 font-normal">
              <TrendingUp className="size-3 text-(--ds-green-700)" />
              <span className="text-(--ds-green-900)/80">Tambah:</span>
              <span className="font-semibold font-mono text-(--ds-green-900)">
                +{(summary?.totalM3Tambah ?? 0).toLocaleString("id-ID")} m³
              </span>
            </Badge>

            {(summary?.totalM3Kurang ?? 0) > 0 && (
              <Badge variant="red-subtle" size="md" className="gap-1.5 font-normal">
                <TrendingDown className="size-3 text-(--ds-red-700)" />
                <span className="text-(--ds-red-900)/80">Kurang:</span>
                <span className="font-semibold font-mono text-(--ds-red-900)">
                  -{(summary?.totalM3Kurang ?? 0).toLocaleString("id-ID")} m³
                </span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
