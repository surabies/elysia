'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Droplets,
  Minus,
  Receipt,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatAngkaId,
  formatPeriodeLabelId,
  formatRupiahId,
} from '../lib/closing-format';
import type { PerbandinganPeriodeData } from '../types';

interface ClosingPerbandinganSectionProps {
  perbandingan: PerbandinganPeriodeData | null;
  loading: boolean;
}

function renderDeltaBadge(delta: number, suffix = '%') {
  if (delta > 0) {
    return (
      <Badge variant="green-subtle" size="sm" className="font-mono tabular-nums">
        <ArrowUpRight className="size-3" />
        <span>
          +{delta}
          {suffix}
        </span>
      </Badge>
    );
  }
  if (delta < 0) {
    return (
      <Badge variant="amber-subtle" size="sm" className="font-mono tabular-nums">
        <ArrowDownRight className="size-3" />
        <span>
          {delta}
          {suffix}
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant="subtle" size="sm" className="font-mono tabular-nums">
      <Minus className="size-3" />
      <span>0{suffix}</span>
    </Badge>
  );
}

export function ClosingPerbandinganSection({
  perbandingan,
  loading,
}: ClosingPerbandinganSectionProps) {
  const ringkasan = perbandingan?.ringkasan;
  const breakdown = perbandingan?.breakdownTarif ?? [];
  const periodeKini = perbandingan?.periodeKini ?? '—';
  const periodeLalu = perbandingan?.periodeLalu ?? '—';
  const isProyeksi = perbandingan?.sumberDataKini === 'PROYEKSI_PRA_CLOSING';

  return (
    <section
      aria-labelledby="perbandingan-section-title"
      className="space-y-4"
    >
      {/* Strip Telemetri Komparasi 3 Pilar (Geist Hairline) */}
      <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Pelanggan Ditagih ({periodeKini})
            </span>
            <Users className="size-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(ringkasan?.totalSlKini ?? 0)}
            </span>
            <span className="text-xs text-muted-foreground">SL</span>
            {!loading && ringkasan && renderDeltaBadge(ringkasan.deltaSl, ' SL')}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Periode lalu ({periodeLalu}):{' '}
            {formatAngkaId(ringkasan?.totalSlLalu ?? 0)} SL
          </p>
        </div>

        <div className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Volume Pemakaian ({periodeKini})
            </span>
            <Droplets className="size-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(ringkasan?.totalM3Kini ?? 0)}
            </span>
            <span className="text-xs text-muted-foreground">m³</span>
            {!loading &&
              ringkasan &&
              renderDeltaBadge(ringkasan.deltaM3Persen, '%')}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Periode lalu ({periodeLalu}):{' '}
            {formatAngkaId(ringkasan?.totalM3Lalu ?? 0)} m³
          </p>
        </div>

        <div className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isProyeksi ? 'Proyeksi Omzet DRD' : 'Omzet DRD Resmi'} (
              {periodeKini})
            </span>
            <Receipt className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-wrap items-baseline gap-2 font-mono tabular-nums">
            <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {loading ? '—' : formatRupiahId(ringkasan?.totalRpKini ?? 0)}
            </span>
            {!loading &&
              ringkasan &&
              renderDeltaBadge(ringkasan.deltaRpPersen, '%')}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Periode lalu ({periodeLalu}):{' '}
            {formatRupiahId(ringkasan?.totalRpLalu ?? 0)}
          </p>
        </div>
      </div>

      {/* Tabel Matriks Flux Analysis per Golongan Tarif */}
      <Card className="overflow-hidden border-border p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/25 px-4 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <BarChart3 className="size-3.5 text-foreground" />
              <h2
                id="perbandingan-section-title"
                className="text-xs font-semibold text-foreground sm:text-sm"
              >
                Matriks Varians per Golongan Tarif (
                {formatPeriodeLabelId(periodeLalu)} &rarr;{' '}
                {formatPeriodeLabelId(periodeKini)})
              </h2>
              <Badge
                variant={isProyeksi ? 'blue-subtle' : 'green-subtle'}
                size="sm"
              >
                {isProyeksi ? 'Proyeksi Pra-Closing Riil' : 'DRD Resmi'}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Periksa deviasi jumlah pelanggan, kubikasi (m³), dan tagihan (Rp)
              sebelum mengunci buku di tab 5. Tutup Bulan.
            </p>
          </div>

          <Badge variant="subtle" size="sm" className="font-mono tabular-nums">
            {breakdown.length} Golongan
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="h-8 text-[11px]">Tarif</TableHead>
                <TableHead className="h-8 text-[11px]">Golongan</TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  SL ({periodeLalu})
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  SL ({periodeKini})
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  m³ ({periodeLalu})
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  m³ ({periodeKini})
                </TableHead>
                <TableHead className="h-8 text-center text-[11px]">
                  &Delta; m³
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  Rp ({periodeLalu})
                </TableHead>
                <TableHead className="h-8 text-right text-[11px]">
                  Rp ({periodeKini})
                </TableHead>
                <TableHead className="h-8 text-center text-[11px]">
                  &Delta; Rp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    Memuat matriks komparasi antar periode...
                  </TableCell>
                </TableRow>
              ) : breakdown.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    Belum ada data bacaan meter atau rekening DRD pada periode{' '}
                    {periodeKini}.
                  </TableCell>
                </TableRow>
              ) : (
                breakdown.map((item) => (
                  <TableRow key={item.tarifKode} className="h-8.5">
                    <TableCell className="py-1.5 font-mono text-xs font-medium">
                      <Badge variant="subtle" size="sm" className="font-mono">
                        {item.tarifKode}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-44 truncate py-1.5 text-xs text-foreground">
                      {item.tarifNama}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {formatAngkaId(item.slPeriodeLalu)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                      {formatAngkaId(item.slPeriodeKini)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {formatAngkaId(item.m3PeriodeLalu)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                      {formatAngkaId(item.m3PeriodeKini)}
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      {renderDeltaBadge(item.deltaM3Persen, '%')}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {formatRupiahId(item.rpPeriodeLalu)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-xs font-medium tabular-nums text-foreground">
                      {formatRupiahId(item.rpPeriodeKini)}
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      {renderDeltaBadge(item.deltaRpPersen, '%')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!loading && breakdown.length > 0 && ringkasan && (
              <TableFooter>
                <TableRow className="bg-muted/35 font-semibold">
                  <TableCell colSpan={2} className="py-2 text-xs text-foreground">
                    TOTAL KESELURUHAN
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatAngkaId(ringkasan.totalSlLalu)}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums text-foreground">
                    {formatAngkaId(ringkasan.totalSlKini)}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatAngkaId(ringkasan.totalM3Lalu)}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums text-foreground">
                    {formatAngkaId(ringkasan.totalM3Kini)}
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    {renderDeltaBadge(ringkasan.deltaM3Persen, '%')}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatRupiahId(ringkasan.totalRpLalu)}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatRupiahId(ringkasan.totalRpKini)}
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    {renderDeltaBadge(ringkasan.deltaRpPersen, '%')}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </Card>
    </section>
  );
}
