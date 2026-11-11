import { PageContainer } from "@/components/layout/index";
import { buildKpis } from "../lib/kpi";
import type { AnalyticsPageData } from "../types";
import { AnalyticsHeader } from "./analytics-header";
import { ConsumptionDistribution } from "./consumption-distribution";
import { DailyReadingsChart } from "./daily-readings-chart";
import { KpiGrid } from "./kpi-grid";
import { OfficerProductivityTable } from "./officer-productivity-table";
import { ReadingStatusDistribution } from "./reading-status-distribution";
import { RegionalReadingsChart } from "./regional-readings-chart";
import { ServiceAreaRisk } from "./service-area-risk/service-area-risk";
import { Activity, BarChart3, LineChart, MapPin, Users } from "lucide-react";

interface AnalyticsDashboardProps {
  data: AnalyticsPageData;
  generatedAt: Date;
}

export function AnalyticsDashboard({ data, generatedAt }: AnalyticsDashboardProps) {
  return (
    <PageContainer className="space-y-7">
      {/* 1. Header Cockpit Telemetri */}
      <AnalyticsHeader
        periodLabel={data.periode.label}
        periodCode={data.periode.thbl}
        generatedAt={generatedAt}
      />

      {/* 2. 4 Kartu KPI Utama Observabilitas */}
      <section aria-label="Indikator Kinerja Utama">
        <KpiGrid items={buildKpis(data)} />
      </section>

      {/* 3. Time-Series Harian & Tren Regional */}
      <section id="tren-harian" className="space-y-3 scroll-mt-6">
        <div className="flex items-center gap-2 text-label-12 font-mono text-muted-foreground uppercase tracking-wider">
          <LineChart className="size-3.5 text-blue-500" />
          <span>Tren Waktu &amp; Sebaran Regional</span>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <DailyReadingsChart data={data.dailyTrends} totalReadings={data.totalBaca} />
          <RegionalReadingsChart data={data.regionalTrends} />
        </div>
      </section>

      {/* 4. Geospasial & Peta Risiko Kelurahan */}
      <section id="risiko-wilayah" className="space-y-3 scroll-mt-6">
        <div className="flex items-center gap-2 text-label-12 font-mono text-muted-foreground uppercase tracking-wider">
          <MapPin className="size-3.5 text-emerald-500" />
          <span>Geospasial &amp; Evaluasi Risiko 21 Kelurahan</span>
        </div>
        <ServiceAreaRisk data={data.serviceAreaRisks} />
      </section>

      {/* 5. Distribusi Kelompok Konsumsi & Status Pembacaan */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-label-12 font-mono text-muted-foreground uppercase tracking-wider">
          <BarChart3 className="size-3.5 text-cyan-500" />
          <span>Distribusi Volumetrik &amp; Detail Kondisi Bacaan</span>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div id="kelompok-konsumsi" className="scroll-mt-6">
            <ConsumptionDistribution data={data.consumptionBuckets} />
          </div>
          <div id="status-pembacaan" className="scroll-mt-6">
            <ReadingStatusDistribution data={data.anomalies} />
          </div>
        </div>
      </section>

      {/* 6. Evaluasi Personel Lapangan */}
      <section id="produktivitas-petugas" className="space-y-2.5 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-label-12 font-mono text-muted-foreground uppercase tracking-wider">
            <Users className="size-3.5 text-indigo-500" />
            <span>Performa Personel Petugas Cater</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {data.officers.length} Petugas Terdaftar
          </span>
        </div>
        <OfficerProductivityTable data={data.officers} />
      </section>
    </PageContainer>
  );
}
