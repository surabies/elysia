"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PeriodeOption } from "@/server/services/dashboard/dashboard.service";
import { formatDate } from "../lib/format";
import { toast } from "sonner";

interface AnalyticsHeaderProps {
  periodLabel: string;
  periodCode: string;
  availablePeriods?: PeriodeOption[];
  generatedAt: Date;
}

export function AnalyticsHeader({
  periodLabel,
  periodCode,
  availablePeriods = [],
  generatedAt,
}: AnalyticsHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const handlePeriodeChange = (nextThbl: string) => {
    if (!nextThbl || nextThbl === periodCode) return;
    router.push(`/analytics?periode=${encodeURIComponent(nextThbl)}`);
  };

  const handleCopyThbl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(periodCode);
      setCopied(true);
      toast.success(`Kode THBL ${periodCode} disalin ke clipboard`);
      setTimeout(() => setCopied(false), 2000);
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

          {/* Telemetry Controls: Period Switcher, THBL, Tanggal (tinggi seragam h-8 / 32px) */}
          <div className="flex flex-wrap items-center gap-2 text-label-12">
            {availablePeriods.length > 0 ? (
              <Select value={periodCode} onValueChange={handlePeriodeChange}>
                <SelectTrigger
                  size="sm"
                  aria-label="Pilih periode analitik"
                  className="h-8 min-w-[172px] rounded-md border-border/80 bg-background px-2.5 font-sans text-label-12 font-medium text-foreground shadow-none"
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
                          <span className="text-[11px] text-(--ds-green-900)">
                            (Berjalan)
                          </span>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {/* THBL Chip with Copy (h-8 seragam) */}
            <button
              type="button"
              onClick={handleCopyThbl}
              title="Klik untuk menyalin kode THBL"
              className="group inline-flex h-8 items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 font-mono text-label-12 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground cursor-pointer"
            >
              <span className="text-[10.5px] font-medium text-muted-foreground">THBL</span>
              <span className="font-semibold text-foreground tracking-tight tabular-nums">
                {periodCode}
              </span>
              {copied ? (
                <Check className="size-3.5 text-(--ds-green-700)" />
              ) : (
                <Copy className="size-3 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
              )}
            </button>

            {/* Diperbarui Chip (h-8 seragam) */}
            <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 font-mono text-label-12 text-muted-foreground">
              <Calendar className="size-3.5 text-muted-foreground/80" />
              <span className="tabular-nums font-medium text-foreground">
                {formatDate(generatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Header Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="gray-subtle" size="sm" className="font-mono uppercase">
              Observabilitas
            </Badge>
            <span className="text-label-12 text-muted-foreground">
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
      </div>
    </div>
  );
}
