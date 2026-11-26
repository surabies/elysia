'use client';

import * as React from 'react';
import {
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
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
import { cn } from '@/lib/utils';
import { pelangganApi } from '../api';
import type {
  PelangganKontakItem,
  KontakKpiStats,
  KontakStatusFilter,
  PaginationMeta,
} from '../types';
import { RingkasanKontakKpi } from './RingkasanKontakKpi';
import { ModalEditKontak } from './ModalEditKontak';

export function ValidasiKontakView() {
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<KontakStatusFilter>('ALL');
  const [ruteFilter, setRuteFilter] = React.useState<string>('all');
  const [ruteOptions, setRuteOptions] = React.useState<Array<{ kode: string; nama?: string }>>([]);

  const [items, setItems] = React.useState<PelangganKontakItem[]>([]);
  const [kpiStats, setKpiStats] = React.useState<KontakKpiStats | null>(null);
  const [pagination, setPagination] = React.useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalRows: 0,
    totalPages: 1,
  });

  // State dialog modal edit
  const [selectedPelanggan, setSelectedPelanggan] = React.useState<PelangganKontakItem | null>(null);
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
      const res = await pelangganApi.getDaftarKontak({
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
      toast.error(err.message || 'Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, statusFilter, ruteFilter, pagination.page, pagination.limit]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (item: PelangganKontakItem) => {
    setSelectedPelanggan(item);
    setModalOpen(true);
  };

  const handleFilterStatus = (status: KontakStatusFilter) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (val: string) => {
    setPagination((prev) => ({ ...prev, limit: Number(val), page: 1 }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 w-full">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <h1 className="text-heading-20 sm:text-heading-24 font-bold text-foreground tracking-tight">
            Validasi Nomor Kontak / WhatsApp Pelanggan
          </h1>
          <p className="text-copy-13 text-muted-foreground mt-0.5">
            Manajemen dan pemutakhiran nomor seluler pelanggan untuk notifikasi baca meter, e-Billing DRD, serta konfirmasi lapangan.
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

      {/* KPI Stats Strip */}
      <RingkasanKontakKpi stats={kpiStats} loading={loading} />

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        {/* Status Filter Tabs / Segmented Pills */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleFilterStatus('ALL')}
            className={cn(
              'h-7 px-3 text-label-12 font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
              statusFilter === 'ALL'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Semua</span>
            {kpiStats && (
              <Badge variant="gray-subtle" size="sm" className="h-4.5 px-1.5 text-[10px]">
                {kpiStats.total}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleFilterStatus('VALID')}
            className={cn(
              'h-7 px-3 text-label-12 font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
              statusFilter === 'VALID'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="size-3.5 text-(--ds-green-700)" />
            <span>Valid WA</span>
            {kpiStats && (
              <Badge variant="green-subtle" size="sm" className="h-4.5 px-1.5 text-[10px]">
                {kpiStats.valid}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleFilterStatus('EMPTY')}
            className={cn(
              'h-7 px-3 text-label-12 font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
              statusFilter === 'EMPTY'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertCircle className="size-3.5 text-(--ds-amber-800)" />
            <span>Belum Ada</span>
            {kpiStats && (
              <Badge variant="amber-subtle" size="sm" className="h-4.5 px-1.5 text-[10px]">
                {kpiStats.empty}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleFilterStatus('INVALID')}
            className={cn(
              'h-7 px-3 text-label-12 font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
              statusFilter === 'INVALID'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Phone className="size-3.5 text-(--ds-blue-700)" />
            <span>Perlu Cek</span>
            {kpiStats && (
              <Badge variant="blue-subtle" size="sm" className="h-4.5 px-1.5 text-[10px]">
                {kpiStats.invalid}
              </Badge>
            )}
          </button>
        </div>

        {/* Search & Rute Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Filter Rute */}
          <div className="w-full sm:w-44">
            <Select value={ruteFilter} onValueChange={(val) => { setRuteFilter(val); setPagination((p) => ({ ...p, page: 1 })); }}>
              <SelectTrigger size="sm" className="h-8 text-label-12 bg-card">
                <SelectValue placeholder="Pilih Rute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rute</SelectItem>
                {ruteOptions.map((r) => (
                  <SelectItem key={r.kode} value={r.kode}>
                    {r.nama || r.kode}
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
              className="h-8 pl-8 pr-3 text-label-12 bg-card"
            />
            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Tabel Data Pelanggan - Kolom Terpisah Rapi Tanpa Baris Bertumpuk */}
      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-copy-13 whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-label-12 font-medium text-muted-foreground">
                <th className="py-2.5 px-3.5">No. Langganan</th>
                <th className="py-2.5 px-3.5">Nama Pelanggan</th>
                <th className="py-2.5 px-3.5">Alamat</th>
                <th className="py-2.5 px-3 text-center">Rute</th>
                <th className="py-2.5 px-3 text-center">Tarif</th>
                <th className="py-2.5 px-3.5">Status Sambungan</th>
                <th className="py-2.5 px-3.5">No. HP / WhatsApp</th>
                <th className="py-2.5 px-3.5">Status Kontak</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-5 animate-spin text-primary" />
                      <span>Memuat data pelanggan...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Filter className="size-6 text-muted-foreground/60" />
                      <p className="font-medium text-foreground">Tidak ada pelanggan yang cocok</p>
                      <p className="text-copy-12 text-muted-foreground">
                        Coba sesuaikan kata kunci pencarian atau ganti filter status kontak.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.nolg}
                    className="hover:bg-muted/30 transition-colors group h-10"
                  >
                    {/* 1. NOLG */}
                    <td className="py-2 px-3.5 font-mono font-medium text-foreground">
                      {row.nolg}
                    </td>

                    {/* 2. Nama Pelanggan */}
                    <td className="py-2 px-3.5 font-medium text-foreground max-w-[220px] truncate" title={row.nama}>
                      {row.nama}
                    </td>

                    {/* 3. Alamat */}
                    <td className="py-2 px-3.5 text-muted-foreground max-w-[280px] truncate" title={`${row.alamat} ${row.rt ? `RT ${row.rt}` : ''} ${row.rw ? `RW ${row.rw}` : ''}`}>
                      {row.alamat}
                      {(row.rt || row.rw) && (
                        <span className="ml-1 text-muted-foreground/70">
                          (RT {row.rt ?? '-'} / RW {row.rw ?? '-'})
                        </span>
                      )}
                    </td>

                    {/* 4. Rute */}
                    <td className="py-2 px-3 text-center font-mono text-foreground">
                      {row.ruteKode ?? '-'}
                    </td>

                    {/* 5. Tarif */}
                    <td className="py-2 px-3 text-center font-mono text-foreground">
                      {row.tarifKode ?? '-'}
                    </td>

                    {/* 6. Status Sambungan (Geist Badge) */}
                    <td className="py-2 px-3.5">
                      <Badge
                        variant={row.status === 'PELANGGAN AKTIF' ? 'green-subtle' : 'gray-subtle'}
                        size="sm"
                      >
                        {row.status === 'PELANGGAN AKTIF' ? 'AKTIF' : row.status}
                      </Badge>
                    </td>

                    {/* 7. Nomor Kontak */}
                    <td className="py-2 px-3.5 font-mono">
                      {row.noTelp ? (
                        <span className="text-foreground">{row.noTelp}</span>
                      ) : (
                        <span className="text-muted-foreground/60 italic text-copy-12">-</span>
                      )}
                    </td>

                    {/* 8. Status Kontak (Geist Badge) */}
                    <td className="py-2 px-3.5">
                      {row.statusKontak === 'VALID' ? (
                        <Badge variant="green-subtle" size="sm">
                          <CheckCircle2 className="size-3" />
                          Valid WA
                        </Badge>
                      ) : row.statusKontak === 'EMPTY' ? (
                        <Badge variant="amber-subtle" size="sm">
                          <AlertCircle className="size-3" />
                          Belum Ada
                        </Badge>
                      ) : (
                        <Badge variant="blue-subtle" size="sm">
                          <Phone className="size-3" />
                          Perlu Cek
                        </Badge>
                      )}
                    </td>

                    {/* 9. Aksi */}
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.waLink && (
                          <a
                            href={row.waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="size-7 rounded-md inline-flex items-center justify-center text-(--ds-green-700) hover:bg-(--ds-green-200) transition-colors cursor-pointer"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(row)}
                          className="h-7 px-2 text-label-12 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="size-3" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
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
              dari <strong>{pagination.totalRows.toLocaleString('id-ID')}</strong> data
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
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="size-7 p-0 cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Dialog Edit Kontak */}
      <ModalEditKontak
        pelanggan={selectedPelanggan}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
