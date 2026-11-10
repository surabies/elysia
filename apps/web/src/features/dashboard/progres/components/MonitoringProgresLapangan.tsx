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
import { PageContainer } from '@/components/layout/page/PageContainer';
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
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-20 text-foreground">
              Monitoring Progres Lapangan Real-Time
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400 gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </Badge>
          </div>
          <p className="text-copy-13 text-muted-foreground mt-1">
            Pantau laju pencatatan meter, target DPM, dan performa petugas catat meter per rute
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Select */}
          <div className="inline-flex rounded-md border border-border bg-(--ds-gray-100) p-0.5">
            <Button
              size="xs"
              variant={autoRefreshInterval === 0 ? 'secondary' : 'ghost'}
              onClick={() => setAutoRefreshInterval(0)}
            >
              Manual
            </Button>
            <Button
              size="xs"
              variant={autoRefreshInterval === 30 ? 'secondary' : 'ghost'}
              onClick={() => setAutoRefreshInterval(30)}
            >
              Auto 30s
            </Button>
            <Button
              size="xs"
              variant={autoRefreshInterval === 60 ? 'secondary' : 'ghost'}
              onClick={() => setAutoRefreshInterval(60)}
            >
              Auto 60s
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Ribbon */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Target DPM */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground">Target Beban (DPM)</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono tabular-nums text-foreground">
              {data?.kpi.totalTarget.toLocaleString('id-ID') ?? '—'}
            </span>
            <span className="text-label-12 text-muted-foreground">Pelanggan</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Beban total rute berjalan
          </p>
        </Card>

        {/* Realisasi Pembacaan */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground">Realisasi Tercatat</span>
            <CheckCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {data?.kpi.totalTerbaca.toLocaleString('id-ID') ?? '—'}
            </span>
            <span className="text-label-12 font-semibold text-emerald-600 dark:text-emerald-400">
              ({data?.kpi.readRatePersen ?? 0}%)
            </span>
          </div>
          {/* Progress bar line */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-(--ds-gray-200) overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, data?.kpi.readRatePersen ?? 0)}%` }}
            />
          </div>
        </Card>

        {/* Sisa Belum Terbaca */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground">Sisa Belum Terbaca</span>
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono tabular-nums text-foreground">
              {data?.kpi.totalSisa.toLocaleString('id-ID') ?? '—'}
            </span>
            <span className="text-label-12 text-muted-foreground">Pelanggan</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Masih dalam rute kunjungan
          </p>
        </Card>

        {/* Petugas Aktif Lapangan */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground">Petugas Lapangan</span>
            <Activity className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono tabular-nums text-(--ds-blue-900)">
              {data?.kpi.petugasAktif ?? 0} / {data?.kpi.totalPetugas ?? 0}
            </span>
            <span className="text-label-12 text-muted-foreground">Petugas</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            {data?.kpi.petugasAktif ?? 0} aktif submit data hari ini
          </p>
        </Card>
      </div>

      {/* Main Content: Search & Layout Switcher */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              size="sm"
              type="text"
              placeholder="Cari nama petugas atau rute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-card"
            />
          </div>

          <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5 bg-(--ds-gray-100)">
            <Button
              size="xs"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('grid')}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              size="xs"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel Rinci"
            >
              <TableIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* View Mode: Grid Kartu Petugas */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPetugas.map((petugas) => (
              <Card
                key={petugas.petugasId}
                className="p-4 border-border bg-card transition-colors hover:border-(--ds-gray-500) flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-full border border-border bg-(--ds-gray-100) text-foreground flex items-center justify-center text-label-12 font-semibold shrink-0">
                        {petugas.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-label-14 font-semibold text-foreground leading-tight">
                          {petugas.nama}
                        </h3>
                        <p className="text-label-11 text-muted-foreground font-mono mt-0.5">
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
                        petugas.statusKerja === 'AKTIF_LAPANGAN' &&
                          'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400'
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
                    <div className="flex justify-between items-baseline text-label-12">
                      <span className="text-muted-foreground">Progres Pencatatan:</span>
                      <span className="font-mono tabular-nums font-semibold text-foreground">
                        {petugas.persentase}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-(--ds-gray-200) overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          petugas.persentase >= 100
                            ? 'bg-foreground'
                            : petugas.persentase >= 75
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        )}
                        style={{ width: `${Math.min(100, petugas.persentase)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Metric Columns: Target | Terbaca | Sisa */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center rounded-md bg-(--ds-gray-100) p-2.5 border border-border">
                    <div>
                      <span className="text-label-11 text-muted-foreground block">Target</span>
                      <span className="font-mono tabular-nums text-label-12 font-semibold text-foreground">
                        {petugas.target.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-label-11 text-muted-foreground block">Terbaca</span>
                      <span className="font-mono tabular-nums text-label-12 font-semibold text-emerald-600 dark:text-emerald-400">
                        {petugas.terbaca.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-label-11 text-muted-foreground block">Sisa</span>
                      <span className="font-mono tabular-nums text-label-12 font-semibold text-amber-600 dark:text-amber-400">
                        {petugas.sisa.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Routes Tags */}
                  <div className="mt-3">
                    <span className="text-label-11 text-muted-foreground block mb-1">
                      Rute Penugasan ({petugas.ruteList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {petugas.ruteList.map((rute) => (
                        <span
                          key={rute}
                          className="px-1.5 py-0.5 rounded text-label-11 font-mono bg-(--ds-gray-100) text-muted-foreground border border-border"
                        >
                          {rute}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Last Active & Action */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-label-12 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
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
                    className="inline-flex items-center gap-1 text-(--ds-blue-900) hover:underline text-label-12"
                  >
                    Verifikasi Hasil
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* View Mode: Tabel Rinci menggunakan shadcn Table */
          <Card className="border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
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
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full border border-border bg-(--ds-gray-100) text-foreground flex items-center justify-center text-label-11 shrink-0">
                          {petugas.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-medium">{petugas.nama}</span>
                          <span className="text-label-11 text-muted-foreground font-mono">
                            {petugas.petugasId}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          petugas.statusKerja === 'AKTIF_LAPANGAN' &&
                            'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400'
                        )}
                      >
                        {petugas.statusKerja === 'AKTIF_LAPANGAN' ? 'Aktif' : 'Selesai'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-medium">
                      {petugas.target.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      {petugas.terbaca.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-medium text-amber-600 dark:text-amber-400">
                      {petugas.sisa.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-(--ds-gray-200) overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, petugas.persentase)}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums font-medium text-label-12 w-10 text-right">
                          {petugas.persentase}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-label-12 text-muted-foreground max-w-xs truncate">
                      {petugas.ruteList.join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-label-12 font-mono">
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
                        className="inline-flex items-center gap-1 text-label-12 text-(--ds-blue-900) hover:underline"
                      >
                        Verifikasi
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
