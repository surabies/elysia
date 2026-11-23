"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/PengaduanHeader.tsx
// Panel Cockpit Pengaduan Responsif Berbasis CSS Container Queries (@container/header):
// - Tinggi disamakan presisi 1:1 dengan Header Panel Kanan (Baris 1: h-12 border-b, Baris 2: min-h-[88px] @[700px]/header:h-[88px], Total: 136px).
// - Saat panel menyusut: tombol aksi otomatis berubah menjadi icon-only compact ber-tooltip,
//   teks sekunder disembunyikan, dan badge KPI diringkas.

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronUp,
  Globe,
  Inbox,
  LifeBuoy,
  Map,
  RotateCw,
  SlidersHorizontal,
  Ticket,
  TimerOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StatistikPengaduan } from "../../types/TipePengaduan";

export interface PengaduanHeaderProps {
  stat: StatistikPengaduan | null;
  onRefresh?: () => void;
  loading?: boolean;
  terbuka?: boolean;
  transitionsReady?: boolean;
  onToggle?: () => void;
}

export function PengaduanHeader({
  stat,
  onRefresh,
  loading = false,
  terbuka = true,
  transitionsReady = true,
  onToggle,
}: PengaduanHeaderProps) {
  const todayLabel = React.useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  const todayShortLabel = React.useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(new Date());
  }, []);

  const totalTiket = React.useMemo(() => {
    if (!stat?.perStatus) return 0;
    return Object.values(stat.perStatus).reduce(
      (acc, val) => acc + (val ?? 0),
      0
    );
  }, [stat]);

  const totalSelesai = React.useMemo(() => {
    if (!stat?.perStatus) return 0;
    return (
      (stat.perStatus.SELESAI ?? 0) +
      (stat.perStatus.DITUTUP ?? 0)
    );
  }, [stat]);

  const belumDitugaskan = stat?.belumDitugaskan ?? 0;
  const melanggarSla = stat?.melanggarSla ?? 0;

  return (
    <div
      aria-hidden={!terbuka}
      className={cn(
        "@container/header relative group/header grid min-w-0 w-full grid-cols-[minmax(0,1fr)] shrink-0",
        transitionsReady
          ? "transition-[grid-template-rows,margin] duration-200 ease-out motion-reduce:transition-none"
          : "transition-none",
        terbuka ? "grid-rows-[1fr]" : "-mb-3 grid-rows-[0fr] pointer-events-none"
      )}
    >
      <div className={cn("min-h-0 min-w-0", !terbuka && "overflow-hidden")}>
        <div className="relative min-w-0 overflow-hidden rounded-lg border border-border bg-card/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:bg-card/40 dark:shadow-none">
          {/* 1. Ambient Lighting Highlights (Vercel Style) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/12 via-cyan-500/6 to-transparent blur-3xl dark:from-blue-500/18 dark:via-cyan-500/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-tr from-emerald-500/6 via-teal-500/6 to-transparent blur-3xl dark:from-emerald-500/12 dark:via-teal-500/6" />

          {/* 2. Micro-dot Grid Texture Overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10 flex flex-col">
            {/* Row 1 (Tinggi terkunci h-12 = 48px, sejajar 1:1 dengan Baris 1 Header Panel Kanan) */}
            <div className="flex h-12 items-center justify-between gap-2 border-b border-border px-3.5 @[680px]/header:px-4">
              {/* Heartbeat Status */}
              <div className="flex min-w-0 items-center gap-2">
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="hidden @[520px]/header:inline font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase shrink-0">
                  PDAM Tirtawening
                </span>
                <span className="hidden @[520px]/header:inline text-muted-foreground/30 shrink-0">
                  •
                </span>
                <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <span className="hidden @[520px]/header:inline-block size-1.5 rounded-full bg-emerald-500/80 shrink-0" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400 truncate">
                    Desk Layanan 24/7
                  </span>
                  <span className="hidden @[860px]/header:inline text-muted-foreground/40 shrink-0">
                    /
                  </span>
                  <span className="hidden @[860px]/header:inline text-muted-foreground/70 truncate">
                    Monitoring SLA &amp; Eskalasi Lapangan
                  </span>
                </div>
              </div>

              {/* Telemetry Controls: Otomatis memadat menjadi icon-only saat panel menyusut */}
              <div className="flex shrink-0 items-center gap-1.5 text-label-12">
                {/* 1. Peta GIS Pengaduan */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/peta-pengaduan"
                      target="_blank"
                      aria-label="Peta GIS Pengaduan"
                      className="inline-flex h-7 w-7 @[560px]/header:w-auto items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-0 @[560px]/header:px-2.5 font-sans text-label-12 font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Map className="size-3.5 shrink-0" />
                      <span className="hidden @[820px]/header:inline">
                        Peta GIS Pengaduan
                      </span>
                      <span className="hidden @[560px]/header:inline @[820px]/header:hidden">
                        Peta GIS
                      </span>
                      <ArrowUpRight className="hidden @[560px]/header:inline size-3 text-primary/70 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Buka Peta GIS Spasial Pengaduan
                  </TooltipContent>
                </Tooltip>

                {/* 2. Kebijakan SOP */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/pengaturan/pengaduan"
                      aria-label="Kebijakan SOP Pengaduan"
                      className="inline-flex h-7 w-7 @[720px]/header:w-auto items-center justify-center gap-1.5 rounded-md border border-border bg-background px-0 @[720px]/header:px-2.5 font-sans text-label-12 font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground"
                    >
                      <SlidersHorizontal className="size-3.5 shrink-0" />
                      <span className="hidden @[720px]/header:inline">
                        Kebijakan SOP
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Pengaturan Kebijakan &amp; SLA Pengaduan
                  </TooltipContent>
                </Tooltip>

                {/* 3. Portal Warga */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/pengaduan-air"
                      target="_blank"
                      aria-label="Portal Pengaduan Warga"
                      className="inline-flex h-7 w-7 @[660px]/header:w-auto items-center justify-center gap-1.5 rounded-md border border-border bg-background px-0 @[660px]/header:px-2.5 font-sans text-label-12 font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground"
                    >
                      <Globe className="size-3.5 shrink-0 @[660px]/header:hidden" />
                      <span className="hidden @[660px]/header:inline">
                        Portal Warga
                      </span>
                      <ArrowUpRight className="hidden @[660px]/header:inline size-3 text-muted-foreground shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Buka Portal Pelaporan Warga
                  </TooltipContent>
                </Tooltip>

                {/* 4. Tombol Segarkan */}
                {onRefresh && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Segarkan data pengaduan"
                        onClick={onRefresh}
                        disabled={loading}
                        className="h-7 w-7 @[900px]/header:w-auto gap-1.5 rounded-md border-border bg-background px-0 @[900px]/header:px-2.5 font-sans text-label-12 font-medium text-muted-foreground hover:text-foreground shadow-none cursor-pointer"
                      >
                        <RotateCw
                          className={cn(
                            "size-3.5 text-muted-foreground shrink-0",
                            loading && "animate-spin"
                          )}
                        />
                        <span className="hidden @[900px]/header:inline">
                          Segarkan
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Segarkan antrean &amp; statistik
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* 5. Tanggal Chip */}
                <div
                  title={`Tanggal hari ini: ${todayLabel}`}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2 @[640px]/header:px-2.5 font-mono text-label-12 text-muted-foreground"
                >
                  <Calendar className="size-3.5 text-muted-foreground/80 shrink-0" />
                  <span className="hidden @[640px]/header:inline tabular-nums font-medium text-foreground">
                    {todayLabel}
                  </span>
                  <span className="inline @[640px]/header:hidden tabular-nums font-medium text-foreground text-[11px]">
                    {todayShortLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2 (Tinggi terkunci h-[88px] pada desktop, sejajar 1:1 dengan Baris 2 Header Panel Kanan) */}
            <div className="flex flex-col @[680px]/header:flex-row @[680px]/header:h-[88px] @[680px]/header:items-center justify-between gap-2.5 @[820px]/header:gap-4 px-3.5 @[680px]/header:px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="blue-subtle" size="sm">
                    Pelayanan Pelanggan
                  </Badge>
                  <span className="hidden @[560px]/header:inline text-label-12 text-muted-foreground truncate">
                    Pusat Kendali Antrean
                  </span>
                </div>

                <h1 className="mt-1 text-heading-16 @[640px]/header:text-heading-20 font-semibold tracking-tight text-foreground flex items-center gap-2 min-w-0">
                  <LifeBuoy className="size-4.5 @[640px]/header:size-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Antrean Pengaduan Layanan</span>
                </h1>
                <p className="mt-0.5 text-copy-12 @[640px]/header:text-copy-13 text-muted-foreground truncate">
                  Kendali tiket keluhan warga, delegasi petugas, dan pantauan SLA.
                </p>
              </div>

              {/* Quick Visual KPI Pills */}
              <div className="flex flex-wrap items-center gap-1.5 @[820px]/header:gap-2 shrink-0">
                <Badge variant="gray-subtle" size="md" className="gap-1.5 font-normal">
                  <Ticket className="size-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold text-foreground font-mono tabular-nums">
                    {totalTiket > 0 ? totalTiket.toLocaleString("id-ID") : "0"}
                    <span className="hidden @[860px]/header:inline font-sans font-normal">
                      {" "}Tiket
                    </span>
                  </span>
                </Badge>

                <Badge variant="blue-subtle" size="md" className="gap-1.5 font-normal">
                  <Inbox className="size-3 text-(--ds-blue-700) shrink-0" />
                  <span className="hidden @[860px]/header:inline text-(--ds-blue-900)/80">
                    Antrean Baru:
                  </span>
                  <span className="inline @[860px]/header:hidden text-(--ds-blue-900)/80">
                    Baru:
                  </span>
                  <span className="font-semibold text-(--ds-blue-900) font-mono tabular-nums">
                    {belumDitugaskan.toLocaleString("id-ID")}
                  </span>
                </Badge>

                <Badge
                  variant={melanggarSla > 0 ? "red-subtle" : "gray-subtle"}
                  size="md"
                  className="gap-1.5 font-normal"
                >
                  <TimerOff
                    className={cn(
                      "size-3 shrink-0",
                      melanggarSla > 0 ? "text-(--ds-red-700)" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "hidden @[860px]/header:inline",
                      melanggarSla > 0 ? "text-(--ds-red-900)/80" : "text-muted-foreground"
                    )}
                  >
                    Lewat SLA:
                  </span>
                  <span
                    className={cn(
                      "inline @[860px]/header:hidden",
                      melanggarSla > 0 ? "text-(--ds-red-900)/80" : "text-muted-foreground"
                    )}
                  >
                    SLA:
                  </span>
                  <span
                    className={cn(
                      "font-semibold font-mono tabular-nums",
                      melanggarSla > 0 ? "text-(--ds-red-900)" : "text-foreground"
                    )}
                  >
                    {melanggarSla.toLocaleString("id-ID")}
                  </span>
                </Badge>

                <Badge variant="green-subtle" size="md" className="gap-1.5 font-normal">
                  <CheckCircle2 className="size-3 text-(--ds-green-700) shrink-0" />
                  <span className="text-(--ds-green-900)/80">Tuntas:</span>
                  <span className="font-semibold text-(--ds-green-900) font-mono tabular-nums">
                    {totalSelesai.toLocaleString("id-ID")}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Collapse Button Tersembunyi di Tengah Border Bawah Panel Judul (Bergaya Sidebar) */}
      {terbuka && onToggle && (
        <button
          type="button"
          aria-label="Sembunyikan panel judul"
          title="Sembunyikan panel judul"
          onClick={onToggle}
          className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 z-30",
            "size-6 rounded-full border border-border bg-card",
            "grid place-content-center cursor-pointer transition-opacity duration-150",
            "opacity-0 pointer-events-none group-hover/header:opacity-100 group-hover/header:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto shadow-xs",
            "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
          )}
        >
          <ChevronUp className="size-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
