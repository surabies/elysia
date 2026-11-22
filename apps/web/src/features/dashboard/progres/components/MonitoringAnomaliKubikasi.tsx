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
  const [loading, setLoading] = React.useState(true);
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
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar Vercel Geist Telemetry */}
      <AnomaliKubikasiHeader
        periodeThbl={periode}
        periodeLabel={periodeLabel}
        availablePeriods={availablePeriods}
        onPeriodChange={handlePeriodChange}
        onRefresh={fetchData}
        loading={loading}
        kpi={data?.kpi}
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Anomali */}
        <Card
          onClick={() => setJenisFilter('all')}
          className={cn(
            'p-4 border-border bg-card cursor-pointer transition-colors hover:border-(--ds-gray-500)',
            jenisFilter === 'all' && 'ring-2 ring-ring border-foreground'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Total Anomali Terdeteksi</span>
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalAnomali) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Rekening berpotensi kelainan catat
          </p>
        </Card>

        {/* Lonjakan Ekstrem */}
        <Card
          onClick={() => setJenisFilter('ekstrim')}
          className={cn(
            'p-4 border-border bg-card cursor-pointer transition-colors hover:border-(--ds-gray-500)',
            jenisFilter === 'ekstrim' && 'ring-2 ring-rose-500/40 border-rose-500'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Lonjakan Ekstrem (&gt;50 m³)</span>
            <TrendingUp className="size-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-heading-24 text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalEkstrim) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Pemakaian melompat tinggi
          </p>
        </Card>

        {/* Pemakaian Nol */}
        <Card
          onClick={() => setJenisFilter('nol')}
          className={cn(
            'p-4 border-border bg-card cursor-pointer transition-colors hover:border-(--ds-gray-500)',
            jenisFilter === 'nol' && 'ring-2 ring-amber-500/40 border-amber-500'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Stand 0 m³ (Nihil / Macet)</span>
            <HelpCircle className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-heading-24 text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalNol) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Meter tidak bergerak / rumah kosong
          </p>
        </Card>

        {/* Pemakaian Turun */}
        <Card
          onClick={() => setJenisFilter('turun')}
          className={cn(
            'p-4 border-border bg-card cursor-pointer transition-colors hover:border-(--ds-gray-500)',
            jenisFilter === 'turun' && 'ring-2 ring-(--ds-blue-400) border-(--ds-blue-900)'
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Pemakaian Turun Drastis</span>
            <TrendingDown className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-blue-900) font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalTurun) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Turun &gt; 50% dari bulan lalu
          </p>
        </Card>
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-(--ds-gray-100) border border-border w-fit">
          <Button
            variant={jenisFilter === 'all' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setJenisFilter('all')}
          >
            Semua Anomali
          </Button>
          <Button
            variant={jenisFilter === 'ekstrim' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setJenisFilter('ekstrim')}
          >
            <TrendingUp className="size-3 text-rose-600 dark:text-rose-400" />
            Lonjakan Ekstrem
          </Button>
          <Button
            variant={jenisFilter === 'nol' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setJenisFilter('nol')}
          >
            <HelpCircle className="size-3 text-amber-600 dark:text-amber-400" />
            Stand 0 m³
          </Button>
          <Button
            variant={jenisFilter === 'turun' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setJenisFilter('turun')}
          >
            <TrendingDown className="size-3 text-(--ds-blue-900)" />
            Turun Drastis
          </Button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            size="sm"
            placeholder="Cari NOLG, nama, atau rute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
      </div>

      {/* 4. Anomaly Data Table */}
      {loading ? (
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
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
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
                        <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium">
                          <ArrowUpRight className="size-3" />
                          +{row.selisihM3} (+{row.persenDeviasi}%)
                        </span>
                      ) : row.selisihM3 < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-(--ds-blue-900) font-medium">
                          <ArrowDownRight className="size-3" />
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
        </Card>
      )}

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
