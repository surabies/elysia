import * as React from "react"
import {
  Droplets,
  Gauge,
  Receipt,
  Users as UsersIcon,
} from "lucide-react"
import type {
  DashboardMetricSummary,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service"
import { formatAngka, formatRupiah } from "../lib/format-ringkasan"
import type { MetricCardData } from "../types/MetricCardTypes"
import { MetricCard } from "./MetricCard"

interface KartuMetrikProps {
  periode: PeriodeInfo
  summary: DashboardMetricSummary
}

export function KartuMetrik({ periode, summary }: KartuMetrikProps) {
  // Hitung sebaran wilayah proporsional untuk Kartu 1
  const wil1 = Math.round(summary.totalPelanggan * 0.2714) // ~6.120
  const wil2 = Math.round(summary.totalPelanggan * 0.2605) // ~5.874
  const wil3 = Math.round(summary.totalPelanggan * 0.2396) // ~5.402
  const wil4 = Math.max(summary.totalPelanggan - wil1 - wil2 - wil3, 0) // ~5.153

  // Hitung status pembacaan untuk Kartu 2
  const belumTerbaca = Math.max(summary.totalPelanggan - summary.totalCater, 0)

  const cards: MetricCardData[] = [
    // Kartu 1: Total Pelanggan Aktif (Varian A: 4 Tingkat Ungu Komposisi Wilayah)
    {
      id: "total-pelanggan",
      title: "Total Pelanggan Aktif",
      icon: UsersIcon,
      rightLabel: "Saat ini",
      value: formatAngka(summary.totalPelanggan),
      delta: {
        text: "0.8%",
        direction: "up",
        tone: "positive",
      },
      helperText: "Sambungan Langganan (SL) terdaftar",
      visual: {
        type: "segments",
        items: [
          { id: "w1", label: "Wilayah 1", value: wil1, color: "#8b5cf6" },
          { id: "w2", label: "Wilayah 2", value: wil2, color: "#a78bfa" },
          { id: "w3", label: "Wilayah 3", value: wil3, color: "#c4b5fd" },
          { id: "w4", label: "Wilayah 4", value: wil4, color: "#ddd6fe" },
        ],
      },
      footer: {
        label: "Buka Data Pelanggan",
        href: "/pelanggan",
      },
    },

    // Kartu 2: Capaian Catat Meter (Varian A: Status Pembacaan)
    {
      id: "capaian-cater",
      title: "Capaian Catat Meter",
      icon: Gauge,
      rightLabel: "Saat ini",
      value: formatAngka(summary.totalCater),
      denominator: `/${formatAngka(summary.totalPelanggan)}`,
      delta: {
        text: "0.2%",
        direction: "up",
        tone: "positive",
      },
      helperText: `Progres ${summary.persenSelesai}% terbaca`,
      visual: {
        type: "segments",
        items: [
          {
            id: "normal",
            label: "Stand Normal",
            value: summary.totalNormal,
            color: "#12b76a",
          },
          {
            id: "anomali",
            label: "Anomali / Kendala",
            value: summary.totalAnomali,
            color: "#e5202e",
          },
          {
            id: "belum",
            label: "Belum Terbaca",
            value: belumTerbaca,
            color: "#c9cdd2",
          },
        ],
      },
      footer: {
        label: "Monitor Catat Meter",
        href: "/cater",
      },
    },

    // Kartu 3: Volume Air Terdistribusi (Varian B: Sparkline Area Monotone 14 Hari)
    {
      id: "volume-air",
      title: "Volume Air Terdistribusi",
      icon: Droplets,
      rightLabel: "14 hari",
      value: formatAngka(summary.totalKubikasiM3),
      unit: "m³",
      delta: {
        text: "3.5%",
        direction: "up",
        tone: "positive",
      },
      helperText: "Total pemakaian air terbaca",
      visual: {
        type: "sparkline",
        data: [
          24.1, 25.3, 26.4, 26.0, 24.2, 23.1, 23.4, 25.0, 25.4, 24.6, 24.9, 25.2,
          25.3, 25.3,
        ],
        color: "#12b76a",
      },
      footer: {
        label: "Produktivitas Cater",
        href: "/progres/cater",
      },
    },

    // Kartu 4: Rekening Tagihan (DRD) (Varian C: 14 Pil Harian)
    {
      id: "rekening-drd",
      title: "Rekening Tagihan (DRD)",
      icon: Receipt,
      rightLabel: "14 hari",
      value: formatRupiah(summary.totalRupiahDrd),
      delta: {
        text: "2.1%",
        direction: "up",
        tone: "positive",
      },
      helperText: `Nilai tagihan periode ${periode.label}`,
      visual: {
        type: "pills",
        values: [0, 1, 0, 0, 2, 1, 0, 1, 0, 3, 2, 0, 2, 7],
        tone: "neutral",
      },
      footer: {
        label: "Lihat Rekap DRD",
        href: "/laporan/lap-drd",
      },
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MetricCard key={card.id} data={card} />
      ))}
    </div>
  )
}
