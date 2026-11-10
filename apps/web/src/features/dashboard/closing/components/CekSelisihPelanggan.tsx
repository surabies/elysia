'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  MetricStatCard,
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/dashboard/shared/components';
import { cn } from '@/lib/utils';
import {
  useCekSelisih,
  type FilterRekonsiliasiStatus,
} from '../hooks/use-cek-selisih';
import { formatAngkaId } from '../lib/closing-format';
import { ClosingSubNavBar } from './ClosingSubNavBar';

export function CekSelisihPelanggan() {
  const {
    periode,
    setPeriode,
    data,
    loading,
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

  return (
    <PageContainer className="space-y-6">
      <PageSectionHeader
        title="Cek Selisih Pelanggan"
        description="Audit rekonsiliasi matematis 4 pilar: Master Induk vs DPM Target vs Hasil Pembacaan Cater vs Rekening DRD."
        actions={
          <>
            <PeriodFilterBar
              periode={periode}
              onPeriodeChange={setPeriode}
              onRefresh={loadCekSelisih}
              loading={loading}
              label="Periode THBL"
            />
            <Button asChild size="default">
              <Link href="/tools-tutup/monitoring-tutup-bulan">
                <span>Ke Wizard Tutup Buku</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <ClosingSubNavBar />

      <StatusFeedbackBanner
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
      />

      {/* Status Banner */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4',
          isMatch
            ? 'border-(--ds-green-300) bg-(--ds-green-100) text-(--ds-green-900) dark:border-(--ds-green-400) dark:bg-(--ds-green-200)'
            : 'border-(--ds-red-300) bg-(--ds-red-100) text-(--ds-red-900) dark:border-(--ds-red-400) dark:bg-(--ds-red-200)',
        )}
      >
        <div className="flex items-center gap-3">
          {isMatch ? (
            <CheckCircle2 className="size-5 shrink-0 text-(--ds-green-700)" />
          ) : (
            <AlertTriangle className="size-5 shrink-0 text-(--ds-red-700)" />
          )}
          <div>
            <p className="text-label-14">
              {isMatch
                ? 'Status Rekonsiliasi: 100% Match (Seimbang)'
                : 'Peringatan: Terdapat Pelanggan Unbilled / Selisih'}
            </p>
            <p className="mt-0.5 text-copy-12 opacity-90">
              {isMatch
                ? 'Seluruh pelanggan aktif telah tercatat di lapangan dan terbit ke rekening resmi DRD tanpa selisih (0 unbilled).'
                : `Ditemukan ${formatAngkaId(data?.ringkasan.totalSelisihUnbilled ?? 0)} pembacaan yang belum terbit rekening DRD.`}
            </p>
          </div>
        </div>

        <Badge variant={isMatch ? 'green-subtle' : 'red-subtle'} size="md">
          {isMatch ? 'Siap Tutup Bulan' : 'Perlu Tindakan'}
        </Badge>
      </div>

      {/* 2. 4-Pilar Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          label="1. Master Pelanggan"
          value={
            loading
              ? '—'
              : formatAngkaId(data?.ringkasan.totalMasterPelanggan ?? 0)
          }
          unit="SL"
          description="Data induk sambungan aktif"
          icon={Users}
        />

        <MetricStatCard
          label="2. Target DPM"
          value={
            loading ? '—' : formatAngkaId(data?.ringkasan.totalDpmTarget ?? 0)
          }
          unit="SL"
          description="Beban kerja daftar catat"
          icon={ClipboardList}
        />

        <MetricStatCard
          label="3. Realisasi Pembacaan"
          value={
            loading ? '—' : formatAngkaId(data?.ringkasan.totalTerbaca ?? 0)
          }
          unit="SL"
          description="Hasil baca petugas lapangan"
          icon={FileCheck2}
          tone="info"
        />

        <MetricStatCard
          label="4. Rekening DRD Terbit"
          value={
            loading ? '—' : formatAngkaId(data?.ringkasan.totalTerbitDrd ?? 0)
          }
          unit="SL"
          description="Tagihan resmi yang diterbitkan"
          icon={Receipt}
          tone="success"
        />
      </div>

      {/* 3. Route Breakdown Reconciliation Table */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-heading-16 text-foreground">
              Rekonsiliasi per Rute Pembacaan ({filteredRutes.length} Rute)
            </h2>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Pemeriksaan keselarasan jumlah pelanggan, hasil baca, dan tagihan
              terbit di masing-masing rute kerja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={filterStatus}
              onValueChange={(v) =>
                setFilterStatus(v as FilterRekonsiliasiStatus)
              }
            >
              <TabsList>
                <TabsTrigger value="SEMUA" className="tabular-nums">
                  Semua ({data?.ruteBreakdown.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="SEIMBANG">Seimbang</TabsTrigger>
                <TabsTrigger value="SELISIH">Selisih</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-56">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
              <Input
                size="sm"
                value={searchRute}
                onChange={(e) => setSearchRute(e.target.value)}
                placeholder="Cari kode rute (mis. CD104)"
                className="pl-8 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="max-h-115 overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Rute</TableHead>
                <TableHead>Wilayah Rute</TableHead>
                <TableHead className="text-right">Master Pelanggan</TableHead>
                <TableHead className="text-right">Terbaca Cater</TableHead>
                <TableHead className="text-right">Terbit DRD</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-copy-13 text-muted-foreground"
                  >
                    Memuat data rekonsiliasi rute...
                  </TableCell>
                </TableRow>
              ) : filteredRutes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-copy-13 text-muted-foreground"
                  >
                    Tidak ada data rute yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRutes.map((r) => (
                  <TableRow key={r.ruteKode}>
                    <TableCell className="text-label-13-mono text-foreground">
                      {r.ruteKode}
                    </TableCell>
                    <TableCell className="text-copy-13 text-muted-foreground">
                      {r.namaRute}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatAngkaId(r.totalPelanggan)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-(--ds-blue-700)">
                      {formatAngkaId(r.terbaca)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-(--ds-green-700)">
                      {formatAngkaId(r.terbitDrd)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums">
                      <span
                        className={cn(
                          r.selisih > 0
                            ? 'text-(--ds-red-700)'
                            : 'text-muted-foreground',
                        )}
                      >
                        {formatAngkaId(r.selisih)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          r.status === 'SEIMBANG'
                            ? 'green-subtle'
                            : 'red-subtle'
                        }
                        size="sm"
                      >
                        {r.status === 'SEIMBANG' ? 'Seimbang' : 'Selisih'}
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
        <Card className="space-y-3 border-(--ds-red-300) p-5 dark:border-(--ds-red-400)">
          <div className="flex items-center gap-2 text-(--ds-red-700)">
            <AlertTriangle className="size-4 shrink-0" />
            <h3 className="text-label-14 text-foreground">
              Daftar Pelanggan Unbilled ({data.daftarUnbilled.length} Sample
              Pelanggan Terbaca Belum Terbit DRD)
            </h3>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Sambungan (NOLG)</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Rute</TableHead>
                  <TableHead className="text-right">STML</TableHead>
                  <TableHead className="text-right">STMA</TableHead>
                  <TableHead className="text-right">Pemakaian (m³)</TableHead>
                  <TableHead>Status Verifikasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daftarUnbilled.map((u) => (
                  <TableRow key={u.nolg}>
                    <TableCell className="text-label-13-mono text-foreground">
                      {u.nolg}
                    </TableCell>
                    <TableCell className="text-label-13 text-foreground">
                      {u.nama}
                    </TableCell>
                    <TableCell className="text-label-12-mono text-muted-foreground">
                      {u.ruteKode}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums">
                      {formatAngkaId(u.stml)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums">
                      {formatAngkaId(u.stma)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatAngkaId(u.pakaiM3)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="subtle" size="sm">
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
    </PageContainer>
  );
}
