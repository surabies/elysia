import { caterProgressService } from "@/server/services/cater/cater-progress.service";
import { caterKueriService } from "@/server/services/cater/cater-kueri.service";
import { closingService } from "@/server/services/closing/closing.service";
import { MonitoringBacaMeter } from "@/features/cater-monitoring";

export const metadata = {
  title: "Monitoring Baca Meter & Produktivitas Petugas — PDAM Tirtawening",
  description: "Monitoring operasional rute dan riwayat sesi harian pencatat meter.",
};

export default async function CaterPage() {
  const periodeInfo = await closingService.getPeriodeKerja().catch(() => null);
  const activeThbl = periodeInfo?.periodeAktif || periodeInfo?.saranPeriode || "202611";
  const activeMonth = `${activeThbl.slice(0, 4)}-${activeThbl.slice(4)}`;

  const [stats, routes, initialRiwayatSesi, initialEkstrim, initialNol] = await Promise.all([
    caterKueriService.getStats().catch(() => null),
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
    />
  );
}
