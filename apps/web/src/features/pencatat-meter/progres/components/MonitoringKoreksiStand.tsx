'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileEdit,
  Search,
  TrendingUp,
  TrendingDown,
  Droplets,
  ArrowUpRight,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PERIODE_BERJALAN_AKTIF } from '@/config/periode';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KoreksiStandHeader } from './KoreksiStandHeader';
import type { PeriodeOption } from '@/server/services/dashboard/dashboard.service';
import type {
  JenisKoreksiStand,
  KoreksiItem,
  LaporanKoreksiResult,
} from '@/server/services/laporan/laporan-koreksi.service';

const numberFormat = new Intl.NumberFormat('id-ID');

type FilterJenis = 'ALL' | JenisKoreksiStand | 'PLUS' | 'MINUS';

export interface MonitoringKoreksiStandProps {
  initialPeriode?: string;
  availablePeriods?: PeriodeOption[];
}

const LABEL_JENIS_KOREKSI: Record<JenisKoreksiStand, { label: string; className: string }> = {
  METER_BARU: {
    label: 'Meter Baru (MB)',
    className:
      'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300',
  },
  MUDA_KEMBALI: {
    label: 'Muda Kembali',
    className:
      'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-300',
  },
  TAKSASI: {
    label: 'Taksasi / Tagih',
    className:
      'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300',
  },
  STAND_METER: {
    label: 'Koreksi Stand',
    className:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300',
  },
};

