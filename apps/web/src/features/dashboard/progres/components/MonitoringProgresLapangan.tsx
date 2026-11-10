'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  Droplets,
  Eye,
  FileCheck2,
  Gauge,
  HelpCircle,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Search,
  Table as TableIcon,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
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
import { cn } from '@/lib/utils';
import type { PetugasProgresItem, MonitoringProgresResult } from '@/server/services/cater/cater-progres.service';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

export function MonitoringProgresLapangan() {
  const [data, setData] = React.useState<MonitoringProgresResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState<number>(0);
  const [selectedPetugas, setSelectedPetugas] = React.useState<PetugasProgresItem | null>(null);

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

  // Filter petugas berdasarkan pencarian
  const filteredPetugas = React.useMemo(() => {
    if (!data?.petugas) return [];
    if (!search.trim()) return data.petugas;
    const q = search.toLowerCase();
    return data.petugas.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.petugasId.toLowerCase().includes(q) ||
        p.ruteList.some((r) => r.toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <TooltipProvider delayDuration={150}>
      <PageContainer className="space-y-6">
        {/* ========================================================= */}
        {/* 1. PAGE HEADER & CONTROL TOOLBAR                          */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-heading-20 text-foreground font-bold tracking-tight">
                Monitoring Progres Petugas Lapangan
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400 gap-1.5 font-medium"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database
              </Badge>
            </div>
            <p className="text-copy-13 text-muted-foreground mt-1">
              Pemantauan real-time laju pembacaan meter, volume kubikasi, dan temuan anomali per petugas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Periode Selector */}
            <div className="flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-label-12">
              <span className="text-muted-foreground mr-2 font-medium">Periode:</span>
              <NativeSelect
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                size="xs"
                className="border-none shadow-none font-semibold text-foreground focus-visible:ring-0 p-0 pr-6"
              >
                <NativeSelectOption value="202601">Januari 2026 (202601)</NativeSelectOption>
                <NativeSelectOption value="202512">Desember 2025 (202512)</NativeSelectOption>
                <NativeSelectOption value="202511">November 2025 (202511)</NativeSelectOption>
              </NativeSelect>
            </div>

            {/* Auto Refresh Toggle */}
            <div className="inline-flex rounded-md border border-border bg-[var(--ds-background-100)] p-0.5">
              <Button
                size="xs"
                variant={autoRefreshInterval === 0 ? 'secondary' : 'ghost'}
                onClick={() => setAutoRefreshInterval(0)}
                className="text-[11px] h-6 px-2"
              >
                Manual
              </Button>
              <Button
                size="xs"
                variant={autoRefreshInterval === 30 ? 'secondary' : 'ghost'}
                onClick={() => setAutoRefreshInterval(30)}
                className="text-[11px] h-6 px-2"
              >
                30s
              </Button>
              <Button
                size="xs"
                variant={autoRefreshInterval === 60 ? 'secondary' : 'ghost'}
                onClick={() => setAutoRefreshInterval(60)}
                className="text-[11px] h-6 px-2"
              >
                60s
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="h-8 gap-1.5 text-[12px] font-medium"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. KPI METRIC CARDS (Vercel Style, Sinkron Database)      */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Realisasi DPM */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-12 font-medium">Realisasi Beban (DPM)</span>
              <CheckCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-heading-24 font-mono font-bold tabular-nums text-foreground">
                {data ? formatNumber(data.kpi.totalTerbaca) : '...'}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                / {data ? formatNumber(data.kpi.totalTarget) : '...'} SL
              </span>
            </div>
            {/* Progress bar line */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, data?.kpi.readRatePersen ?? 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-copy-12 text-emerald-600 dark:text-emerald-400 font-medium">
              {data?.kpi.readRatePersen ?? 100}% Selesai Tercatat
            </p>
          </Card>

          {/* Card 2: Total Volume Kubikasi */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-12 font-medium">Volume Kubikasi Air</span>
              <Droplets className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-heading-24 font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {data ? formatNumber(data.kpi.totalM3) : '...'}
              </span>
              <span className="text-label-12 text-muted-foreground font-sans">m³</span>
            </div>
            <p className="mt-1.5 text-copy-12 text-muted-foreground">
              Rata-rata {data ? formatNumber(Math.round(data.kpi.totalM3 / (data.kpi.totalPetugas || 1))) : 0} m³ / petugas
            </p>
          </Card>

          {/* Card 3: Total Anomali Riil (Sinkron 100%) */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-12 font-medium">Anomali Terdeteksi</span>
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-heading-24 font-mono font-bold tabular-nums text-foreground">
                {data ? formatNumber(data.kpi.totalAnomali) : '...'}
              </span>
              <span className="text-label-12 text-muted-foreground font-sans">Kasus</span>
            </div>
            <p className="mt-1.5 text-copy-12 text-muted-foreground font-mono text-[11px]">
              Ekstrem: {data?.kpi.totalEkstrim ?? 0} · Nol: {data?.kpi.totalNol ?? 0} · Turun: {data?.kpi.totalTurun ?? 0}
            </p>
          </Card>

          {/* Card 4: Petugas Aktif & Rute */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-12 font-medium">Petugas &amp; Rute Binaan</span>
              <Users className="size-4 text-foreground/80" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-heading-24 font-mono font-bold tabular-nums text-foreground">
                {data?.kpi.totalPetugas ?? 0}
              </span>
              <span className="text-label-12 text-muted-foreground font-sans">Petugas Aktif</span>
            </div>
            <p className="mt-1.5 text-copy-12 text-muted-foreground">
              Mencakup {data?.kpi.totalRute ?? 0} rute pembacaan
            </p>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* 3. TOOLBAR PENCARIAN & LAYOUT SWITCHER                    */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama petugas, ID, atau kode rute…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-[12px] bg-card border-border"
            />
          </div>

          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-[var(--ds-background-100)] w-fit">
            <Button
              size="xs"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('table')}
              className="h-7 px-2.5 text-[11px] gap-1.5 font-medium"
            >
              <TableIcon className="size-3.5" />
              <span>Tabel Vercel</span>
            </Button>
            <Button
              size="xs"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="h-7 px-2.5 text-[11px] gap-1.5 font-medium"
            >
              <LayoutGrid className="size-3.5" />
              <span>Grid Kartu</span>
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. VIEW MODE: TABEL BERGAYA VERCEL (Rapi & Elegan)        */}
        {/* ========================================================= */}
        {viewMode === 'table' ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--ds-background-100)] border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Petugas Cater</th>
                    <th className="py-2.5 px-3 font-medium text-center">Rute Binaan</th>
                    <th className="py-2.5 px-4 font-medium text-right">Realisasi (SL)</th>
                    <th className="py-2.5 px-4 font-medium text-right">Volume (m³)</th>
                    <th className="py-2.5 px-4 font-medium text-center">Anomali</th>
                    <th className="py-2.5 px-4 font-medium">Siklus Pengerjaan</th>
                    <th className="py-2.5 px-3 font-medium text-center">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-[12px]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground animate-pulse">
                        Memuat data progres petugas riil…
                      </td>
                    </tr>
                  ) : filteredPetugas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted-foreground">
                        Tidak ada petugas yang cocok dengan kata kunci pencarian.
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
                            <div className="size-7 rounded-full border border-border bg-[var(--ds-background-200)] text-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
                              {petugas.nama.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block group-hover:text-primary transition-colors">
                                {petugas.nama}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                ID: {petugas.petugasId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: Rute Binaan */}
                        <td className="py-2 px-3 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="font-mono text-[10px] py-0 px-2 cursor-help">
                                {petugas.totalRute} Rute
                              </Badge>
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
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-foreground tabular-nums">
                              {formatNumber(petugas.terbaca)}{' '}
                              <span className="text-[10px] font-normal text-muted-foreground">/ {formatNumber(petugas.target)}</span>
                            </span>
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, petugas.persentase)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Kolom 4: Total Volume Kubikasi */}
                        <td className="py-2 px-4 text-right font-mono font-semibold text-foreground tabular-nums whitespace-nowrap">
                          {formatNumber(petugas.totalM3)} <span className="text-[10px] font-normal text-muted-foreground">m³</span>
                        </td>

                        {/* Kolom 5: Temuan Anomali */}
                        <td className="py-2 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-semibold" title="Lonjakan Ekstrem">
                              {petugas.totalEkstrim}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold" title="Stand 0 m³">
                              {petugas.totalNol}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold" title="Turun Drastis">
                              {petugas.totalTurun}
                            </span>
                          </div>
                        </td>

                        {/* Kolom 6: Siklus Pengerjaan */}
                        <td className="py-2 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {petugas.mulaiCatat && petugas.selesaiCatat ? (
                            <span>
                              {petugas.mulaiCatat.slice(5, 10)} → {petugas.selesaiCatat.slice(5, 10)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Kolom 7: Status */}
                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-mono py-0 px-1.5',
                              petugas.statusKerja === 'SELESAI'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400'
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/25'
                            )}
                          >
                            {petugas.statusKerja === 'SELESAI' ? '100% Selesai' : 'Aktif'}
                          </Badge>
                        </td>

                        {/* Kolom 8: Aksi */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 hover:bg-muted font-medium cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPetugas(petugas);
                                  }}
                                >
                                  <Eye className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Tinjau detail kinerja {petugas.nama}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 hover:bg-muted font-medium cursor-pointer"
                                  asChild
                                >
                                  <Link
                                    href={`/verifikasi/baca-petugas?q=${encodeURIComponent(petugas.nama)}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ArrowUpRight className="size-3.5 text-blue-600 dark:text-blue-400" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Buka verifikasi bacaan {petugas.nama}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPetugas.map((petugas) => (
              <Card
                key={petugas.petugasId}
                onClick={() => setSelectedPetugas(petugas)}
                className="p-4 border-border bg-card transition-all hover:border-[var(--ds-gray-500)] flex flex-col justify-between space-y-4 cursor-pointer group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-full border border-border bg-[var(--ds-background-200)] text-foreground flex items-center justify-center text-label-12 font-semibold shrink-0">
                        {petugas.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-label-14 font-semibold text-foreground group-hover:text-primary transition-colors">
                          {petugas.nama}
                        </h3>
                        <p className="text-label-11 text-muted-foreground font-mono mt-0.5">
                          ID: {petugas.petugasId} · {petugas.totalRute} Rute Binaan
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400 font-mono text-[10px]"
                    >
                      100% Selesai
                    </Badge>
                  </div>

                  {/* Realisasi Beban & Volume Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-baseline text-label-12">
                      <span className="text-muted-foreground">Volume Kubikasi Air:</span>
                      <span className="font-mono tabular-nums font-bold text-foreground">
                        {formatNumber(petugas.totalM3)} m³
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, petugas.persentase)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Metric Columns: Target | Terbaca | Anomali */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center rounded-md bg-[var(--ds-background-100)] p-2.5 border border-border/70">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">Target</span>
                      <span className="font-mono tabular-nums text-label-12 font-bold text-foreground">
                        {formatNumber(petugas.target)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">Terbaca</span>
                      <span className="font-mono tabular-nums text-label-12 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(petugas.terbaca)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">Anomali</span>
                      <span className="font-mono tabular-nums text-label-12 font-bold text-amber-600 dark:text-amber-400">
                        {formatNumber(petugas.anomali)}
                      </span>
                    </div>
                  </div>

                  {/* Rute Binaan Chips */}
                  <div className="mt-3">
                    <span className="text-[10px] text-muted-foreground block mb-1 font-medium uppercase">
                      Rute Penugasan ({petugas.ruteList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {petugas.ruteList.slice(0, 7).map((rute) => (
                        <span
                          key={rute}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground border border-border/60"
                        >
                          {rute}
                        </span>
                      ))}
                      {petugas.ruteList.length > 7 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                          +{petugas.ruteList.length - 7} lagi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Siklus & Aksi */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-label-12 text-muted-foreground">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>{petugas.selesaiCatat?.slice(0, 10) ?? '—'}</span>
                  </div>
                  <Link
                    href={`/verifikasi/baca-petugas?q=${encodeURIComponent(petugas.nama)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-medium"
                  >
                    Verifikasi Laporan
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. MODAL DRILLDOWN PETUGAS                                */}
        {/* ========================================================= */}
        {selectedPetugas && (
          <Dialog open={Boolean(selectedPetugas)} onOpenChange={(open) => !open && setSelectedPetugas(null)}>
            <DialogContent className="max-w-lg font-sans">
              <DialogHeader>
                <DialogTitle className="text-heading-18 font-bold flex items-center gap-2">
                  <span>Profil Kinerja: {selectedPetugas.nama}</span>
                  <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/25">
                    100% Selesai
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Ringkasan beban kerja pencatatan dan rincian anomali lapangan periode {periode}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-copy-13">
                {/* Ringkasan Beban & Kubikasi */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border p-2.5 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground block">Total Pelanggan Dicatat</span>
                    <span className="font-mono text-copy-16 font-bold text-foreground">
                      {formatNumber(selectedPetugas.terbaca)} SL
                    </span>
                  </div>
                  <div className="rounded-md border border-border p-2.5 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground block">Total Kubikasi Air</span>
                    <span className="font-mono text-copy-16 font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(selectedPetugas.totalM3)} m³
                    </span>
                  </div>
                </div>

                {/* 3 Pilar Temuan Anomali Petugas */}
                <div className="rounded-md border border-border p-3 space-y-2 bg-muted/30">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                    Temuan Anomali Petugas ({selectedPetugas.anomali} Kasus)
                  </span>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded p-2 border border-red-500/20 bg-red-500/5 text-center">
                      <span className="text-[10px] text-muted-foreground block">Lonjakan Ekstrem</span>
                      <span className="font-mono text-copy-14 font-bold text-red-600 dark:text-red-400">
                        {selectedPetugas.totalEkstrim}
                      </span>
                    </div>
                    <div className="rounded p-2 border border-amber-500/20 bg-amber-500/5 text-center">
                      <span className="text-[10px] text-muted-foreground block">Stand 0 m³</span>
                      <span className="font-mono text-copy-14 font-bold text-amber-600 dark:text-amber-400">
                        {selectedPetugas.totalNol}
                      </span>
                    </div>
                    <div className="rounded p-2 border border-blue-500/20 bg-blue-500/5 text-center">
                      <span className="text-[10px] text-muted-foreground block">Turun Drastis</span>
                      <span className="font-mono text-copy-14 font-bold text-blue-600 dark:text-blue-400">
                        {selectedPetugas.totalTurun}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seluruh Rute Binaan */}
                <div className="rounded-md border border-border p-3 space-y-1.5">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                    Daftar {selectedPetugas.totalRute} Rute Binaan:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPetugas.ruteList.map((rute) => (
                      <span
                        key={rute}
                        className="px-2 py-0.5 rounded font-mono text-[11px] bg-muted text-foreground border border-border"
                      >
                        {rute}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Siklus Tanggal Kerja */}
                <div className="flex items-center justify-between text-label-12 text-muted-foreground px-1">
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
