import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { auth } from "@/lib/auth/index";
import { dashboardService } from "@/server/services/dashboard/dashboard.service";
import {
  DistribusiWilayahTarif,
  KartuMetrik,
  PintasanModul,
  RingkasanHeader,
  StatusSistem,
} from "@/features/dashboard/overview";

export const metadata: Metadata = {
  title: "Ringkasan Eksekutif — PDAM Tirtawening",
  description:
    "Pusat komando operasional 3 Pilar PDAM: Pencatatan Meter, Pelayanan Pengaduan, dan Penagihan.",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const { periode, summary, wilayah, tarif } =
    await dashboardService.getDashboardData();

  return (
    <PageContainer className="space-y-6">
      <RingkasanHeader
        name={session.user.name}
        role={session.user.role}
        periode={periode}
        tanggalHariIni={tanggalHariIni}
      />
      <KartuMetrik periode={periode} summary={summary} />
      <DistribusiWilayahTarif wilayah={wilayah} tarif={tarif} />
      <div className="grid gap-4 md:grid-cols-2">
        <StatusSistem />
        <PintasanModul />
      </div>
    </PageContainer>
  );
}
