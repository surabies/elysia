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

interface AnalyticsDashboardProps {
  data: AnalyticsPageData;
  generatedAt: Date;
}

export function AnalyticsDashboard({ data, generatedAt }: AnalyticsDashboardProps) {
  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Cockpit Telemetri + Filter Periode */}
      <AnalyticsHeader
        periodLabel={data.periode.label}
        periodCode={data.periode.thbl}
        availablePeriods={data.availablePeriods}
        generatedAt={generatedAt}
      />

      {/* 2. 4 Kartu KPI Utama Observabilitas */}
      <section aria-label="Indikator Kinerja Utama">
        <KpiGrid items={buildKpis(data)} />
      </section>

      {/* 3. Time-Series Harian & Tren Regional */}
      <section id="tren-harian" className="grid gap-4 scroll-mt-6 xl:grid-cols-2">
        <DailyReadingsChart data={data.dailyTrends} totalReadings={data.totalBaca} />
        <RegionalReadingsChart data={data.regionalTrends} />
      </section>

      {/* 4. Geospasial & Peta Risiko Kelurahan */}
      <section id="risiko-wilayah" className="scroll-mt-6">
        <ServiceAreaRisk data={data.serviceAreaRisks} />
      </section>

      {/* 5. Distribusi Kelompok Konsumsi & Status Pembacaan */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div id="kelompok-konsumsi" className="scroll-mt-6">
          <ConsumptionDistribution data={data.consumptionBuckets} />
        </div>
        <div id="status-pembacaan" className="scroll-mt-6">
          <ReadingStatusDistribution data={data.anomalies} />
        </div>
      </section>

      {/* 6. Evaluasi Personel Lapangan */}
      <section id="produktivitas-petugas" className="scroll-mt-6">
        <OfficerProductivityTable data={data.officers} />
      </section>
    </PageContainer>
  );
}
