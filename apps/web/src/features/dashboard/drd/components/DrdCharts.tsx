"use client";

import type { DrdSummary } from "@/server/services/dashboard/drd.service";
import {
  KelurahanBillingChart,
  CoverageChart,
  DomesticSegmentationChart,
  TaaKelurahanChart,
  TariffDistributionChart,
  TaaServiceRatioChart,
  BillingComponentsChart,
} from "./charts";

// Re-export shared primitives and core chart components for backwards compatibility
export * from "./charts";
export {
  VercelBarChart,
  VercelVisxBarChart,
  type VercelBarPoint,
  type VercelVisxPoint,
} from "@/components/charts/vercel-bar-chart";

/* -------------------------------------------------------------------------- */
/*                              MAIN EXPORT                                   */
/* -------------------------------------------------------------------------- */

export function DrdCharts({ data }: { data: DrdSummary }) {
  return (
    <div className="space-y-4">
      {/* Baris 1: Sisi Spasial & Volume Layanan */}
      <div className="grid gap-4 xl:grid-cols-2">
        <KelurahanBillingChart data={data.dataKelurahan} />
        <CoverageChart data={data.dataCakupan} />
      </div>

      {/* Baris 2: Segmentasi Domestik & Anomali Wilayah */}
      <div className="grid gap-4 xl:grid-cols-2">
        <DomesticSegmentationChart
          data={data.dataDomestik}
          totalDomestic={data.jumlahDomestik}
        />
        <TaaKelurahanChart data={data.dataTaaKelurahan} />
      </div>

      {/* Baris 3: Distribusi Proporsi Finansial & Risiko */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TariffDistributionChart data={data.dataTarif} />
        <TaaServiceRatioChart data={data.dataTaaStatus} />
        <BillingComponentsChart data={data.dataTagihanKomposisi} />
      </div>
    </div>
  );
}
