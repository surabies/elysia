import type { Metadata } from 'next';
import { dashboardService } from '@/server/services/dashboard/dashboard.service';
import { closingService } from '@/server/services/closing/closing.service';
import { MonitoringAnomaliKubikasi } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Monitoring Anomali Kubikasi | Cater PDAM',
  description: 'Deteksi dini lonjakan pemakaian ekstrem, penurunan drastis, dan stand meter 0 m³',
};

export default async function AnomaliKubikasiPage({
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
    <MonitoringAnomaliKubikasi
      initialPeriode={activeThbl}
      availablePeriods={availablePeriods}
    />
  );
}
