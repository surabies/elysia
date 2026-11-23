'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCheck,
  ChevronDown,
  Droplets,
  Eye,
  Filter,
  Gauge,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PERIODE_TERKUNCI_KANTOR } from '@/config/periode';
import { VerticalProgress } from '@/components/ui/vertical-progress';
import { MetricCard } from '@/features/dashboard/overview/components/MetricCard';
import type { MetricCardData } from '@/features/dashboard/overview/types/MetricCardTypes';
import { ProgresLapanganHeader } from './ProgresLapanganHeader';
import type { PeriodeOption } from '@/server/services/dashboard/dashboard.service';
import { cn } from '@/lib/utils';
import type { PetugasProgresItem, MonitoringProgresResult } from '@/server/services/cater/cater-progres.service';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

export type StatusKerjaFilter = 'semua' | 'selesai' | 'aktif';
export type AnomaliFilter = 'semua' | 'beranomali' | 'bebas';
export type SortFilter = 'capaian_desc' | 'capaian_asc' | 'target_desc' | 'volume_desc' | 'anomali_desc';

export interface MonitoringProgresLapanganProps {
  initialThbl?: string;
  availablePeriods?: PeriodeOption[];
}

export function MonitoringProgresLapangan({
  initialThbl,
  availablePeriods = [],
}: MonitoringProgresLapanganProps) {
  const [data, setData] = React.useState<MonitoringProgresResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState(initialThbl || PERIODE_TERKUNCI_KANTOR);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusKerjaFilter>('semua');
  const [anomaliFilter, setAnomaliFilter] = React.useState<AnomaliFilter>('semua');
  const [sortBy, setSortBy] = React.useState<SortFilter>('capaian_desc');
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState<number>(0);
  const [selectedPetugas, setSelectedPetugas] = React.useState<PetugasProgresItem | null>(null);

  // Sinkronisasi bila initialThbl dari Server Component berubah
  React.useEffect(() => {
    if (initialThbl && initialThbl !== periode) {
      setPeriode(initialThbl);
    }
  }, [initialThbl]);

  const periodeLabel = React.useMemo(() => {
    if (availablePeriods && availablePeriods.length > 0) {
      const match = availablePeriods.find((p) => p.thbl === periode);
      if (match) return match.label;
    }
    if (periode && periode.length === 6) {
      const y = periode.slice(0, 4);
      const m = periode.slice(4);
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
        new Date(Number(y), Number(m) - 1, 1)
      );
    }
    return periode;
  }, [periode, availablePeriods]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/progress/monitoring-lapangan?thbl=${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh timer
  React.useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchData]);

  // Filter & Pengurutan petugas berdasarkan kombinasi kriteria
  const filteredPetugas = React.useMemo(() => {
    if (!data?.petugas) return [];

    let list = [...data.petugas];

    // 1. Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.petugasId.toLowerCase().includes(q) ||
          p.ruteList.some((r) => r.toLowerCase().includes(q))
      );
    }

    // 2. Status Kerja
    if (statusFilter === 'selesai') {
      list = list.filter((p) => p.statusKerja === 'SELESAI' || p.persentase >= 100);
    } else if (statusFilter === 'aktif') {
      list = list.filter((p) => p.statusKerja !== 'SELESAI' && p.persentase < 100);
    }

    // 3. Anomali
    if (anomaliFilter === 'beranomali') {
      list = list.filter((p) => p.anomali > 0);
    } else if (anomaliFilter === 'bebas') {
      list = list.filter((p) => p.anomali === 0);
    }

    // 4. Pengurutan (Sorting)
    list.sort((a, b) => {
      switch (sortBy) {
        case 'capaian_desc':
          return b.persentase - a.persentase;
        case 'capaian_asc':
          return a.persentase - b.persentase;
        case 'target_desc':
          return b.target - a.target;
        case 'volume_desc':
          return b.totalM3 - a.totalM3;
        case 'anomali_desc':
          return b.anomali - a.anomali;
        default:
          return 0;
      }
    });

    return list;
  }, [data, search, statusFilter, anomaliFilter, sortBy]);

  const hasActiveFilters = Boolean(
    search.trim() || statusFilter !== 'semua' || anomaliFilter !== 'semua' || sortBy !== 'capaian_desc'
  );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('semua');
    setAnomaliFilter('semua');
    setSortBy('capaian_desc');
  };

  // =========================================================================
  // 4 KARTU KPI STANDAR OVERVIEW / ANALYTICS DENGAN PALET WARNA VERCEL
  // (Biru, Amber, Merah, Hijau, Pink) & DATA HARIAN RIIL BACKEND
  // =========================================================================
  const kpiCards: MetricCardData[] = React.useMemo(() => {
    const totalTerbaca = data?.kpi.totalTerbaca ?? 0;
    const totalTarget = Math.max(data?.kpi.totalTarget ?? 1, 1);
    const totalM3 = data?.kpi.totalM3 ?? 0;
    const totalPetugas = data?.kpi.totalPetugas ?? 0;
    const totalAnomali = data?.kpi.totalAnomali ?? 0;
    const totalEkstrim = data?.kpi.totalEkstrim ?? 0;
    const totalNol = data?.kpi.totalNol ?? 0;
    const totalTurun = data?.kpi.totalTurun ?? 0;

    const readRate = data?.kpi.readRatePersen ?? (totalTarget > 0 ? Number(((totalTerbaca / totalTarget) * 100).toFixed(1)) : 100);
    const sisaBelum = Math.max(totalTarget - totalTerbaca, 0);
    const normalBaca = Math.max(totalTerbaca - totalAnomali, 0);
    const persenAnomali = totalTerbaca > 0 ? ((totalAnomali / totalTerbaca) * 100).toFixed(1) : '0.0';

    // Ekstraksi data harian aktual dari backend (mencakup seluruh tanggal transaksi riil)
    const dailyTrends = data?.dailyTrends && data.dailyTrends.length > 0 ? data.dailyTrends : [];
    const dailyLabels = dailyTrends.map((d) => d.label || `Tgl ${parseInt(d.hari, 10)}`);
    const sparklineKubikasi = dailyTrends.map((d) => d.kubikasi);
    const pillsLajuHarian = dailyTrends.map((d) => d.total);
    const totalHariCatat = dailyTrends.length;
    const rataRataLajuHarian = Math.round(totalTerbaca / Math.max(totalHariCatat, 1));

    return [
      // 1. Capaian Target Catat (Varian Segments: Hijau Normal, Amber Anomali, Abu Belum)
      {
        id: 'kpi-capaian-catat',
        title: 'Capaian Target Catat',
        icon: Gauge,
        rightLabel: `Periode ${periode}`,
        value: formatNumber(totalTerbaca),
        denominator: `/${formatNumber(totalTarget)}`,
        unit: 'SL',
        delta: {
          text: `${readRate}%`,
          direction: 'up',
          tone: 'positive',
        },
        helperText: `${readRate}% selesai tercatat dari target kota`,
        visual: {
          type: 'segments',
          items: [
            { id: 'normal', label: 'Normal', value: normalBaca, color: '#10b981' }, // Hijau Vercel
            { id: 'anomali', label: 'Anomali', value: totalAnomali, color: '#f5a623' }, // Amber Vercel
            { id: 'belum', label: 'Sisa Belum', value: sisaBelum, color: '#94a3b8' }, // Netral
          ],
        },
      },

      // 2. Volume Kubikasi Air Terdistribusi (Varian Sparkline: Area kurva halus Biru Vercel)
      {
        id: 'kpi-volume-m3',
        title: 'Volume Air Terbaca',
        icon: Droplets,
        rightLabel: totalHariCatat > 0 ? `${totalHariCatat} Hari Catat` : 'Siklus Berjalan',
        value: formatNumber(totalM3),
        unit: 'm³',
        delta: {
          text: `~${(totalM3 / Math.max(totalTerbaca, 1)).toFixed(1)} m³/SL`,
          direction: 'neutral',
          tone: 'neutral',
        },
        helperText: `Total volume air terdistribusi pelanggan`,
        visual: {
          type: 'sparkline',
          data: sparklineKubikasi.length > 0 ? sparklineKubikasi : [0],
          labels: dailyLabels,
          color: '#0070f3', // Biru Vercel signature
          unit: 'm³',
        },
      },

      // 3. Temuan Anomali Lapangan (Varian Segments: Merah Ekstrem, Amber Nol, Biru Turun)
      {
        id: 'kpi-anomali-lapangan',
        title: 'Temuan Anomali Lapangan',
        icon: AlertTriangle,
        rightLabel: `${persenAnomali}% dari Bacaan`,
        value: formatNumber(totalAnomali),
        unit: 'Kasus',
        delta: {
          text: `${persenAnomali}% dari total baca`,
          direction: totalAnomali > 0 ? 'up' : 'neutral',
          tone: totalAnomali > 0 ? 'negative' : 'positive',
        },
        helperText: 'Lonjakan ekstrem, stand 0 m³, dan penurunan drastis',
        visual: {
          type: 'segments',
          items: [
            { id: 'ekstrim', label: 'Ekstrem', value: totalEkstrim, color: '#e5202e' }, // Merah Vercel
            { id: 'nol', label: 'Stand 0', value: totalNol, color: '#f5a623' }, // Amber Vercel
            { id: 'turun', label: 'Turun', value: totalTurun, color: '#0070f3' }, // Biru Vercel
          ],
        },
      },

      // 4. Ritme Laju Harian Petugas (Varian Pills: Bar Kotak Biru Vercel)
      {
        id: 'kpi-laju-harian',
        title: 'Ritme Laju Harian',
        icon: Users,
        rightLabel: `${totalPetugas} Petugas Aktif`,
        value: formatNumber(rataRataLajuHarian),
        denominator: ' SL/hari',
        delta: {
          text: 'Aktif',
          direction: 'up',
          tone: 'positive',
        },
        helperText: `Rata-rata laju pencatatan per hari kerja`,
        visual: {
          type: 'pills',
          values: pillsLajuHarian.length > 0 ? pillsLajuHarian : [0],
          labels: dailyLabels,
          tone: 'neutral', // Otomatis Biru Vercel di MetricVisualPills
          unit: 'SL',
        },
      },
    ];
  }, [data, periode]);

  return (
    <TooltipProvider delayDuration={150}>
      <PageContainer className="space-y-6">
        {/* ========================================================= */}
        {/* 1. PAGE HEADER COCKPIT (Konsisten dengan Seluruh Sistem)   */}
        {/* ========================================================= */}
        <ProgresLapanganHeader
          periodeThbl={periode}
          periodeLabel={periodeLabel}
          availablePeriods={availablePeriods}
          onPeriodChange={(next) => setPeriode(next)}
          onRefresh={fetchData}
          loading={loading}
          autoRefreshInterval={autoRefreshInterval}
          onAutoRefreshChange={setAutoRefreshInterval}
          kpi={data?.kpi}
        />

        {/* ========================================================= */}
        {/* 2. KPI METRIC CARDS (Format Standar MetricCard Vercel)     */}
        {/* ========================================================= */}
        <section aria-label="Indikator Kinerja Progres Lapangan">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <MetricCard key={card.id} data={card} />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. DAFTAR PETUGAS (Standalone Table dengan Toolbar di Atas) */}
        {/* ========================================================= */}
        <div className="space-y-3">
          {/* Filter Controls Toolbar di luar dan di atas tabel */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Box */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama, ID, atau kode rute…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs bg-card border-border shadow-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Status Petugas Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as StatusKerjaFilter)}
              >
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs bg-card border-border shadow-none">
                  <SelectValue placeholder="Status Kerja" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="selesai">100% Selesai</SelectItem>
                  <SelectItem value="aktif">Aktif Berjalan</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Temuan Anomali */}
              <Select
                value={anomaliFilter}
                onValueChange={(val) => setAnomaliFilter(val as AnomaliFilter)}
              >
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs bg-card border-border shadow-none">
                  <SelectValue placeholder="Anomali" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="semua">Semua Kasus</SelectItem>
                  <SelectItem value="beranomali">Ada Anomali</SelectItem>
                  <SelectItem value="bebas">Bebas Anomali</SelectItem>
                </SelectContent>
              </Select>

              {/* Urutan (Sorting) */}
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as SortFilter)}
              >
                <SelectTrigger size="sm" className="h-8 min-w-[145px] text-xs bg-card border-border shadow-none">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="capaian_desc">Capaian Tertinggi (%)</SelectItem>
                  <SelectItem value="capaian_asc">Capaian Terendah (%)</SelectItem>
                  <SelectItem value="target_desc">Target SL Terbanyak</SelectItem>
                  <SelectItem value="volume_desc">Volume m³ Terbanyak</SelectItem>
                  <SelectItem value="anomali_desc">Anomali Terbanyak</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  title="Reset semua filter"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              )}

              <Badge variant="pill" size="sm" className="font-mono h-8 px-2.5">
                {filteredPetugas.length} / {data?.petugas?.length ?? 0} Petugas
              </Badge>
            </div>

            {/* View Switcher: Table vs Grid */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40 shrink-0">
              <Button
                size="xs"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('table')}
                className="h-6.5 px-2.5 text-[11px] gap-1.5 font-medium"
                title="Tampilan Tabel"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </Button>
              <Button
                size="xs"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="h-6.5 px-2.5 text-[11px] gap-1.5 font-medium"
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
            </div>
          </div>

          {/* VIEW MODE: TABEL BERGAYA VERCEL */}
          {viewMode === 'table' ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Petugas Cater</th>
                      <th className="py-2.5 px-3 font-medium text-center">Rute Binaan</th>
                      <th className="py-2.5 px-4 font-medium text-right">Target Catat (SL)</th>
                      <th className="py-2.5 px-4 font-medium text-right">Volume (m³)</th>
                      <th className="py-2.5 px-4 font-medium text-center">Anomali</th>
                      <th className="py-2.5 px-4 font-medium">Siklus Pengerjaan</th>
                      <th className="py-2.5 px-3 font-medium text-center">Status</th>
                      <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground animate-pulse text-xs">
                          Memuat data progres petugas riil…
                        </td>
                      </tr>
                    ) : filteredPetugas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-muted-foreground text-xs">
                          Tidak ada petugas yang cocok dengan kriteria filter saat ini.
                        </td>
                      </tr>
                    ) : (
                      filteredPetugas.map((petugas) => (
                        <tr
                          key={petugas.petugasId}
                          onClick={() => setSelectedPetugas(petugas)}
                          className="hover:bg-muted/40 transition-colors h-11 cursor-pointer group"
                        >
                          {/* Kolom 1: Petugas */}
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="size-7 rounded-full border border-border bg-muted text-foreground flex items-center justify-center text-[11px] font-semibold shrink-0 shadow-2xs">
                                {petugas.nama.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground block group-hover:text-primary transition-colors truncate">
                                  {petugas.nama}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  ID: {petugas.petugasId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Kolom 2: Rute Binaan (Badge Geist: variant="pill") */}
                          <td className="py-2 px-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Badge variant="pill" size="sm" className="font-mono cursor-help">
                                    {petugas.totalRute} Rute
                                  </Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-mono text-[11px]">
                                  {petugas.ruteList.join(', ')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>

                          {/* Kolom 3: Realisasi Beban SL */}
                          <td className="py-2 px-4 text-right">
                            <div className="font-mono font-semibold text-foreground">
                              {formatNumber(petugas.terbaca)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              / {formatNumber(petugas.target)} SL
                            </div>
                          </td>

                          {/* Kolom 4: Volume Kubikasi */}
                          <td className="py-2 px-4 text-right">
                            <div className="font-mono font-bold text-sky-600 dark:text-sky-400">
                              {formatNumber(petugas.totalM3)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              m³ air
                            </div>
                          </td>

                          {/* Kolom 5: Anomali Lapangan (Badge Geist: variant="amber-subtle") */}
                          <td className="py-2 px-4 text-center">
                            {petugas.anomali > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block">
                                    <Badge
                                      variant="amber-subtle"
                                      size="sm"
                                      className="font-mono gap-1 cursor-help"
                                    >
                                      <AlertTriangle className="size-3" />
                                      <span>{petugas.anomali}</span>
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs space-y-1">
                                  <p className="font-semibold text-foreground">Detail Anomali Petugas:</p>
                                  <p className="text-rose-500">• Lonjakan Ekstrem: {petugas.totalEkstrim}</p>
                                  <p className="text-amber-500">• Stand 0 m³: {petugas.totalNol}</p>
                                  <p className="text-sky-500">• Turun Drastis: {petugas.totalTurun}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="font-mono text-muted-foreground text-xs">—</span>
                            )}
                          </td>

                          {/* Kolom 6: Siklus Pengerjaan (VerticalProgress |||) */}
                          <td className="py-2 px-4 min-w-[150px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-medium text-foreground">
                                  {petugas.persentase}%
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Target Catat
                                </span>
                              </div>
                              <VerticalProgress
                                value={petugas.persentase}
                                ticks={20}
                                variant={petugas.persentase >= 100 ? 'emerald' : 'blue'}
                                heightClass="h-2"
                                gapClass="gap-[2px]"
                                ariaLabel={`Progres ${petugas.nama}`}
                              />
                            </div>
                          </td>

                          {/* Kolom 7: Status (Badge Geist: green-subtle / blue-subtle) */}
                          <td className="py-2 px-3 text-center">
                            <Badge
                              variant={petugas.statusKerja === 'SELESAI' ? 'green-subtle' : 'blue-subtle'}
                              size="sm"
                              className="font-mono uppercase"
                            >
                              {petugas.statusKerja === 'SELESAI' ? '100% Selesai' : 'Aktif'}
                            </Badge>
                          </td>

                          {/* Kolom 8: Aksi */}
                          <td className="py-2 px-4 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPetugas(petugas);
                              }}
                              className="h-7 px-2 text-muted-foreground hover:text-foreground text-[11px] gap-1"
                            >
                              <Eye className="size-3.5" />
                              <span className="hidden sm:inline">Rincian</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW MODE: GRID KARTU */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-44 rounded-xl border border-border bg-muted/20 animate-pulse" />
                ))
              ) : filteredPetugas.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                  Tidak ada petugas yang cocok dengan kriteria filter saat ini.
                </div>
              ) : (
                filteredPetugas.map((petugas) => (
                  <div
                    key={petugas.petugasId}
                    onClick={() => setSelectedPetugas(petugas)}
                    className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm cursor-pointer space-y-3"
                  >
                    {/* Header Kartu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full border border-border bg-muted text-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                          {petugas.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground text-xs truncate group-hover:text-primary transition-colors">
                            {petugas.nama}
                          </h3>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ID: {petugas.petugasId} • {petugas.totalRute} Rute
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={petugas.statusKerja === 'SELESAI' ? 'green-subtle' : 'blue-subtle'}
                        size="sm"
                        className="font-mono uppercase"
                      >
                        {petugas.statusKerja === 'SELESAI' ? '100% Selesai' : 'Aktif'}
                      </Badge>
                    </div>

                    {/* Progress Bar Vertikal */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">Capaian Catat</span>
                        <span className="font-mono font-bold text-foreground">
                          {petugas.persentase}%
                        </span>
                      </div>
                      <VerticalProgress
                        value={petugas.persentase}
                        ticks={24}
                        variant={petugas.persentase >= 100 ? 'emerald' : 'blue'}
                        heightClass="h-2"
                        gapClass="gap-[2px]"
                      />
                    </div>

                    {/* Metrik Mini Grid */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border/60 text-center">
                      <div className="p-1 rounded bg-muted/20">
                        <span className="text-[10px] text-muted-foreground block">Tercatat</span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {formatNumber(petugas.terbaca)}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-muted/20">
                        <span className="text-[10px] text-muted-foreground block">Volume</span>
                        <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                          {formatNumber(petugas.totalM3)}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-muted/20">
                        <span className="text-[10px] text-muted-foreground block">Anomali</span>
                        <span className={cn("font-mono text-xs font-semibold", petugas.anomali > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                          {petugas.anomali}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MODAL / DIALOG DETAIL PROFIL KINERJA PETUGAS              */}
        {/* ========================================================= */}
        {selectedPetugas && (
          <Dialog open={Boolean(selectedPetugas)} onOpenChange={(open) => !open && setSelectedPetugas(null)}>
            <DialogContent className="max-w-lg font-sans">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>Profil Kinerja: {selectedPetugas.nama}</span>
                  <Badge
                    variant={selectedPetugas.statusKerja === 'SELESAI' ? 'green-subtle' : 'blue-subtle'}
                    size="sm"
                    className="font-mono"
                  >
                    {selectedPetugas.statusKerja === 'SELESAI' ? '100% Selesai' : `${selectedPetugas.persentase}% Aktif`}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Ringkasan beban kerja pencatatan dan rincian anomali lapangan periode {periodeLabel}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Ringkasan Beban & Kubikasi */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border p-2.5 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground block">Total Pelanggan Dicatat</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {formatNumber(selectedPetugas.terbaca)} SL
                    </span>
                  </div>
                  <div className="rounded-lg border border-border p-2.5 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground block">Total Kubikasi Air</span>
                    <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                      {formatNumber(selectedPetugas.totalM3)} m³
                    </span>
                  </div>
                </div>

                {/* Gaya ||| Bar Vertikal di Modal */}
                <div className="space-y-1.5 rounded-lg border border-border p-2.5 bg-muted/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Progres Terhadap Target Catat ({selectedPetugas.persentase}%)</span>
                    <span className="font-mono text-foreground font-bold tabular-nums">
                      {formatNumber(selectedPetugas.terbaca)} / {formatNumber(selectedPetugas.target)} Target
                    </span>
                  </div>
                  <VerticalProgress
                    value={selectedPetugas.persentase}
                    ticks={28}
                    variant={selectedPetugas.persentase >= 100 ? 'emerald' : 'blue'}
                    heightClass="h-2.5"
                    gapClass="gap-[3px]"
                    ariaLabel={`Capaian target ${selectedPetugas.nama}`}
                  />
                </div>

                {/* 3 Pilar Temuan Anomali Petugas - Palet Vercel */}
                <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                    Temuan Anomali Petugas ({selectedPetugas.anomali} Kasus)
                  </span>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded-md p-2 border border-rose-500/20 bg-rose-500/5 text-center">
                      <span className="text-[10px] text-muted-foreground block">Lonjakan Ekstrem</span>
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        {selectedPetugas.totalEkstrim}
                      </span>
                    </div>
                    <div className="rounded-md p-2 border border-amber-500/20 bg-amber-500/5 text-center">
                      <span className="text-[10px] text-muted-foreground block">Stand 0 m³</span>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {selectedPetugas.totalNol}
                      </span>
                    </div>
                    <div className="rounded-md p-2 border border-sky-500/20 bg-sky-500/5 text-center">
                      <span className="text-[10px] text-muted-foreground block">Turun Drastis</span>
                      <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        {selectedPetugas.totalTurun}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seluruh Rute Binaan */}
                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                    Daftar {selectedPetugas.totalRute} Rute Binaan:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPetugas.ruteList.map((rute) => (
                      <Badge
                        key={rute}
                        variant="pill"
                        size="sm"
                        className="font-mono"
                      >
                        {rute}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Siklus Tanggal Kerja */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Siklus Mulai: <strong className="font-mono text-foreground">{selectedPetugas.mulaiCatat ?? '—'}</strong></span>
                  <span>Siklus Selesai: <strong className="font-mono text-foreground">{selectedPetugas.selesaiCatat ?? '—'}</strong></span>
                </div>
              </div>

              <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/verifikasi/baca-petugas?q=${encodeURIComponent(selectedPetugas.nama)}`}>
                    Buka Panel Verifikasi Petugas
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedPetugas(null)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageContainer>
    </TooltipProvider>
  );
}
