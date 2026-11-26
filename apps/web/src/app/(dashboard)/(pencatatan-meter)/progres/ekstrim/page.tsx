import type { Metadata } from 'next';
import { dashboardService } from '@/server/services/dashboard/dashboard.service';
import { closingService } from '@/server/services/closing/closing.service';
import { MonitoringAnomaliKubikasi } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Radar Anomali Ekstrim | PDAM Tirtawening',
  description: 'Deteksi dini lonjakan pemakaian ekstrem, pemakaian 0 m³, dan anomali kubikasi',
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
