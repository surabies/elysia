"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  Gauge,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  DashboardMetricSummary,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RingkasanHeaderProps {
  name: string;
  role: string;
  periode: PeriodeInfo;
  tanggalHariIni: string;
  summary?: DashboardMetricSummary;
}

export function RingkasanHeader({
  name,
  role,
  periode,
  tanggalHariIni,
  summary,
}: RingkasanHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  // Hitung salam berdasarkan waktu lokal
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  // Hitung progres siklus hari dalam bulan berjalan
  const { hariBerjalan, totalHariBulan, siklusHariPersen } = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = Math.min(now.getDate(), totalDays);
    const pct = Math.round((currentDay / totalDays) * 100);
    return {
      hariBerjalan: currentDay,
      totalHariBulan: totalDays,
      siklusHariPersen: pct,
    };
  }, []);

  const handleCopyThbl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(periode.thbl);
      setCopied(true);
      toast.success(`Kode THBL ${periode.thbl} disalin ke clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSearch = () => {
    // Simulasi shortcut keyboard Cmd/Ctrl+K untuk memicu modal pencarian
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const displayProgress = summary?.persenSelesai ?? siklusHariPersen;
  const isCaterActive = (summary?.totalCater ?? 0) > 0;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-border/60 dark:bg-card/40 dark:shadow-none">
      {/* 1. Ambient Lighting Highlights (Vercel Style) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-500/12 via-cyan-500/6 to-transparent blur-3xl dark:from-emerald-500/18 dark:via-cyan-500/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-tr from-blue-500/6 via-violet-500/6 to-transparent blur-3xl dark:from-blue-500/12 dark:via-violet-500/6" />

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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
              PDAM Tirtawening
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500/80" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Live Operasional
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">/</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                {summary ? `${summary.totalRute} Rute • ${summary.totalPetugas} Petugas Aktif` : "Core Cluster STI"}
              </span>
            </div>
          </div>

          {/* Telemetry Chips (THBL, Tanggal, Live Badge) */}
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
                {periode.thbl}
              </span>
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-2.5 text-muted-foreground/60 transition-opacity group-hover:text-foreground" />
              )}
            </button>

            {/* Tanggal Chip */}
            <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
              <Calendar className="size-3 text-muted-foreground/70" />
              <span className="tabular-nums font-medium text-foreground">
                {tanggalHariIni}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Main Cockpit Body (3 Columns) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
          {/* Kolom 1: User Identity & Mission Title (5 Col) */}
          <div className="min-w-0 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                size="sm"
                className="font-mono text-[10px] font-medium tracking-wider uppercase border-border/80 bg-background/60 backdrop-blur-xs"
              >
                {role}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Pusat Kendali 3 Pilar
              </span>
            </div>

            <h1 className="mt-1.5 text-heading-20 font-semibold tracking-tight text-foreground">
              Ringkasan Operasional
            </h1>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              {greeting},{" "}
              <span className="font-medium text-foreground">{name}</span>.
              Sistem pencatatan dan tagihan aktif untuk periode{" "}
              <span className="font-medium text-foreground">{periode.label}</span>.
            </p>
          </div>

          {/* Kolom 2: Signature Feature - Siklus Operasional Gauge (4 Col) */}
          <div className="rounded-md border border-border/60 bg-muted/25 p-3.5 backdrop-blur-xs transition-colors hover:border-border/90 lg:col-span-4">
            <div className="flex items-center justify-between text-label-12">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Activity className="size-3.5 text-emerald-500" />
                {isCaterActive ? "Capaian Catat THBL" : "Siklus Periode THBL"}
              </span>
              <span className="font-mono text-label-12 font-semibold tabular-nums text-foreground">
                {displayProgress}%
              </span>
            </div>

            {/* Sleek Vercel Progress Bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(Math.max(displayProgress, 2), 100)}%` }}
              />
            </div>

            {/* Telemetri Detail Siklus */}
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span>
                Hari ke-{hariBerjalan} <span className="text-muted-foreground/40">/</span> {totalHariBulan}
              </span>
              <span className="tabular-nums font-medium text-foreground">
                {summary
                  ? `${summary.totalCater.toLocaleString("id-ID")} / ${summary.totalPelanggan.toLocaleString("id-ID")} SL`
                  : `Periode ${periode.label}`}
              </span>
            </div>
          </div>

          {/* Kolom 3: Micro Quick Actions & Command Pill (3 Col) */}
          <div className="flex flex-col gap-2 lg:col-span-3">
            {/* Quick Action 1: Verifikasi & Koreksi */}
            <Link
              href="/verifikasi"
              className="group flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2 text-label-12 text-foreground transition-all hover:border-foreground/30 hover:bg-accent/40 hover:shadow-xs"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">Verifikasi Lapangan</span>
              </div>
              <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </Link>

            {/* Quick Action 2: Command Search Pill */}
            <button
              type="button"
              onClick={handleOpenSearch}
              className="group flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2 text-label-12 text-muted-foreground transition-all hover:border-foreground/30 hover:bg-accent/40 hover:text-foreground hover:shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="size-4 text-cyan-600 dark:text-cyan-400" />
                <span>Pencarian Cepat</span>
              </div>
              <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
