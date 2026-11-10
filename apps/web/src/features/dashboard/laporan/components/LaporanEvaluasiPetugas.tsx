'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Award,
  Users,
  Search,
  RefreshCw,
  Download,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
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
import { PageContainer } from '@/components/layout/page/PageContainer';
import { cn } from '@/lib/utils';
import type {
  LaporanEvaluasiResult,
  EvaluasiPetugasItem,
} from '@/server/services/laporan/laporan-evaluasi.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export function LaporanEvaluasiPetugas() {
  const [data, setData] = React.useState<LaporanEvaluasiResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState('202601');
  const [search, setSearch] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cater/laporan/evaluasi-petugas?thbl=${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load evaluasi petugas report:', err);
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
        item.nama.toLowerCase().includes(q) ||
        item.petugasId.toLowerCase().includes(q) ||
        (item.noHp && item.noHp.includes(q))
    );
  }, [data, search]);

  const exportCsv = () => {
    if (!filteredItems.length) return;
    const headers = [
      'Peringkat',
      'ID Petugas',
      'Nama Petugas',
      'Target SL',
      'Realisasi SL',
      'Sisa SL',
      'Persen Selesai',
      'Kubikasi m3',
      'Avg Durasi Detik',
      'Total Anomali',
      'Akurasi GPS %',
      'Grade',
    ];
    const rows = filteredItems.map((i) => [
      i.peringkat,
      i.petugasId,
      `"${i.nama}"`,
      i.targetSL,
      i.realisasiSL,
      i.sisaSL,
      `${i.persenSelesai}%`,
      i.totalM3,
      i.rataDurasiDetik,
      i.totalAnomali,
      `${i.akurasiGpsPersen}%`,
      i.gradeKinerja,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-evaluasi-petugas-${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-heading-20 text-foreground">
            Laporan Evaluasi Kinerja Petugas Cater
          </h1>
          <p className="text-copy-13 text-muted-foreground mt-1">
            Penilaian capaian target, produktivitas harian, akurasi GPS, dan kualitas pembacaan 9 petugas cater.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-label-12">
            <span className="text-muted-foreground">Periode:</span>
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

          <Button
            size="sm"
            onClick={exportCsv}
            disabled={loading || !filteredItems.length}
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
            <span className="text-label-12">Petugas Aktif</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalPetugasAktif) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">personel</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Regu pembaca meter resmi</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Rata-rata Pencapaian</span>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? `${data.kpi.rataRataPencapaian}%` : '...'}
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Dari seluruh target rute</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Total SL Terbaca</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalSLSelesai) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Hasil pembacaan terverifikasi</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Kubikasi Tercatat</span>
            <ShieldCheck className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKubikasiTercatat) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Volume air terjual</p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex items-center justify-between">
        <span className="text-label-13 text-muted-foreground">
          Daftar Rapor Kinerja Petugas Periode {periode}
        </span>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            size="sm"
            placeholder="Cari nama atau NIP petugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card"
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
          Tidak ada data kinerja petugas yang ditemukan.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Rank</TableHead>
                <TableHead>Petugas Cater</TableHead>
                <TableHead className="text-right">Target (SL)</TableHead>
                <TableHead className="text-right">Realisasi</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead className="w-36">Capaian</TableHead>
                <TableHead className="text-right">Kubikasi</TableHead>
                <TableHead className="text-right">Avg Durasi</TableHead>
                <TableHead className="text-right">Akurasi GPS</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono tabular-nums">
              {filteredItems.map((item) => (
                <TableRow key={item.petugasId}>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        'size-6 rounded-full inline-flex items-center justify-center text-label-11',
                        item.peringkat === 1
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                          : item.peringkat === 2
                          ? 'bg-(--ds-gray-200) text-foreground font-semibold'
                          : item.peringkat === 3
                          ? 'bg-amber-700/15 text-amber-700 dark:text-amber-400 font-semibold'
                          : 'text-muted-foreground font-normal'
                      )}
                    >
                      {item.peringkat}
                    </span>
                  </TableCell>
                  <TableCell className="font-sans">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full border border-border bg-(--ds-gray-100) text-foreground flex items-center justify-center text-label-11 shrink-0">
                        {item.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-foreground block">{item.nama}</span>
                        <span className="text-label-11 text-muted-foreground font-mono">
                          ID: {item.petugasId} {item.noHp ? `• ${item.noHp}` : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(item.targetSL)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {numberFormat.format(item.realisasiSL)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(item.sisaSL)}
                  </TableCell>
                  <TableCell className="font-sans">
                    <div className="space-y-1">
                      <div className="flex justify-between text-label-11 font-mono">
                        <span className="font-medium text-foreground">{item.persenSelesai}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-(--ds-gray-200) overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            item.persenSelesai >= 90
                              ? 'bg-emerald-500'
                              : item.persenSelesai >= 70
                              ? 'bg-foreground'
                              : 'bg-amber-500'
                          )}
                          style={{ width: `${Math.min(100, item.persenSelesai)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {numberFormat.format(item.totalM3)} m³
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-label-12">
                    {item.rataDurasiDetik} detik
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-label-12">
                    <span className="font-medium text-foreground">{item.akurasiGpsPersen}%</span>
                  </TableCell>
                  <TableCell className="text-center font-sans">
                    <Badge
                      variant={
                        item.gradeKinerja === 'SANGAT_BAIK'
                          ? 'default'
                          : item.gradeKinerja === 'BAIK'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {item.gradeKinerja.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-sans">
                    <Link
                      href={`/verifikasi/baca-petugas?q=${item.petugasId}`}
                      className="inline-flex items-center gap-1 text-label-12 text-(--ds-blue-900) hover:underline"
                    >
                      Verifikasi
                      <ArrowUpRight className="size-3" />
                    </Link>
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
