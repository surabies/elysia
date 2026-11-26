import {
  Activity,
  AlertTriangle,
  Droplets,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import type { MetricCardData } from "@/features/dashboard/overview";
import { formatNumber } from "./format";
import type { AnalyticsPageData } from "../types";

/**
 * Legacy KPI interface for backward compatibility
 */
export interface Kpi {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  unit: string;
  note: string;
}

/**
 * Membangun 4 Kartu Metrik Analitik berdensitas tinggi dengan pola Vercel Geist:
 * 1. Keterbacaan Meter (Varian Segments: Normal vs Anomali vs Belum Terbaca)
 * 2. Kubikasi Air Terdistribusi (Varian Sparkline: Area kurva halus tren harian)
 * 3. Ritme Laju Harian (Varian Pills: 14 pil intensitas pembacaan harian)
 * 4. Temuan & Anomali Lapangan (Varian Pills dengan problem tone)
 */
export function buildAnalyticsMetricCards(data: AnalyticsPageData): MetricCardData[] {
  const totalTarget = Math.max(data.totalPelanggan || 0, 1);
  const totalBaca = data.totalBaca || 0;
  const belumTerbaca = Math.max(data.totalPelanggan - totalBaca, 0);

  // Agregasi anomali dari time-series harian atau daftar anomali (kecualikan Normal '01' & Stand Konsumen 'Z')
  const totalAnomaliTrends = (data.dailyTrends || []).reduce(
    (sum, d) => sum + (d.anomali || 0),
    0
  );
  const totalAnomaliList = (data.anomalies || [])
    .filter((a) => a.kode !== "NORMAL" && !a.kode.startsWith("WARN_"))
    .reduce((sum, a) => sum + (a.jumlah || 0), 0);
  const totalAnomali =
    (data.dailyTrends || []).length > 0 ? totalAnomaliTrends : totalAnomaliList;
  const totalNormal = Math.max(totalBaca - totalAnomali, 0);

  const persentaseBaca = ((totalBaca / totalTarget) * 100).toFixed(1);
  const avgVolumePerSl = data.totalKubikasi / Math.max(totalBaca || data.totalPelanggan, 1);
  const persentaseAnomali =
    totalBaca > 0 ? ((totalAnomali / totalBaca) * 100).toFixed(1) : "0.0";

  // Data tren harian lengkap (mengikuti seluruh tanggal transaksi aktual pada periode ini tanpa dipotong)
  const trendDays = data.dailyTrends && data.dailyTrends.length > 0 ? data.dailyTrends : [];
  const trendLabels = trendDays.map((d) => d.label || `Tgl ${parseInt(d.hari, 10)}`);

  const sparklineKubikasi = trendDays.map((d) => d.kubikasi || 0);
  const pillsLajuHarian = trendDays.map((d) => d.total || 0);
  const pillsAnomaliHarian = trendDays.map((d) => d.anomali || 0);

  return [
    // Kartu 1: Keterbacaan Meter (Varian A: Segments)
    {
      id: "keterbacaan-meter",
      title: "Keterbacaan Meter",
      icon: Activity,
      rightLabel: `Periode ${data.periode?.label || "-"}`,
      value: formatNumber(totalBaca),
      denominator: `/ ${formatNumber(data.totalPelanggan || 0)}`,
      unit: "SL",
      delta: {
        text: `${persentaseBaca}%`,
        direction: "up",
        tone: "positive",
      },
      helperText: `Dari ${formatNumber(data.totalPelanggan || 0)} pelanggan terdaftar`,
      visual: {
        type: "segments",
        items: [
          { id: "normal", label: "Normal", value: totalNormal, color: "#10b981" },
          { id: "anomali", label: "Anomali", value: totalAnomali, color: "#f5a623" },
          { id: "sisa", label: "Belum", value: belumTerbaca, color: "#94a3b8" },
        ],
      },
    },

    // Kartu 2: Kubikasi Air Terdistribusi (Varian B: Smooth Monotone Sparkline)
    {
      id: "volume-kubikasi",
      title: "Kubikasi Air Terdistribusi",
      icon: Droplets,
      rightLabel: `${(data.dailyTrends || []).length} Hari Catat`,
      value: formatNumber(data.totalKubikasi || 0),
      unit: "m³",
      delta: {
        text: `${avgVolumePerSl.toFixed(1)} m³/SL`,
        direction: "neutral",
        tone: "neutral",
      },
      helperText: "Total volume air tercatat pelanggan",
      visual: {
        type: "sparkline",
        data: sparklineKubikasi,
        labels: trendLabels,
        color: "#0070f3",
        unit: "m³",
      },
    },

    // Kartu 3: Ritme Laju Harian (Varian C: Bar Kotak Intensitas Harian)
    {
      id: "laju-harian",
      title: "Ritme Laju Harian",
      icon: Gauge,
      rightLabel: "Rata-rata",
      value: formatNumber(data.rataRataHarian || 0),
      unit: "SL/hari",
      delta: {
        text: `Puncak ${formatNumber(data.puncakHarian?.total || 0)} SL (Tgl ${parseInt(data.puncakHarian?.hari || "0", 10)})`,
        direction: "up",
        tone: "positive",
      },
      helperText: "Konsistensi laju pencatatan per hari kerja",
      visual: {
        type: "pills",
        values: pillsLajuHarian,
        labels: trendLabels,
        tone: "neutral",
        unit: "SL",
      },
    },

    // Kartu 4: Temuan & Anomali Lapangan (Varian C: Bar Kotak Problem Tone)
    {
      id: "anomali-lapangan",
      title: "Temuan & Anomali Lapangan",
      icon: AlertTriangle,
      rightLabel: `${persentaseAnomali}% dari Bacaan`,
      value: formatNumber(totalAnomali),
      unit: "Kasus",
      delta: {
        text: `${persentaseAnomali}% dari total baca`,
        direction: totalAnomali > 0 ? "up" : "neutral",
        tone: totalAnomali > 0 ? "negative" : "neutral",
      },
      helperText: "Meter rusak, segel lepas, kendala fisik, dsb.",
      visual: {
        type: "pills",
        values: pillsAnomaliHarian,
        labels: trendLabels,
        tone: "problem",
        unit: "Kasus",
      },
    },
  ];
}

/**
 * Alias fungsi untuk kompatibilitas mundur
 */
export function buildKpis(data: AnalyticsPageData): MetricCardData[] {
  return buildAnalyticsMetricCards(data);
}
