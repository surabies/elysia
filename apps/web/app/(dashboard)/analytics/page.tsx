import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/index";
import { PageContainer } from "@/components/layout/index";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Activity,
  Droplets,
  Flame,
  Gauge,
} from "lucide-react";
import { analyticsService } from "@/src/server/services/dashboard/analytics.service";
import { CdnRequestsChart } from "./components/CdnRequestsChart";
import { TopRegionsChart } from "./components/TopRegionsChart";
import { ConsumptionHistogramChart } from "./components/ConsumptionHistogramChart";
import { OfficerProductivityTable } from "./components/OfficerProductivityTable";

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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageContainer className="space-y-6">
      {/* Header Observabilitas Vercel-Style */}
      <div className="relative overflow-hidden rounded-[10px] border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Observabilitas & Analitik Operasional
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-[11px] font-medium uppercase border-border bg-muted/60 text-foreground rounded-full"
              >
                Vercel Observability
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Visualisasi time-series real-time, monitoring kubikasi air, dan metrik regional PDAM Tirtawening.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground md:self-auto">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>{tanggalHariIni}</span>
            <span className="text-border">|</span>
            <span className="font-medium text-foreground">
              Periode {data.periode.label}
            </span>
            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
              {data.periode.thbl}
            </Badge>
          </div>
        </div>
      </div>

      {/* 4 KPI Top Counters (Gaya Vercel Metrics Card) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border/80 rounded-[10px]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Invocations
            </span>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
            {data.totalBaca.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              SL (100%)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Dari {data.totalPelanggan.toLocaleString("id-ID")} pelanggan terdaftar
          </p>
        </Card>

        <Card className="p-4 border-border/80 rounded-[10px]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Kubikasi Air Terdistribusi
            </span>
            <Droplets className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
            {data.totalKubikasi.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              m³
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Rata-rata {(data.totalKubikasi / Math.max(data.totalPelanggan, 1)).toFixed(1)} m³ / SL
          </p>
        </Card>

        <Card className="p-4 border-border/80 rounded-[10px]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Rata-rata Laju Harian
            </span>
            <Gauge className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
            {data.rataRataHarian.toLocaleString("id-ID")}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-1.5">
              SL / hari
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Konsistensi {data.dailyTrends.length} hari siklus catat
          </p>
        </Card>

        <Card className="p-4 border-border/80 rounded-[10px]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Puncak Aktivitas
            </span>
            <Flame className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
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

      {/* Dua Grafik Observabilitas Vercel Utama (sample-grafik.md & sample-grafik-2.md) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sample 1: CDN Requests / Invocations (tirtawening) */}
        <CdnRequestsChart
          data={data.dailyTrends}
          totalInvocations={data.totalBaca}
        />

        {/* Sample 2: Top Regions Observability dengan Sparkline Table */}
        <TopRegionsChart data={data.regionalTrends} />
      </div>

      {/* Dua Komponen Pendukung: Histogram Sebaran Kubikasi & Produktivitas Petugas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConsumptionHistogramChart data={data.consumptionBuckets} />
        <OfficerProductivityTable data={data.officers} />
      </div>
    </PageContainer>
  );
}
