import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Droplets,
  Gauge,
  Receipt,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react"
import type {
  DashboardMetricSummary,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service"
import { formatAngka, formatRupiah } from "../lib/format-ringkasan"

interface KartuMetrikProps {
  periode: PeriodeInfo
  summary: DashboardMetricSummary
}

type DotTone = "neutral" | "positive" | "warning" | "danger"

interface LedgerRow {
  label: string
  value: string
  tone?: DotTone
}

interface ProgressTickSegment {
  ratio: number
  colorClass: string
}

interface LedgerMetricCard {
  id: string
  title: string
  icon: LucideIcon
  href: string
  primaryValue: string
  unit?: string
  secondaryNote?: string
  progressLabel: string
  progressSegments: ProgressTickSegment[]
  rows: [LedgerRow, LedgerRow, LedgerRow]
}

const TOTAL_PROGRESS_TICKS = 28

function VerticalProgressTicks({
  segments,
  ariaLabel,
}: {
  segments: ProgressTickSegment[]
  ariaLabel: string
}) {
  const tickColors: string[] = []

  for (const seg of segments) {
    const clamped = Math.max(0, Math.min(1, seg.ratio))
    let count = Math.round(clamped * TOTAL_PROGRESS_TICKS)
    // Jika rasio > 0 tapi sangat kecil, tetap tampilkan minimal 1 strip agar status terlihat
    if (clamped > 0 && count === 0) count = 1
    for (let i = 0; i < count && tickColors.length < TOTAL_PROGRESS_TICKS; i++) {
      tickColors.push(seg.colorClass)
    }
  }

  while (tickColors.length < TOTAL_PROGRESS_TICKS) {
    tickColors.push("bg-border/90 dark:bg-muted/70")
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="my-3 flex h-2.5 w-full items-center gap-[3px]"
    >
      {tickColors.map((colorClass, idx) => (
        <span
          key={idx}
          className={`h-full flex-1 rounded-[1.5px] transition-colors ${colorClass}`}
        />
      ))}
    </div>
  )
}

const DOT_TONE_CLASS: Record<DotTone, string> = {
  neutral: "bg-muted-foreground/45",
  positive: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
}

const VALUE_TONE_CLASS: Record<DotTone, string> = {
  neutral: "text-foreground",
  positive: "text-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
}

function formatDesimal(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function KartuMetrik({ periode, summary }: KartuMetrikProps) {
  const belumTerbaca = Math.max(summary.totalPelanggan - summary.totalCater, 0)
  const rataPelangganPerRute =
    summary.totalRute > 0
      ? Math.round(summary.totalPelanggan / summary.totalRute)
      : 0
  const rataKubikasiPerSl =
    summary.totalCater > 0 ? summary.totalKubikasiM3 / summary.totalCater : 0
  const rataTagihanPerSl =
    summary.totalCater > 0
      ? Math.round(summary.totalRupiahDrd / summary.totalCater)
      : 0
  const tarifEfektifPerM3 =
    summary.totalKubikasiM3 > 0
      ? Math.round(summary.totalRupiahDrd / summary.totalKubikasiM3)
      : 0

  const rasioTerbaca =
    summary.totalPelanggan > 0
      ? Math.min(1, summary.totalCater / summary.totalPelanggan)
      : 0
  const rasioNormal =
    summary.totalPelanggan > 0
      ? Math.min(1, summary.totalNormal / summary.totalPelanggan)
      : 0
  const rasioAnomali =
    summary.totalPelanggan > 0
      ? Math.min(1, summary.totalAnomali / summary.totalPelanggan)
      : 0
  const rasioDrd =
    summary.totalRupiahDrd > 0 ? Math.max(rasioTerbaca, 0.05) : 0

  const cards: LedgerMetricCard[] = [
    {
      id: "total-pelanggan",
      title: "Pelanggan Aktif",
      icon: UsersIcon,
      href: "/pelanggan",
      primaryValue: formatAngka(summary.totalPelanggan),
      unit: "SL",
      progressLabel: `Cakupan pembacaan pelanggan ${formatDesimal(rasioTerbaca * 100)}%`,
      progressSegments: [
        {
          ratio: rasioTerbaca,
          colorClass: "bg-foreground/75 dark:bg-foreground/80",
        },
      ],
      rows: [
        {
          label: "Rute Pembacaan",
          value: `${formatAngka(summary.totalRute)} rute`,
        },
        {
          label: "Petugas Aktif",
          value: `${formatAngka(summary.totalPetugas)} orang`,
        },
        {
          label: "Rata-rata / Rute",
          value: `${formatAngka(rataPelangganPerRute)} SL`,
        },
      ],
    },
    {
      id: "capaian-cater",
      title: "Capaian Catat Meter",
      icon: Gauge,
      href: "/cater",
      primaryValue: `${formatDesimal(summary.persenSelesai)}%`,
      secondaryNote: `${formatAngka(summary.totalCater)} / ${formatAngka(summary.totalPelanggan)}`,
      progressLabel: `Progres normal ${formatDesimal(rasioNormal * 100)}%, anomali ${formatDesimal(rasioAnomali * 100)}%`,
      progressSegments: [
        { ratio: rasioNormal, colorClass: "bg-emerald-500" },
        { ratio: rasioAnomali, colorClass: "bg-rose-500" },
      ],
      rows: [
        {
          label: "Stand Normal",
          value: formatAngka(summary.totalNormal),
          tone: "positive",
        },
        {
          label: "Anomali / Kendala",
          value: formatAngka(summary.totalAnomali),
          tone: summary.totalAnomali > 0 ? "danger" : "neutral",
        },
        {
          label: "Belum Terbaca",
          value: formatAngka(belumTerbaca),
          tone: "neutral",
        },
      ],
    },
    {
      id: "volume-air",
      title: "Volume Air Terbaca",
      icon: Droplets,
      href: "/progres/cater",
      primaryValue: formatAngka(summary.totalKubikasiM3),
      unit: "m³",
      progressLabel: `Cakupan volume terbaca ${formatDesimal(rasioTerbaca * 100)}%`,
      progressSegments: [
        { ratio: rasioTerbaca, colorClass: "bg-sky-500" },
      ],
      rows: [
        {
          label: "Rata-rata / SL",
          value: `${formatDesimal(rataKubikasiPerSl)} m³`,
        },
        {
          label: "Sambungan Terbaca",
          value: `${formatAngka(summary.totalCater)} SL`,
        },
        {
          label: "Lapor Mandiri",
          value:
            summary.totalMandiriMenunggu > 0
              ? `${formatAngka(summary.totalMandiriMenunggu)} menunggu`
              : `${formatAngka(summary.totalMandiriPeriode)} laporan`,
          tone:
            summary.totalMandiriMenunggu > 0
              ? "warning"
              : summary.totalMandiriPeriode > 0
                ? "positive"
                : "neutral",
        },
      ],
    },
    {
      id: "rekening-drd",
      title: "Rekening Tagihan (DRD)",
      icon: Receipt,
      href: "/laporan/lap-drd",
      primaryValue: formatRupiah(summary.totalRupiahDrd),
      progressLabel: `Realisasi penagihan periode ${periode.label}`,
      progressSegments: [
        { ratio: rasioDrd, colorClass: "bg-emerald-500/85" },
      ],
      rows: [
        {
          label: "Periode Aktif",
          value: periode.label,
        },
        {
          label: "Rata-rata / SL",
          value: formatRupiah(rataTagihanPerSl),
        },
        {
          label: "Tarif Efektif",
          value: `${formatRupiah(tarifEfektifPerM3)}/m³`,
        },
      ],
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.id}
            href={card.href}
            className="group flex flex-col justify-between rounded-lg border border-border/80 bg-card p-4 transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* 1. Header: Ikon + Judul + Panah Navigasi */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0 text-muted-foreground stroke-[1.5] transition-colors group-hover:text-foreground" />
                <h3 className="truncate text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {card.title}
                </h3>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/70 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </div>

            {/* 2. Nilai Utama */}
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span
                  title={card.primaryValue}
                  className="truncate text-[24px] font-semibold tracking-tight text-foreground tabular-nums leading-none"
                >
                  {card.primaryValue}
                </span>
                {card.unit ? (
                  <span className="shrink-0 text-[13px] font-normal text-muted-foreground">
                    {card.unit}
                  </span>
                ) : null}
              </div>
              {card.secondaryNote ? (
                <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground tabular-nums">
                  {card.secondaryNote}
                </span>
              ) : null}
            </div>

            {/* 3. Indikator Progres Vertikal (||||||) + Tabel Ringkas Key-Value */}
            <VerticalProgressTicks
              segments={card.progressSegments}
              ariaLabel={card.progressLabel}
            />
            <div>
              <dl className="space-y-1.5">
                {card.rows.map((row) => {
                  const tone = row.tone ?? "neutral"
                  return (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-2 text-[12.5px] leading-5"
                    >
                      <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${DOT_TONE_CLASS[tone]}`}
                        />
                        <span className="truncate">{row.label}</span>
                      </dt>
                      <dd
                        className={`shrink-0 font-medium tabular-nums ${VALUE_TONE_CLASS[tone]}`}
                      >
                        {row.value}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
