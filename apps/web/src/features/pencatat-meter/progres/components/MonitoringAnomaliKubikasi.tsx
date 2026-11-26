'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PERIODE_TERKUNCI_KANTOR } from '@/config/periode';
import { cn } from '@/lib/utils';
import type { PeriodeOption } from '@/server/services/dashboard/dashboard.service';
import type {
  AnomaliKubikasiItem,
  AnomaliKubikasiResult,
  JenisAnomali,
} from '@/server/services/cater/cater-progress.service';
import { AnomaliKubikasiHeader } from './AnomaliKubikasiHeader';

const numberFormat = new Intl.NumberFormat('id-ID');

export interface MonitoringAnomaliKubikasiProps {
  initialPeriode?: string;
  availablePeriods?: PeriodeOption[];
}

export function MonitoringAnomaliKubikasi({
  initialPeriode,
  availablePeriods = [],
}: MonitoringAnomaliKubikasiProps) {
  const router = useRouter();
  const [data, setData] = React.useState<AnomaliKubikasiResult | null>(null);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [periode, setPeriode] = React.useState(initialPeriode || PERIODE_TERKUNCI_KANTOR);
  const [jenisFilter, setJenisFilter] = React.useState<'all' | 'ekstrim' | 'nol' | 'turun'>('all');
  const [search, setSearch] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<AnomaliKubikasiItem | null>(null);

  React.useEffect(() => {
    if (initialPeriode && initialPeriode !== periode) {
      setPeriode(initialPeriode);
    }
  }, [initialPeriode]);

  const periodeLabel = React.useMemo(() => {
    const found = availablePeriods.find((p) => p.thbl === periode);
    if (found) return found.label;
    if (periode.length === 6) {
      const yr = periode.substring(0, 4);
      const mo = parseInt(periode.substring(4, 6), 10);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      if (mo >= 1 && mo <= 12) {
        return `${monthNames[mo - 1]} ${yr}`;
      }
    }
    return periode;
  }, [periode, availablePeriods]);

  const handlePeriodChange = (nextThbl: string) => {
    if (!nextThbl || nextThbl === periode) return;
    setPeriode(nextThbl);
    router.push(`/progres/ekstrim?periode=${encodeURIComponent(nextThbl)}`, {
      scroll: false,
    });
  };

  const fetchData = React.useCallback(async (isFirst = false) => {
    if (isFirst) setInitialLoading(true);
    else setIsUpdating(true);
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
      setInitialLoading(false);
      setIsUpdating(false);
    }
  }, [periode, jenisFilter, search]);

  React.useEffect(() => {
    fetchData(true);
  }, [periode]);

  React.useEffect(() => {
    fetchData(false);
  }, [jenisFilter, search]);

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar Vercel Geist Telemetry */}
      <AnomaliKubikasiHeader
        periodeThbl={periode}
        periodeLabel={periodeLabel}
        availablePeriods={availablePeriods}
        onPeriodChange={handlePeriodChange}
        onRefresh={() => fetchData(false)}
        loading={isUpdating || initialLoading}
        kpi={data?.kpi}
      />

      {/* 2. KPI Cards (Filter Triggers - Vercel Geist Subtle Background Style Tanpa Border Kaku) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Anomali */}
        <div
          onClick={() => setJenisFilter('all')}
          className={cn(
            'p-4 rounded-lg border border-transparent cursor-pointer transition-all',
            jenisFilter === 'all'
              ? 'bg-(--ds-red-200) ring-1 ring-(--ds-red-700)/25 shadow-xs'
              : 'bg-(--ds-red-100) hover:bg-(--ds-red-200)'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-label-12 font-medium text-(--ds-red-900)">Total Anomali Terdeteksi</span>
            <div className="flex items-center gap-1.5">
              {jenisFilter === 'all' && (
                <span className="size-1.5 rounded-full bg-(--ds-red-700) animate-pulse" />
              )}
              <AlertTriangle className="size-4 text-(--ds-red-700)" />
            </div>
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-red-900) font-mono font-bold tabular-nums">
            {data ? numberFormat.format(data.kpi.totalAnomali) : '...'}
            <span className="text-label-12 font-normal text-(--ds-red-900)/70 ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-(--ds-red-900)/80">
            Rekening berpotensi kelainan catat
          </p>
        </div>

        {/* Lonjakan Ekstrem */}
        <div
          onClick={() => setJenisFilter('ekstrim')}
          className={cn(
            'p-4 rounded-lg border border-transparent cursor-pointer transition-all',
            jenisFilter === 'ekstrim'
              ? 'bg-(--ds-red-200) ring-1 ring-(--ds-red-700)/25 shadow-xs'
              : 'bg-(--ds-red-100) hover:bg-(--ds-red-200)'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-label-12 font-medium text-(--ds-red-900)">Lonjakan Ekstrem (&gt;50 m³)</span>
            <div className="flex items-center gap-1.5">
              {jenisFilter === 'ekstrim' && (
                <span className="size-1.5 rounded-full bg-(--ds-red-700) animate-pulse" />
              )}
              <TrendingUp className="size-4 text-(--ds-red-700)" />
            </div>
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-red-900) font-mono font-bold tabular-nums">
            {data ? numberFormat.format(data.kpi.totalEkstrim) : '...'}
            <span className="text-label-12 font-normal text-(--ds-red-900)/70 ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-(--ds-red-900)/80">
            Pemakaian melompat tinggi
          </p>
        </div>

        {/* Pemakaian Nol */}
        <div
          onClick={() => setJenisFilter('nol')}
          className={cn(
            'p-4 rounded-lg border border-transparent cursor-pointer transition-all',
            jenisFilter === 'nol'
              ? 'bg-(--ds-amber-200) ring-1 ring-(--ds-amber-700)/25 shadow-xs'
              : 'bg-(--ds-amber-100) hover:bg-(--ds-amber-200)'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-label-12 font-medium text-(--ds-amber-900)">Stand 0 m³ (Nihil / Macet)</span>
            <div className="flex items-center gap-1.5">
              {jenisFilter === 'nol' && (
                <span className="size-1.5 rounded-full bg-(--ds-amber-700) animate-pulse" />
              )}
              <HelpCircle className="size-4 text-(--ds-amber-700)" />
            </div>
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-amber-900) font-mono font-bold tabular-nums">
            {data ? numberFormat.format(data.kpi.totalNol) : '...'}
            <span className="text-label-12 font-normal text-(--ds-amber-900)/70 ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-(--ds-amber-900)/80">
            Meter tidak bergerak / rumah kosong
          </p>
        </div>

        {/* Pemakaian Turun */}
        <div
          onClick={() => setJenisFilter('turun')}
          className={cn(
            'p-4 rounded-lg border border-transparent cursor-pointer transition-all',
            jenisFilter === 'turun'
              ? 'bg-(--ds-blue-200) ring-1 ring-(--ds-blue-700)/25 shadow-xs'
              : 'bg-(--ds-blue-100) hover:bg-(--ds-blue-200)'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-label-12 font-medium text-(--ds-blue-900)">Pemakaian Turun Drastis</span>
            <div className="flex items-center gap-1.5">
              {jenisFilter === 'turun' && (
                <span className="size-1.5 rounded-full bg-(--ds-blue-700) animate-pulse" />
              )}
              <TrendingDown className="size-4 text-(--ds-blue-700)" />
            </div>
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-blue-900) font-mono font-bold tabular-nums">
            {data ? numberFormat.format(data.kpi.totalTurun) : '...'}
            <span className="text-label-12 font-normal text-(--ds-blue-900)/70 ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-(--ds-blue-900)/80">
            Turun &gt; 50% dari bulan lalu
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PANEL DAFTAR KASUS ANOMALI (Standar Container Geist)   */}
      {/* ========================================================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-none space-y-4">
        {/* Header Panel Toolbar dengan Fitur Filter Lengkap & Konsisten */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-(--ds-amber-700)" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Daftar Temuan Kasus Anomali Meter
              </h2>
              <Badge variant="pill" size="sm" className="font-mono">
                {data?.items?.length ?? 0} Kasus Ditampilkan
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftar pelanggan terindikasi lonjakan ekstrem, meter tidak bergerak (0 m³), atau penurunan drastis periode {periodeLabel}.
            </p>
          </div>

          {/* Filter Controls Row (Pencarian Cepat) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                size="sm"
                placeholder="Cari NOLG, nama, atau rute…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs bg-background border-border shadow-none"
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
          </div>
        </div>

        {/* 4. Anomaly Data Table (Transisi Mulus Tanpa Unmount) */}
        {initialLoading && !data ? (
          <div className="flex h-64 w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="size-6 text-primary" />
              <p className="text-copy-12 text-muted-foreground">Memuat daftar kasus anomali...</p>
            </div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-copy-13 text-muted-foreground">
            Tidak ditemukan kasus anomali pada filter ini.
          </div>
        ) : (
          <div className={cn(
            "border border-border rounded-lg bg-card overflow-hidden transition-opacity duration-150",
            isUpdating && "opacity-60"
          )}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Langganan</TableHead>
                  <TableHead>Pelanggan &amp; Alamat</TableHead>
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
              <TableBody className="font-mono tabular-nums">
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
                      <TableCell className="font-medium text-foreground font-sans">
                        {row.nolg}
                      </TableCell>
                      <TableCell className="font-sans">
                        <div className="max-w-[200px] truncate">
                          <p className="font-medium text-foreground truncate">{row.nama}</p>
                          <p className="text-label-11 text-muted-foreground truncate">{row.alamat}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans text-muted-foreground">
                        <div className="text-label-12">
                          <span className="font-medium text-foreground font-mono">{row.ruteKode ?? '-'}</span>
                          <p className="text-label-11 text-muted-foreground">{row.kelurahanNama ?? '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {numberFormat.format(row.stml)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {numberFormat.format(row.stma)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {numberFormat.format(row.pakaiM3)} m³
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {numberFormat.format(row.pakaiLalu)} m³
                      </TableCell>
                      <TableCell className="text-right">
                        {row.selisihM3 > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-(--ds-red-900) font-medium">
                            <ArrowUpRight className="size-3 text-(--ds-red-700)" />
                            +{row.selisihM3} (+{row.persenDeviasi}%)
                          </span>
                        ) : row.selisihM3 < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-(--ds-blue-900) font-medium">
                            <ArrowDownRight className="size-3 text-(--ds-blue-700)" />
                            {row.selisihM3} ({row.persenDeviasi}%)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-sans">
                        {isEkstrim ? (
                          <Badge variant="red-subtle" size="sm">
                            Lonjakan Ekstrem
                          </Badge>
                        ) : isNol ? (
                          <Badge variant="amber-subtle" size="sm">
                            Stand 0 m³
                          </Badge>
                        ) : isTurun ? (
                          <Badge variant="blue-subtle" size="sm">
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
                          size="icon-xs"
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
          </div>
        )}
      </div>

      {/* 5. Detail Modal Preview using shadcn Dialog */}
      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="text-label-11 font-mono text-muted-foreground uppercase">
                NOLG: {selectedItem.nolg} • Periode {selectedItem.thbl}
              </div>
              <DialogTitle className="mt-0.5">
                {selectedItem.nama}
              </DialogTitle>
              <DialogDescription>
                {selectedItem.alamat}
              </DialogDescription>
            </DialogHeader>

            {/* Stand comparison */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-(--ds-gray-100) p-3 text-center font-mono tabular-nums">
              <div>
                <span className="block text-label-11 text-muted-foreground font-sans">Stand Lalu</span>
                <span className="text-heading-16 text-foreground">
                  {numberFormat.format(selectedItem.stml)}
                </span>
              </div>
              <div>
                <span className="block text-label-11 text-muted-foreground font-sans">Stand Akhir</span>
                <span className="text-heading-16 text-(--ds-blue-900)">
                  {numberFormat.format(selectedItem.stma)}
                </span>
              </div>
              <div>
                <span className="block text-label-11 text-muted-foreground font-sans">Pemakaian</span>
                <span className="text-heading-16 text-foreground">
                  {numberFormat.format(selectedItem.pakaiM3)} m³
                </span>
              </div>
            </div>

            {/* Anomaly summary box */}
            <div className="rounded-lg border border-border p-3 space-y-2 text-copy-12">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kategori Anomali:</span>
                <Badge
                  variant={
                    selectedItem.jenisAnomali.toLowerCase().includes('ekstrim')
                      ? 'red-subtle'
                      : selectedItem.jenisAnomali.toLowerCase().includes('nol')
                      ? 'amber-subtle'
                      : 'blue-subtle'
                  }
                  size="sm"
                >
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
            <div className="rounded-lg border border-dashed border-border bg-(--ds-gray-100) p-3 text-center">
              <img
                src={selectedItem.fotoMeterUrl || '/images/meter/petugas.jpg'}
                alt="Foto bukti meter"
                className="mx-auto h-40 object-cover rounded-md border border-border"
              />
              <p className="mt-1.5 text-copy-12 text-muted-foreground">
                Dokumentasi fisik meter pelanggan
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Tutup
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </PageContainer>
  );
}
