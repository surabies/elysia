import type { Metadata } from 'next';
import { dashboardService } from '@/server/services/dashboard/dashboard.service';
import { closingService } from '@/server/services/closing/closing.service';
import { MonitoringKoreksiStand } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Koreksi Stand | PDAM Tirtawening',
  description:
    'Riwayat resmi penyesuaian angka meter, Meter Baru (MB), Muda Kembali, dan perubahan kubikasi dengan audit log',
};

export default async function KoreksiStandPage({
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
    <MonitoringKoreksiStand
      initialPeriode={activeThbl}
      availablePeriods={availablePeriods}
    />
  );
}
