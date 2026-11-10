'use client';

import * as React from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  MapPin,
  User,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
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
import { PageContainer } from '@/components/layout/page/PageContainer';
import { cn } from '@/lib/utils';
import type {
  CekFotoItem,
  CekFotoResult,
} from '@/server/services/cater/cater-progress.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function MonitoringCekFoto() {
  const [data, setData] = React.useState<CekFotoResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [kondisiFilter, setKondisiFilter] = React.useState<'all' | 'normal' | 'anomali'>('all');
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [selectedFoto, setSelectedFoto] = React.useState<CekFotoItem | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const filterParam = kondisiFilter !== 'all' ? `&filterKondisi=${kondisiFilter}` : '';
      const res = await fetch(
        `/api/cater/meter/cek-foto?thbl=${periode}${filterParam}${q}&limit=60`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch cek foto:', err);
    } finally {
      setLoading(false);
    }
  }, [periode, kondisiFilter, search]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset zoom on select
  React.useEffect(() => {
    if (selectedFoto) {
      setZoomLevel(1);
      setRotation(0);
    }
  }, [selectedFoto]);

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-heading-20 text-foreground">
            Audit & Cek Foto Petugas
          </h1>
          <p className="text-copy-13 text-muted-foreground mt-1">
            Galeri foto angka meter dan fisik rumah pelanggan hasil perekaman petugas lapangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-label-12">
            <span className="text-muted-foreground mr-2">Periode:</span>
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
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Foto */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Total Dokumentasi</span>
            <Camera className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalFoto) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">foto</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Tercatat dalam periode aktif</p>
        </Card>

        {/* Kondisi Normal */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Kondisi Normal</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalNormal) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">foto</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Angka stand wajar & terbaca</p>
        </Card>

        {/* Anomali / Kelainan */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Kelainan Catat</span>
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-heading-24 text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalAnomali) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">foto</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Meter rusak / buram / anomali</p>
        </Card>

        {/* Terverifikasi */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Status Terverifikasi</span>
            <ShieldCheck className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalVerified) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">laporan</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Lolos verifikasi bertingkat</p>
        </Card>
      </div>

      {/* 3. Controls & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-(--ds-gray-100) border border-border w-fit">
          <Button
            variant={kondisiFilter === 'all' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setKondisiFilter('all')}
          >
            Semua Foto
          </Button>
          <Button
            variant={kondisiFilter === 'normal' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setKondisiFilter('normal')}
          >
            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
            Normal
          </Button>
          <Button
            variant={kondisiFilter === 'anomali' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setKondisiFilter('anomali')}
          >
            <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />
            Anomali / Kelainan
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              size="sm"
              placeholder="Cari NOLG, nama, atau rute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-card"
            />
          </div>

          <div className="flex items-center rounded-md border border-border p-0.5 bg-(--ds-gray-100)">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="size-3.5" />
              Galeri
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="size-3.5" />
              Tabel
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Content: Photo Gallery Grid or Table */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-primary" />
            <p className="text-copy-12 text-muted-foreground">Memuat galeri foto meter...</p>
          </div>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-copy-13 text-muted-foreground">
          Tidak ditemukan foto meter pada filter ini.
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Galeri */
        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.items.map((item) => {
            const isNormal = item.ketCatat === 'Normal' && item.pakaiM3 <= 50 && item.pakaiM3 > 0;
            const photoSrc = item.fotoMeterUrl || '/images/meter/petugas.jpg';

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden rounded-lg border-border bg-card transition-colors hover:border-(--ds-gray-500) cursor-pointer flex flex-col justify-between"
                onClick={() => setSelectedFoto(item)}
              >
                {/* Photo Container */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-(--ds-gray-100)">
                  <img
                    src={photoSrc}
                    alt={`Meter ${item.nolg}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-label-11 text-white">
                      {item.ruteKode ?? 'RUTE'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0',
                        isNormal
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      )}
                    >
                      {item.ketCatat}
                    </Badge>
                  </div>

                  {/* Bottom Stats Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 text-white font-mono tabular-nums flex items-baseline justify-between text-label-12">
                    <div>
                      <span className="text-label-11 text-zinc-300 font-sans block">Stand Akhir</span>
                      <span className="font-semibold text-label-14">{numberFormat.format(item.stma)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-label-11 text-zinc-300 font-sans block">Pakai</span>
                      <span className="font-semibold text-label-14 text-sky-300">{numberFormat.format(item.pakaiM3)} m³</span>
                    </div>
                  </div>

                  {/* Hover Zoom Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/20">
                    <div className="rounded-full bg-black/70 p-2 text-white">
                      <Maximize2 className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="p-3 space-y-1.5">
                  <div className="truncate">
                    <span className="font-mono text-label-11 text-foreground block">
                      {item.nolg}
                    </span>
                    <p className="text-label-13 font-medium text-foreground truncate">{item.nama}</p>
                    <p className="text-copy-12 text-muted-foreground truncate">{item.alamat}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-1.5 text-label-11 text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <User className="size-3 shrink-0" />
                      {item.petugasNama}
                    </span>
                    <span className="shrink-0 font-mono">
                      {item.tglCatat ? new Date(item.tglCatat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Tabel Audit Foto menggunakan shadcn Table */
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Rute & Wilayah</TableHead>
                <TableHead className="text-right">Stand Lalu</TableHead>
                <TableHead className="text-right">Stand Akhir</TableHead>
                <TableHead className="text-right">Pakai m³</TableHead>
                <TableHead>Petugas</TableHead>
                <TableHead>Kondisi Catat</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono tabular-nums">
              {data.items.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedFoto(row)}
                >
                  <TableCell className="p-2">
                    <img
                      src={row.fotoMeterUrl || '/images/meter/petugas.jpg'}
                      alt=""
                      className="size-10 rounded-md object-cover border border-border"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground font-sans">
                    {row.nolg}
                  </TableCell>
                  <TableCell className="font-sans font-medium text-foreground max-w-[180px] truncate">
                    {row.nama}
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground">
                    {row.ruteKode ?? '-'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(row.stml)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {numberFormat.format(row.stma)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-(--ds-blue-900)">
                    {numberFormat.format(row.pakaiM3)} m³
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground">
                    {row.petugasNama}
                  </TableCell>
                  <TableCell className="font-sans">
                    <Badge variant="outline">
                      {row.ketCatat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Badge variant="secondary">
                      {row.statusVerifikasi}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFoto(row);
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

      {/* 5. Lightbox Modal Preview using shadcn Dialog */}
      <Dialog open={Boolean(selectedFoto)} onOpenChange={(open) => !open && setSelectedFoto(null)}>
        {selectedFoto && (
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-border bg-card">
            <div className="relative flex flex-col lg:flex-row w-full max-h-[90vh]">
              {/* Left Image Viewer */}
              <div className="relative flex-1 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden min-h-[300px] lg:min-h-[500px]">
                <div className="overflow-hidden flex items-center justify-center w-full h-full p-4">
                  <img
                    src={selectedFoto.fotoMeterUrl || '/images/meter/petugas.jpg'}
                    alt="Foto Meter"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease',
                    }}
                    className="max-h-[70vh] max-w-full object-contain select-none"
                  />
                </div>

                {/* Viewer Control Bar */}
                <div className="absolute bottom-3 flex items-center gap-2 rounded-full bg-black/75 px-3 py-1.5 text-white border border-white/15">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-white hover:bg-white/20"
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    title="Perbesar"
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                  <span className="text-label-11 font-mono select-none px-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-white hover:bg-white/20"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    title="Perkecil"
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <div className="h-4 w-px bg-white/20 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-white hover:bg-white/20"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Putar 90°"
                  >
                    <RotateCw className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Right Information Panel */}
              <div className="w-full lg:w-80 p-5 flex flex-col justify-between overflow-y-auto bg-card space-y-4">
                <div>
                  <DialogHeader className="p-0 text-left">
                    <span className="text-label-11 font-mono text-muted-foreground uppercase">
                      NOLG: {selectedFoto.nolg}
                    </span>
                    <DialogTitle className="mt-0.5">
                      {selectedFoto.nama}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedFoto.alamat} • {selectedFoto.ruteKode ?? '-'}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Meter Numbers */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-(--ds-gray-100) p-3 font-mono tabular-nums text-center">
                    <div>
                      <span className="block text-label-11 text-muted-foreground font-sans">Stand Akhir</span>
                      <span className="text-heading-16 text-foreground">
                        {numberFormat.format(selectedFoto.stma)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-label-11 text-muted-foreground font-sans">Pemakaian</span>
                      <span className="text-heading-16 text-(--ds-blue-900)">
                        {numberFormat.format(selectedFoto.pakaiM3)} m³
                      </span>
                    </div>
                  </div>

                  {/* Metadata List */}
                  <div className="mt-4 space-y-2 text-copy-12 border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kondisi Catat:</span>
                      <Badge variant="outline">
                        {selectedFoto.ketCatat}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status Verifikasi:</span>
                      <span className="font-medium text-foreground">{selectedFoto.statusVerifikasi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Petugas Lapangan:</span>
                      <span className="font-medium text-foreground">{selectedFoto.petugasNama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Waktu Perekaman:</span>
                      <span className="font-mono text-muted-foreground text-label-11">
                        {selectedFoto.tglCatat
                          ? new Date(selectedFoto.tglCatat).toLocaleString('id-ID')
                          : '-'}
                      </span>
                    </div>
                    {selectedFoto.jarakPelangganMeter !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Radius GPS:</span>
                        <span className="font-mono text-foreground font-medium">
                          {selectedFoto.jarakPelangganMeter} meter
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFoto(null)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </PageContainer>
  );
}