const LABEL_STATUS_VERIF: Record<string, { label: string; className: string }> = {
  APPROVED_FINAL: {
    label: 'V3 Sah',
    className:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  LOCKED_BILLING: {
    label: 'Terkunci DRD',
    className:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  VERIFIED_L2: {
    label: 'V2',
    className:
      'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  VERIFIED_L1: {
    label: 'V1',
    className:
      'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  NEED_RESURVEY: {
    label: 'Cek Ulang',
    className:
      'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
};

function infoStatusVerif(status: string) {
  return (
    LABEL_STATUS_VERIF[status] ?? {
      label: 'Menunggu V1',
      className: 'border-border bg-muted/60 text-muted-foreground',
    }
  );
}

export function MonitoringKoreksiStand({
  initialPeriode,
  availablePeriods = [],
}: MonitoringKoreksiStandProps = {}) {
  const [data, setData] = React.useState<LaporanKoreksiResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [periode, setPeriode] = React.useState(
    initialPeriode || PERIODE_BERJALAN_AKTIF,
  );
  const [search, setSearch] = React.useState('');
  const [filterJenis, setFilterJenis] = React.useState<FilterJenis>('ALL');

  React.useEffect(() => {
    if (initialPeriode && initialPeriode !== periode) {
      setPeriode(initialPeriode);
    }
  }, [initialPeriode]);

  const periodeLabel = React.useMemo(() => {
    if (availablePeriods && availablePeriods.length > 0) {
      const match = availablePeriods.find((p) => p.thbl === periode);
      if (match) return match.label;
    }
    if (periode && periode.length === 6) {
      const y = periode.slice(0, 4);
      const m = periode.slice(4);
      return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${y}-${m}-01T00:00:00`));
    }
    return periode;
  }, [periode, availablePeriods]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cater/laporan/monitoring-koreksi?thbl=${encodeURIComponent(periode)}`,
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring koreksi:', err);
      toast.error('Gagal memuat data monitoring koreksi stand.');
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    const q = search.trim().toLowerCase();
    return data.items.filter((item) => {
      const matchSearch =
        !q ||
        item.nolg.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        (item.ruteKode && item.ruteKode.toLowerCase().includes(q)) ||
        (item.catatanAudit && item.catatanAudit.toLowerCase().includes(q)) ||
        (item.alasanKoreksi && item.alasanKoreksi.toLowerCase().includes(q)) ||
        (item.namaVerifikator && item.namaVerifikator.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterJenis === 'ALL') return true;
      if (filterJenis === 'PLUS') return item.selisihM3 > 0;
      if (filterJenis === 'MINUS') return item.selisihM3 < 0;
      return item.jenisKoreksi === filterJenis;
    });
  }, [data, search, filterJenis]);

  const exportCsv = React.useCallback(() => {
    if (!filteredItems.length) {
      toast.error('Tidak ada data koreksi untuk diekspor');
      return;
    }

    const headers = [
      'NOLG',
      'Nama Pelanggan',
      'Tarif',
      'Rute',
      'Jenis Koreksi',
      'Stand Lalu',
      'Stand Baca Awal',
      'Stand Revisi',
      'Stand Angkat MB',
      'Pakai Awal (m3)',
      'Pakai Revisi (m3)',
      'Selisih Dampak (m3)',
      'Verifikator',
      'Catatan Audit',
      'Waktu Koreksi',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.nolg}"`,
      `"${item.nama.replace(/"/g, '""')}"`,
      item.tarifKode ?? '',
      item.ruteKode ?? '',
      LABEL_JENIS_KOREKSI[item.jenisKoreksi]?.label ?? item.jenisKoreksi,
      item.stmlRevisi ?? item.stml,
      item.stmaAwal,
      item.stmaRevisi,
      item.standAngkat ?? (item.mbTanpaStandAngkat ? 'OVERRIDE_TANPA_STAND_ANGKAT' : ''),
      item.pakaiM3Awal,
      item.pakaiM3Revisi,
      item.selisihM3,
      `"${(item.namaVerifikator ?? '').replace(/"/g, '""')}"`,
      `"${(item.catatanAudit ?? item.alasanKoreksi ?? '').replace(/"/g, '""')}"`,
      item.updatedAt,
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-koreksi-stand-${periode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengekspor ${filteredItems.length} baris koreksi ke CSV`);
  }, [filteredItems, periode]);

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Telemetri Vercel Geist (Konsisten dengan seluruh modul Progres) */}
      <KoreksiStandHeader
        periodeThbl={periode}
        periodeLabel={periodeLabel}
        availablePeriods={availablePeriods}
        onPeriodChange={setPeriode}
        onRefresh={fetchData}
        onExportCsv={exportCsv}
        canExport={filteredItems.length > 0}
        loading={loading}
        summary={data?.summary}
      />

      {/* 2. KPI Cards Koreksi */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Total Rekening Dikoreksi</span>
            <FileEdit className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data ? numberFormat.format(data.summary.totalKoreksi) : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">
              SL
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Termasuk {data?.summary.totalMeterBaru ?? 0} MB &amp;{' '}
            {data?.summary.totalRollover ?? 0} Rollover
          </p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Dampak Kubikasi Bertambah (+)</span>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            +{data ? numberFormat.format(data.summary.totalM3Tambah) : '0'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">
              m³
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Penambahan kubikasi tagih terverifikasi
          </p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Dampak Kubikasi Berkurang (-)</span>
            <TrendingDown className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 text-(--ds-blue-900) font-mono tabular-nums">
            -{data ? numberFormat.format(data.summary.totalM3Kurang) : '0'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">
              m³
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Pengurangan lebih catat / revisi stand
          </p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-12">Netto Deviasi Kubikasi</span>
            <Droplets className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 text-foreground font-mono tabular-nums">
            {data
              ? data.summary.nettoM3 >= 0
                ? `+${numberFormat.format(data.summary.nettoM3)}`
                : numberFormat.format(data.summary.nettoM3)
              : '...'}
            <span className="text-label-12 font-normal text-muted-foreground ml-1.5 font-sans">
              m³
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Selisih bersih dampak terhadap DRD
          </p>
        </Card>
      </div>

      {/* 3. Filter Bar & Pencarian */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              size="sm"
              placeholder="Cari NOLG, nama, rute, verifikator, alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 bg-card text-xs"
            />
          </div>

          <div className="inline-flex flex-wrap rounded-md border border-border bg-muted/40 p-0.5">
            {(
              [
                { id: 'ALL', label: `Semua (${data?.items.length ?? 0})` },
                { id: 'STAND_METER', label: 'Stand Meter' },
                { id: 'METER_BARU', label: 'Meter Baru (MB)' },
                { id: 'MUDA_KEMBALI', label: 'Muda Kembali' },
                { id: 'TAKSASI', label: 'Taksasi' },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.id}
                size="xs"
                variant={filterJenis === tab.id ? 'secondary' : 'ghost'}
                onClick={() => setFilterJenis(tab.id)}
                className="h-7 px-2.5 text-xs cursor-pointer"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <span className="text-label-12 text-muted-foreground font-mono">
          Menampilkan {filteredItems.length} dari {data?.items.length ?? 0} riwayat koreksi
        </span>
      </div>

      {/* 4. Tabel Audit Koreksi Stand */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-lg border border-border bg-card/50">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-primary" />
            <p className="text-copy-12 text-muted-foreground">
              Memuat audit koreksi periode {periode}...
            </p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 border-dashed border-border bg-card/40 text-center">
          <FileEdit className="size-8 text-muted-foreground/50" />
          <p className="text-label-14 font-medium text-foreground">
            Belum ada riwayat koreksi stand pada periode {periodeLabel} ({periode})
          </p>
          <p className="text-copy-12 text-muted-foreground max-w-md">
            Setiap perubahan angka stand, pengisian Stand Angkat Meter Baru (MB), konfirmasi Muda Kembali, maupun revisi kubikasi dari halaman Verifikasi Petugas akan tercatat otomatis di sini.
          </p>
          <Link href="/verifikasi/baca-petugas">
            <Button variant="outline" size="sm" className="mt-2 gap-1.5">
              Buka Verifikasi Petugas
              <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tarif / Rute</TableHead>
                <TableHead>Jenis Koreksi</TableHead>
                <TableHead className="text-right">Stand Lalu</TableHead>
                <TableHead className="text-right">Stand Baca → Revisi</TableHead>
                <TableHead className="text-right">Pakai Awal → Revisi</TableHead>
                <TableHead
                  className="text-right"
                  title="Selisih perubahan kubikasi akibat koreksi (Pakai Revisi dikurangi Pakai Awal)"
                >
                  Selisih Koreksi
                </TableHead>
                <TableHead>Status Tahap</TableHead>
                <TableHead>Catatan Audit &amp; Verifikator</TableHead>
                <TableHead className="text-right">Waktu</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono tabular-nums">
              {filteredItems.map((row) => {
                const badgeInfo = LABEL_JENIS_KOREKSI[row.jenisKoreksi];
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-sans">
                      <div className="font-mono text-label-12 font-semibold text-foreground">
                        {row.nolg}
                      </div>
                      <div className="text-copy-12 text-muted-foreground max-w-[180px] truncate">
                        {row.nama}
                      </div>
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground">
                      <span className="font-medium text-foreground font-mono">
                        {row.tarifKode ?? '-'}
                      </span>
                      <span className="text-label-11 text-muted-foreground ml-1.5">
                        ({row.ruteKode ?? '-'})
                      </span>
                    </TableCell>
                    <TableCell className="font-sans">
                      <Badge
                        variant="outline"
                        className={cn('text-[11px] font-medium', badgeInfo.className)}
                      >
                        {badgeInfo.label}
                      </Badge>
                      {row.jenisKoreksi === 'METER_BARU' && (
                        <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                          {row.standAngkat != null
                            ? `Angkat: ${numberFormat.format(row.standAngkat)}`
                            : row.mbTanpaStandAngkat
                              ? 'Override Tanpa St. Angkat'
                              : null}
                        </div>
                      )}
                      {row.jenisKoreksi === 'MUDA_KEMBALI' && row.digitRollover != null && (
                        <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                          {row.digitRollover} Digit ({numberFormat.format(10 ** row.digitRollover)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.stmlRevisi != null && row.stmlRevisi !== row.stml ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="line-through opacity-60">
                            {numberFormat.format(row.stml)}
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {numberFormat.format(row.stmlRevisi)}
                          </span>
                        </span>
                      ) : (
                        numberFormat.format(row.stml)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.stmaRevisi !== row.stmaAwal ? (
                        <span className="inline-flex items-center justify-end gap-1">
                          <span className="text-muted-foreground">
                            {numberFormat.format(row.stmaAwal)}
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {numberFormat.format(row.stmaRevisi)}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium text-foreground">
                          {numberFormat.format(row.stmaRevisi)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-end gap-1">
                        <span
                          className={cn(
                            'text-muted-foreground',
                            row.pakaiM3Awal < 0 && 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {numberFormat.format(row.pakaiM3Awal)}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {numberFormat.format(row.pakaiM3Revisi)} m³
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.selisihM3 > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          +{numberFormat.format(row.selisihM3)} m³
                        </span>
                      ) : row.selisihM3 < 0 ? (
                        <span className="text-(--ds-blue-900) font-medium">
                          {numberFormat.format(row.selisihM3)} m³
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0 m³</span>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">
                      {(() => {
                        const st = infoStatusVerif(row.statusVerifikasi);
                        return (
                          <Badge
                            variant="outline"
                            className={cn('text-[11px] font-medium', st.className)}
                          >
                            {st.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="font-sans max-w-[260px]">
                      <div className="line-clamp-1 text-copy-12 text-foreground">
                        {row.catatanAudit || row.alasanKoreksi || 'Koreksi terverifikasi'}
                      </div>
                      {row.namaVerifikator && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <UserCheck className="size-3" />
                          <span>{row.namaVerifikator}</span>
                        </div>
                      )}
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
                    <TableCell className="text-right font-sans">
                      <Link
                        href={`/verifikasi/baca-petugas?q=${encodeURIComponent(row.nolg)}`}
                        className="inline-flex items-center gap-1 text-label-12 font-medium text-(--ds-blue-900) hover:underline"
                      >
                        Detail
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
