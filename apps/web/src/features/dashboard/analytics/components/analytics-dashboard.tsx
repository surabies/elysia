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

      <div className="grid gap-4 xl:grid-cols-2">
        <DailyReadingsChart data={data.dailyTrends} totalReadings={data.totalBaca} />
        <RegionalReadingsChart data={data.regionalTrends} />
      </div>

      <ServiceAreaRisk data={data.serviceAreaRisks} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ConsumptionDistribution data={data.consumptionBuckets} />
        <ReadingStatusDistribution data={data.anomalies} />
      </div>

      <OfficerProductivityTable data={data.officers} />
    </PageContainer>
  );
}
