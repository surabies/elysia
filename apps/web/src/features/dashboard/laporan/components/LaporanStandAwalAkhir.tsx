'use client';

import * as React from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Gauge,
  Droplets,
  Layers,
  ArrowRight,
  TrendingUp,
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
  LaporanStandAwalAkhirResult,
  StandAwalAkhirItem,
} from '@/server/services/laporan/laporan-stand.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function LaporanStandAwalAkhir() {
  const [data, setData] = React.useState<LaporanStandAwalAkhirResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [limit, setLimit] = React.useState('100');
  const [search, setSearch] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/laporan/stand-awal-akhir?thbl=${periode}&limit=${limit}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load stand awal akhir report:', err);
    } finally {
      setLoading(false);
    }
  }, [periode, limit]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (i) =>
        i.nolg.toLowerCase().includes(q) ||
        i.nama.toLowerCase().includes(q) ||
        (i.alamat && i.alamat.toLowerCase().includes(q)) ||
        (i.ruteKode && i.ruteKode.toLowerCase().includes(q)) ||
        (i.kelurahanNama && i.kelurahanNama.toLowerCase().includes(q))
    );
  }, [data, search]);

  const exportCsv = () => {
    if (!filteredItems.length) return;
    const headers = [
      'NOLG',
      'Nama',
      'Alamat',
      'Tarif',
      'Rute',
      'Kelurahan',
      'Stand Lalu (STML)',
      'Stand Akhir (STMA)',
      'Pemakaian (m3)',
      'Kondisi',
      'Status Verifikasi',
      'Waktu Catat',
    ];
    const rows = filteredItems.map((i) => [
      i.nolg,
      `"${i.nama}"`,
      `"${i.alamat || ''}"`,
      i.tarifKode || '',
      i.ruteKode || '',
      `"${i.kelurahanNama || ''}"`,
      i.stml,
      i.stma,
      i.pakaiM3,
      `"${i.ketCatat || 'Normal'}"`,
      i.statusVerifikasi,
      i.tglCatat || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-stand-awal-akhir-${periode}.csv`);
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
            <Gauge className="size-6 text-primary" />
            Laporan Rekapitulasi Stand Awal & Akhir Meter
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Komparasi angka stand meter lalu (STML) terhadap stand meter angkat (STMA) dan kubikasi ditagihkan.
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

          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs">
            <span className="text-muted-foreground font-medium">Tampilkan:</span>
            <NativeSelect
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              size="xs"
              className="border-none shadow-none font-semibold text-foreground focus-visible:ring-0 p-0 pr-6"
            >
              <NativeSelectOption value="50">50 Baris</NativeSelectOption>
              <NativeSelectOption value="100">100 Baris</NativeSelectOption>
              <NativeSelectOption value="250">250 Baris</NativeSelectOption>
              <NativeSelectOption value="500">500 Baris</NativeSelectOption>
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
            <span className="text-xs font-medium">Pelanggan Terbaca</span>
            <Layers className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalPelangganTerbaca) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Sampel data termuat</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Volume Terbaca</span>
            <Droplets className="size-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKubikasiM3) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Kubikasi resmi periode {periode}</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rata-rata Konsumsi</span>
            <TrendingUp className="size-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? `${data.kpi.rataRataKubikasi}` : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">m³ / SL</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Rata-rata konsumsi sampel</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Stand Tertinggi</span>
            <Gauge className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.standTertinggi) : '...'}
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Angka index meter tertinggi</p>
        </Card>
      </div>

      {/* 3. Search Bar */}
      <div className="flex items-center justify-between">
        <span className="text-label-12 text-muted-foreground font-medium">
          Daftar Rincian Stand Lalu (STML) vs Stand Akhir (STMA)
        </span>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari NOLG, nama, rute, kelurahan..."
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
          Tidak ditemukan data stand meter pada filter ini.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Alamat & Kelurahan</TableHead>
                <TableHead>Tarif / Rute</TableHead>
                <TableHead className="text-right">Stand Lalu (STML)</TableHead>
                <TableHead className="text-right">Stand Akhir (STMA)</TableHead>
                <TableHead className="text-right">Pemakaian (m³)</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead className="text-center">Status Verifikasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono">
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-foreground font-sans">
                    {item.nolg}
                  </TableCell>
                  <TableCell className="font-sans font-medium text-foreground max-w-[170px] truncate">
                    {item.nama}
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground text-label-11">
                    <span className="block truncate max-w-[180px]">{item.alamat}</span>
                    <span className="text-[10px] text-muted-foreground">{item.kelurahanNama}</span>
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground text-label-11">
                    <span className="font-mono font-semibold text-foreground">{item.tarifKode ?? '-'}</span>
                    <span className="text-[10px] text-muted-foreground block">Rute: {item.ruteKode ?? '-'}</span>
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
                  <TableCell className="font-sans">
                    <Badge variant="outline" className="text-[10px]">
                      {item.ketCatat || 'Normal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Badge
                      variant={
                        item.statusVerifikasi === 'APPROVED_FINAL' || item.statusVerifikasi === 'VERIFIED'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {item.statusVerifikasi}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
