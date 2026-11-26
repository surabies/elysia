import { caterProgressService } from "@/server/services/cater/cater-progress.service";
import { caterKueriService } from "@/server/services/cater/cater-kueri.service";
import { closingService } from "@/server/services/closing/closing.service";
import { dashboardService } from "@/server/services/dashboard/dashboard.service";
import { MonitoringBacaMeter } from "@/features/cater-monitoring";

export const metadata = {
  title: "Monitoring Baca | PDAM Tirtawening",
  description: "Monitoring operasional rute dan riwayat sesi harian pencatat meter.",
};

export default async function CaterPage({
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
      : periodeInfo?.periodeAktif || periodeInfo?.saranPeriode || "202611";

  const activeMonth = `${activeThbl.slice(0, 4)}-${activeThbl.slice(4)}`;

  const [stats, routes, initialRiwayatSesi, initialEkstrim, initialNol] = await Promise.all([
    caterKueriService.getStats(activeThbl).catch(() => null),
    caterKueriService.getRoutes(500, 0).catch(() => []),
    caterProgressService.getRiwayatSesiPetugas(activeThbl).catch(() => []),
    caterProgressService.getIkhtisarEkstrim(activeThbl, 200).catch(() => []),
    caterProgressService.getIkhtisarPemakaianNol(activeThbl, 200).catch(() => []),
  ]);

  return (
    <MonitoringBacaMeter
      initialStats={stats}
      initialRoutes={routes}
      initialRiwayatSesi={initialRiwayatSesi}
      initialExtremeReadings={initialEkstrim as any}
      initialZeroReadings={initialNol as any}
      initialMonth={activeMonth}
      availablePeriods={availablePeriods}
    />
  );
}
