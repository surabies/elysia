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
      <AnalyticsHeader
        periodLabel={data.periode.label}
        periodCode={data.periode.thbl}
        generatedAt={generatedAt}
      />

      <KpiGrid items={buildKpis(data)} />

      <div id="tren-harian" className="grid gap-4 xl:grid-cols-2 scroll-mt-6">
        <DailyReadingsChart data={data.dailyTrends} totalReadings={data.totalBaca} />
        <RegionalReadingsChart data={data.regionalTrends} />
      </div>

      <div id="risiko-wilayah" className="scroll-mt-6">
        <ServiceAreaRisk data={data.serviceAreaRisks} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div id="kelompok-konsumsi" className="scroll-mt-6">
          <ConsumptionDistribution data={data.consumptionBuckets} />
        </div>
        <div id="status-pembacaan" className="scroll-mt-6">
          <ReadingStatusDistribution data={data.anomalies} />
        </div>
      </div>

      <div id="produktivitas-petugas" className="scroll-mt-6">
        <OfficerProductivityTable data={data.officers} />
      </div>
    </PageContainer>
  );
}
