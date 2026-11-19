import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { auth } from "@/lib/auth/index";
import { dashboardService } from "@/server/services/dashboard/dashboard.service";
import {
  AntreanTindakanCard,
  DistribusiWilayahTarif,
  KartuMetrik,
  KesiapanBillingCard,
  RingkasanHeader,
} from "@/features/dashboard/overview";

export const metadata: Metadata = {
  title: "Ringkasan Eksekutif — PDAM Tirtawening",
  description:
    "Pusat komando operasional 3 Pilar PDAM: Pencatatan Meter, Pelayanan Pengaduan, dan Penagihan.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { periode: requestedPeriode } = await searchParams;

  const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const {
    periode,
    availablePeriods,
    currentCalendarLabel,
    isHistoricalFallback,
    summary,
    wilayah,
    tarif,
    antrean,
    kesiapanBilling,
  } = await dashboardService.getDashboardData(requestedPeriode);

  return (
    <PageContainer className="space-y-6">
      <RingkasanHeader
        name={session.user.name}
        role={session.user.role}
        periode={periode}
        availablePeriods={availablePeriods}
        currentCalendarLabel={currentCalendarLabel}
        isHistoricalFallback={isHistoricalFallback}
        tanggalHariIni={tanggalHariIni}
        summary={summary}
      />
      <KartuMetrik periode={periode} summary={summary} />
      <div className="grid gap-4 xl:grid-cols-2">
        <AntreanTindakanCard antrean={antrean} periode={periode} />
        <KesiapanBillingCard kesiapan={kesiapanBilling} periode={periode} />
      </div>
      <DistribusiWilayahTarif wilayah={wilayah} tarif={tarif} />
    </PageContainer>
  );
}
