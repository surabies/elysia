import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/index";
import { PageContainer } from "@/components/layout/index";
import { Card } from "@/components/ui/card";
import { Activity, Droplets, Flame, Gauge } from "lucide-react";
import { analyticsService } from "@/server/services/dashboard/analytics.service";
import { IconTile } from "@/components/reui/icon-tile";
import { CdnRequestsChart } from "@/features/dashboard/analytics/components/CdnRequestsChart";
import { TopRegionsChart } from "@/features/dashboard/analytics/components/TopRegionsChart";
import { ConsumptionHistogramChart } from "@/features/dashboard/analytics/components/ConsumptionHistogramChart";
import { OfficerProductivityTable } from "@/features/dashboard/analytics/components/OfficerProductivityTable";
import { ServiceAreaRiskMap } from "@/features/dashboard/analytics/components/ServiceAreaRiskMap";
import { ReadingStatusChart } from "@/features/dashboard/analytics/components/ReadingStatusChart";

export const metadata: Metadata = {
  title: "Analytics & Observabilitas Operasional — PDAM Tirtawening",
  description:
    "Pusat metrik performa, time-series pembacaan meter, distribusi kubikasi, dan produktivitas petugas.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Ambil seluruh analitik terpadu dari AnalyticsService
  const data = await analyticsService.getAnalyticsPageData();

  const now = new Date();
  const tanggalHariIni = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <PageContainer className="space-y-6">
      <div className="rounded-lg border border-border bg-card px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              PDAM Tirtawening
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Analitik Operasional
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-x-2 border-t border-border pt-3 sm:gap-x-4 sm:border-t-0 sm:pt-0">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Periode
              </p>
              <p className="truncate text-xs font-medium text-foreground">
                {data.periode.label}
              </p>
            </div>
            <div className="min-w-0 border-l border-border pl-2 sm:pl-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Kode
              </p>
              <p className="font-mono text-xs font-medium text-foreground">
                {data.periode.thbl}
              </p>
            </div>
            <div className="min-w-0 border-l border-border pl-2 sm:pl-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Hari ini
              </p>
              <p className="whitespace-nowrap text-xs font-medium text-foreground">
                {tanggalHariIni}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Top Counters (Gaya Vercel Metrics Card) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <Card className="min-w-0 rounded-[10px] border-border/80 p-3 sm:p-4">
          <div className="flex items-center justify-between pb-1">
            <span className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px] sm:tracking-wider">
              Total Invocations
            </span>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Activity />
            </IconTile>
          </div>
          <div className="whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {data.totalBaca.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              SL (100%)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Dari {data.totalPelanggan.toLocaleString("id-ID")} pelanggan
            terdaftar
          </p>
        </Card>

        <Card className="min-w-0 rounded-[10px] border-border/80 p-3 sm:p-4">
          <div className="flex items-center justify-between pb-1">
            <span className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px] sm:tracking-wider">
              Kubikasi Air Terdistribusi
            </span>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Droplets />
            </IconTile>
          </div>
          <div className="whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {data.totalKubikasi.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              m³
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Rata-rata{" "}
            {(data.totalKubikasi / Math.max(data.totalPelanggan, 1)).toFixed(1)}{" "}
            m³ / SL
          </p>
        </Card>

        <Card className="min-w-0 rounded-[10px] border-border/80 p-3 sm:p-4">
          <div className="flex items-center justify-between pb-1">
            <span className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px] sm:tracking-wider">
              Rata-rata Laju Harian
            </span>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Gauge />
            </IconTile>
          </div>
          <div className="whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {data.rataRataHarian.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              SL / hari
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Konsistensi {data.dailyTrends.length} hari siklus catat
          </p>
        </Card>

        <Card className="min-w-0 rounded-[10px] border-border/80 p-3 sm:p-4">
          <div className="flex items-center justify-between pb-1">
            <span className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px] sm:tracking-wider">
              Puncak Aktivitas
            </span>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Flame />
            </IconTile>
          </div>
          <div className="whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {data.puncakHarian.total.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              SL
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tercapai pada {data.puncakHarian.hari}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CdnRequestsChart
          data={data.dailyTrends}
          totalInvocations={data.totalBaca}
        />

        <TopRegionsChart data={data.regionalTrends} />
      </div>

      <ServiceAreaRiskMap data={data.serviceAreaRisks} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ConsumptionHistogramChart data={data.consumptionBuckets} />
        <ReadingStatusChart data={data.anomalies} />
      </div>

      <OfficerProductivityTable data={data.officers} />
    </PageContainer>
  );
}
