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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Camera className="size-6 text-primary" />
            Audit & Cek Foto Petugas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Galeri foto angka meter dan fisik rumah pelanggan hasil perekaman petugas lapangan.
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
        {/* Total Foto */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Dokumentasi</span>
            <Camera className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalFoto) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">foto</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Tercatat dalam periode aktif</p>
        </Card>

        {/* Kondisi Normal */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kondisi Normal</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalNormal) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">foto</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Angka stand wajar & terbaca</p>
        </Card>

        {/* Anomali / Kelainan */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kelainan Catat</span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalAnomali) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">foto</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Meter rusak / buram / anomali</p>
        </Card>

        {/* Terverifikasi */}
        <Card className="p-4 rounded-[10px] border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Status Terverifikasi</span>
            <ShieldCheck className="size-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalVerified) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">laporan</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Lolos verifikasi bertingkat</p>
        </Card>
      </div>

      {/* 3. Controls & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border w-fit">
          <Button
            variant={kondisiFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setKondisiFilter('all')}
            className="h-7 text-xs"
          >
            Semua Foto
          </Button>
          <Button
            variant={kondisiFilter === 'normal' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setKondisiFilter('normal')}
            className="h-7 text-xs gap-1"
          >
            <CheckCircle2 className="size-3 text-emerald-500" />
            Normal
          </Button>
          <Button
            variant={kondisiFilter === 'anomali' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setKondisiFilter('anomali')}
            className="h-7 text-xs gap-1"
          >
            <AlertTriangle className="size-3 text-amber-500" />
            Anomali / Kelainan
          </Button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari NOLG, nama, atau rute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex items-center rounded-md border border-border p-0.5 bg-card">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-2 text-xs gap-1"
            >
              <LayoutGrid className="size-3.5" />
              Galeri
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-7 px-2 text-xs gap-1"
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
            <p className="text-xs text-muted-foreground">Memuat galeri foto meter...</p>
          </div>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Tidak ditemukan foto meter pada filter ini.
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Galeri */
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.items.map((item) => {
            const isNormal = item.ketCatat === 'Normal' && item.pakaiM3 <= 50 && item.pakaiM3 > 0;
            const photoSrc = item.fotoMeterUrl || '/images/meter/petugas.jpg';

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden rounded-[10px] border-border bg-card shadow-xs transition-all hover:border-primary/50 hover:shadow-md cursor-pointer flex flex-col justify-between"
                onClick={() => setSelectedFoto(item)}
              >
                {/* Photo Container */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/40">
                  <img
                    src={photoSrc}
                    alt={`Meter ${item.nolg}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-xs">
                      {item.ruteKode ?? 'RUTE'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-medium border-0 px-1.5 py-0.5',
                        isNormal
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      )}
                    >
                      {item.ketCatat}
                    </Badge>
                  </div>

                  {/* Bottom Stats Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 text-white font-mono flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-300 font-sans block">Stand Akhir</span>
                      <span className="font-bold text-sm tracking-tight">{numberFormat.format(item.stma)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-300 font-sans block">Pakai</span>
                      <span className="font-bold text-sm text-sky-300">{numberFormat.format(item.pakaiM3)} m³</span>
                    </div>
                  </div>

                  {/* Hover Zoom Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/20">
                    <div className="rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur-xs">
                      <Maximize2 className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="p-3 text-xs space-y-1.5">
                  <div className="truncate">
                    <span className="font-mono font-semibold text-foreground text-[11px] block">
                      {item.nolg}
                    </span>
                    <p className="font-medium text-foreground truncate text-xs">{item.nama}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.alamat}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground">
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
            <TableHeader className="bg-muted/40">
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
            <TableBody className="font-mono">
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
                  <TableCell className="font-semibold text-foreground font-sans">
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
                  <TableCell className="text-right font-bold text-foreground">
                    {numberFormat.format(row.stma)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-sky-600 dark:text-sky-400">
                    {numberFormat.format(row.pakaiM3)} m³
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground">
                    {row.petugasNama}
                  </TableCell>
                  <TableCell className="font-sans">
                    <Badge variant="outline" className="text-[10px]">
                      {row.ketCatat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Badge variant="secondary" className="text-[10px]">
                      {row.statusVerifikasi}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
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
                <div className="absolute bottom-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-white backdrop-blur-md shadow-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    title="Perbesar"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <span className="text-[11px] font-mono select-none px-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    title="Perkecil"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <div className="h-4 w-px bg-white/20 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Putar 90°"
                  >
                    <RotateCw className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Right Information Panel */}
              <div className="w-full lg:w-80 p-5 flex flex-col justify-between overflow-y-auto bg-card space-y-4">
                <div>
                  <DialogHeader className="p-0 text-left">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                      NOLG: {selectedFoto.nolg}
                    </span>
                    <DialogTitle className="text-base font-bold text-foreground leading-tight mt-0.5">
                      {selectedFoto.nama}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                      {selectedFoto.alamat} • {selectedFoto.ruteKode ?? '-'}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Meter Numbers */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 font-mono text-center">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-sans">Stand Akhir</span>
                      <span className="text-base font-bold text-primary">
                        {numberFormat.format(selectedFoto.stma)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-sans">Pemakaian</span>
                      <span className="text-base font-bold text-foreground">
                        {numberFormat.format(selectedFoto.pakaiM3)} m³
                      </span>
                    </div>
                  </div>

                  {/* Metadata List */}
                  <div className="mt-4 space-y-2 text-xs border-t border-border/60 pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kondisi Catat:</span>
                      <Badge variant="outline" className="font-semibold text-[11px]">
                        {selectedFoto.ketCatat}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status Verifikasi:</span>
                      <span className="font-semibold text-foreground">{selectedFoto.statusVerifikasi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Petugas Lapangan:</span>
                      <span className="font-medium text-foreground">{selectedFoto.petugasNama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Waktu Perekaman:</span>
                      <span className="font-mono text-muted-foreground text-[11px]">
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

                <div className="pt-2 border-t border-border/60 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFoto(null)}
                    className="text-xs"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
