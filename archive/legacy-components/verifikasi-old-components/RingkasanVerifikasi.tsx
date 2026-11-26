"use client";

// features/dashboard/verifikasi/components/RingkasanVerifikasi.tsx — strip 4
// kartu statistik yang BISA DILIPAT, ringkasan sebaris untuk keadaan terlipat,
// dan dropdown periode. Dipakai halaman petugas DAN pelanggan.
//
// WARNA mengikuti arti yang sama dengan tabel (WarnaTahap.ts): amber =
// menunggu, hijau = selesai, biru = progres, abu = total.
import {
  CheckmarkCircle02Icon,
  HourglassIcon,
  PercentCircleIcon,
  Task01Icon,
} from "@/features/dashboard/shared/icons/ikon-lucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/native-select";
import { formatPeriode } from "@/features/public";
import type { StatsVerifikasi } from "../types";

export function PilihPeriode({
  periodes,
  nilai,
  onGanti,
}: {
  periodes: number[];
  nilai: number | null;
  onGanti: (p: number | null) => void;
}) {
  return (
    <NativeSelect
      aria-label="Filter periode"
      size="sm"
      value={nilai ?? ""}
      onChange={(e) =>
        onGanti(e.currentTarget.value ? Number(e.currentTarget.value) : null)
      }
      className="w-auto min-w-36"
    >
      <option value="">Semua periode</option>
      {periodes.map((p) => (
        <option key={p} value={p}>
          {formatPeriode(p)}
        </option>
      ))}
    </NativeSelect>
  );
}

/// Angka turunan dihitung SATU kali di sini, dipakai kartu dan ringkasan sebaris
/// — dua tampilan tidak boleh menghitung "progres" dengan cara berbeda.
function hitung(stats: StatsVerifikasi | null) {
  const total = stats?.total ?? 0;
  const menunggu = stats?.menunggu ?? 0;
  const ditolak = stats?.ditolak ?? 0;
  const diverifikasi = stats?.diverifikasi ?? 0;
  const selesai = diverifikasi + ditolak;
  const progres = total > 0 ? Math.round((selesai / total) * 100) : 0;
  return { total, menunggu, ditolak, diverifikasi, selesai, progres };
}

const id = (n: number) => n.toLocaleString("id-ID");

