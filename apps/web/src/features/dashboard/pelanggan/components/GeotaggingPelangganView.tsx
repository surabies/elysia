'use client';

import * as React from 'react';
import {
  Search,
  RefreshCw,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Crosshair,
  Loader2,
  X,
  Compass,
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
import { PageContainer } from '@/components/layout/page/PageContainer';
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

  // State quick GPS 1-tap langsung dari perangkat mobile
  const [quickTaggingNolg, setQuickTaggingNolg] = React.useState<string | null>(null);

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

  // Fitur 1-Tap Quick Geotagging untuk perangkat mobile di lapangan
  const handleQuickGpsDevice = (pelanggan: PelangganGpsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      toast.error('Perangkat tidak mendukung fitur Geolocation GPS');
      handleOpenModal(pelanggan);
      return;
    }

    setQuickTaggingNolg(pelanggan.nolg);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(7));
        const lng = Number(pos.coords.longitude.toFixed(7));
        const acc = Math.round(pos.coords.accuracy);

        // Jika akurasi GPS HP meleset > 12 meter, buka peta interaktif agar petugas bisa geser pin sedikit
        if (acc > 12) {
          setQuickTaggingNolg(null);
          toast.info(
            `Akurasi GPS saat ini ±${acc}m. Silakan sesuaikan/geser titik sedikit di peta agar akurat.`
          );
          handleOpenModal({
            ...pelanggan,
            lat,
            lng,
          });
          return;
        }

        try {
          const res = await pelangganApi.updateGps(pelanggan.nolg, {
            lat,
            lng,
            catatan: `Geotag perangkat mobile (±${acc}m)`,
          });
          toast.success(
            res.message || `GPS ${pelanggan.nolg} tersimpan (${lat.toFixed(5)}, ${lng.toFixed(5)})`
          );
          fetchData();
        } catch (err: any) {
          toast.error(err.message || 'Gagal menyimpan titik GPS');
        } finally {
          setQuickTaggingNolg(null);
        }
      },
      (err) => {
        setQuickTaggingNolg(null);
        toast.error(`Gagal membaca GPS perangkat: ${err.message}. Silakan plot melalui peta.`);
        handleOpenModal(pelanggan);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleFilterStatus = (status: GpsFilterTab) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.max(1, pagination.totalPages)) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (val: string) => {
    setPagination((prev) => ({ ...prev, limit: Number(val), page: 1 }));
  };

  const persenTerpetakan = kpiStats?.persen ?? 0;

  return (
    <>
      {/* ===================================================================== */}
      {/* TAMPILAN KHUSUS PERANGKAT MOBILE (< md): GAYA NATIVE MOBILE APP       */}
      {/* ===================================================================== */}
      <div className="md:hidden flex flex-col min-h-full bg-background pb-20">
        {/* 1. Mobile App Header & Progress Banner */}
        <div className="bg-card border-b border-border px-4 pt-3.5 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-xl bg-(--ds-blue-100) text-(--ds-blue-700) flex items-center justify-center shrink-0">
                <Compass className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-heading-16 font-bold text-foreground truncate">
                  Geotagging Lapangan
                </h1>
                <p className="text-copy-12 text-muted-foreground truncate">
                  Pemetaan titik meter pelanggan
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={fetchData}
              disabled={loading}
              aria-label="Segarkan data"
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </Button>
          </div>

          {/* Mobile Compact Progress Strip */}
          <div className="rounded-xl border border-border bg-(--ds-gray-100) p-3 space-y-2">
            <div className="flex items-center justify-between text-label-12">
              <span className="text-muted-foreground font-medium">
                Progres Cakupan Titik GPS
              </span>
              <span className="font-mono font-bold text-foreground">
                {kpiStats ? `${kpiStats.berGps.toLocaleString('id-ID')} / ${kpiStats.total.toLocaleString('id-ID')} SL (${persenTerpetakan}%)` : '—'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-(--ds-blue-700) transition-all duration-300"
                style={{ width: `${Math.min(100, persenTerpetakan)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-lg bg-card border border-border py-1.5 px-2">
                <span className="block text-[10px] text-muted-foreground">Belum GPS</span>
                <span className="font-mono text-label-13 font-bold text-(--ds-amber-900)">
                  {kpiStats ? kpiStats.tanpaGps.toLocaleString('id-ID') : '-'}
                </span>
              </div>
              <div className="rounded-lg bg-card border border-border py-1.5 px-2">
                <span className="block text-[10px] text-muted-foreground">Sudah GPS</span>
                <span className="font-mono text-label-13 font-bold text-(--ds-green-800)">
                  {kpiStats ? kpiStats.berGps.toLocaleString('id-ID') : '-'}
                </span>
              </div>
              <div className="rounded-lg bg-card border border-border py-1.5 px-2">
                <span className="block text-[10px] text-muted-foreground">Total SL</span>
                <span className="font-mono text-label-13 font-bold text-foreground">
                  {kpiStats ? kpiStats.total.toLocaleString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sticky Mobile Search, Rute & Filter Tabs */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-3.5 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            {/* Search Box Mobile */}
            <div className="relative flex-1">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari NoLG, nama, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-copy-13 bg-card rounded-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Rute Selector Mobile */}
            <div className="w-32 shrink-0">
              <Select
                value={ruteFilter}
                onValueChange={(val) => {
                  setRuteFilter(val);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger size="sm" className="h-9 text-label-12 bg-card rounded-lg w-full">
                  <SelectValue placeholder="Rute" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rute</SelectItem>
                  {ruteOptions.map((r) => (
                    <SelectItem key={r.kode} value={r.kode}>
                      {r.kode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3 Tab Putih Bersih Sejajar Penuh */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleFilterStatus('TANPA_GPS')}
              className={cn(
                'h-8 px-2 rounded-lg border text-label-12 font-medium flex items-center justify-center gap-1 transition-all bg-card',
                statusFilter === 'TANPA_GPS'
                  ? 'border-foreground text-foreground font-semibold shadow-2xs'
                  : 'border-border text-muted-foreground'
              )}
            >
              <span>Belum GPS</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterStatus('BER_GPS')}
              className={cn(
                'h-8 px-2 rounded-lg border text-label-12 font-medium flex items-center justify-center gap-1 transition-all bg-card',
                statusFilter === 'BER_GPS'
                  ? 'border-foreground text-foreground font-semibold shadow-2xs'
                  : 'border-border text-muted-foreground'
              )}
            >
              <span>Sudah GPS</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterStatus('ALL')}
              className={cn(
                'h-8 px-2 rounded-lg border text-label-12 font-medium flex items-center justify-center gap-1 transition-all bg-card',
                statusFilter === 'ALL'
                  ? 'border-foreground text-foreground font-semibold shadow-2xs'
                  : 'border-border text-muted-foreground'
              )}
            >
              <span>Semua</span>
            </button>
          </div>
        </div>

        {/* 3. Daftar Kartu Pelanggan Gaya Aplikasi Mobile */}
        <div className="px-3.5 pt-3 space-y-2.5 flex-1">
          {loading && items.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="size-6 animate-spin text-primary" />
              <span className="text-copy-13">Memuat daftar pelanggan...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-1.5">
              <Filter className="size-7 mx-auto text-muted-foreground/60" />
              <p className="text-label-14 font-semibold text-foreground">
                Tidak ada pelanggan ditemukan
              </p>
              <p className="text-copy-12 text-muted-foreground">
                Ubah kata kunci pencarian atau filter status GPS di atas.
              </p>
            </div>
          ) : (
            items.map((row, idx) => {
              const isQuickTagging = quickTaggingNolg === row.nolg;
              const nomorBaris =
                row.noUrutRute ?? (pagination.page - 1) * pagination.limit + idx + 1;

              return (
                <article
                  key={row.nolg}
                  onClick={() => handleOpenModal(row)}
                  className="rounded-xl border border-border bg-card p-3.5 shadow-2xs active:scale-[0.99] transition-transform space-y-2.5"
                >
                  {/* Baris Atas: Nomor Urut, NoLG, Rute & Status GPS */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-md bg-(--ds-gray-100) border border-border font-mono text-label-11 font-bold text-foreground">
                        #{nomorBaris}
                      </span>
                      <span className="font-mono text-label-13 font-bold text-foreground">
                        {row.nolg}
                      </span>
                      <Badge variant="gray-subtle" size="sm" className="font-mono">
                        {row.ruteKode || '-'}
                      </Badge>
                    </div>

                    {row.hasGps ? (
                      <Badge variant="green-subtle" size="sm">
                        <CheckCircle2 className="size-3" />
                        <span>Ber-GPS</span>
                      </Badge>
                    ) : (
                      <Badge variant="amber-subtle" size="sm">
                        <AlertTriangle className="size-3" />
                        <span>Belum GPS</span>
                      </Badge>
                    )}
                  </div>

                  {/* Baris Tengah: Nama & Alamat Pelanggan */}
                  <div>
                    <h3 className="text-label-14 font-semibold text-foreground truncate">
                      {row.nama}
                    </h3>
                    <p className="text-copy-12 text-muted-foreground truncate mt-0.5">
                      {row.alamat}
                      {(row.rt || row.rw) && ` (RT ${row.rt ?? '-'}/RW ${row.rw ?? '-'})`}
                    </p>
                  </div>

                  {/* Info Koordinat jika sudah ada */}
                  {row.hasGps && row.lat != null && row.lng != null && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between rounded-lg bg-(--ds-gray-100) px-2.5 py-1.5 text-label-12"
                    >
                      <span className="font-mono text-foreground">
                        {row.lat.toFixed(6)}, {row.lng.toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-(--ds-blue-700) font-medium"
                      >
                        <span>Navigasi</span>
                        <Navigation className="size-3" />
                      </a>
                    </div>
                  )}

                  {/* Baris Tombol Aksi Mobile Ramah Jempol */}
                  <div
                    className="grid grid-cols-2 gap-2 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      disabled={isQuickTagging}
                      onClick={(e) => handleQuickGpsDevice(row, e)}
                      className="h-9 text-label-12 gap-1.5 bg-card"
                    >
                      {isQuickTagging ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Crosshair className="size-3.5 text-(--ds-blue-700)" />
                      )}
                      <span>GPS Cepat</span>
                    </Button>

                    <Button
                      type="button"
                      variant={row.hasGps ? 'secondary' : 'default'}
                      size="md"
                      onClick={() => handleOpenModal(row)}
                      className="h-9 text-label-12 gap-1.5"
                    >
                      <MapPin className="size-3.5" />
                      <span>{row.hasGps ? 'Buka Peta' : 'Plot di Peta'}</span>
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* 4. Mobile Pagination Bar (Di Atas Floating Nav Pill) */}
        <div className="px-3.5 pt-4 pb-6">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-2xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="h-8 px-3 gap-1"
            >
              <ChevronLeft className="size-4" />
              <span>Prev</span>
            </Button>

            <div className="text-center">
              <span className="font-mono text-label-12 font-semibold text-foreground block">
                Hal {pagination.page} / {Math.max(1, pagination.totalPages)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {pagination.totalRows.toLocaleString('id-ID')} pelanggan
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="h-8 px-3 gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAMPILAN DESKTOP (>= md): DASHBOARD TABEL SATU BARIS STANDAR          */}
      {/* ===================================================================== */}
      <PageContainer className="hidden md:flex flex-col gap-4">
        {/* 1. Header Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3.5">
          <div className="min-w-0">
            <h1 className="text-heading-20 sm:text-heading-24 font-bold text-foreground tracking-tight">
              Titik GPS &amp; Geotagging Pelanggan
            </h1>
            <p className="text-copy-13 text-muted-foreground mt-0.5">
              Pemetaan dan kalibrasi koordinat spasial pelanggan dengan peta satelit interaktif untuk akurasi rute baca meter.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="h-8 flex items-center gap-1.5"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* 2. Kartu KPI Spasial */}
        <RingkasanGpsKpi stats={kpiStats} loading={loading} />

        {/* 3. Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-card p-3 rounded-lg border border-border">
          {/* Status Filter Tabs (Warna Putih Bersih) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleFilterStatus('TANPA_GPS')}
              className={cn(
                'h-8 px-3 text-label-12 font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-card',
                statusFilter === 'TANPA_GPS'
                  ? 'border-foreground/40 text-foreground font-semibold shadow-2xs'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              )}
            >
              <AlertTriangle className="size-3.5 text-(--ds-amber-800)" />
              <span>Belum Ada GPS</span>
              {kpiStats && (
                <Badge
                  variant="gray-subtle"
                  size="sm"
                  className="h-4.5 px-1.5 text-[10px]"
                >
                  {kpiStats.tanpaGps.toLocaleString('id-ID')}
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFilterStatus('BER_GPS')}
              className={cn(
                'h-8 px-3 text-label-12 font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-card',
                statusFilter === 'BER_GPS'
                  ? 'border-foreground/40 text-foreground font-semibold shadow-2xs'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              )}
            >
              <CheckCircle2 className="size-3.5 text-(--ds-green-700)" />
              <span>Sudah Ber-GPS</span>
              {kpiStats && (
                <Badge
                  variant="gray-subtle"
                  size="sm"
                  className="h-4.5 px-1.5 text-[10px]"
                >
                  {kpiStats.berGps.toLocaleString('id-ID')}
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFilterStatus('ALL')}
              className={cn(
                'h-8 px-3 text-label-12 font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-card',
                statusFilter === 'ALL'
                  ? 'border-foreground/40 text-foreground font-semibold shadow-2xs'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              )}
            >
              <span>Semua</span>
              {kpiStats && (
                <Badge
                  variant="gray-subtle"
                  size="sm"
                  className="h-4.5 px-1.5 text-[10px]"
                >
                  {kpiStats.total.toLocaleString('id-ID')}
                </Badge>
              )}
            </button>
          </div>

          {/* Search & Rute Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Filter Rute */}
            <div className="w-full sm:w-44">
              <Select
                value={ruteFilter}
                onValueChange={(val) => {
                  setRuteFilter(val);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger size="sm" className="h-8 text-label-12 bg-card w-full">
                  <SelectValue placeholder="Pilih Rute" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rute</SelectItem>
                  {ruteOptions.map((r) => (
                    <SelectItem key={r.kode} value={r.kode}>
                      {r.nama && r.nama !== r.kode ? `${r.kode} - ${r.nama}` : r.kode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder="Cari NOLG, Nama, Alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-label-12 bg-card"
              />
              <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Tabel Data Pelanggan - Satu Baris per Item, Nomor di Kolom Pertama Terpisah dari Rute */}
        <div className="rounded-lg border border-border overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-copy-13 whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-label-12 font-medium text-muted-foreground">
                  <th className="py-2.5 px-3 w-14 text-center">No.</th>
                  <th className="py-2.5 px-3.5">No. Langganan</th>
                  <th className="py-2.5 px-3.5">Nama Pelanggan</th>
                  <th className="py-2.5 px-3.5">Alamat</th>
                  <th className="py-2.5 px-3 text-center">Rute</th>
                  <th className="py-2.5 px-3.5">Titik Koordinat</th>
                  <th className="py-2.5 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="size-5 animate-spin text-primary" />
                        <span>Memuat data pelanggan...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Filter className="size-6 text-muted-foreground/60" />
                        <p className="font-medium text-foreground">Tidak ada pelanggan yang cocok</p>
                        <p className="text-copy-12 text-muted-foreground">
                          Coba sesuaikan kata kunci pencarian atau ganti filter status titik GPS.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => {
                    const isQuickTagging = quickTaggingNolg === row.nolg;
                    const fullAlamat = `${row.alamat}${row.rt || row.rw ? ` (RT ${row.rt ?? '-'}/RW ${row.rw ?? '-'})` : ''}`;
                    const nomorBaris =
                      row.noUrutRute ??
                      (pagination.page - 1) * pagination.limit + idx + 1;

                    return (
                      <tr
                        key={row.nolg}
                        onClick={() => handleOpenModal(row)}
                        className="hover:bg-muted/30 transition-colors group h-10 cursor-pointer"
                      >
                        {/* 1. Nomor (Kolom Pertama Terpisah) */}
                        <td className="py-2 px-3 text-center font-mono text-muted-foreground tabular-nums">
                          {nomorBaris}
                        </td>

                        {/* 2. No. Langganan */}
                        <td className="py-2 px-3.5 font-mono font-medium text-foreground">
                          {row.nolg}
                        </td>

                        {/* 3. Nama Pelanggan (1 baris truncate) */}
                        <td
                          className="py-2 px-3.5 font-medium text-foreground max-w-[200px] truncate"
                          title={row.nama}
                        >
                          {row.nama}
                        </td>

                        {/* 4. Alamat (1 baris truncate) */}
                        <td
                          className="py-2 px-3.5 text-muted-foreground max-w-[280px] truncate"
                          title={fullAlamat}
                        >
                          {fullAlamat}
                        </td>

                        {/* 5. Rute (Hanya Kode Rute) */}
                        <td className="py-2 px-3 text-center font-mono text-foreground">
                          {row.ruteKode || '-'}
                        </td>

                        {/* 6. Titik Koordinat / Status Spasial */}
                        <td
                          className="py-2 px-3.5 font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.hasGps && row.lat != null && row.lng != null ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Badge variant="green-subtle" size="sm" className="font-mono">
                                <CheckCircle2 className="size-3" />
                                <span>
                                  {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                                </span>
                              </Badge>
                              <a
                                href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="size-6 rounded-md inline-flex items-center justify-center text-(--ds-blue-700) hover:bg-(--ds-blue-100) transition-colors"
                                title="Buka Titik di Google Maps"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            </div>
                          ) : (
                            <Badge variant="amber-subtle" size="sm">
                              <AlertTriangle className="size-3" />
                              <span>Belum Ada GPS</span>
                            </Badge>
                          )}
                        </td>

                        {/* 7. Aksi Fungsional */}
                        <td
                          className="py-2 px-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isQuickTagging}
                              onClick={(e) => handleQuickGpsDevice(row, e)}
                              className="h-7 px-2 text-label-12 flex items-center gap-1 bg-card"
                              title="Ambil GPS Perangkat (Otomatis buka peta jika deviasi > 12m)"
                            >
                              {isQuickTagging ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Crosshair className="size-3 text-(--ds-blue-700)" />
                              )}
                              <span>GPS Cepat</span>
                            </Button>

                            <Button
                              type="button"
                              variant={row.hasGps ? 'ghost' : 'outline'}
                              size="sm"
                              onClick={() => handleOpenModal(row)}
                              className="h-7 px-2 text-label-12 flex items-center gap-1"
                            >
                              <MapPin className="size-3" />
                              <span>{row.hasGps ? 'Peta / Ubah' : 'Plot Peta'}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Footer Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 py-2.5 border-t border-border bg-muted/20">
            <div className="flex items-center gap-2 text-copy-12 text-muted-foreground">
              <span>Tampilkan</span>
              <Select value={String(pagination.limit)} onValueChange={handleLimitChange}>
                <SelectTrigger size="sm" className="h-7 w-16 text-copy-12 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>
                dari <strong>{pagination.totalRows.toLocaleString('id-ID')}</strong> pelanggan
              </span>
            </div>

            <div className="flex items-center gap-1 text-copy-12">
              <span className="text-muted-foreground mr-2">
                Halaman {pagination.page} dari {Math.max(1, pagination.totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="size-7 p-0 cursor-pointer"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="size-7 p-0 cursor-pointer"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Dialog / Full-Screen Mobile Map Sheet Geotagging */}
      <ModalGeotagging
        pelanggan={selectedPelanggan}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchData}
      />
    </>
  );
}
