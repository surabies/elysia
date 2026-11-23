"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/PanelDetailPengaduan.tsx
// Panel Kanan (Master-Detail Tiket Pengaduan):
// - Tinggi Header Panel Kanan disamakan presisi 1:1 dengan Panel Judul Kiri:
//   * Baris 1 (h-12 = 48px, border-b): Nomor Tiket (Klik Salin) + Badge Status Ringkas + Sisa SLA + Cetak & Halaman Penuh
//   * Baris 2 (h-[88px] = 88px): Info Pelapor/No. Pelanggan singkat + Segmented Tab Switcher (Tindakan & Info | Obrolan & Audit)
// - Konten Judul Lengkap, Jenis Keluhan, Prioritas, & Waktu Masuk dipindahkan ke kartu "Duduk Perkara" (InfoPerkara.tsx)
//   agar header panel kanan bebas sesak dan judul dapat dibaca utuh.

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  FileText,
  MessageSquare,
  Printer,
  TriangleAlert,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSisaWaktu } from "@/features/public/lib/format";
import {
  LABEL_STATUS_PENGADUAN_STAF_RINGKAS,
  statusPengaduanStaf,
} from "@/features/dashboard/lib/LabelPengaduan";
import { cn } from "@/lib/utils";
import { PanelKartu } from "@/features/dashboard/pengaduan/components/bersama/PanelKartu";
import {
  LinimasaStaf,
  PengalihModeRiwayat,
  type ModeTampilanRiwayat,
} from "@/features/dashboard/pengaduan/components/LinimasaStaf";
import { InfoPerkara } from "../detail-tiket/InfoPerkara";
import { MediaBukti } from "../detail-tiket/MediaBukti";
import { PanelTindakan } from "../detail-tiket/PanelTindakan";
import { PanelSelesai } from "../detail-tiket/PanelSelesai";
import { PanelChat } from "../detail-tiket/PanelObrolan";
import { PanelEskalasi } from "../detail-tiket/PanelEskalasi";
import { LembarCetak } from "../detail-tiket/cetak/LembarCetak";
import { useCetak } from "../../hooks/UseCetak";
import { useDetailTiket } from "../../hooks/UseRincianTiket";

import type {
  PengaduanDetail,
  PetugasRingkas,
} from "../../types/TipePengaduan";

const STATUS_AKHIR = ["SELESAI", "DITUTUP", "DITOLAK"];

export interface PanelDetailPengaduanProps {
  pengaduanId: string | null;
  initialDetail?: PengaduanDetail | null;
  initialPetugas?: PetugasRingkas[];
  onMutated?: () => void;
}

