import { caterProgressService } from "@/server/services/cater/cater-progress.service";
import { caterKueriService } from "@/server/services/cater/cater-kueri.service";
import { MonitoringBacaMeter } from "@/features/cater-monitoring";

export const metadata = {
  title: "Monitoring Baca Meter & Produktivitas Petugas — PDAM Tirtawening",
  description: "Monitoring operasional rute dan riwayat sesi harian pencatat meter.",
};

export default async function CaterPage() {
  const [stats, routes, initialRiwayatSesi, initialEkstrim, initialNol] = await Promise.all([
    caterKueriService.getStats().catch(() => null),
    caterKueriService.getRoutes(500, 0).catch(() => []),
    caterProgressService.getRiwayatSesiPetugas("202601").catch(() => []),
    caterProgressService.getIkhtisarEkstrim("202601", 200).catch(() => []),
    caterProgressService.getIkhtisarPemakaianNol("202601", 200).catch(() => []),
  ]);

  return (
    <MonitoringBacaMeter
      initialStats={stats}
      initialRoutes={routes}
      initialRiwayatSesi={initialRiwayatSesi}
      initialExtremeReadings={initialEkstrim as any}
      initialZeroReadings={initialNol as any}
      initialMonth="2026-01"
    />
  );
}
