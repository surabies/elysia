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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricStatCard } from '@/features/dashboard/shared/components';
import { formatAngkaId, formatRupiahId } from '../lib/closing-format';
import type { PerbandinganPeriodeData } from '../types';

interface ClosingPerbandinganSectionProps {
  perbandingan: PerbandinganPeriodeData | null;
  loading: boolean;
}

function renderDeltaBadge(delta: number, suffix = '%') {
  if (delta > 0) {
    return (
      <Badge variant="green-subtle" size="sm" className="tabular-nums">
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
      <Badge variant="amber-subtle" size="sm" className="tabular-nums">
        <ArrowDownRight className="size-3" />
        <span>
          {delta}
          {suffix}
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant="subtle" size="sm" className="tabular-nums">
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

  return (
    <section
      aria-labelledby="perbandingan-section-title"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricStatCard
          label={`Komparasi Sambungan (${periodeLalu} vs ${periodeKini})`}
          value={loading ? '—' : formatAngkaId(ringkasan?.totalSlKini ?? 0)}
          unit="SL"
          description={`Periode lalu: ${formatAngkaId(ringkasan?.totalSlLalu ?? 0)} SL (${(ringkasan?.deltaSl ?? 0) >= 0 ? '+' : ''}${formatAngkaId(ringkasan?.deltaSl ?? 0)} SL)`}
          icon={Users}
        />

        <MetricStatCard
          label={`Komparasi Kubikasi Air (${periodeLalu} vs ${periodeKini})`}
          value={loading ? '—' : formatAngkaId(ringkasan?.totalM3Kini ?? 0)}
          unit="m³"
          description={`Periode lalu: ${formatAngkaId(ringkasan?.totalM3Lalu ?? 0)} m³ (${(ringkasan?.deltaM3Persen ?? 0) >= 0 ? '+' : ''}${ringkasan?.deltaM3Persen ?? 0}%)`}
          icon={Droplets}
          tone="info"
        />

        <MetricStatCard
          label={`Komparasi Omzet DRD (${periodeLalu} vs ${periodeKini})`}
          value={loading ? '—' : formatRupiahId(ringkasan?.totalRpKini ?? 0)}
          description={`Periode lalu: ${formatRupiahId(ringkasan?.totalRpLalu ?? 0)} (${(ringkasan?.deltaRpPersen ?? 0) >= 0 ? '+' : ''}${ringkasan?.deltaRpPersen ?? 0}%)`}
          icon={Receipt}
          tone="success"
        />
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-foreground" />
              <h2
                id="perbandingan-section-title"
                className="text-heading-16 text-foreground"
              >
                Tahap 6: Matriks Perbandingan DRD per Golongan Tarif ({periodeLalu}{' '}
                &rarr; {periodeKini})
              </h2>
            </div>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Audit deviasi jumlah sambungan langganan (SL), pemakaian kubikasi
              air (m³), dan nilai tagihan DRD (Rp) antar siklus penagihan.
            </p>
          </div>

          <Badge variant="blue-subtle" size="md" className="tabular-nums">
            {breakdown.length} Golongan Tarif
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tarif</TableHead>
                <TableHead>Nama Golongan</TableHead>
                <TableHead className="text-right">SL ({periodeLalu})</TableHead>
                <TableHead className="text-right">SL ({periodeKini})</TableHead>
                <TableHead className="text-right">
                  Kubikasi ({periodeLalu})
                </TableHead>
                <TableHead className="text-right">
                  Kubikasi ({periodeKini})
                </TableHead>
                <TableHead className="text-center">&Delta; m³</TableHead>
                <TableHead className="text-right">
                  Tagihan ({periodeKini})
                </TableHead>
                <TableHead className="text-center">&Delta; Rp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-copy-13 text-muted-foreground"
                  >
                    Memuat komparasi rekening DRD antar periode...
                  </TableCell>
                </TableRow>
              ) : breakdown.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-copy-13 text-muted-foreground"
                  >
                    Belum ada rekening DRD yang diterbitkan pada periode{' '}
                    {periodeKini}. Jalankan Tahap 5 (Create Closed DRD) terlebih
                    dahulu.
                  </TableCell>
                </TableRow>
              ) : (
                breakdown.map((item) => (
                  <TableRow key={item.tarifKode}>
                    <TableCell className="text-label-13-mono text-foreground">
                      <Badge variant="subtle" size="sm" className="font-mono">
                        {item.tarifKode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-label-13 text-foreground">
                      {item.tarifNama}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-muted-foreground">
                      {formatAngkaId(item.slPeriodeLalu)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatAngkaId(item.slPeriodeKini)}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-muted-foreground">
                      {formatAngkaId(item.m3PeriodeLalu)} m³
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatAngkaId(item.m3PeriodeKini)} m³
                    </TableCell>
                    <TableCell className="text-center">
                      {renderDeltaBadge(item.deltaM3Persen, '%')}
                    </TableCell>
                    <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                      {formatRupiahId(item.rpPeriodeKini)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderDeltaBadge(item.deltaRpPersen, '%')}
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