export function PanelDetailPengaduan({
  pengaduanId,
  initialDetail = null,
  initialPetugas = [],
  onMutated,
}: PanelDetailPengaduanProps) {
  const { detail, petugas, memuat, galat, mengirim, jalankan } =
    useDetailTiket(pengaduanId, onMutated, initialDetail, initialPetugas);
  const { mencetak, tanggalCetak, mulai: cetak } = useCetak();
  const [subTab, setSubTab] = React.useState<"tindakan" | "obrolan">("tindakan");
  const [modeRiwayat, setModeRiwayat] =
    React.useState<ModeTampilanRiwayat>("CHAT");
  const [disalin, setDisalin] = React.useState(false);

  const salinNomorTiket = React.useCallback(() => {
    if (!detail?.nomorTiket) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(detail.nomorTiket);
      setDisalin(true);
      toast.success(`Nomor tiket ${detail.nomorTiket} disalin`);
      setTimeout(() => setDisalin(false), 1800);
    }
  }, [detail?.nomorTiket]);

  if (!pengaduanId) {
    return (
      <div className="@container/detail flex h-full flex-col items-center justify-center gap-2.5 p-6 text-center overflow-hidden rounded-lg">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
          <FileText className="size-4.5" />
        </div>
        <p className="text-copy-13 font-medium text-foreground">
          Belum Ada Tiket Terpilih
        </p>
        <p className="max-w-xs text-copy-12 text-muted-foreground">
          Klik salah satu baris tiket di tabel kiri (atau gunakan tombol panah{" "}
          <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑</kbd>{" "}
          <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↓</kbd>)
          untuk menugaskan petugas, memeriksa bukti, atau membalas warga.
        </p>
      </div>
    );
  }

  if (memuat && !detail) {
    return (
      <div
        className="@container/detail flex flex-col overflow-hidden rounded-lg"
        aria-label="Memuat detail tiket"
      >
        <div className="h-12 border-b border-border px-3.5 flex items-center justify-between">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="h-[88px] border-b border-border px-3.5 py-2.5 flex flex-col justify-between">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
        <div className="p-3 space-y-3">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="@container/detail flex h-full flex-col items-center justify-center gap-3 p-6 text-center overflow-hidden rounded-lg">
        <TriangleAlert className="size-5 text-destructive" />
        <p className="text-copy-13 text-muted-foreground">
          {galat ?? "Detail tiket tidak ditemukan."}
        </p>
      </div>
    );
  }

  const status = statusPengaduanStaf(detail.status);
  const labelStatusRingkas =
    LABEL_STATUS_PENGADUAN_STAF_RINGKAS[detail.status] ?? status.label;
  const bisaSelesai = detail.transisiTersedia.includes("SELESAI");
  const terbuka = detail.status !== "DITUTUP";
  const aksi = { detail, mengirim, jalankan };

  const tampilSla =
    Boolean(detail.sla?.targetSelesaiAt) &&
    (!STATUS_AKHIR.includes(detail.status) || detail.sla.melanggar);
  const teksSla = detail.sla?.terjeda
    ? "SLA dijeda"
    : formatSisaWaktu(detail.sla?.sisaMenit ?? null);

  return (
    <div className="@container/detail flex h-full min-h-0 flex-col overflow-hidden rounded-lg">
      {/* =====================================================================
          1. HEADER PANEL DETAIL TIKET (Tinggi 136px = 48px + 88px, Sejajar 1:1 dengan Panel Judul Kiri)
          ===================================================================== */}
      <header className="shrink-0 bg-card/70 backdrop-blur-xl dark:bg-card/40">
        {/* Baris 1 (h-12 = 48px, garis separator bawah dengan gap kiri-kanan mx-3.5):
            Nomor Tiket + Status Ringkas + Sisa SLA + Tombol Cetak & Halaman Penuh */}
        <div className="mx-3.5 flex h-12 items-center justify-between gap-2 border-b border-border">
          <div className="flex min-w-0 items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={salinNomorTiket}
                  className="group/copy inline-flex h-7 items-center gap-1.5 font-mono text-xs font-bold px-2.5 rounded-md bg-muted/80 text-foreground border border-border/80 shadow-2xs hover:border-foreground/30 transition-colors cursor-pointer shrink-0"
                >
                  <span>{detail.nomorTiket}</span>
                  {disalin ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground/70 group-hover/copy:text-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Klik untuk menyalin nomor tiket
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn("h-6 text-[11px] truncate", status.badgeClass)}
                >
                  {labelStatusRingkas}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Status: {status.label}
              </TooltipContent>
            </Tooltip>

            {memuat && (
              <Spinner
                className="size-3.5 text-muted-foreground ml-0.5 shrink-0"
                aria-label="Menyegarkan detail tiket"
              />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {tampilSla && (
              <span
                className={cn(
                  "hidden @[370px]/detail:inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 font-mono text-[11px]",
                  detail.sla.melanggar
                    ? "border-destructive/30 bg-destructive/10 font-semibold text-destructive"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                <Clock className="size-3 shrink-0" />
                <span className="first-letter:uppercase">{teksSla}</span>
              </span>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={cetak}
                  disabled={mencetak}
                  aria-label="Cetak Lembar Kerja PDF"
                  className="size-7 rounded-md border-border bg-background text-muted-foreground hover:text-foreground shadow-none cursor-pointer"
                >
                  <Printer className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Cetak Lembar Kerja PDF
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  asChild
                  aria-label="Buka di Halaman Penuh"
                  className="size-7 rounded-md border-border bg-background text-muted-foreground hover:text-foreground shadow-none"
                >
                  <Link href={`/pengaduan/${detail.id}`}>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Buka di Halaman Penuh
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Baris 2 (h-[88px] = 88px, garis separator bawah dengan gap kiri-kanan mx-3.5):
            Identitas Ringkas Pelapor + Tab Switcher Lega */}
        <div className="mx-3.5 flex h-[88px] flex-col justify-between border-b border-border py-2.5">
          {/* Strip Identitas Pelapor & Petugas */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5 truncate">
              <User className="size-3.5 text-muted-foreground/80 shrink-0" />
              <span className="font-medium text-foreground truncate">
                {detail.pelapor}
              </span>
              {detail.nomorLangganan && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    NOLG {detail.nomorLangganan}
                  </span>
                </>
              )}
            </div>
            <span className="hidden @[380px]/detail:inline text-[11px] text-muted-foreground truncate shrink-0">
              {detail.ditugaskanKe?.name
                ? `Petugas: ${detail.ditugaskanKe.name}`
                : "Belum ditugaskan"}
            </span>
          </div>

          {/* Sub-Tab Switcher (Tindakan & Info vs Obrolan & Audit) */}
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setSubTab("tindakan")}
              className={cn(
                "inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all cursor-pointer truncate",
                subTab === "tindakan"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Wrench className="size-3.5 shrink-0" />
              <span className="truncate">Tindakan &amp; Info</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("obrolan")}
              className={cn(
                "inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all cursor-pointer truncate",
                subTab === "obrolan"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="truncate">Obrolan &amp; Audit</span>
              {detail.riwayat.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.2 font-mono text-[10px] shrink-0">
                  {detail.riwayat.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Body Scrollable Mandiri (Garis separator memiliki gap kiri-kanan px-3.5 dari tepi border panel) */}
      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 divide-y divide-border">
        {galat && (
          <div className="py-2.5">
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              {galat}
            </p>
          </div>
        )}

        {subTab === "tindakan" ? (
          <>
            <InfoPerkara detail={detail} />
            <PanelTindakan {...aksi} petugas={petugas} />
            {bisaSelesai && <PanelSelesai {...aksi} />}
            <MediaBukti detail={detail} />
            {terbuka && <PanelEskalasi {...aksi} petugas={petugas} />}
          </>
        ) : (
          <>
            {terbuka && <PanelChat {...aksi} />}
            <PanelKartu
              judul="Riwayat tindak lanjut"
              aksi={
                <PengalihModeRiwayat
                  mode={modeRiwayat}
                  onGantiMode={setModeRiwayat}
                />
              }
            >
              <LinimasaStaf
                riwayat={detail.riwayat}
                modeTampilan={modeRiwayat}
                onGantiMode={setModeRiwayat}
              />
            </PanelKartu>
          </>
        )}
      </div>

      {mencetak && <LembarCetak detail={detail} tanggalCetak={tanggalCetak} />}
    </div>
  );
}
