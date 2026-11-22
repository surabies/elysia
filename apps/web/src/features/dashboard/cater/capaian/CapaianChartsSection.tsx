'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { KumpulanSeriGrafik } from '@/server/domain/capaian/capaian.types';
import { formatRibuan, formatDesimal } from './format';
import { BarChart } from '@/components/charts/bar-chart';
import { Bar } from '@/components/charts/bar';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { LineChart } from '@/components/charts/line-chart';
import { Line } from '@/components/charts/line';
import { XAxis } from '@/components/charts/x-axis';
import { Grid } from '@/components/charts/grid';
import { ChartTooltip } from '@/components/charts/tooltip/chart-tooltip';
import {
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface CapaianChartsSectionProps {
  grafik: KumpulanSeriGrafik;
}

const BULAN_LABELS_LENGKAP = [
  'Januari 2026',
  'Februari 2026',
  'Maret 2026',
  'April 2026',
  'Mei 2026',
  'Juni 2026',
  'Juli 2026',
  'Agustus 2026',
  'September 2026',
  'Oktober 2026',
  'November 2026',
  'Desember 2026',
];

const BULAN_LABELS_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function CapaianChartsSection({ grafik }: CapaianChartsSectionProps) {
  const [activeTab, setActiveTab] = React.useState<
    'm3' | 'm3PerSl' | 'sl' | 'delta' | 'harian'
  >('m3');

  // 1. Data Target vs Realisasi M³ untuk Bklit BarChart (Grouped Bar)
  const m3Data = React.useMemo(() => {
    return (grafik.targetVsRealisasiM3 || []).map((d) => ({
      bulan: d.bulan,
      targetM3: d.targetM3,
      realisasiM3: d.realisasiM3 ?? 0,
    }));
  }, [grafik.targetVsRealisasiM3]);

  // 2. Data Rasio M³/SL untuk Bklit LineChart (Dual-series Time Series)
  const rasioData = React.useMemo(() => {
    return (grafik.targetVsRealisasiM3PerSl || []).map((d, index) => ({
      date: new Date(2026, index, 1),
      bulan: d.bulan,
      targetM3PerSl: d.targetM3PerSl ?? 0,
      realisasiM3PerSl: d.realisasiM3PerSl ?? 0,
    }));
  }, [grafik.targetVsRealisasiM3PerSl]);

  // 3. Data SL Target vs Realisasi untuk Bklit BarChart (Grouped Bar)
  const slData = React.useMemo(() => {
    return (grafik.slTargetVsRealisasi || []).map((d) => ({
      bulan: d.bulan,
      targetSl: d.targetSl,
      realisasiSl: d.realisasiSl ?? 0,
    }));
  }, [grafik.slTargetVsRealisasi]);

  // 4. Data Fluktuasi Delta M³ Bulanan untuk Bklit BarChart (± Baseline 0)
  const deltaData = React.useMemo(() => {
    return (grafik.deltaM3 || []).map((d) => ({
      bulan: d.bulan,
      deltaM3: d.deltaM3 ?? 0,
      tipe: d.tipe,
    }));
  }, [grafik.deltaM3]);

  // 5. Data Tren Konsumsi Harian (M³/SL/Hari) untuk Bklit LineChart
  const harianData = React.useMemo(() => {
    return (grafik.m3PerSlPerHari || []).map((d, index) => {
      // Index 0 adalah Desember tahun lalu (2025-12-01), sisanya Januari-Desember 2026
      const date = index === 0 ? new Date(2025, 11, 1) : new Date(2026, index - 1, 1);
      return {
        date,
        bulan: d.bulan,
        m3PerSlPerHari: d.m3PerSlPerHari ?? 0,
      };
    });
  }, [grafik.m3PerSlPerHari]);

  const harianLabelsSingkat = React.useMemo(() => {
    return (grafik.m3PerSlPerHari || []).map((d) => d.bulan);
  }, [grafik.m3PerSlPerHari]);

  const harianLabelsLengkap = React.useMemo(() => {
    return (grafik.m3PerSlPerHari || []).map((d, index) =>
      index === 0 ? 'Desember 2025 (Acuan)' : `Bulan ${d.bulan} 2026`
    );
  }, [grafik.m3PerSlPerHari]);

  return (
    <div className="space-y-4">
      {/* Sub-selector Toolbar Bergaya Bklit UI (Tab Active Putih Bersih) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-muted/20">
        <div className="flex flex-wrap items-center gap-1 border border-border rounded-lg p-1 bg-muted/40 shadow-2xs">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveTab('m3')}
            className={`h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md transition-all ${
              activeTab === 'm3'
                ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            }`}
          >
            <BarChart3 className="size-3.5 text-blue-600" />
            <span>Target vs Realisasi M³</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveTab('m3PerSl')}
            className={`h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md transition-all ${
              activeTab === 'm3PerSl'
                ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            }`}
          >
            <LineChartIcon className="size-3.5 text-emerald-600" />
            <span>Rasio M³/SL (Komparasi)</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveTab('sl')}
            className={`h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md transition-all ${
              activeTab === 'sl'
                ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            }`}
          >
            <Activity className="size-3.5 text-purple-600" />
            <span>SL Target vs Realisasi</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveTab('delta')}
            className={`h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md transition-all ${
              activeTab === 'delta'
                ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            }`}
          >
            <TrendingUp className="size-3.5 text-amber-600" />
            <span>Delta M³ Bulanan</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveTab('harian')}
            className={`h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md transition-all ${
              activeTab === 'harian'
                ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            }`}
          >
            <Calendar className="size-3.5 text-teal-600" />
            <span>M³/SL/Hari (Tren)</span>
          </Button>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono hidden md:block">
          Bklit Charts (https://bklit.com)
        </div>
      </div>

      {/* Konten Chart Bklit UI Terpadu dengan Wrapper Ketinggian Proporsional (Tinggi Terkendali 260-280px) */}
      <div className="p-4 sm:p-6 min-w-0 w-full overflow-hidden">
        {/* 1. Target vs Realisasi M³ (Bklit BarChart - Grouped Bars) */}
        {activeTab === 'm3' && (
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Perbandingan Volume Kubikasi: Target vs Realisasi (M³)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Evaluasi pemenuhan target distribusi kubikasi per bulan sepanjang tahun 2026.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2.5 rounded-xs bg-slate-300 dark:bg-slate-700 border border-slate-400 inline-block" />
                  Target M³
                </span>
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <span className="size-2.5 rounded-xs bg-blue-600 inline-block" />
                  Realisasi M³
                </span>
              </div>
            </div>

            {/* Sized Wrapper: Mengontrol tinggi grafik agar proporsional dan tidak terlalu tinggi */}
            <div className="relative w-full h-[260px] sm:h-[280px] min-w-0">
              <BarChart
                data={m3Data}
                xDataKey="bulan"
                aspectRatio="auto"
                margin={{ top: 20, right: 20, bottom: 35, left: 20 }}
                className="size-full"
              >
                <Grid horizontal stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="4 4" />
                <Bar
                  dataKey="targetM3"
                  fill="color-mix(in srgb, var(--foreground) 20%, transparent)"
                  stroke="color-mix(in srgb, var(--foreground) 40%, transparent)"
                  lineCap="round"
                />
                <Bar
                  dataKey="realisasiM3"
                  fill="var(--chart-line-primary, #2563eb)"
                  lineCap="round"
                />
                <BarXAxis showAllLabels />
                <ChartTooltip
                  showCrosshair={false}
                  dateLabels={BULAN_LABELS_LENGKAP}
                  rows={(point) => [
                    {
                      color: "var(--ds-gray-400, #94a3b8)",
                      label: "Target M³",
                      value: `${formatRibuan(Number(point.targetM3))} m³`,
                    },
                    {
                      color: "#2563eb",
                      label: "Realisasi M³",
                      value:
                        Number(point.realisasiM3) > 0
                          ? `${formatRibuan(Number(point.realisasiM3))} m³`
                          : '—',
                    },
                  ]}
                />
              </BarChart>
            </div>
          </div>
        )}

        {/* 2. Target vs Realisasi M³/SL (Bklit LineChart - Dual Line Komparasi) */}
        {activeTab === 'm3PerSl' && (
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Rasio Pemakaian Air: Target vs Realisasi (M³/SL)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Perbandingan intensitas rata-rata konsumsi air tiap sambungan langganan terhadap target.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                  Target M³/SL
                </span>
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <span className="size-2 rounded-full bg-emerald-600 inline-block" />
                  Realisasi M³/SL
                </span>
              </div>
            </div>

            {/* Sized Wrapper: Mengontrol tinggi grafik agar proporsional dan tidak terlalu tinggi */}
            <div className="relative w-full h-[260px] sm:h-[280px] min-w-0">
              <LineChart
                data={rasioData}
                xDataKey="date"
                aspectRatio="auto"
                margin={{ top: 20, right: 20, bottom: 35, left: 20 }}
                className="size-full"
              >
                <Grid horizontal stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="4 4" />
                <Line
                  dataKey="targetM3PerSl"
                  stroke="var(--chart-line-secondary, #94a3b8)"
                  strokeWidth={2}
                  showMarkers
                />
                <Line
                  dataKey="realisasiM3PerSl"
                  stroke="var(--chart-line-primary, #10b981)"
                  strokeWidth={2.5}
                  showMarkers
                />
                <XAxis labels={BULAN_LABELS_SINGKAT} />
                <ChartTooltip
                  dateLabels={BULAN_LABELS_LENGKAP}
                  rows={(point) => [
                    {
                      color: "var(--ds-gray-400, #94a3b8)",
                      label: "Target M³/SL",
                      value: `${formatDesimal(Number(point.targetM3PerSl), 2)} m³/SL`,
                    },
                    {
                      color: "#10b981",
                      label: "Realisasi M³/SL",
                      value:
                        Number(point.realisasiM3PerSl) > 0
                          ? `${formatDesimal(Number(point.realisasiM3PerSl), 2)} m³/SL`
                          : '—',
                    },
                  ]}
                />
              </LineChart>
            </div>
          </div>
        )}

        {/* 3. SL Target vs Realisasi (Bklit BarChart - Grouped Bars) */}
        {activeTab === 'sl' && (
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Jumlah Sambungan Langganan: Target vs Realisasi (SL)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Perbandingan cakupan jumlah pelanggan yang ditargetkan dengan yang berhasil tercatat.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2.5 rounded-xs bg-slate-300 dark:bg-slate-700 border border-slate-400 inline-block" />
                  Target SL
                </span>
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <span className="size-2.5 rounded-xs bg-purple-600 inline-block" />
                  Realisasi SL
                </span>
              </div>
            </div>

            {/* Sized Wrapper: Mengontrol tinggi grafik agar proporsional dan tidak terlalu tinggi */}
            <div className="relative w-full h-[260px] sm:h-[280px] min-w-0">
              <BarChart
                data={slData}
                xDataKey="bulan"
                aspectRatio="auto"
                margin={{ top: 20, right: 20, bottom: 35, left: 20 }}
                className="size-full"
              >
                <Grid horizontal stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="4 4" />
                <Bar
                  dataKey="targetSl"
                  fill="color-mix(in srgb, var(--foreground) 20%, transparent)"
                  stroke="color-mix(in srgb, var(--foreground) 40%, transparent)"
                  lineCap="round"
                />
                <Bar
                  dataKey="realisasiSl"
                  fill="var(--chart-3, #9333ea)"
                  lineCap="round"
                />
                <BarXAxis showAllLabels />
                <ChartTooltip
                  showCrosshair={false}
                  dateLabels={BULAN_LABELS_LENGKAP}
                  rows={(point) => [
                    {
                      color: "var(--ds-gray-400, #94a3b8)",
                      label: "Target SL",
                      value: `${formatRibuan(Number(point.targetSl))} SL`,
                    },
                    {
                      color: "#9333ea",
                      label: "Realisasi SL",
                      value:
                        Number(point.realisasiSl) > 0
                          ? `${formatRibuan(Number(point.realisasiSl))} SL`
                          : '—',
                    },
                  ]}
                />
              </BarChart>
            </div>
          </div>
        )}

        {/* 4. Fluktuasi Delta M³ Bulanan (Bklit BarChart dengan Zero Baseline Highlight) */}
        {activeTab === 'delta' && (
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Fluktuasi Kenaikan / Penurunan Kubikasi Bulanan (Δ M³)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pergerakan volume air dibanding bulan sebelumnya (Hijau = Naik, Merah = Turun).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="size-2.5 rounded-xs bg-emerald-600 inline-block" />
                  Kenaikan (+)
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                  <span className="size-2.5 rounded-xs bg-rose-600 inline-block" />
                  Penurunan (-)
                </span>
              </div>
            </div>

            {/* Sized Wrapper: Mengontrol tinggi grafik agar proporsional dan tidak terlalu tinggi */}
            <div className="relative w-full h-[260px] sm:h-[280px] min-w-0">
              <BarChart
                data={deltaData}
                xDataKey="bulan"
                aspectRatio="auto"
                margin={{ top: 20, right: 20, bottom: 35, left: 20 }}
                className="size-full"
              >
                <Grid
                  horizontal
                  stroke="var(--border)"
                  strokeOpacity={0.6}
                  strokeDasharray="4 4"
                  highlightRowValues={[0]}
                  highlightRowStroke="var(--foreground)"
                  highlightRowStrokeOpacity={0.4}
                  highlightRowStrokeWidth={1.5}
                />
                <Bar
                  dataKey="deltaM3"
                  fill="var(--chart-line-emerald, #10b981)"
                  lineCap="round"
                />
                <BarXAxis showAllLabels />
                <ChartTooltip
                  showCrosshair={false}
                  dateLabels={BULAN_LABELS_LENGKAP}
                  rows={(point) => {
                    const val = Number(point.deltaM3);
                    return [
                      {
                        color: val >= 0 ? '#10b981' : '#ef4444',
                        label: 'Perubahan Δ M³',
                        value: `${val > 0 ? '+' : ''}${formatRibuan(val)} m³`,
                      },
                    ];
                  }}
                />
              </BarChart>
            </div>
          </div>
        )}

        {/* 5. Tren Konsumsi Harian (Bklit LineChart - M³/SL/Hari) */}
        {activeTab === 'harian' && (
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tren Rata-rata Konsumsi Harian per Pelanggan (M³/SL/Hari)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Konsistensi pemakaian air per hari tiap sambungan pelanggan mulai dari acuan Desember tahun lalu.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="size-2 rounded-full bg-teal-600 inline-block" />
                Konsumsi Harian (M³/SL/Hari)
              </div>
            </div>

            {/* Sized Wrapper: Mengontrol tinggi grafik agar proporsional dan tidak terlalu tinggi */}
            <div className="relative w-full h-[260px] sm:h-[280px] min-w-0">
              <LineChart
                data={harianData}
                xDataKey="date"
                aspectRatio="auto"
                margin={{ top: 20, right: 20, bottom: 35, left: 20 }}
                className="size-full"
              >
                <Grid horizontal stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="4 4" />
                <Line
                  dataKey="m3PerSlPerHari"
                  stroke="var(--chart-line-primary, #0d9488)"
                  strokeWidth={2.5}
                  showMarkers
                />
                <XAxis labels={harianLabelsSingkat} />
                <ChartTooltip
                  dateLabels={harianLabelsLengkap}
                  rows={(point) => [
                    {
                      color: '#0d9488',
                      label: 'Konsumsi Harian',
                      value: `${formatDesimal(Number(point.m3PerSlPerHari), 3)} m³/SL/hari`,
                    },
                  ]}
                />
              </LineChart>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
