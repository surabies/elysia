'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Search,
  RefreshCw,
  Download,
  Calendar,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
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
import { toast } from 'sonner';

export interface KoreksiItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  petugasId: string | null;
  namaPetugas: string;
  thbl: string;
  stml: number;
  stmaAwal: number;
  pakaiM3Awal: number;
  stmaRevisi: number;
  pakaiM3Revisi: number;
  selisihM3: number;
  alasanKoreksi: string | null;
  catatanAudit: string | null;
  statusVerifikasi: string;
  tglCatat: string | null;
  updatedAt: string;
}

export interface LaporanKoreksiData {
  periode: string;
  summary: {
    totalKoreksi: number;
    totalM3Tambah: number;
    totalM3Kurang: number;
    nettoM3: number;
  };
  items: KoreksiItem[];
}

export function LaporanMonitoringKoreksi() {
  const [data, setData] = React.useState<LaporanKoreksiData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');
  const [filterSelisih, setFilterSelisih] = React.useState<'ALL' | 'PLUS' | 'MINUS'>('ALL');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/laporan/monitoring-koreksi?thbl=${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load koreksi report:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCsv = () => {
    if (!data?.items.length) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = [
      'NOLG',
      'Nama Pelanggan',
      'Tarif',
      'Rute',
      'Stand Lalu',
      'Stand Kini Awal',
      'Stand Kini Revisi',
      'Pakai Awal (m3)',
      'Pakai Revisi (m3)',
      'Selisih (m3)',
      'Alasan Koreksi',
      'Catatan Audit',
      'Waktu Update',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.nolg}"`,
      `"${item.nama.replace(/"/g, '""')}"`,
      item.tarifKode ?? '',
      item.ruteKode ?? '',
      item.stml,
      item.stmaAwal,
      item.stmaRevisi,
      item.pakaiM3Awal,
      item.pakaiM3Revisi,
      item.selisihM3,
      `"${(item.alasanKoreksi ?? '').replace(/"/g, '""')}"`,
      `"${(item.catatanAudit ?? '').replace(/"/g, '""')}"`,
      item.updatedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-koreksi-kubikasi-${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan berhasil diekspor ke CSV');
  };

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.nolg.toLowerCase().includes(search.toLowerCase()) ||
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        (item.ruteKode && item.ruteKode.toLowerCase().includes(search.toLowerCase())) ||
        (item.alasanKoreksi && item.alasanKoreksi.toLowerCase().includes(search.toLowerCase()));

      const matchSelisih =
        filterSelisih === 'ALL'
          ? true
          : filterSelisih === 'PLUS'
          ? item.selisihM3 > 0
          : item.selisihM3 < 0;

      return matchSearch && matchSelisih;
    });
  }, [data, search, filterSelisih]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Laporan Monitoring Kubikasi Koreksi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail rekapitulasi penyesuaian angka stand meter dan selisih kubikasi pemakaian air
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 shadow-xs text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Periode:</span>
            <input
              type="text"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-16 font-mono font-bold bg-transparent border-none text-foreground focus:outline-none"
            />
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

          <Button
            size="sm"
            onClick={exportCsv}
            disabled={loading || !data?.items.length}
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Laporan Dikoreksi</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {data?.summary.totalKoreksi ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Sambungan Langganan</p>
        </Card>

        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Koreksi Tambah (+)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            +{data?.summary.totalM3Tambah.toLocaleString('id-ID') ?? 0} m³
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Penyesuaian stand bertambah</p>
        </Card>

        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Koreksi Kurang (-)</span>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
            -{data?.summary.totalM3Kurang.toLocaleString('id-ID') ?? 0} m³
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Penyesuaian stand berkurang</p>
        </Card>

        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Netto Dampak Kubikasi</span>
            <Scale className="h-4 w-4 text-blue-600" />
          </div>
          <div
            className={cn(
              'mt-2 text-2xl font-bold font-mono',
              (data?.summary.nettoM3 ?? 0) >= 0 ? 'text-blue-600' : 'text-rose-600'
            )}
          >
            {(data?.summary.nettoM3 ?? 0) >= 0 ? '+' : ''}
            {data?.summary.nettoM3.toLocaleString('id-ID') ?? 0} m³
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Total selisih volume air DRD</p>
        </Card>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari NOLG, nama pelanggan, alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>

          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setFilterSelisih('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filterSelisih === 'ALL'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semua ({data?.items.length ?? 0})
            </button>
            <button
              onClick={() => setFilterSelisih('PLUS')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filterSelisih === 'PLUS'
                  ? 'bg-emerald-500/10 text-emerald-600 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-emerald-600'
              )}
            >
              Koreksi Tambah (+)
            </button>
            <button
              onClick={() => setFilterSelisih('MINUS')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filterSelisih === 'MINUS'
                  ? 'bg-amber-500/10 text-amber-600 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-amber-600'
              )}
            >
              Koreksi Kurang (-)
            </button>
          </div>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>NOLG / Pelanggan</TableHead>
                <TableHead>Tarif / Rute</TableHead>
                <TableHead className="text-right">Stand Lalu</TableHead>
                <TableHead className="text-right">Stand Awal</TableHead>
                <TableHead className="text-right">Stand Revisi</TableHead>
                <TableHead className="text-right">Pakai Awal</TableHead>
                <TableHead className="text-right">Pakai Revisi</TableHead>
                <TableHead className="text-center">Selisih (m³)</TableHead>
                <TableHead>Alasan & Catatan Audit</TableHead>
                <TableHead className="text-right">Waktu Koreksi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="font-mono font-bold text-xs">{item.nolg}</div>
                    <div className="text-foreground truncate max-w-[180px]">{item.nama}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    <div>{item.tarifKode || '—'}</div>
                    <div className="text-[10px]">{item.ruteKode || '—'}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.stml}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.stmaAwal}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {item.stmaRevisi}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.pakaiM3Awal} m³
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {item.pakaiM3Revisi} m³
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono font-bold',
                        item.selisihM3 > 0
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300'
                          : item.selisihM3 < 0
                          ? 'bg-amber-500/10 text-amber-600 border-amber-300'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {item.selisihM3 > 0 ? `+${item.selisihM3}` : item.selisihM3} m³
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-foreground line-clamp-1">
                      {item.alasanKoreksi || 'Koreksi Stand Meter'}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                      {item.catatanAudit || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-[11px]">
                    {new Date(item.updatedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/verifikasi/baca-petugas?q=${item.nolg}`}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
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
      </div>
    </div>
  );
}
