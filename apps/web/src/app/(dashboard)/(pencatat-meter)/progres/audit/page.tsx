import type { Metadata } from 'next';
import { dashboardService } from '@/server/services/dashboard/dashboard.service';
import { closingService } from '@/server/services/closing/closing.service';
import { AuditAnomaliView } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Audit & Rekonsiliasi Anomali | Cater PDAM',
  description: 'Matriks pemisahan resmi antara Anomali Validasi Meter dan Catatan Kendala Akses Lapangan',
};

export default async function AuditAnomaliPage({
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
    <AuditAnomaliView
      initialPeriode={activeThbl}
      availablePeriods={availablePeriods}
    />
  );
}
