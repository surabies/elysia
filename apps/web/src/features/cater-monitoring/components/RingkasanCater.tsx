import { Card, CardContent } from '@/components/ui/card';
import type { CaterStats } from '../types';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

export function RingkasanCater({
  stats,
  loading,
}: {
  stats: CaterStats | null;
  loading: boolean;
}) {
  const metrics = [
    { label: 'Pelanggan', value: stats?.totalPelanggan },
    { label: 'Pembacaan historis', value: stats?.totalTercatat },
    { label: 'Rute', value: stats?.totalRute },
    { label: 'Petugas', value: stats?.totalPetugas },
  ];

  return (
    <section aria-label="Ringkasan data" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-4">
            <p className="text-label-12 text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-heading-24">
              {loading ? '…' : formatNumber(metric.value ?? 0)}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
