"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  BarChart3,
  Calendar,
  Check,
  Compass,
  Copy,
  LineChart,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "../lib/format";
import { toast } from "sonner";

interface AnalyticsHeaderProps {
  periodLabel: string;
  periodCode: string;
  generatedAt: Date;
}

export function AnalyticsHeader({
  periodLabel,
  periodCode,
  generatedAt,
}: AnalyticsHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyThbl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(periodCode);
      setCopied(true);
      toast.success(`Kode THBL ${periodCode} disalin ke clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const jumpTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-border/60 dark:bg-card/40 dark:shadow-none">
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
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/50 pb-3">
          {/* Status Heartbeat */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
              PDAM Tirtawening
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-blue-500/80" />
              <span className="font-medium text-blue-700 dark:text-blue-400">
                Observabilitas Real-time
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">/</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                Time-Series Engine
              </span>
            </div>
          </div>

          {/* Telemetry Chips */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {/* THBL Chip with Copy */}
            <button
              type="button"
              onClick={handleCopyThbl}
              title="Klik untuk menyalin kode THBL"
              className="group flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/70 hover:text-foreground"
            >
              <span className="text-[10px] font-medium text-muted-foreground/70">THBL</span>
              <span className="font-semibold text-foreground tracking-tight">
                {periodCode}
              </span>
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-2.5 text-muted-foreground/60 transition-opacity group-hover:text-foreground" />
              )}
            </button>

            {/* Diperbarui Chip */}
            <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
              <Calendar className="size-3 text-muted-foreground/70" />
              <span className="tabular-nums font-medium text-foreground">
                {formatDate(generatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Header Content & Navigation Jump Anchors */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                size="sm"
                className="font-mono text-[10px] font-medium tracking-wider uppercase border-border/80 bg-background/60 backdrop-blur-xs"
              >
                Observabilitas
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Periode Aktif {periodLabel}
              </span>
            </div>

            <h1 className="mt-1.5 text-heading-20 font-semibold tracking-tight text-foreground">
              Analitik &amp; Observabilitas Operasional
            </h1>
            <p className="mt-0.5 text-copy-13 text-muted-foreground max-w-3xl">
              Evaluasi kinerja pembacaan meter, time-series harian, peta risiko kelurahan, dan distribusi kubikasi PDAM Tirtawening.
            </p>
          </div>

          {/* Quick Jump Pills (Interactive Vercel Sub-nav) */}
          <div className="flex flex-wrap items-center gap-1.5 self-start rounded-md border border-border/60 bg-muted/20 p-1 text-label-12 backdrop-blur-xs lg:self-center">
            <button
              type="button"
              onClick={() => jumpTo("tren-harian")}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs"
            >
              <LineChart className="size-3 text-blue-500" />
              <span>Tren Harian</span>
            </button>
            <button
              type="button"
              onClick={() => jumpTo("risiko-wilayah")}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs"
            >
              <MapPin className="size-3 text-emerald-500" />
              <span>Peta Risiko</span>
            </button>
            <button
              type="button"
              onClick={() => jumpTo("status-pembacaan")}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs"
            >
              <AlertTriangle className="size-3 text-amber-500" />
              <span>Anomali</span>
            </button>
            <button
              type="button"
              onClick={() => jumpTo("produktivitas-petugas")}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs"
            >
              <Users className="size-3 text-cyan-500" />
              <span>Petugas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
