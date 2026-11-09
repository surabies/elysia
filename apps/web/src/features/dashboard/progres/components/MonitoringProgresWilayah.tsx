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
import { cn } from '@/lib/utils';
import type {
  WilayahProgresItem,
  WilayahProgresResult,
} from '@/server/services/cater/cater-progress.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function MonitoringProgresWilayah() {
  const [data, setData] = React.useState<WilayahProgresResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = React.useState<'persen' | 'target' | 'anomali'>('persen');

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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MapPin className="size-6 text-primary" />
            Monitoring Progres Wilayah
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Persentase capaian pembacaan meter air per kelurahan dan zona distribusi operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs">
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

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Target */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Target Wilayah</span>
            <Layers className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalTarget) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Dari {data?.kpi.totalKelurahan ?? 0} kelurahan layanan aktif
          </p>
        </Card>

        {/* Realisasi Terbaca */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Realisasi Terbaca</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {data ? numberFormat.format(data.kpi.totalTerbaca) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sisa {data ? numberFormat.format(data.kpi.totalSisa) : '0'} SL belum tercatat
          </p>
        </Card>

        {/* Rata-rata Progres */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rata-rata Capaian</span>
            <TrendingUp className="size-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? `${data.kpi.persenRataRata}%` : '...'}
          </div>
          <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, data?.kpi.persenRataRata ?? 0)}%` }}
            />
          </div>
        </Card>

        {/* Total Kubikasi */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Akumulasi Kubikasi</span>
            <Droplets className="size-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKubikasi) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="size-3" />
            {data ? numberFormat.format(data.kpi.totalAnomali) : '0'} catatan anomali
          </p>
        </Card>
      </div>

      {/* 3. Top Highlights / Quick Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top 3 Kelurahan */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Kelurahan Capaian Tertinggi
            </h2>
            <span className="text-[11px] text-muted-foreground">3 Teratas</span>
          </div>
          <div className="space-y-2">
            {topCapaian.map((item, idx) => (
              <div
                key={item.kelurahanKode}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">{item.kelurahanNama}</p>
                    <p className="text-[10px] text-muted-foreground">{item.kecamatanNama}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {item.persenSelesai}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {numberFormat.format(item.terbaca)} / {numberFormat.format(item.target)} SL
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Perlu Perhatian */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-amber-500" />
              Perlu Perhatian Khusus
            </h2>
            <span className="text-[11px] text-muted-foreground">Anomali / Progres Rendah</span>
          </div>
          <div className="space-y-2">
            {butuhPerhatian.map((item) => (
              <div
                key={item.kelurahanKode}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs"
              >
                <div className="truncate min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.kelurahanNama}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Seksi {item.seksiKode} • Sisa {numberFormat.format(item.sisa)} SL
                  </p>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    {item.totalAnomali} Anomali
                  </p>
                  <p className="text-[10px] text-muted-foreground">
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
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari kelurahan / kecamatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sorting */}
          <div className="flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
            <span className="mr-1.5 font-medium">Urutkan:</span>
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
          <div className="flex items-center rounded-md border border-border p-0.5 bg-card">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-7 px-2 text-xs gap-1"
            >
              <TableIcon className="size-3.5" />
              Tabel
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-2 text-xs gap-1"
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
            <p className="text-xs text-muted-foreground">Memuat data progres wilayah...</p>
          </div>
        </div>
      ) : filteredWilayah.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Tidak ada data wilayah yang sesuai pencarian.
        </div>
      ) : viewMode === 'table' ? (
        /* Tabel Rinci menggunakan shadcn Table */
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
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
            <TableBody className="font-mono">
              {filteredWilayah.map((row) => {
                const isComplete = row.persenSelesai >= 100;
                const isGood = row.persenSelesai >= 70;
                const isLow = row.persenSelesai < 40;

                return (
                  <TableRow key={row.kelurahanKode}>
                    <TableCell className="font-semibold text-foreground font-sans">
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
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {numberFormat.format(row.terbaca)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {numberFormat.format(row.sisa)}
                    </TableCell>
                    <TableCell className="font-sans">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-semibold text-foreground">{row.persenSelesai}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              isComplete
                                ? 'bg-emerald-500'
                                : isGood
                                ? 'bg-primary'
                                : isLow
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            )}
                            style={{ width: `${Math.min(100, row.persenSelesai)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {numberFormat.format(row.totalM3)} m³
                    </TableCell>
                    <TableCell className="text-right">
                      {row.totalAnomali > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {numberFormat.format(row.totalAnomali)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-sans">
                      {isComplete ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                          Selesai
                        </Badge>
                      ) : isGood ? (
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10">
                          Lancar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
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
              className="p-4 rounded-[10px] border-border bg-card shadow-xs flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                      {row.kelurahanKode} • Seksi {row.seksiKode}
                    </span>
                    <h3 className="font-semibold text-foreground text-sm leading-tight mt-0.5">
                      {row.kelurahanNama}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{row.kecamatanNama}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {row.persenSelesai}%
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        row.persenSelesai >= 100
                          ? 'bg-emerald-500'
                          : row.persenSelesai >= 70
                          ? 'bg-primary'
                          : row.persenSelesai < 40
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.min(100, row.persenSelesai)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-muted/30 p-2 text-center font-mono text-[11px]">
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-sans">Target</span>
                    <span className="font-semibold text-foreground">{numberFormat.format(row.target)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-sans">Terbaca</span>
                    <span className="font-semibold text-emerald-600">{numberFormat.format(row.terbaca)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-sans">Sisa</span>
                    <span className="font-semibold text-muted-foreground">{numberFormat.format(row.sisa)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Droplets className="size-3 text-teal-500" />
                  {numberFormat.format(row.totalM3)} m³
                </span>
                {row.totalAnomali > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono flex items-center gap-0.5">
                    <AlertTriangle className="size-3" />
                    {row.totalAnomali} Anomali
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
