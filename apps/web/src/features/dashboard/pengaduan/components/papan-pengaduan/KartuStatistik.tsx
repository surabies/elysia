// features/dashboard/pengaduan/components/papan-pengaduan/KartuStatistik.tsx
// — 4 Kartu KPI Ringkas & Elegan bergaya /progres/ekstrim dengan CSS Container Queries (@container/kpi & @container/card):
// - Murni indikator visual (tanpa aksi filter klik; seluruh fungsi filter terpusat di Navbar).
// - Saat kartu menyusut: judul & sub-unit otomatis diringkas agar angka tidak pernah terpotong atau bertabrakan.
"use client";

import * as React from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Inbox,
  Star,
  TimerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatistikPengaduan } from "@/features/dashboard/pengaduan/types/TipePengaduan";

const numberFormat = new Intl.NumberFormat("id-ID");

export function KartuStatistik({
  stat,
  terbuka = true,
  transitionsReady = true,
  onToggle,
  headerTerbuka = true,
  onToggleHeader,
}: {
  stat: StatistikPengaduan | null;
  terbuka?: boolean;
  transitionsReady?: boolean;
  onToggle?: () => void;
  headerTerbuka?: boolean;
  onToggleHeader?: () => void;
}) {
  const perStatus = stat?.perStatus ?? {};
  const perPrioritas = stat?.perPrioritasTerbuka ?? {};

  const totalSelesai = (perStatus.SELESAI ?? 0) + (perStatus.DITUTUP ?? 0);
  const belumDitugaskan = stat?.belumDitugaskan ?? 0;
  const melanggarSla = stat?.melanggarSla ?? 0;

  const daruratCount = perPrioritas.DARURAT ?? 0;
  const tinggiCount = perPrioritas.TINGGI ?? 0;
  const daruratTinggi = daruratCount + tinggiCount;

  const rataRating = stat?.rataRating ?? null;
  const jumlahDinilai = stat?.jumlahDinilai ?? 0;

  return (
    <div
      aria-hidden={!terbuka}
      className={cn(
        "@container/kpi relative group/kpi grid min-w-0 w-full grid-cols-[minmax(0,1fr)] shrink-0",
        transitionsReady
          ? "transition-[grid-template-rows,margin] duration-200 ease-out motion-reduce:transition-none"
          : "transition-none",
        terbuka ? "grid-rows-[1fr]" : "-mb-3 grid-rows-[0fr] pointer-events-none"
      )}
    >
      {/* Floating Expand Button untuk menampilkan kembali Panel Judul saat Panel Judul sedang tersembunyi */}
      {terbuka && !headerTerbuka && onToggleHeader && (
        <button
          type="button"
          aria-label="Tampilkan panel judul"
          title="Tampilkan panel judul"
          onClick={onToggleHeader}
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 z-30",
            "size-6 rounded-full border border-border bg-card",
            "grid place-content-center cursor-pointer transition-opacity duration-150",
            "opacity-0 pointer-events-none group-hover/kpi:opacity-100 group-hover/kpi:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto shadow-xs",
            "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
          )}
        >
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      )}

      <div className={cn("min-h-0 min-w-0", !terbuka && "overflow-hidden")}>
        <section
          aria-label="Indikator Kinerja Antrean Pengaduan"
          className="grid min-w-0 grid-cols-2 gap-2.5 @[620px]/kpi:grid-cols-4 @[800px]/kpi:gap-3"
        >
          {/* 1. Belum Ditugaskan (Blue Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-blue-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hidden @[170px]/card:inline text-label-12 font-medium text-(--ds-blue-900) truncate">
                Belum Ditugaskan
              </span>
              <span className="inline @[170px]/card:hidden text-label-12 font-medium text-(--ds-blue-900) truncate">
                Belum Tugas
              </span>
              <Inbox className="size-3.5 @[200px]/card:size-4 text-(--ds-blue-700) shrink-0" />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-blue-900) font-mono font-bold tabular-nums truncate">
              {numberFormat.format(belumDitugaskan)}
              <span className="text-label-12 font-normal text-(--ds-blue-900)/70 ml-1.5 font-sans">
                tiket
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-blue-900)/80 truncate">
              <span className="hidden @[210px]/card:inline">
                Menunggu delegasi petugas lapangan
              </span>
              <span className="inline @[210px]/card:hidden">
                Menunggu delegasi petugas
              </span>
            </p>
          </div>

          {/* 2. Lewat Tenggat SLA (Red Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-red-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hidden @[170px]/card:inline text-label-12 font-medium text-(--ds-red-900) truncate">
                Lewat Tenggat SLA
              </span>
              <span className="inline @[170px]/card:hidden text-label-12 font-medium text-(--ds-red-900) truncate">
                Lewat SLA
              </span>
              <TimerOff className="size-3.5 @[200px]/card:size-4 text-(--ds-red-700) shrink-0" />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-red-900) font-mono font-bold tabular-nums truncate">
              {numberFormat.format(melanggarSla)}
              <span className="text-label-12 font-normal text-(--ds-red-900)/70 ml-1.5 font-sans">
                terlambat
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-red-900)/80 truncate">
              <span className="hidden @[210px]/card:inline">
                Melewati target waktu penyelesaian SOP
              </span>
              <span className="inline @[210px]/card:hidden">
                Melewati target SOP
              </span>
            </p>
          </div>

          {/* 3. Darurat & Tinggi Terbuka (Amber Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-amber-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hidden @[195px]/card:inline text-label-12 font-medium text-(--ds-amber-900) truncate">
                Darurat &amp; Tinggi (Terbuka)
              </span>
              <span className="inline @[195px]/card:hidden text-label-12 font-medium text-(--ds-amber-900) truncate">
                Darurat &amp; Tinggi
              </span>
              <AlertTriangle className="size-3.5 @[200px]/card:size-4 text-(--ds-amber-700) shrink-0" />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-amber-900) font-mono font-bold tabular-nums truncate">
              {numberFormat.format(daruratTinggi)}
              <span className="text-label-12 font-normal text-(--ds-amber-900)/70 ml-1.5 font-sans">
                kasus
                <span className="hidden @[185px]/card:inline">
                  {" "}({daruratCount} darurat)
                </span>
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-amber-900)/80 truncate">
              <span className="hidden @[210px]/card:inline">
                Prioritas kritis membutuhkan respon cepat
              </span>
              <span className="inline @[210px]/card:hidden">
                Prioritas kritis terbuka
              </span>
            </p>
          </div>

          {/* 4. Rata-rata Kepuasan & Tuntas (Green Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-green-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hidden @[190px]/card:inline text-label-12 font-medium text-(--ds-green-900) truncate">
                Rata-rata Kepuasan Warga
              </span>
              <span className="inline @[190px]/card:hidden text-label-12 font-medium text-(--ds-green-900) truncate">
                Kepuasan Warga
              </span>
              <Star className="size-3.5 @[200px]/card:size-4 text-(--ds-green-700) shrink-0" />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-green-900) font-mono font-bold tabular-nums truncate">
              {rataRating !== null ? rataRating.toFixed(1) : "—"}
              <span className="text-label-12 font-normal text-(--ds-green-900)/70 ml-1.5 font-sans">
                {rataRating !== null ? (
                  <>
                    /5
                    <span className="hidden @[185px]/card:inline">
                      {" "}· {numberFormat.format(jumlahDinilai)} ulasan
                    </span>
                  </>
                ) : (
                  <>
                    {numberFormat.format(totalSelesai)}
                    <span className="hidden @[180px]/card:inline"> tiket</span> tuntas
                  </>
                )}
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-green-900)/80 truncate">
              {numberFormat.format(totalSelesai)} pengaduan{" "}
              <span className="hidden @[210px]/card:inline">telah </span>diselesaikan
            </p>
          </div>
        </section>
      </div>

      {/* Floating Collapse Button Tersembunyi di Tengah Border Bawah Kartu KPI (Bergaya Sidebar) */}
      {terbuka && onToggle && (
        <button
          type="button"
          aria-label="Sembunyikan kartu KPI"
          title="Sembunyikan kartu KPI"
          onClick={onToggle}
          className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 z-30",
            "size-6 rounded-full border border-border bg-card",
            "grid place-content-center cursor-pointer transition-opacity duration-150",
            "opacity-0 pointer-events-none group-hover/kpi:opacity-100 group-hover/kpi:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto shadow-xs",
            "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
          )}
        >
          <ChevronUp className="size-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/** Ringkasan sebaris yang ditampilkan di toolbar navbar saat Kartu KPI dilipat */
export function RingkasanPengaduanSebaris({
  stat,
}: {
  stat: StatistikPengaduan | null;
}) {
  if (!stat) return null;
  const daruratTinggi =
    (stat.perPrioritasTerbuka.DARURAT ?? 0) +
    (stat.perPrioritasTerbuka.TINGGI ?? 0);

  return (
    <p className="hidden items-center gap-2 text-label-12 text-muted-foreground tabular-nums 2xl:flex">
      <span>
        Baru{" "}
        <strong className="font-mono font-semibold text-(--ds-blue-900)">
          {stat.belumDitugaskan.toLocaleString("id-ID")}
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        Lewat SLA{" "}
        <strong
          className={cn(
            "font-mono font-semibold",
            stat.melanggarSla > 0 ? "text-(--ds-red-900)" : "text-foreground"
          )}
        >
          {stat.melanggarSla.toLocaleString("id-ID")}
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        Darurat{" "}
        <strong
          className={cn(
            "font-mono font-semibold",
            daruratTinggi > 0 ? "text-(--ds-amber-900)" : "text-foreground"
          )}
        >
          {daruratTinggi.toLocaleString("id-ID")}
        </strong>
      </span>
    </p>
  );
}