/// Strip kartu KPI bergaya Vercel Geist (@container/kpi & @container/card) persis halaman Pengaduan.
export function RingkasanVerifikasi({
  stats,
  periode,
  terbuka = true,
  onToggle,
}: {
  stats: StatsVerifikasi | null;
  periode: number | null;
  terbuka?: boolean;
  onToggle?: () => void;
}) {
  const h = hitung(stats);
  const labelPeriode = periode ? formatPeriode(periode) : "Semua periode";

  return (
    <div
      aria-hidden={!terbuka}
      className={cn(
        "@container/kpi relative group/kpi grid min-w-0 w-full grid-cols-[minmax(0,1fr)] shrink-0",
        "transition-[grid-template-rows,margin] duration-200 ease-out motion-reduce:transition-none",
        terbuka ? "grid-rows-[1fr]" : "-mb-3 grid-rows-[0fr] pointer-events-none"
      )}
    >
      <div className={cn("min-h-0 min-w-0", !terbuka && "overflow-hidden")}>
        <section
          aria-label="Indikator Ringkasan Verifikasi"
          className="grid min-w-0 grid-cols-2 gap-2.5 @[620px]/kpi:grid-cols-4 @[800px]/kpi:gap-3"
        >
          {/* 1. Total Laporan (Blue Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-blue-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-label-12 font-medium text-(--ds-blue-900) truncate">
                Total Laporan
              </span>
              <HugeiconsIcon
                icon={Task01Icon}
                strokeWidth={2}
                className="size-3.5 @[200px]/card:size-4 text-(--ds-blue-700) shrink-0"
                aria-hidden
              />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-blue-900) font-mono font-bold tabular-nums truncate">
              {id(h.total)}
              <span className="text-label-12 font-normal text-(--ds-blue-900)/70 ml-1.5 font-sans">
                laporan
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-blue-900)/80 truncate">
              {labelPeriode}
            </p>
          </div>

          {/* 2. Menunggu Verifikasi (Amber Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-amber-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-label-12 font-medium text-(--ds-amber-900) truncate">
                Menunggu
              </span>
              <HugeiconsIcon
                icon={HourglassIcon}
                strokeWidth={2}
                className="size-3.5 @[200px]/card:size-4 text-(--ds-amber-700) shrink-0"
                aria-hidden
              />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-amber-900) font-mono font-bold tabular-nums truncate">
              {id(h.menunggu)}
              <span className="text-label-12 font-normal text-(--ds-amber-900)/70 ml-1.5 font-sans">
                antrean
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-amber-900)/80 truncate">
              Belum diverifikasi petugas
            </p>
          </div>

          {/* 3. Terverifikasi (Green Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-green-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-label-12 font-medium text-(--ds-green-900) truncate">
                Terverifikasi
              </span>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-3.5 @[200px]/card:size-4 text-(--ds-green-700) shrink-0"
                aria-hidden
              />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-green-900) font-mono font-bold tabular-nums truncate">
              {id(h.diverifikasi)}
              <span className="text-label-12 font-normal text-(--ds-green-900)/70 ml-1.5 font-sans">
                laporan
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-green-900)/80 truncate">
              {h.ditolak > 0 ? `${id(h.ditolak)} perlu cek ulang` : "Selesai ditinjau"}
            </p>
          </div>

          {/* 4. Progres Selesai (Purple Subtle Theme) */}
          <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-purple-100) transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-label-12 font-medium text-(--ds-purple-900) truncate">
                Progres Selesai
              </span>
              <HugeiconsIcon
                icon={PercentCircleIcon}
                strokeWidth={2}
                className="size-3.5 @[200px]/card:size-4 text-(--ds-purple-700) shrink-0"
                aria-hidden
              />
            </div>
            <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-purple-900) font-mono font-bold tabular-nums truncate">
              {h.progres}%
              <span className="text-label-12 font-normal text-(--ds-purple-900)/70 ml-1.5 font-sans">
                selesai
              </span>
            </div>
            <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-purple-900)/80 truncate">
              {id(h.selesai)} dari {id(h.total)} laporan
            </p>
          </div>
        </section>
      </div>

      {/* Floating Collapse Button di Pojok Kanan Bawah Kartu KPI */}
      {terbuka && onToggle && (
        <button
          type="button"
          aria-label="Sembunyikan kartu ringkasan"
          title="Sembunyikan kartu ringkasan"
          onClick={onToggle}
          className={cn(
            "absolute -bottom-3 right-4 z-30",
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

/// Versi sebaris saat kartu terlipat — angkanya tidak boleh ikut hilang.
export function RingkasanSebaris({ stats }: { stats: StatsVerifikasi | null }) {
  const h = hitung(stats);
  return (
    <p className="hidden items-center gap-2 text-label-12 text-muted-foreground tabular-nums 2xl:flex">
      <span>
        Total{" "}
        <strong className="font-mono font-semibold text-(--ds-blue-900)">
          {id(h.total)}
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        Menunggu{" "}
        <strong
          className={cn(
            "font-mono font-semibold",
            h.menunggu > 0 ? "text-(--ds-amber-900)" : "text-foreground",
          )}
        >
          {id(h.menunggu)}
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        Terverifikasi{" "}
        <strong className="font-mono font-semibold text-(--ds-green-900)">
          {id(h.diverifikasi)}
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        <strong className="font-mono font-semibold text-(--ds-purple-900)">
          {h.progres}%
        </strong>{" "}
        selesai
      </span>
    </p>
  );
}
