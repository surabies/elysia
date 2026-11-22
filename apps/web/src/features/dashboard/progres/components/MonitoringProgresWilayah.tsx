'use client';

import * as React from 'react';
import {
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Droplets,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PERIODE_TERKUNCI_KANTOR } from '@/config/periode';
import { VerticalProgress } from '@/components/ui/vertical-progress';
import { cn } from '@/lib/utils';
import { ProgresWilayahHeader } from './ProgresWilayahHeader';
import type { PeriodeOption } from '@/server/services/dashboard/dashboard.service';
import type {
  WilayahProgresItem,
  WilayahProgresResult,
} from '@/server/services/cater/cater-progress.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export interface MonitoringProgresWilayahProps {
  initialPeriode?: string;
  availablePeriods?: PeriodeOption[];
}

export function MonitoringProgresWilayah({
  initialPeriode,
  availablePeriods = [],
}: MonitoringProgresWilayahProps = {}) {
  const [data, setData] = React.useState<WilayahProgresResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState(initialPeriode || PERIODE_TERKUNCI_KANTOR);
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = React.useState<'persen' | 'target' | 'anomali'>('persen');

  const periodeLabel = React.useMemo(() => {
    if (availablePeriods && availablePeriods.length > 0) {
      const match = availablePeriods.find((p) => p.thbl === periode);
      if (match) return match.label;
    }
    if (periode && periode.length === 6) {
      const y = periode.slice(0, 4);
      const m = periode.slice(4);
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
        new Date(`${y}-${m}-01T00:00:00`)
      );
    }
    return periode;
  }, [periode, availablePeriods]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/progress/monitoring-wilayah?thbl=${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch wilayah progress:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredWilayah = React.useMemo(() => {
    if (!data?.wilayah) return [];
    let list = [...data.wilayah];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.kelurahanNama.toLowerCase().includes(q) ||
          w.kelurahanKode.toLowerCase().includes(q) ||
          w.kecamatanNama.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'persen') {
      list.sort((a, b) => b.persenSelesai - a.persenSelesai);
    } else if (sortBy === 'target') {
      list.sort((a, b) => b.target - a.target);
    } else if (sortBy === 'anomali') {
      list.sort((a, b) => b.totalAnomali - a.totalAnomali);
    }

    return list;
  }, [data, search, sortBy]);

  const topCapaian = React.useMemo(() => {
    if (!data?.wilayah) return [];
    return [...data.wilayah].sort((a, b) => b.persenSelesai - a.persenSelesai).slice(0, 3);
  }, [data]);

  const butuhPerhatian = React.useMemo(() => {
    if (!data?.wilayah) return [];
    return [...data.wilayah]
      .filter((w) => w.persenSelesai < 50 || w.totalAnomali > 30)
      .sort((a, b) => a.persenSelesai - b.persenSelesai)
      .slice(0, 3);
  }, [data]);

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar Telemetri Vercel Geist (Konsisten dengan Ringkasan, Analytics, dan Monitoring Cater) */}
      <ProgresWilayahHeader
        periodeThbl={periode}
        periodeLabel={periodeLabel}
        availablePeriods={availablePeriods}
        onPeriodChange={setPeriode}
        onRefresh={fetchData}
        loading={loading}
        kpi={data?.kpi}
      />

      {/* 2. KPI Cards Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Target */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Total Target Wilayah</span>
            <Layers className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalTarget) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Dari {data?.kpi.totalKelurahan ?? 0} kelurahan layanan aktif
          </p>
        </Card>

        {/* Realisasi Terbaca */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Realisasi Terbaca</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {data ? numberFormat.format(data.kpi.totalTerbaca) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Sisa {data ? numberFormat.format(data.kpi.totalSisa) : '0'} SL belum tercatat
          </p>
        </Card>

        {/* Rata-rata Progres */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Rata-rata Capaian</span>
            <TrendingUp className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? `${data.kpi.persenRataRata}%` : '...'}
          </div>
          {/* Gaya ||| Bar Vertikal */}
          <VerticalProgress
            value={data?.kpi.persenRataRata ?? 0}
            ticks={28}
            variant="emerald"
            heightClass="h-2.5"
            gapClass="gap-[3px]"
            className="mt-2"
            ariaLabel="Rata-rata Capaian"
          />
        </Card>

        {/* Total Kubikasi */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Akumulasi Kubikasi</span>
            <Droplets className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKubikasi) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-label-12 text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            {data ? numberFormat.format(data.kpi.totalAnomali) : '0'} catatan anomali
          </p>
        </Card>
      </div>

      {/* 3. Top Highlights / Quick Insights */}
      <div className="grid gap-3.5 lg:grid-cols-2">
        {/* Top 3 Kelurahan */}
        <Card className="p-4 border-border bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-label-12 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Kelurahan Capaian Tertinggi
            </h2>
            <span className="text-label-11 text-muted-foreground">3 Teratas</span>
          </div>
          <div className="space-y-2">
            {topCapaian.map((item, idx) => (
              <div
                key={item.kelurahanKode}
                className="flex items-center justify-between p-2.5 rounded-md border border-border bg-(--ds-gray-100) text-copy-12"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-label-11 font-semibold text-emerald-600 dark:text-emerald-400">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-label-13 font-medium text-foreground truncate">{item.kelurahanNama}</p>
                    <p className="text-label-11 text-muted-foreground">{item.kecamatanNama}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <p className="text-label-13 font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.persenSelesai}%
                  </p>
                  <p className="text-label-11 text-muted-foreground">
                    {numberFormat.format(item.terbaca)} / {numberFormat.format(item.target)} SL
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Perlu Perhatian */}
        <Card className="p-4 border-border bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-label-12 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
              Perlu Perhatian Khusus
            </h2>
            <span className="text-label-11 text-muted-foreground">Anomali / Progres Rendah</span>
          </div>
          <div className="space-y-2">
            {butuhPerhatian.map((item) => (
              <div
                key={item.kelurahanKode}
                className="flex items-center justify-between p-2.5 rounded-md border border-border bg-(--ds-gray-100) text-copy-12"
              >
                <div className="truncate min-w-0">
                  <p className="text-label-13 font-medium text-foreground truncate">{item.kelurahanNama}</p>
                  <p className="text-label-11 text-muted-foreground">
                    Seksi {item.seksiKode} • Sisa {numberFormat.format(item.sisa)} SL
                  </p>
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <p className="text-label-13 font-semibold text-amber-600 dark:text-amber-400">
                    {item.totalAnomali} Anomali
                  </p>
                  <p className="text-label-11 text-muted-foreground">
                    Capaian {item.persenSelesai}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Controls: Search, Sort, View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            size="sm"
            placeholder="Cari kelurahan / kecamatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sorting */}
          <div className="flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-label-12 text-muted-foreground">
            <span className="mr-1.5">Urutkan:</span>
            <NativeSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              size="xs"
              className="border-none shadow-none font-semibold text-foreground focus-visible:ring-0 p-0 pr-6"
            >
              <NativeSelectOption value="persen">% Capaian</NativeSelectOption>
              <NativeSelectOption value="target">Target Terbanyak</NativeSelectOption>
              <NativeSelectOption value="anomali">Anomali Terbanyak</NativeSelectOption>
            </NativeSelect>
          </div>

          {/* View Mode */}
          <div className="flex items-center rounded-md border border-border p-0.5 bg-(--ds-gray-100)">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="size-3.5" />
              Tabel
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="size-3.5" />
              Kartu
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Table or Grid */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-primary" />
            <p className="text-copy-12 text-muted-foreground">Memuat data progres wilayah...</p>
          </div>
        </div>
      ) : filteredWilayah.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-copy-13 text-muted-foreground">
          Tidak ada data wilayah yang sesuai pencarian.
        </div>
      ) : viewMode === 'table' ? (
        /* Tabel Rinci menggunakan shadcn Table */
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Kelurahan</TableHead>
                <TableHead>Kecamatan</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Terbaca</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead className="w-48">Progres Capaian</TableHead>
                <TableHead className="text-right">Total Kubikasi</TableHead>
                <TableHead className="text-right">Anomali</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono tabular-nums">
              {filteredWilayah.map((row) => {
                const isComplete = row.persenSelesai >= 100;
                const isGood = row.persenSelesai >= 70;
                const isLow = row.persenSelesai < 40;

                return (
                  <TableRow key={row.kelurahanKode}>
                    <TableCell className="font-medium text-foreground font-sans">
                      {row.kelurahanKode}
                    </TableCell>
                    <TableCell className="font-sans font-medium text-foreground">
                      {row.kelurahanNama}
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground">
                      {row.kecamatanNama}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {numberFormat.format(row.target)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {numberFormat.format(row.terbaca)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {numberFormat.format(row.sisa)}
                    </TableCell>
                    <TableCell className="font-sans">
                      <div className="space-y-1 w-32">
                        <div className="flex justify-between text-label-11 font-mono">
                          <span className="font-semibold text-foreground">{row.persenSelesai}%</span>
                          <span className="text-[10px] text-muted-foreground">{numberFormat.format(row.terbaca)}/{numberFormat.format(row.target)}</span>
                        </div>
                        <VerticalProgress
                          value={row.persenSelesai}
                          ticks={16}
                          variant={isComplete ? "emerald" : isGood ? "blue" : isLow ? "red" : "amber"}
                          heightClass="h-2"
                          gapClass="gap-[2px]"
                          ariaLabel={`Capaian ${row.kelurahanNama}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {numberFormat.format(row.totalM3)} m³
                    </TableCell>
                    <TableCell className="text-right">
                      {row.totalAnomali > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {numberFormat.format(row.totalAnomali)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-sans">
                      {isComplete ? (
                        <Badge variant="green-subtle" size="sm">
                          Selesai
                        </Badge>
                      ) : isGood ? (
                        <Badge variant="blue-subtle" size="sm">
                          Lancar
                        </Badge>
                      ) : (
                        <Badge variant="amber-subtle" size="sm">
                          Berjalan
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Grid Kartu */
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredWilayah.map((row) => (
            <Card
              key={row.kelurahanKode}
              className="p-4 border-border bg-card flex flex-col justify-between gap-3 hover:border-(--ds-gray-500) transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-label-11 font-mono text-muted-foreground uppercase">
                      {row.kelurahanKode} • Seksi {row.seksiKode}
                    </span>
                    <h3 className="text-label-14 font-semibold text-foreground leading-tight mt-0.5">
                      {row.kelurahanNama}
                    </h3>
                    <p className="text-copy-12 text-muted-foreground">{row.kecamatanNama}</p>
                  </div>
                  <span className="font-mono tabular-nums text-label-14 font-semibold text-emerald-600 dark:text-emerald-400">
                    {row.persenSelesai}%
                  </span>
                </div>

                {/* Gaya ||| Bar Vertikal */}
                <div className="mt-3">
                  <VerticalProgress
                    value={row.persenSelesai}
                    ticks={24}
                    variant={
                      row.persenSelesai >= 100
                        ? 'emerald'
                        : row.persenSelesai >= 70
                        ? 'blue'
                        : row.persenSelesai < 40
                        ? 'red'
                        : 'amber'
                    }
                    heightClass="h-2.5"
                    gapClass="gap-[3px]"
                    ariaLabel={`Capaian ${row.kelurahanNama}`}
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1 rounded-md border border-border bg-(--ds-gray-100) p-2 text-center font-mono tabular-nums text-label-12">
                  <div>
                    <span className="block text-label-11 text-muted-foreground font-sans">Target</span>
                    <span className="font-medium text-foreground">{numberFormat.format(row.target)}</span>
                  </div>
                  <div>
                    <span className="block text-label-11 text-muted-foreground font-sans">Terbaca</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{numberFormat.format(row.terbaca)}</span>
                  </div>
                  <div>
                    <span className="block text-label-11 text-muted-foreground font-sans">Sisa</span>
                    <span className="font-medium text-muted-foreground">{numberFormat.format(row.sisa)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2.5 text-label-12 text-muted-foreground">
                <span className="flex items-center gap-1 font-mono tabular-nums">
                  <Droplets className="size-3 text-(--ds-blue-900)" />
                  {numberFormat.format(row.totalM3)} m³
                </span>
                {row.totalAnomali > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium font-mono tabular-nums flex items-center gap-0.5">
                    <AlertTriangle className="size-3" />
                    {row.totalAnomali} Anomali
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
