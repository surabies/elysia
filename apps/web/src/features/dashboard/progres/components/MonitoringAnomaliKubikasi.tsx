'use client';

import * as React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Gauge,
  HelpCircle,
  MapPin,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type {
  AnomaliKubikasiItem,
  AnomaliKubikasiResult,
  JenisAnomali,
} from '@/server/services/cater/cater-progress.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function MonitoringAnomaliKubikasi() {
  const [data, setData] = React.useState<AnomaliKubikasiResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [jenisFilter, setJenisFilter] = React.useState<'all' | 'ekstrim' | 'nol' | 'turun'>('all');
  const [search, setSearch] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<AnomaliKubikasiItem | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const filterParam = jenisFilter !== 'all' ? `&jenis=${jenisFilter}` : '';
      const res = await fetch(
        `/api/cater/progress/anomali?thbl=${periode}${filterParam}${q}&limit=150`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch anomali kubikasi:', err);
    } finally {
      setLoading(false);
    }
  }, [periode, jenisFilter, search]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Gauge className="size-6 text-amber-500" />
            Monitoring Anomali Kubikasi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Deteksi dini lonjakan pemakaian ekstrem, penurunan drastis, dan stand meter 0 m³.
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

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Anomali */}
        <Card
          onClick={() => setJenisFilter('all')}
          className={cn(
            'p-4 rounded-[10px] border-border bg-card shadow-xs cursor-pointer transition-all hover:border-primary/50',
            jenisFilter === 'all' && 'ring-2 ring-primary border-transparent'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Anomali Terdeteksi</span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalAnomali) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Rekening berpotensi kelainan catat
          </p>
        </Card>

        {/* Lonjakan Ekstrem */}
        <Card
          onClick={() => setJenisFilter('ekstrim')}
          className={cn(
            'p-4 rounded-[10px] border-border bg-card shadow-xs cursor-pointer transition-all hover:border-rose-500/50',
            jenisFilter === 'ekstrim' && 'ring-2 ring-rose-500 border-transparent'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Lonjakan Ekstrem (&gt;50 m³)</span>
            <TrendingUp className="size-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalEkstrim) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Pemakaian melompat tinggi
          </p>
        </Card>

        {/* Pemakaian Nol */}
        <Card
          onClick={() => setJenisFilter('nol')}
          className={cn(
            'p-4 rounded-[10px] border-border bg-card shadow-xs cursor-pointer transition-all hover:border-amber-500/50',
            jenisFilter === 'nol' && 'ring-2 ring-amber-500 border-transparent'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Stand 0 m³ (Nihil / Macet)</span>
            <HelpCircle className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalNol) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Meter tidak bergerak / rumah kosong
          </p>
        </Card>

        {/* Pemakaian Turun */}
        <Card
          onClick={() => setJenisFilter('turun')}
          className={cn(
            'p-4 rounded-[10px] border-border bg-card shadow-xs cursor-pointer transition-all hover:border-sky-500/50',
            jenisFilter === 'turun' && 'ring-2 ring-sky-500 border-transparent'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pemakaian Turun Drastis</span>
            <TrendingDown className="size-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalTurun) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Turun &gt; 50% dari bulan lalu
          </p>
        </Card>
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border w-fit">
          <Button
            variant={jenisFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setJenisFilter('all')}
            className="h-7 text-xs"
          >
            Semua Anomali
          </Button>
          <Button
            variant={jenisFilter === 'ekstrim' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setJenisFilter('ekstrim')}
            className="h-7 text-xs gap-1"
          >
            <TrendingUp className="size-3 text-rose-500" />
            Lonjakan Ekstrem
          </Button>
          <Button
            variant={jenisFilter === 'nol' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setJenisFilter('nol')}
            className="h-7 text-xs gap-1"
          >
            <HelpCircle className="size-3 text-amber-500" />
            Stand 0 m³
          </Button>
          <Button
            variant={jenisFilter === 'turun' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setJenisFilter('turun')}
            className="h-7 text-xs gap-1"
          >
            <TrendingDown className="size-3 text-sky-500" />
            Turun Drastis
          </Button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari NOLG, nama, atau rute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* 4. Anomaly Data Table */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-primary" />
            <p className="text-xs text-muted-foreground">Memuat daftar kasus anomali...</p>
          </div>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Tidak ditemukan kasus anomali pada filter ini.
        </div>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Pelanggan & Alamat</TableHead>
                <TableHead>Rute / Wilayah</TableHead>
                <TableHead className="text-right">Stand Lalu</TableHead>
                <TableHead className="text-right">Stand Akhir</TableHead>
                <TableHead className="text-right">Pakai m³</TableHead>
                <TableHead className="text-right">Bulan Lalu</TableHead>
                <TableHead className="text-right">Deviasi</TableHead>
                <TableHead className="text-center">Jenis Anomali</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono">
              {data.items.map((row) => {
                const isEkstrim = row.jenisAnomali === 'EKSTRIM';
                const isNol = row.jenisAnomali === 'NOL';
                const isTurun = row.jenisAnomali === 'TURUN';

                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedItem(row)}
                  >
                    <TableCell className="font-semibold text-foreground font-sans">
                      {row.nolg}
                    </TableCell>
                    <TableCell className="font-sans">
                      <div className="max-w-[200px] truncate">
                        <p className="font-semibold text-foreground truncate">{row.nama}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{row.alamat}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground">
                      <div className="text-[11px]">
                        <span className="font-semibold text-foreground font-mono">{row.ruteKode ?? '-'}</span>
                        <p className="text-[10px] text-muted-foreground">{row.kelurahanNama ?? '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {numberFormat.format(row.stml)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {numberFormat.format(row.stma)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {numberFormat.format(row.pakaiM3)} m³
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {numberFormat.format(row.pakaiLalu)} m³
                    </TableCell>
                    <TableCell className="text-right">
                      {row.selisihM3 > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
                          <ArrowUpRight className="size-3" />
                          +{row.selisihM3} (+{row.persenDeviasi}%)
                        </span>
                      ) : row.selisihM3 < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-semibold">
                          <ArrowDownRight className="size-3" />
                          {row.selisihM3} ({row.persenDeviasi}%)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0%</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-sans">
                      {isEkstrim ? (
                        <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-500/30 bg-rose-500/10">
                          Lonjakan Ekstrem
                        </Badge>
                      ) : isNol ? (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                          Stand 0 m³
                        </Badge>
                      ) : isTurun ? (
                        <Badge variant="outline" className="text-[10px] text-sky-600 border-sky-500/30 bg-sky-500/10">
                          Turun Drastis
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground max-w-[140px] truncate">
                      {row.ketCatat ?? 'Normal'}
                    </TableCell>
                    <TableCell className="text-center font-sans">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(row);
                        }}
                      >
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 5. Detail Modal Preview using shadcn Dialog */}
      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                NOLG: {selectedItem.nolg} • Periode {selectedItem.thbl}
              </div>
              <DialogTitle className="text-base font-bold text-foreground leading-snug mt-0.5">
                {selectedItem.nama}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedItem.alamat}
              </DialogDescription>
            </DialogHeader>

            {/* Stand comparison */}
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center font-mono">
              <div>
                <span className="block text-[11px] text-muted-foreground font-sans">Stand Lalu</span>
                <span className="text-sm font-semibold text-foreground">
                  {numberFormat.format(selectedItem.stml)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground font-sans">Stand Akhir</span>
                <span className="text-sm font-bold text-primary">
                  {numberFormat.format(selectedItem.stma)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground font-sans">Pemakaian</span>
                <span className="text-sm font-bold text-foreground">
                  {numberFormat.format(selectedItem.pakaiM3)} m³
                </span>
              </div>
            </div>

            {/* Anomaly summary box */}
            <div className="rounded-lg border border-border p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kategori Anomali:</span>
                <Badge variant="outline" className="font-semibold text-xs">
                  {selectedItem.jenisAnomali}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Deviasi dari Bulan Lalu:</span>
                <span className="font-mono font-semibold">
                  {selectedItem.selisihM3 > 0 ? `+${selectedItem.selisihM3} m³` : `${selectedItem.selisihM3} m³`}{' '}
                  ({selectedItem.persenDeviasi}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Keterangan Petugas:</span>
                <span className="font-medium text-foreground">{selectedItem.ketCatat ?? 'Normal'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Petugas Lapangan:</span>
                <span className="font-medium text-foreground">{selectedItem.petugasNama ?? '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rute & Kelurahan:</span>
                <span className="font-medium text-foreground">
                  {selectedItem.ruteKode ?? '-'} • {selectedItem.kelurahanNama ?? '-'}
                </span>
              </div>
            </div>

            {/* Photo fallback preview */}
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center">
              <img
                src={selectedItem.fotoMeterUrl || '/images/meter/petugas.jpg'}
                alt="Foto bukti meter"
                className="mx-auto h-40 object-cover rounded-md border border-border"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Dokumentasi fisik meter pelanggan
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
