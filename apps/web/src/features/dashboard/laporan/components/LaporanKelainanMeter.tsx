'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  Camera,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
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
  LaporanKelainanResult,
  KelainanDetailItem,
} from '@/server/services/laporan/laporan-kelainan.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function LaporanKelainanMeter() {
  const [data, setData] = React.useState<LaporanKelainanResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');
  const [filterKategori, setFilterKategori] = React.useState<string>('ALL');
  const [selectedItem, setSelectedItem] = React.useState<KelainanDetailItem | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/laporan/kelainan-meter?thbl=${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load kelainan meter report:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchSearch =
        search.trim() === '' ||
        item.nolg.toLowerCase().includes(search.toLowerCase()) ||
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        (item.alamat && item.alamat.toLowerCase().includes(search.toLowerCase())) ||
        item.ketCatat.toLowerCase().includes(search.toLowerCase()) ||
        (item.ruteKode && item.ruteKode.toLowerCase().includes(search.toLowerCase()));

      const matchKategori =
        filterKategori === 'ALL' ||
        (filterKategori === 'KERUSAKAN' &&
          (item.ketCatat.includes('Pecah') ||
            item.ketCatat.includes('Buram') ||
            item.ketCatat.includes('Macet') ||
            item.ketCatat.includes('Rusak'))) ||
        (filterKategori === 'AKSES' &&
          (item.ketCatat.includes('Kunci') ||
            item.ketCatat.includes('Tertimbun') ||
            item.ketCatat.includes('Terhalang') ||
            item.ketCatat.includes('DK'))) ||
        (filterKategori === 'PELANGGARAN' &&
          (item.ketCatat.includes('Segel') ||
            item.ketCatat.includes('Bypass') ||
            item.ketCatat.includes('Balik')));

      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori]);

  const exportCsv = () => {
    if (!filteredItems.length) return;
    const headers = [
      'NOLG',
      'Nama',
      'Alamat',
      'Tarif',
      'Rute',
      'Kelurahan',
      'Kelainan',
      'Stand Lalu',
      'Stand Akhir',
      'Pemakaian m3',
      'Petugas',
      'Waktu Catat',
    ];
    const rows = filteredItems.map((i) => [
      i.nolg,
      `"${i.nama}"`,
      `"${i.alamat || ''}"`,
      i.tarifKode || '',
      i.ruteKode || '',
      `"${i.kelurahanNama || ''}"`,
      `"${i.ketCatat}"`,
      i.stml,
      i.stma,
      i.pakaiM3,
      `"${i.petugasNama || ''}"`,
      i.tglCatat || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-kelainan-meter-${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <AlertTriangle className="size-6 text-amber-500" />
            Laporan Rekapitulasi Kelainan Water Meter
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rekap kondisi fisik meter rusak, kendala akses rumah terkunci, dan temuan anomali lapangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs">
            <span className="text-muted-foreground font-medium">Periode:</span>
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

          <Button
            size="sm"
            onClick={exportCsv}
            disabled={loading || !filteredItems.length}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Download className="size-3.5" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Kelainan Fisik</span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKelainan) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">kasus</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Tercatat di periode {periode}</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kendala Akses Rumah</span>
            <ShieldAlert className="size-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKendalaAkses) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Pagar digembok / terhalang</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kerusakan Water Meter</span>
            <Camera className="size-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKerusakanFisik) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">meter</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Kaca buram / jarum macet (GWM)</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Potensi Pelanggaran</span>
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalPelanggaran) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">temuan</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Segel putus / meter terbalik</p>
        </Card>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border w-fit">
          <Button
            variant={filterKategori === 'ALL' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('ALL')}
            className="h-7 text-xs font-medium"
          >
            Semua ({data?.items.length ?? 0})
          </Button>
          <Button
            variant={filterKategori === 'AKSES' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('AKSES')}
            className="h-7 text-xs font-medium"
          >
            Kendala Akses
          </Button>
          <Button
            variant={filterKategori === 'KERUSAKAN' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('KERUSAKAN')}
            className="h-7 text-xs font-medium"
          >
            Kerusakan Meter
          </Button>
          <Button
            variant={filterKategori === 'PELANGGARAN' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('PELANGGARAN')}
            className="h-7 text-xs font-medium"
          >
            Pelanggaran
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari NOLG, nama, rute, kelainan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* 4. Table Area */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border text-muted-foreground text-copy-13">
          Tidak ditemukan catatan kelainan meter pada periode dan filter ini.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Rute & Wilayah</TableHead>
                <TableHead>Kondisi Kelainan</TableHead>
                <TableHead className="text-right">STML</TableHead>
                <TableHead className="text-right">STMA</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Petugas Lapangan</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono">
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <TableCell className="font-semibold text-foreground font-sans">
                    {item.nolg}
                  </TableCell>
                  <TableCell className="font-sans font-medium text-foreground max-w-[180px] truncate">
                    {item.nama}
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground text-label-11">
                    <span className="font-mono font-semibold text-foreground">{item.ruteKode ?? '-'}</span>
                    <span className="block text-[10px] truncate max-w-[140px]">{item.kelurahanNama}</span>
                  </TableCell>
                  <TableCell className="font-sans">
                    <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10">
                      {item.ketCatat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(item.stml)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {numberFormat.format(item.stma)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-teal-600 dark:text-teal-400">
                    {numberFormat.format(item.pakaiM3)} m³
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground text-label-11">
                    {item.petugasNama}
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                    >
                      <Eye className="size-3.5 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 5. Detail Modal using shadcn Dialog */}
      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                NOLG: {selectedItem.nolg} • Tarif {selectedItem.tarifKode ?? '-'}
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-0.5">
                {selectedItem.nama}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedItem.alamat} • Rute {selectedItem.ruteKode ?? '-'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Temuan Kelainan Meter:
                </span>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {selectedItem.ketCatat}
                </p>
                {selectedItem.catatan && (
                  <p className="text-muted-foreground text-label-11 italic mt-1">
                    "{selectedItem.catatan}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center font-mono">
                <div>
                  <span className="block text-[10px] text-muted-foreground font-sans">Stand Lalu</span>
                  <span className="text-sm font-semibold">{numberFormat.format(selectedItem.stml)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-sans">Stand Akhir</span>
                  <span className="text-sm font-bold text-primary">{numberFormat.format(selectedItem.stma)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-sans">Pemakaian</span>
                  <span className="text-sm font-bold text-teal-600">{numberFormat.format(selectedItem.pakaiM3)} m³</span>
                </div>
              </div>

              {selectedItem.fotoMeterUrl && (
                <div className="rounded-lg border border-border p-2 bg-muted/20 text-center">
                  <img
                    src={selectedItem.fotoMeterUrl}
                    alt="Foto meter kelainan"
                    className="mx-auto h-40 object-cover rounded-md"
                  />
                  <span className="text-[10px] text-muted-foreground block mt-1">Dokumentasi fisik meter</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-border/60">
                <span className="text-muted-foreground">Petugas: {selectedItem.petugasNama}</span>
                <div className="flex gap-2">
                  <Link
                    href={`/cater/ganti-meter?nolg=${selectedItem.nolg}`}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    Usulkan Ganti Meter (GWM)
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
