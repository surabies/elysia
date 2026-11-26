'use client';

import { Check, CheckCircle2, Clock, GitBranch, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@cater/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAngkaId, formatPeriodeLabelId } from '../lib/closing-format';
import type {
  StandAngkatDecisionStatus,
  StandAngkatMutasiItem,
} from '../types';

interface ClosingStandAngkatSectionProps {
  periode: string;
  standAngkatList: StandAngkatMutasiItem[];
  loading: boolean;
  actionLoading: boolean;
  onVerifyStandAngkat: (
    id: string,
    status: StandAngkatDecisionStatus,
  ) => void;
}

export function ClosingStandAngkatSection({
  periode,
  standAngkatList,
  loading,
  actionLoading,
  onVerifyStandAngkat,
}: ClosingStandAngkatSectionProps) {
  const totalMutasi = standAngkatList.length;
  const totalPending = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'PENDING',
  ).length;
  const totalApproved = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'APPROVED',
  ).length;
  const totalBelumLengkap = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'DATA_METER_BELUM_LENGKAP',
  ).length;

  return (
    <TooltipProvider delayDuration={150}>
      <section
        aria-labelledby="stand-angkat-section-title"
        className="space-y-4"
      >
        {/* Strip Telemetri Geist Hairline */}
        <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="space-y-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Total Pergantian Meter
              </span>
              <GitBranch className="size-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-base font-semibold text-foreground">
                {loading ? '—' : formatAngkaId(totalMutasi)}
              </span>
              <span className="text-xs text-muted-foreground">transaksi</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Periode {formatPeriodeLabelId(periode)} ({periode})
            </p>
          </div>

          <div className="space-y-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Menunggu Persetujuan
              </span>
              <Clock className="size-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span
                className={
                  totalPending > 0
                    ? 'text-base font-semibold text-amber-600 dark:text-amber-400'
                    : 'text-base font-semibold text-foreground'
                }
              >
                {loading ? '—' : formatAngkaId(totalPending)}
              </span>
              <span className="text-xs text-muted-foreground">pending</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {totalPending === 0
                ? 'Tidak ada antrean penghambat tutup buku'
                : 'Wajib disetujui/ditolak sebelum kunci DRD'}
            </p>
          </div>

          <div className="space-y-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Disetujui &amp; Siap Hitung
              </span>
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {loading ? '—' : formatAngkaId(totalApproved)}
              </span>
              <span className="text-xs text-muted-foreground">disetujui</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {totalBelumLengkap > 0
                ? `${totalBelumLengkap} menunggu kelengkapan data teknik`
                : 'Rumus: (Stand Angkat − STML) + (STMA − Stand Pasang)'}
            </p>
          </div>
        </div>

        {/* Tabel Compact Geist */}
        <Card className="overflow-hidden border-border p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/25 px-4 py-3">
            <div>
              <h2
                id="stand-angkat-section-title"
                className="text-xs font-semibold text-foreground sm:text-sm"
              >
                Daftar Mutasi Ganti Meter ({formatPeriodeLabelId(periode)})
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Pastikan nomor meter baru dan angka fisik Stand Angkat sesuai
                berita acara lapangan sebelum menyetujui.
              </p>
            </div>
            <Badge
              variant={totalPending === 0 ? 'green-subtle' : 'amber-subtle'}
              size="sm"
              className="font-mono tabular-nums"
            >
              {totalPending === 0
                ? '0 Pending'
                : `${totalPending} Perlu Verifikasi`}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="h-8 text-[11px]">NOLG</TableHead>
                  <TableHead className="h-8 text-[11px]">
                    Nama Pelanggan
                  </TableHead>
                  <TableHead className="h-8 text-[11px]">Alasan</TableHead>
                  <TableHead className="h-8 text-[11px]">Meter Lama</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Stand Angkat
                  </TableHead>
                  <TableHead className="h-8 text-[11px]">Meter Baru</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Stand Pasang
                  </TableHead>
                  <TableHead className="h-8 text-center text-[11px]">
                    Status
                  </TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Tindakan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      Memuat daftar pergantian meter...
                    </TableCell>
                  </TableRow>
                ) : standAngkatList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      Tidak ada transaksi ganti meter air pada periode{' '}
                      {formatPeriodeLabelId(periode)}. Syarat Ganti Meter
                      otomatis terpenuhi.
                    </TableCell>
                  </TableRow>
                ) : (
                  standAngkatList.map((m) => {
                    const isDataLengkap =
                      Boolean(m.noMeterBaru) && m.standAngkat !== null;

                    return (
                      <TableRow key={m.id} className="h-9">
                        <TableCell className="py-1.5 font-mono text-xs font-medium tabular-nums text-foreground">
                          {m.nolg}
                        </TableCell>
                        <TableCell className="max-w-44 truncate py-1.5 text-xs text-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate">
                                {m.namaPelanggan ?? '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              {m.namaPelanggan ?? '—'}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="subtle" size="sm">
                            {m.alasan}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-xs text-muted-foreground">
                          {m.noMeterLama || '—'}
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                          {m.standAngkat !== null
                            ? formatAngkaId(m.standAngkat)
                            : '—'}
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-xs text-foreground">
                          {m.noMeterBaru ?? '—'}
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                          {formatAngkaId(m.standPasang)}
                        </TableCell>
                        <TableCell className="py-1.5 text-center">
                          <Badge
                            variant={
                              m.statusVerifikasi === 'APPROVED'
                                ? 'green-subtle'
                                : m.statusVerifikasi === 'REJECTED'
                                  ? 'red-subtle'
                                  : m.statusVerifikasi ===
                                      'DATA_METER_BELUM_LENGKAP'
                                    ? 'blue-subtle'
                                    : 'amber-subtle'
                            }
                            size="sm"
                          >
                            {m.statusVerifikasi === 'APPROVED'
                              ? 'Disetujui'
                              : m.statusVerifikasi === 'REJECTED'
                                ? 'Ditolak'
                                : m.statusVerifikasi ===
                                    'DATA_METER_BELUM_LENGKAP'
                                  ? 'Belum Lengkap'
                                  : 'Menunggu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-right">
                          {m.statusVerifikasi === 'PENDING' ? (
                            <div className="inline-flex items-center gap-1">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                disabled={actionLoading || !isDataLengkap}
                                title={
                                  !isDataLengkap
                                    ? 'No. Meter Baru dan Stand Angkat wajib lengkap sebelum disetujui'
                                    : undefined
                                }
                                onClick={() =>
                                  onVerifyStandAngkat(m.id, 'APPROVED')
                                }
                              >
                                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Setujui</span>
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                disabled={actionLoading}
                                onClick={() =>
                                  onVerifyStandAngkat(m.id, 'REJECTED')
                                }
                              >
                                <X className="size-3 text-red-600 dark:text-red-400" />
                                <span>Tolak</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </TooltipProvider>
  );
}
