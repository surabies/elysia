'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Gauge,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface PetugasProgresItem {
  petugasId: string;
  nama: string;
  wilayahKode: string | null;
  ruteList: string[];
  target: number;
  terbaca: number;
  sisa: number;
  persentase: number;
  anomali: number;
  terakhirCatat: string | null;
  durasiRataRataDetik: number;
  statusKerja: 'AKTIF_LAPANGAN' | 'ISTIRAHAT' | 'SELESAI' | 'BELUM_MULAI';
}

export interface MonitoringProgresData {
  periode: string;
  timestamp: string;
  kpi: {
    totalTarget: number;
    totalTerbaca: number;
    totalSisa: number;
    readRatePersen: number;
    totalAnomali: number;
    petugasAktif: number;
    totalPetugas: number;
  };
  petugas: PetugasProgresItem[];
}

export function MonitoringProgresLapangan() {
  const [data, setData] = React.useState<MonitoringProgresData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState<number>(0); // 0 = off, 30 = 30s

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

  // Filter petugas by search keyword
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Monitoring Progres Lapangan Real-Time
            </h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-300 gap-1.5 py-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau laju pencatatan meter, target DPM, dan performa petugas catat meter per rute
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Select */}
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setAutoRefreshInterval(0)}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                autoRefreshInterval === 0
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Manual
            </button>
            <button
              onClick={() => setAutoRefreshInterval(30)}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                autoRefreshInterval === 30
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Auto 30s
            </button>
            <button
              onClick={() => setAutoRefreshInterval(60)}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                autoRefreshInterval === 60
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Auto 60s
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Target DPM */}
        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Target Beban (DPM)</span>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">
              {data?.kpi.totalTarget.toLocaleString('id-ID') ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">Pelanggan</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Beban total rute berjalan
          </p>
        </Card>

        {/* Realisasi Pembacaan */}
        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Realisasi Tercatat</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <CheckCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {data?.kpi.totalTerbaca.toLocaleString('id-ID') ?? '—'}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              ({data?.kpi.readRatePersen ?? 0}%)
            </span>
          </div>
          {/* Progress bar line */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, data?.kpi.readRatePersen ?? 0)}%` }}
            />
          </div>
        </Card>

        {/* Sisa Belum Terbaca */}
        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Sisa Belum Terbaca</span>
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">
              {data?.kpi.totalSisa.toLocaleString('id-ID') ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">Pelanggan</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Masih dalam rute kunjungan
          </p>
        </Card>

        {/* Petugas Aktif Lapangan */}
        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Petugas Lapangan</span>
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-600">
              {data?.kpi.petugasAktif ?? 0} / {data?.kpi.totalPetugas ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">Petugas</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {data?.kpi.petugasAktif ?? 0} aktif submit data hari ini
          </p>
        </Card>
      </div>

      {/* Main Content: Search & Layout Switcher */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama petugas atau rute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>

          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Tampilan Tabel Rinci"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode: Grid Kartu Petugas */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPetugas.map((petugas) => (
              <Card
                key={petugas.petugasId}
                className="p-5 border bg-card/80 backdrop-blur transition-all hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {petugas.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground leading-tight">
                          {petugas.nama}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {petugas.petugasId} · {petugas.wilayahKode ?? 'Wilayah'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        petugas.statusKerja === 'SELESAI'
                          ? 'default'
                          : petugas.statusKerja === 'AKTIF_LAPANGAN'
                          ? 'outline'
                          : 'secondary'
                      }
                      className={cn(
                        'text-[10px] px-2 py-0.5',
                        petugas.statusKerja === 'AKTIF_LAPANGAN' &&
                          'bg-emerald-500/10 text-emerald-600 border-emerald-300 font-semibold',
                        petugas.statusKerja === 'SELESAI' && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {petugas.statusKerja === 'AKTIF_LAPANGAN'
                        ? 'Aktif Lapangan'
                        : petugas.statusKerja === 'SELESAI'
                        ? 'Selesai 100%'
                        : 'Belum Mulai'}
                    </Badge>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-muted-foreground">Progres Pencatatan:</span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {petugas.persentase}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          petugas.persentase >= 100
                            ? 'bg-primary'
                            : petugas.persentase >= 75
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        )}
                        style={{ width: `${Math.min(100, petugas.persentase)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Metric Columns: Target | Terbaca | Sisa */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center rounded-lg bg-muted/30 p-2.5 border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Target</span>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {petugas.target.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Terbaca</span>
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        {petugas.terbaca.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Sisa</span>
                      <span className="font-mono text-xs font-bold text-amber-600">
                        {petugas.sisa.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Routes Tags */}
                  <div className="mt-3">
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      Rute Penugasan ({petugas.ruteList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {petugas.ruteList.map((rute) => (
                        <span
                          key={rute}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border"
                        >
                          {rute}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Last Active & Action */}
                <div className="pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {petugas.terakhirCatat
                        ? new Date(petugas.terakhirCatat).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Belum ada'}
                    </span>
                  </div>
                  <Link
                    href={`/verifikasi/baca-petugas?q=${petugas.petugasId}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
                  >
                    Verifikasi Hasil
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* View Mode: Tabel Rinci menggunakan shadcn Table */
          <Card className="border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Terbaca</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Progres %</TableHead>
                  <TableHead>Rute</TableHead>
                  <TableHead>Aktivitas Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPetugas.map((petugas) => (
                  <TableRow key={petugas.petugasId}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {petugas.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-semibold">{petugas.nama}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {petugas.petugasId}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          petugas.statusKerja === 'AKTIF_LAPANGAN' &&
                            'bg-emerald-500/10 text-emerald-600 border-emerald-300'
                        )}
                      >
                        {petugas.statusKerja === 'AKTIF_LAPANGAN' ? 'Aktif' : 'Selesai'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {petugas.target.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-600">
                      {petugas.terbaca.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-amber-600">
                      {petugas.sisa.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, petugas.persentase)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs w-10 text-right">
                          {petugas.persentase}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                      {petugas.ruteList.join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">
                      {petugas.terakhirCatat
                        ? new Date(petugas.terakhirCatat).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/verifikasi/baca-petugas?q=${petugas.petugasId}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        Verifikasi
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
