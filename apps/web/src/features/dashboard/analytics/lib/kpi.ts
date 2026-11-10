import { Activity, Droplets, Flame, Gauge, type LucideIcon } from "lucide-react";
import { formatNumber } from "./format";
import type { AnalyticsPageData } from "../types";

export interface Kpi {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  unit: string;
  note: string;
}

export function buildKpis(data: AnalyticsPageData): Kpi[] {
  const avgVolumePerSl = data.totalKubikasi / Math.max(data.totalPelanggan, 1);

  return [
    {
      id: "invocations",
      label: "Total Pembacaan Meter",
      icon: Activity,
      value: formatNumber(data.totalBaca),
      unit: "SL",
      note: `Dari ${formatNumber(data.totalPelanggan)} pelanggan terdaftar`,
    },
    {
      id: "volume",
      label: "Kubikasi Air Terdistribusi",
      icon: Droplets,
      value: formatNumber(data.totalKubikasi),
      unit: "m³",
      note: `Rata-rata ${avgVolumePerSl.toFixed(1)} m³ / SL`,
    },
    {
      id: "daily-rate",
      label: "Rata-rata Laju Harian",
      icon: Gauge,
      value: formatNumber(data.rataRataHarian),
      unit: "SL / hari",
      note: `Konsistensi ${data.dailyTrends.length} hari siklus catat`,
    },
    {
      id: "peak",
      label: "Puncak Aktivitas Harian",
      icon: Flame,
      value: formatNumber(data.puncakHarian.total),
      unit: "SL",
      note: `Tercapai pada ${data.puncakHarian.hari}`,
    },
  ];
}
