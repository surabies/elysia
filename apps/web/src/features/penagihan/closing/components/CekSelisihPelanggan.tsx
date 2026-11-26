'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  PlusCircle,
  Receipt,
  Search,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  ClosingSmoothPanel,
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/penagihan/closing/components/shared';
import { cn } from '@/lib/utils';
import {
  useCekSelisih,
  type FilterRekonsiliasiStatus,
} from '../hooks/use-cek-selisih';
import { formatAngkaId, formatPeriodeLabelId } from '../lib/closing-format';
import { ClosingSubNavBar } from './ClosingSubNavBar';

export function CekSelisihPelanggan() {
  const {
    periode,
    daftarPeriode,
    setPeriode,
    data,
    loading,
    refreshing,
    feedback,
    setFeedback,
    searchRute,
    setSearchRute,
    filterStatus,
    setFilterStatus,
    filteredRutes,
    isMatch,
    loadCekSelisih,
  } = useCekSelisih();

  const isPraClosing = data?.modeAudit !== 'PASCA_CLOSING';
  const totalMaster = data?.ringkasan.totalMasterPelanggan ?? 0;
  const totalDpm = data?.ringkasan.totalDpmTarget ?? 0;
  const totalTerbaca = data?.ringkasan.totalTerbaca ?? 0;
  const totalDrd = data?.ringkasan.totalTerbitDrd ?? 0;
  const totalBelumBaca =
    data?.ringkasan.totalBelumTerbaca ?? Math.max(0, totalDpm - totalTerbaca);
  const totalSelisih = data?.ringkasan.totalSelisihUnbilled ?? 0;

  const selisihRuteCount = (data?.ruteBreakdown ?? []).filter(
    (r) => r.status === 'SELISIH',
  ).length;
  const seimbangRuteCount = (data?.ruteBreakdown ?? []).filter(
    (r) => r.status === 'SEIMBANG',
  ).length;

  return (
    <PageContainer className="space-y-4">
      <PageSectionHeader
        title="3. Cek Selisih"
        description="Audit rekonsiliasi jumlah pelanggan aktif (diluar DICABUT) per rute: Master vs Target DPM vs Realisasi Baca vs Rekening DRD."
        badge={
          <Badge variant={isPraClosing ? 'blue-subtle' : 'secondary'} size="md">
            {isPraClosing ? 'Mode Pra-Closing' : 'Mode Pasca-Closing'}
          </Badge>
        }
        actions={
          <PeriodFilterBar
            periode={periode}
            options={daftarPeriode}
            onPeriodeChange={setPeriode}
            onRefresh={loadCekSelisih}
            loading={loading || refreshing}
            label="Periode"
          />
        }
      />

      <ClosingSubNavBar />

      <ClosingSmoothPanel refreshing={refreshing}>
        <StatusFeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />

      {/* Strip Telemetri 4 Pilar (Geist Hairline) */}
      <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <div className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              1. Master Pelanggan Aktif
            </span>
            <Users className="size-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(totalMaster)}
            </span>
            <span className="text-xs text-muted-foreground">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Diluar sambungan berstatus DICABUT
          </p>
        </div>

        <div className="space-y-1 border-border px-4 py-3 sm:border-l lg:border-l-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              2. Target DPM ({periode})
            </span>
            <ClipboardList className="size-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(totalDpm)}
            </span>
            <span className="text-xs text-muted-foreground">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totalMaster === totalDpm
              ? 'Sinkron 100% dengan Master Aktif'
              : `Selisih ${formatAngkaId(Math.abs(totalMaster - totalDpm))} SL dari Master`}
          </p>
        </div>

        <div className="space-y-1 border-border px-4 py-3 sm:border-t lg:border-t-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              3. Realisasi Terbaca
            </span>
            <FileCheck2 className="size-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(totalTerbaca)}
            </span>
            <span className="text-xs text-muted-foreground">SL</span>
          </div>
          <p
            className={cn(
              'text-[11px]',
              totalBelumBaca > 0
                ? 'font-medium text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400',
            )}
          >
            {loading
              ? '...'
              : totalBelumBaca > 0
                ? `${formatAngkaId(totalBelumBaca)} SL belum tercatat`
                : '100% target DPM sudah terbaca'}
          </p>
        </div>

        <div className="space-y-1 border-border px-4 py-3 sm:border-t sm:border-l lg:border-t-0 lg:border-l-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              4. Rekening DRD Resmi
            </span>
            <Receipt className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(totalDrd)}
            </span>
            <span className="text-xs text-muted-foreground">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isPraClosing
              ? 'Terbit otomatis saat Kunci Buku (Tab 5)'
              : totalDrd === totalTerbaca
                ? '100% bacaan telah terbit DRD'
                : `Selisih ${formatAngkaId(Math.abs(totalTerbaca - totalDrd))} SL`}
          </p>
        </div>
      </div>

      {/* Banner Ringkas Status Rekonsiliasi + Tombol Tindak Lanjut */}
      {!loading && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3',
            isMatch
              ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 dark:border-emerald-950/60 dark:bg-emerald-950/20 dark:text-emerald-300'
              : 'border-amber-200 bg-amber-50/40 text-amber-900 dark:border-amber-950/60 dark:bg-amber-950/20 dark:text-amber-300',
          )}
        >
          <div className="flex items-start gap-2.5">
            {isMatch ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <div className="text-xs">
              <p className="font-semibold">
                {isMatch
                  ? isPraClosing
                    ? `100% Rute Seimbang — Siap Lanjut ke 4. Perbandingan & 5. Tutup Bulan`
                    : `Rekonsiliasi 4 Pilar Seimbang 100% (0 Unbilled)`
                  : isPraClosing
                    ? `Terdapat ${formatAngkaId(totalSelisih)} SL belum selesai pada ${formatAngkaId(selisihRuteCount)} rute baca`
                    : `Ditemukan selisih ${formatAngkaId(totalSelisih)} SL antara bacaan dan rekening DRD`}
              </p>
              <p className="mt-0.5 text-[11px] opacity-85">
                {isMatch
                  ? `Seluruh ${formatAngkaId(totalMaster)} pelanggan aktif pada ${formatPeriodeLabelId(periode)} telah selaras tanpa selisih.`
                  : isPraClosing
                    ? 'Gunakan filter "Selisih" di bawah untuk melihat rute yang belum 100% terbaca, lalu lengkapi via stand PBPK, Hitung Rata-Rata, atau Manual ADD.'
                    : 'Periksa daftar pelanggan unbilled pada tabel rincian di bagian bawah halaman ini.'}
              </p>
            </div>
          </div>

          {!isMatch && isPraClosing && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button asChild variant="outline" size="xs">
                <Link href="/tools-tutup/pbpk">
                  <span>Input Stand PBPK</span>
                  <ExternalLink className="size-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xs">
                <Link href="/meter/hitung-rata-rata">
                  <Calculator className="size-3" />
                  <span>Rata-Rata</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="xs">
                <Link href="/pelanggan/manual-add">
                  <PlusCircle className="size-3" />
                  <span>Manual ADD</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tabel Rekonsiliasi Rute Compact */}
      <Card className="overflow-hidden border-border p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/25 px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold text-foreground sm:text-sm">
              Rekonsiliasi per Rute Pembacaan ({filteredRutes.length} Rute)
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Perbandingan target pelanggan aktif terhadap realisasi baca di
              masing-masing rute.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Filter Geist */}
            <div className="inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              {(
                [
                  {
                    id: 'SEMUA',
                    label: `Semua (${data?.ruteBreakdown.length ?? 0})`,
                  },
                  {
                    id: 'SELISIH',
                    label: `Selisih (${selisihRuteCount})`,
                  },
                  {
                    id: 'SEIMBANG',
                    label: `Seimbang (${seimbangRuteCount})`,
                  },
                ] as { id: FilterRekonsiliasiStatus; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={cn(
                    'rounded px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors cursor-pointer',
                    filterStatus === tab.id
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-48">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                size="sm"
                value={searchRute}
                onChange={(e) => setSearchRute(e.target.value)}
                placeholder="Cari rute (CD104)..."
                className="h-7.5 pl-8 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="max-h-105 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="h-8 text-[11px]">Rute</TableHead>
                <TableHead className="h-8 text-[11px]">Wilayah</TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  Target Aktif
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  Terbaca
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  Belum Baca
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  Terbit DRD
                </TableHead>
                <TableHead className="h-8 text-center text-[11px]">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    Memuat rekonsiliasi per rute...
                  </TableCell>
                </TableRow>
              ) : filteredRutes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    Tidak ada rute yang cocok dengan filter pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRutes.map((r) => {
                  const belum =
                    r.belumTerbaca ?? Math.max(0, r.totalPelanggan - r.terbaca);
                  return (
                    <TableRow key={r.ruteKode} className="h-8.5">
                      <TableCell className="py-1.5 font-mono text-xs font-medium text-foreground">
                        {r.ruteKode}
                      </TableCell>
                      <TableCell className="max-w-56 truncate py-1.5 text-xs text-muted-foreground">
                        {r.namaRute}
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                        {formatAngkaId(r.totalPelanggan)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                        {formatAngkaId(r.terbaca)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums">
                        <span
                          className={cn(
                            belum > 0
                              ? 'font-semibold text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground',
                          )}
                        >
                          {formatAngkaId(belum)}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                        {isPraClosing && r.terbitDrd === 0
                          ? '—'
                          : formatAngkaId(r.terbitDrd)}
                      </TableCell>
                      <TableCell className="py-1.5 text-center">
                        <Badge
                          variant={
                            r.status === 'SEIMBANG'
                              ? 'green-subtle'
                              : 'amber-subtle'
                          }
                          size="sm"
                        >
                          {r.status === 'SEIMBANG'
                            ? 'Seimbang'
                            : `Selisih ${formatAngkaId(r.selisih)}`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Tabel Drilldown Sampel Pelanggan Belum Baca / Unbilled */}
      {data && data.daftarUnbilled.length > 0 && (
        <Card className="overflow-hidden border-border p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/25 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                {isPraClosing
                  ? `Sampel Pelanggan Belum Tercatat di DPM (${data.daftarUnbilled.length} dari ${formatAngkaId(totalBelumBaca)} SL)`
                  : `Daftar Pelanggan Unbilled (${data.daftarUnbilled.length} SL)`}
              </h3>
            </div>
          </div>

          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="h-8 text-[11px]">NOLG</TableHead>
                  <TableHead className="h-8 text-[11px]">
                    Nama Pelanggan
                  </TableHead>
                  <TableHead className="h-8 text-[11px]">Rute</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Stand Awal
                  </TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Stand Akhir
                  </TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Pemakaian
                  </TableHead>
                  <TableHead className="h-8 text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daftarUnbilled.map((u) => (
                  <TableRow key={u.nolg} className="h-8.5">
                    <TableCell className="py-1.5 font-mono text-xs font-medium text-foreground">
                      {u.nolg}
                    </TableCell>
                    <TableCell className="max-w-56 truncate py-1.5 text-xs text-foreground">
                      {u.nama}
                    </TableCell>
                    <TableCell className="py-1.5 font-mono text-xs text-muted-foreground">
                      {u.ruteKode}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums">
                      {formatAngkaId(u.stml)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums">
                      {u.statusVerifikasi.includes('BELUM')
                        ? '—'
                        : formatAngkaId(u.stma)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums">
                      {u.statusVerifikasi.includes('BELUM')
                        ? '—'
                        : `${formatAngkaId(u.pakaiM3)} m³`}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge
                        variant={
                          u.statusVerifikasi === 'PBPK_BELUM_BACA'
                            ? 'blue-subtle'
                            : 'amber-subtle'
                        }
                        size="sm"
                      >
                        {u.statusVerifikasi === 'PBPK_BELUM_BACA'
                          ? 'PBPK Belum Stand'
                          : u.statusVerifikasi === 'BELUM_DICATAT'
                            ? 'Belum Dicatat'
                            : u.statusVerifikasi}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      </ClosingSmoothPanel>
    </PageContainer>
  );
}
