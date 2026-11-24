'use client';

import * as React from 'react';
import {
  Search,
  RefreshCw,
  MapPin,
  Compass,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { pelangganApi } from '../api';
import type {
  PelangganGpsItem,
  GpsKpiStats,
  PaginationMeta,
} from '../types';
import { RingkasanGpsKpi } from './RingkasanGpsKpi';
import { ModalGeotagging } from './ModalGeotagging';

type GpsFilterTab = 'ALL' | 'TANPA_GPS' | 'BER_GPS';

export function GeotaggingPelangganView() {
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<GpsFilterTab>('TANPA_GPS');
  const [ruteFilter, setRuteFilter] = React.useState<string>('all');
  const [ruteOptions, setRuteOptions] = React.useState<Array<{ kode: string; nama?: string }>>([]);

  const [items, setItems] = React.useState<PelangganGpsItem[]>([]);
  const [kpiStats, setKpiStats] = React.useState<GpsKpiStats | null>(null);
  const [pagination, setPagination] = React.useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalRows: 0,
    totalPages: 1,
  });

  // Modal Geotagging state
  const [selectedPelanggan, setSelectedPelanggan] = React.useState<PelangganGpsItem | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Debounce input pencarian
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Muat opsi rute sekali saat inisialisasi
  React.useEffect(() => {
    pelangganApi.getRuteList().then(setRuteOptions).catch(() => {});
  }, []);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await pelangganApi.getDaftarGps({
        q: debouncedQuery,
        status: statusFilter,
        ruteKode: ruteFilter,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.success) {
        setItems(res.items);
        setKpiStats(res.kpi);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data koordinat pelanggan');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, statusFilter, ruteFilter, pagination.page, pagination.limit]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (pelanggan: PelangganGpsItem) => {
    setSelectedPelanggan(pelanggan);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Compass className="size-5 text-primary" />
            <span>Geotagging & Validasi Titik GPS</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen koordinat spasial pelanggan untuk akurasi peta rute cater, penertiban geofence, dan integrasi PostGIS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            <span>Muat Ulang</span>
          </Button>
        </div>
      </div>

      {/* 2. Kartu KPI Spasial */}
      <RingkasanGpsKpi stats={kpiStats} loading={loading} />

      {/* 3. Filter Bar & Tab Navigasi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
        {/* Tab Filter Status GPS */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border w-fit text-xs">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('TANPA_GPS');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={cn(
              'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'TANPA_GPS'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span>Belum Ada GPS (Prioritas)</span>
            {kpiStats && (
              <Badge variant="amber-subtle" className="text-[10px] px-1.5 py-0 h-4">
                {kpiStats.tanpaGps}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('BER_GPS');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={cn(
              'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'BER_GPS'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="size-3.5 text-green-500" />
            <span>Sudah Ber-GPS</span>
            {kpiStats && (
              <Badge variant="green-subtle" className="text-[10px] px-1.5 py-0 h-4">
                {kpiStats.berGps}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={cn(
              'px-3 py-1.5 rounded-md font-medium transition-all',
              statusFilter === 'ALL'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Semua Pelanggan</span>
          </button>
        </div>

        {/* Filter Rute & Pencarian */}
        <div className="flex items-center gap-2">
          {/* Dropdown Rute */}
          <div className="w-[180px]">
            <Select
              value={ruteFilter}
              onValueChange={(val) => {
                setRuteFilter(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Pilih Rute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rute</SelectItem>
                {ruteOptions.map((r) => (
                  <SelectItem key={r.kode} value={r.kode}>
                    {r.kode} {r.nama ? `(${r.nama})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Box */}
          <div className="relative w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari NoLG / Nama / Alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 4. Tabel Daftar Pelanggan dengan Sticky Header */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] relative">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm border-b border-border shadow-xs">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] text-xs font-semibold">No. Sambungan</TableHead>
                <TableHead className="min-w-[220px] text-xs font-semibold">Nama & Alamat</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold">Rute & Urut</TableHead>
                <TableHead className="w-[110px] text-xs font-semibold">No. Meter</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold">Status Spasial</TableHead>
                <TableHead className="min-w-[180px] text-xs font-semibold">Titik Koordinat</TableHead>
                <TableHead className="w-[120px] text-right text-xs font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    Memuat data pelanggan...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    Tidak ada pelanggan yang cocok dengan kriteria filter.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.nolg} className="text-xs hover:bg-muted/50 transition-colors">
                    {/* 1. NoLG & NPRS */}
                    <TableCell className="font-mono font-medium align-middle">
                      <div>{item.nolg}</div>
                      {item.nprs && (
                        <div className="text-[10px] text-muted-foreground font-normal">
                          NPRS: {item.nprs}
                        </div>
                      )}
                    </TableCell>

                    {/* 2. Nama & Alamat */}
                    <TableCell className="align-middle">
                      <div className="font-medium text-foreground">{item.nama}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.alamat} {item.rt ? `RT ${item.rt}` : ''} {item.rw ? `/ RW ${item.rw}` : ''}
                      </div>
                    </TableCell>

                    {/* 3. Rute & Urut */}
                    <TableCell className="align-middle font-mono">
                      <div>{item.ruteKode || '-'}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Urut: #{item.noUrutRute ?? '-'}
                      </div>
                    </TableCell>

                    {/* 4. No Meter */}
                    <TableCell className="align-middle font-mono text-[11px]">
                      {item.noMeter || '-'}
                    </TableCell>

                    {/* 5. Status Spasial */}
                    <TableCell className="align-middle">
                      {item.hasGps ? (
                        <Badge variant="green-subtle" className="text-[10px] gap-1 py-0.5">
                          <CheckCircle2 className="size-3" />
                          <span>Ber-GPS</span>
                        </Badge>
                      ) : (
                        <Badge variant="amber-subtle" className="text-[10px] gap-1 py-0.5">
                          <AlertTriangle className="size-3" />
                          <span>Tanpa GPS</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* 6. Titik Koordinat */}
                    <TableCell className="align-middle font-mono text-[11px]">
                      {item.hasGps && item.lat != null && item.lng != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="text-muted-foreground">
                            {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                            title="Buka di Google Maps"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic font-sans text-[11px]">
                          Belum terplot
                        </span>
                      )}
                    </TableCell>

                    {/* 7. Tombol Aksi */}
                    <TableCell className="text-right align-middle">
                      <Button
                        variant={item.hasGps ? 'ghost' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-7 text-[11px] gap-1 px-2.5',
                          !item.hasGps && 'border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                        )}
                        onClick={() => handleOpenModal(item)}
                      >
                        <MapPin className="size-3" />
                        <span>{item.hasGps ? 'Ubah GPS' : 'Plot GPS'}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 border-t border-border bg-muted/30 text-xs">
          <div className="text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{items.length}</span> dari{' '}
            <span className="font-medium text-foreground">{pagination.totalRows}</span> pelanggan
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </Button>
            <div className="text-xs text-muted-foreground font-mono">
              {pagination.page} / {pagination.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <span>Berikutnya</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 6. Dialog Modal Geotagging */}
      <ModalGeotagging
        pelanggan={selectedPelanggan}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
