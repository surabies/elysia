import type { Metadata } from 'next';
import { dashboardService } from '@/server/services/dashboard/dashboard.service';
import { closingService } from '@/server/services/closing/closing.service';
import { MonitoringProgresLapangan } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Monitoring Progres Lapangan | Cater PDAM Tirtawening',
  description: 'Pemantauan real-time laju pembacaan meter, volume kubikasi, dan temuan anomali per petugas lapangan',
};

export default async function ProgresCaterPage({
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
    <MonitoringProgresLapangan
      initialThbl={activeThbl}
      availablePeriods={availablePeriods}
    />
  );
}
