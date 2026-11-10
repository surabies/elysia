'use client';

import {
  Check,
  CheckCircle2,
  Clock,
  GitBranch,
  X,
} from 'lucide-react';
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
import { MetricStatCard } from '@/features/dashboard/shared/components';
import { formatAngkaId } from '../lib/closing-format';
import type {
  StandAngkatMutasiItem,
  StandAngkatVerificationStatus,
} from '../types';

interface ClosingStandAngkatSectionProps {
  periode: string;
  standAngkatList: StandAngkatMutasiItem[];
  loading: boolean;
  actionLoading: boolean;
  onVerifyStandAngkat: (
    id: string,
    status: Exclude<StandAngkatVerificationStatus, 'PENDING'>,
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

  return (
    <section aria-labelledby="stand-angkat-section-title" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricStatCard
          label="Total Ganti Water Meter (GWM)"
          value={loading ? '—' : formatAngkaId(totalMutasi)}
          unit="Transaksi"
          description={`Periode THBL ${periode}`}
          icon={GitBranch}
        />
        <MetricStatCard
          label="Menunggu Verifikasi Stand Angkat"
          value={loading ? '—' : formatAngkaId(totalPending)}
          unit="Pending"
          description={
            totalPending === 0
              ? 'Seluruh mutasi telah diverifikasi'
              : 'Wajib disahkan sebelum kunci DRD'
          }
          icon={Clock}
          tone={totalPending > 0 ? 'warning' : 'success'}
        />
        <MetricStatCard
          label="Stand Angkat Disetujui"
          value={loading ? '—' : formatAngkaId(totalApproved)}
          unit="Approved"
          description="Siap dijumlahkan pada kalkulasi m³"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="stand-angkat-section-title"
                className="text-heading-16 text-foreground"
              >
                Tahap 2: Daftar Mutasi Stand Angkat Ganti Water Meter ({periode})
              </h2>
              <Badge
                variant={totalPending === 0 ? 'green-subtle' : 'amber-subtle'}
                size="sm"
              >
                {totalPending === 0
                  ? '100% Terverifikasi'
                  : `${totalPending} Menunggu Approval`}
              </Badge>
            </div>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Rumus pemakaian ganti meter:{' '}
              <span className="font-mono text-foreground">
                Pakai Total = (Stand Angkat − STML) + (STMA − Stand Pasang)
              </span>
              . Pastikan angka fisik sesuai berita acara lapangan.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No Sambungan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Alasan GWM</TableHead>
                <TableHead>No Meter Lama &rarr; Baru</TableHead>
                <TableHead className="text-right">Stand Angkat</TableHead>
                <TableHead className="text-right">Stand Pasang</TableHead>
                <TableHead>Petugas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi Verifikasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-copy-13 text-muted-foreground"
                  >
                    Memuat transaksi mutasi stand angkat...
                  </TableCell>
                </TableRow>
              ) : standAngkatList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-copy-13 text-muted-foreground"
                  >
                    Tidak ada transaksi ganti water meter (Stand Angkat) pada
                    periode {periode}. Tahap 2 otomatis berstatus Selesai.
                  </TableCell>
                </TableRow>
              ) : (
                standAngkatList.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-label-13-mono tabular-nums text-foreground">
                      {m.nolg}
                    </TableCell>
                    <TableCell className="text-label-13 text-foreground">
                      {m.namaPelanggan ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="subtle" size="sm">
                        {m.alasan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-label-12-mono text-muted-foreground">
                      {m.noMeterLama} &rarr;{' '}
                      <span className="text-foreground">{m.noMeterBaru}</span>
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatAngkaId(m.standAngkat)} m³
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatAngkaId(m.standPasang)} m³
                    </TableCell>
                    <TableCell className="text-copy-12 text-muted-foreground">
                      {m.petugasPasang}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          m.statusVerifikasi === 'APPROVED'
                            ? 'green-subtle'
                            : m.statusVerifikasi === 'REJECTED'
                              ? 'red-subtle'
                              : 'amber-subtle'
                        }
                        size="sm"
                      >
                        {m.statusVerifikasi}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {m.statusVerifikasi === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            disabled={actionLoading}
                            onClick={() =>
                              onVerifyStandAngkat(m.id, 'APPROVED')
                            }
                          >
                            <Check className="size-3 text-(--ds-green-700)" />
                            <span>Approve</span>
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
                            <X className="size-3 text-(--ds-red-700)" />
                            <span>Tolak</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-copy-12 text-muted-foreground">
                          Selesai
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  );
}
