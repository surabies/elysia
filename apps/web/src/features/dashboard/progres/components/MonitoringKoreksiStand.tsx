'use client';

import * as React from 'react';
import {
  FileEdit,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  User,
  Droplets,
  Layers,
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
import { PageContainer } from '@/components/layout/page/PageContainer';
import { cn } from '@/lib/utils';
import type {
  KoreksiItem,
  LaporanKoreksiResult,
} from '@/server/services/laporan/laporan-koreksi.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function MonitoringKoreksiStand() {
  const [data, setData] = React.useState<LaporanKoreksiResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/laporan/monitoring-koreksi?thbl=${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring koreksi:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (item) =>
        item.nolg.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        (item.catatanAudit && item.catatanAudit.toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-heading-20 text-foreground">
            Monitoring Koreksi Stand & Audit Trail
          </h1>
          <p className="text-copy-13 text-muted-foreground mt-1">
            Riwayat resmi penyesuaian angka meter, perbaikan salah baca, dan perubahan kubikasi dengan audit log bertingkat.
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

      {/* 2. KPI Cards Koreksi */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Total Koreksi */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Total Rekening Dikoreksi</span>
            <FileEdit className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.summary.totalKoreksi) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">rekening</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Oleh Verifikator & Billing</p>
        </Card>

        {/* Kubikasi Bertambah */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Koreksi Bertambah (+)</span>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            +{data ? numberFormat.format(data.summary.totalM3Tambah) : '0'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Penyesuaian kurang catat</p>
        </Card>

        {/* Kubikasi Berkurang */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Koreksi Berkurang (-)</span>
            <TrendingDown className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-blue-900) font-mono tabular-nums">
            -{data ? numberFormat.format(data.summary.totalM3Kurang) : '0'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Penyesuaian lebih catat</p>
        </Card>

        {/* Netto Selisih */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Netto Deviasi Koreksi</span>
            <Droplets className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? (data.summary.nettoM3 >= 0 ? `+${data.summary.nettoM3}` : data.summary.nettoM3) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Dampak kubikasi ke billing</p>
        </Card>
      </div>

      {/* 3. Controls & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            size="sm"
            placeholder="Cari NOLG, nama pelanggan, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>

        <span className="text-label-12 text-muted-foreground font-mono">
          Menampilkan {filteredItems.length} riwayat koreksi
        </span>
      </div>

      {/* 4. Table Koreksi Stand */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-primary" />
            <p className="text-copy-12 text-muted-foreground">Memuat data monitoring koreksi...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-copy-13 text-muted-foreground">
          Tidak ada data koreksi stand pada periode ini.
        </div>
      ) : (
        /* Tabel Audit Koreksi menggunakan shadcn Table */
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Tarif / Rute</TableHead>
                <TableHead className="text-right">Stand Awal</TableHead>
                <TableHead className="text-right">Stand Revisi</TableHead>
                <TableHead className="text-right">Pakai Awal</TableHead>
                <TableHead className="text-right">Pakai Revisi</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead>Catatan Audit Verifikator</TableHead>
                <TableHead className="text-right">Waktu Koreksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono tabular-nums">
              {filteredItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground font-sans">
                    {row.nolg}
                  </TableCell>
                  <TableCell className="font-sans font-medium text-foreground max-w-[170px] truncate">
                    {row.nama}
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground">
                    <span className="font-medium text-foreground font-mono">{row.tarifKode ?? '-'}</span>
                    <span className="text-label-11 text-muted-foreground ml-1.5">({row.ruteKode ?? '-'})</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(row.stmaAwal)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {numberFormat.format(row.stmaRevisi)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(row.pakaiM3Awal)} m³
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {numberFormat.format(row.pakaiM3Revisi)} m³
                  </TableCell>
                  <TableCell className="text-right">
                    {row.selisihM3 > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +{row.selisihM3} m³
                      </span>
                    ) : row.selisihM3 < 0 ? (
                      <span className="text-(--ds-blue-900) font-medium">
                        {row.selisihM3} m³
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0 m³</span>
                    )}
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground max-w-[260px]">
                    <span className="line-clamp-1 text-copy-12">
                      {row.catatanAudit || row.alasanKoreksi || 'Koreksi terverifikasi'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-label-12">
                    {row.updatedAt
                      ? new Date(row.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
