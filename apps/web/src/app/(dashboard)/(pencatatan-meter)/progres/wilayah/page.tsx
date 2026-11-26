import type { Metadata } from 'next';
import { dashboardService } from '@/server/services/dashboard/dashboard.service';
import { closingService } from '@/server/services/closing/closing.service';
import { MonitoringProgresWilayah } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Progres Wilayah | PDAM Tirtawening',
  description: 'Persentase capaian pembacaan meter air per kelurahan dan zona distribusi',
};

export default async function ProgresWilayahPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode: requestedPeriode } = await searchParams;
  const [periodeInfo, availablePeriods] = await Promise.all([
    closingService.getPeriodeKerja().catch(() => null),
    dashboardService.getAvailablePeriods().catch(() => []),
  ]);

  const activeThbl =
    requestedPeriode && /^\d{6}$/.test(requestedPeriode)
      ? requestedPeriode
      : periodeInfo?.periodeAktif || periodeInfo?.saranPeriode || '202611';

  return (
    <MonitoringProgresWilayah
      initialPeriode={activeThbl}
      availablePeriods={availablePeriods}
    />
  );
}
