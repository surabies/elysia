import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/index";
import { analyticsService } from "@/server/services/dashboard/analytics.service";
import { AnalyticsDashboard } from "@/features/dashboard/analytics";

export const metadata: Metadata = {
  title: "Analytics & Observabilitas Operasional — PDAM Tirtawening",
  description:
    "Pusat metrik performa, time-series pembacaan meter, distribusi kubikasi, dan produktivitas petugas.",
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { periode: requestedPeriode } = await searchParams;
  const data = await analyticsService.getAnalyticsPageData(requestedPeriode);

  return <AnalyticsDashboard data={data} generatedAt={new Date()} />;
}
