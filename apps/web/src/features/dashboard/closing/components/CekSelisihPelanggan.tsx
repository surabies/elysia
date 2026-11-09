'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  Users,
  FileCheck2,
  ClipboardList,
  Receipt,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface CekSelisihRuteItem {
  ruteKode: string;
  namaRute: string;
  totalPelanggan: number;
  terbaca: number;
  terbitDrd: number;
  selisih: number;
  status: 'SEIMBANG' | 'SELISIH';
}

export interface CekSelisihData {
  periode: string;
  ringkasan: {
    totalMasterPelanggan: number;
    totalDpmTarget: number;
    totalTerbaca: number;
    totalTerbitDrd: number;
    totalSelisihUnbilled: number;
    statusRekonsiliasi: 'MATCH' | 'DISCREPANCY';
  };
  ruteBreakdown: CekSelisihRuteItem[];
  daftarUnbilled: Array<{
    nolg: string;
    nama: string;
    ruteKode: string;
    stml: number;
    stma: number;
    pakaiM3: number;
    statusVerifikasi: string;
  }>;
}

export function CekSelisihPelanggan() {
  const [periode, setPeriode] = React.useState('202601');
  const [data, setData] = React.useState<CekSelisihData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [galat, setGalat] = React.useState<string | null>(null);

  // Filters
  const [searchRute, setSearchRute] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'SEMUA' | 'SEIMBANG' | 'SELISIH'>('SEMUA');

  const fetchCekSelisih = React.useCallback(async () => {
    setLoading(true);
    setGalat(null);
    try {
      const res = await fetch(`/api/closing/cek-selisih/${periode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setGalat(json.error || 'Gagal memuat data cek selisih.');
      }
    } catch (err: any) {
      setGalat(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchCekSelisih();
  }, [fetchCekSelisih]);

  const filteredRutes = (data?.ruteBreakdown ?? []).filter((r) => {
    const matchSearch =
      r.ruteKode.toLowerCase().includes(searchRute.toLowerCase()) ||
      r.namaRute.toLowerCase().includes(searchRute.toLowerCase());
    const matchStatus =
      filterStatus === 'SEMUA' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const isMatch = data?.ringkasan.statusRekonsiliasi === 'MATCH';

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* 1. Header & Periode Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Cek Selisih Pelanggan
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit rekonsiliasi matematis 4 pilar: Master Induk vs DPM Target vs Hasil Pembacaan Cater vs Rekening DRD.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
            <span className="text-xs font-medium px-2 text-muted-foreground">Periode THBL:</span>
            <Input
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-24 h-8 text-xs font-mono text-center bg-background"
              placeholder="YYYYMM"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCekSelisih}
              disabled={loading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Muat Ulang
            </Button>
          </div>

          <Link href="/tools-tutup/monitoring-tutup-bulan">
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold">
              Ke Closing Periode <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Notice */}
      {galat && (
        <div className="flex items-center gap-2 p-3.5 rounded-md border text-xs bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{galat}</span>
        </div>
      )}

      {/* Status Banner */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border text-xs',
          isMatch
            ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        )}
      >
        <div className="flex items-center gap-3">
          {isMatch ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          )}
          <div>
            <p className="font-bold text-sm">
              {isMatch
                ? 'Status Rekonsiliasi: 100% MATCH (SEIMBANG)'
                : 'Peringatan: Terdapat Pelanggan Unbilled / Selisih'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isMatch
                ? 'Seluruh pelanggan aktif telah tercatat di lapangan dan terbit ke rekening resmi DRD tanpa selisih (0 unbilled).'
                : `Ditemukan ${data?.ringkasan.totalSelisihUnbilled ?? 0} pembacaan yang belum terbit rekening DRD.`}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            'text-xs py-1 px-3 font-semibold',
            isMatch
              ? 'bg-emerald-600 text-white border-transparent'
              : 'bg-destructive text-white border-transparent'
          )}
        >
          {isMatch ? 'SIAP TUTUP BULAN' : 'PERLU TINDAKAN'}
        </Badge>
      </div>

      {/* 2. 4-Pilar Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">1. Master Pelanggan</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono">
              {loading ? '-' : (data?.ringkasan.totalMasterPelanggan ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-muted-foreground font-mono">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Data Induk Sambungan Aktif</p>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">2. Target DPM</span>
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono">
              {loading ? '-' : (data?.ringkasan.totalDpmTarget ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-muted-foreground font-mono">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Beban Kerja Daftar Catat</p>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">3. Realisasi Pembacaan</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-blue-600">
              {loading ? '-' : (data?.ringkasan.totalTerbaca ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-muted-foreground font-mono">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Hasil Baca Petugas Lapangan</p>
        </Card>

        <Card className="p-4 bg-card border-emerald-500/30">
          <div className="flex items-center justify-between text-foreground">
            <span className="text-xs font-semibold">4. Rekening DRD Terbit</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {loading ? '-' : (data?.ringkasan.totalTerbitDrd ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-muted-foreground font-mono">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Tagihan Resmi yang Diterbitkan</p>
        </Card>
      </div>

      {/* 3. Route Breakdown Reconciliation Table */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Rekonsiliasi per Rute Pembacaan ({filteredRutes.length} Rute)
            </h2>
            <p className="text-xs text-muted-foreground">
              Pemeriksaan keselarasan jumlah pelanggan, hasil baca, dan tagihan terbit di masing-masing rute kerja.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/40 text-xs">
              <Button
                size="sm"
                variant={filterStatus === 'SEMUA' ? 'secondary' : 'ghost'}
                onClick={() => setFilterStatus('SEMUA')}
                className="h-6 text-[11px] px-2.5"
              >
                Semua ({data?.ruteBreakdown.length ?? 0})
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'SEIMBANG' ? 'secondary' : 'ghost'}
                onClick={() => setFilterStatus('SEIMBANG')}
                className="h-6 text-[11px] px-2.5 text-emerald-600"
              >
                Seimbang
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'SELISIH' ? 'secondary' : 'ghost'}
                onClick={() => setFilterStatus('SELISIH')}
                className="h-6 text-[11px] px-2.5 text-destructive"
              >
                Selisih
              </Button>
            </div>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={searchRute}
                onChange={(e) => setSearchRute(e.target.value)}
                placeholder="Cari kode rute e.g. CD104..."
                className="h-8 pl-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto max-h-[460px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-[11px]">
                <TableHead className="font-semibold">Kode Rute</TableHead>
                <TableHead className="font-semibold">Wilayah Rute</TableHead>
                <TableHead className="text-right font-semibold">Master Pelanggan</TableHead>
                <TableHead className="text-right font-semibold">Terbaca Cater</TableHead>
                <TableHead className="text-right font-semibold">Terbit DRD</TableHead>
                <TableHead className="text-right font-semibold">Selisih</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Memuat data rekonsiliasi rute...
                  </TableCell>
                </TableRow>
              ) : filteredRutes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Tidak ada data rute yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRutes.map((r, i) => (
                  <TableRow key={i} className="text-xs hover:bg-muted/40">
                    <TableCell className="font-mono font-bold text-foreground">{r.ruteKode}</TableCell>
                    <TableCell className="text-muted-foreground">{r.namaRute}</TableCell>
                    <TableCell className="text-right font-mono">{r.totalPelanggan}</TableCell>
                    <TableCell className="text-right font-mono text-blue-600">{r.terbaca}</TableCell>
                    <TableCell className="text-right font-mono font-medium text-emerald-600">
                      {r.terbitDrd}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={cn(r.selisih > 0 ? 'text-destructive font-bold' : 'text-muted-foreground')}>
                        {r.selisih}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] py-0 px-2 font-semibold',
                          r.status === 'SEIMBANG'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        )}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 4. Unbilled Drilldown Table if Discrepancy Exists */}
      {data && data.daftarUnbilled.length > 0 && (
        <Card className="p-4 space-y-3 border-destructive/30">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h3 className="text-xs font-bold">
              Daftar Pelanggan Unbilled ({data.daftarUnbilled.length} Sample Pelanggan Terbaca Belum Terbit DRD)
            </h3>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-[11px]">
                  <TableHead className="font-semibold">No Sambungan (NOLG)</TableHead>
                  <TableHead className="font-semibold">Nama Pelanggan</TableHead>
                  <TableHead className="font-semibold">Rute</TableHead>
                  <TableHead className="text-right font-semibold">STML</TableHead>
                  <TableHead className="text-right font-semibold">STMA</TableHead>
                  <TableHead className="text-right font-semibold">Pemakaian (m³)</TableHead>
                  <TableHead className="font-semibold">Status Verifikasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daftarUnbilled.map((u, i) => (
                  <TableRow key={i} className="text-xs">
                    <TableCell className="font-mono font-medium">{u.nolg}</TableCell>
                    <TableCell>{u.nama}</TableCell>
                    <TableCell className="font-mono">{u.ruteKode}</TableCell>
                    <TableCell className="text-right font-mono">{u.stml}</TableCell>
                    <TableCell className="text-right font-mono">{u.stma}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{u.pakaiM3}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {u.statusVerifikasi}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
