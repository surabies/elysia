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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Award className="size-6 text-primary" />
            Laporan Evaluasi Kinerja Petugas Cater
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Penilaian capaian target, produktivitas harian, akurasi GPS, dan kualitas pembacaan 9 petugas cater.
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
            <span className="text-xs font-medium">Petugas Aktif</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalPetugasAktif) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">personel</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Regu pembaca meter resmi</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rata-rata Pencapaian</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? `${data.kpi.rataRataPencapaian}%` : '...'}
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Dari seluruh target rute</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total SL Terbaca</span>
            <CheckCircle2 className="size-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalSLSelesai) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">SL</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Hasil pembacaan terverifikasi</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kubikasi Tercatat</span>
            <ShieldCheck className="size-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.kpi.totalKubikasiTercatat) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Volume air terjual</p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex items-center justify-between">
        <span className="text-label-12 text-muted-foreground font-medium">
          Daftar Rapor Kinerja Petugas Periode {periode}
        </span>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NIP petugas..."
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
          Tidak ada data kinerja petugas yang ditemukan.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
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
            <TableBody className="font-mono">
              {filteredItems.map((item) => (
                <TableRow key={item.petugasId}>
                  <TableCell className="text-center font-bold">
                    <span
                      className={cn(
                        'size-6 rounded-full inline-flex items-center justify-center text-xs',
                        item.peringkat === 1
                          ? 'bg-amber-500/20 text-amber-600 font-extrabold'
                          : item.peringkat === 2
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-foreground font-bold'
                          : item.peringkat === 3
                          ? 'bg-amber-700/20 text-amber-700 font-bold'
                          : 'text-muted-foreground font-normal'
                      )}
                    >
                      {item.peringkat}
                    </span>
                  </TableCell>
                  <TableCell className="font-sans">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {item.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">{item.nama}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: {item.petugasId} {item.noHp ? `• ${item.noHp}` : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(item.targetSL)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {numberFormat.format(item.realisasiSL)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {numberFormat.format(item.sisaSL)}
                  </TableCell>
                  <TableCell className="font-sans">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="font-bold text-foreground">{item.persenSelesai}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            item.persenSelesai >= 90
                              ? 'bg-emerald-500'
                              : item.persenSelesai >= 70
                              ? 'bg-primary'
                              : 'bg-amber-500'
                          )}
                          style={{ width: `${Math.min(100, item.persenSelesai)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {numberFormat.format(item.totalM3)} m³
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-label-11">
                    {item.rataDurasiDetik} detik
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-label-11">
                    <span className="font-semibold text-foreground">{item.akurasiGpsPersen}%</span>
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
                      className="text-[10px]"
                    >
                      {item.gradeKinerja.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-sans">
                    <Link
                      href={`/verifikasi/baca-petugas?q=${item.petugasId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
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
    </div>
  );
}
