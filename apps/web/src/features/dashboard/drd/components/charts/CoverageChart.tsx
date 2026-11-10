"use client";

import { useMemo, useState } from "react";
import { VercelBarChart, type VercelBarPoint } from "@/components/charts/vercel-bar-chart";
import { VercelChartCard, type VercelBreakdownRow } from "./VercelChartCard";
import {
  formatCompactYAxisNumber,
  formatNumber,
  truncateLabel,
} from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

const COVERAGE_METRICS = {
  sl: { label: "Sambungan (SL)", unit: "SL", color: "var(--ds-blue-700)" },
  pemakaianM3: { label: "Konsumsi (m³)", unit: "m³", color: "var(--ds-teal-700)" },
} as const;

type CoverageMetric = keyof typeof COVERAGE_METRICS;

export function CoverageChart({ data }: { data: DrdSummary["dataCakupan"] }) {
  const [metric, setMetric] = useState<CoverageMetric>("sl");

  const totalSL = useMemo(
    () => data.reduce((sum, item) => sum + item.sl, 0),
    [data]
  );
  const totalM3 = useMemo(
    () => data.reduce((sum, item) => sum + item.pemakaianM3, 0),
    [data]
  );

  const activeConfig = COVERAGE_METRICS[metric];

  // Top 8 areas to keep chart balanced and X axis clean
  const displayData = useMemo(() => {
    return [...data]
      .sort((a, b) => (metric === "sl" ? b.sl - a.sl : b.pemakaianM3 - a.pemakaianM3))
      .slice(0, 8);
  }, [data, metric]);

  const chartData: VercelBarPoint[] = useMemo(() => {
    return displayData.map((d) => ({
      key: d.kelurahan,
      label: d.kelurahan,
      shortLabel: truncateLabel(d.kelurahan, 8),
      value: metric === "sl" ? d.sl : d.pemakaianM3,
      formattedValue:
        metric === "sl"
          ? `${formatNumber(d.sl)} SL`
          : `${formatNumber(d.pemakaianM3)} m³`,
      unit: activeConfig.unit,
    }));
  }, [displayData, metric, activeConfig.unit]);

  const breakdownRows: VercelBreakdownRow[] = useMemo(() => {
    const avgPerSL = totalSL > 0 ? (totalM3 / totalSL).toFixed(1) : "0";
    return [
      {
        color: "var(--ds-blue-700)",
        label: "Total Sambungan Langganan",
        value: `${formatNumber(totalSL)} SL`,
        share: "100%",
      },
      {
        color: "var(--ds-teal-700)",
        label: "Konsumsi Akumulatif Air",
        value: `${formatNumber(totalM3)} m³`,
        share: "Total",
      },
      {
        color: "var(--ds-gray-600)",
        label: "Rata-rata Pemakaian Air",
        value: `${avgPerSL} m³/SL`,
        share: "Efisiensi",
      },
    ];
  }, [totalSL, totalM3]);

  return (
    <VercelChartCard
      title="Cakupan Layanan Wilayah"
      description="Sebaran jumlah sambungan langganan (SL) dan volume konsumsi air per wilayah."
      meter={{
        current:
          metric === "sl"
            ? `${formatNumber(totalSL)} SL`
            : `${formatNumber(totalM3)} m³`,
        total: metric === "sl" ? "Total Sambungan" : "Total Konsumsi",
        percent: 100,
        color: activeConfig.color,
      }}
      tabs={[
        { value: "sl", label: "Sambungan (SL)" },
        { value: "pemakaianM3", label: "Konsumsi (m³)" },
      ]}
      activeTab={metric}
      onTabChange={(val) => setMetric(val as CoverageMetric)}
      updatedText="Diperbarui periode aktif"
      breakdownRows={breakdownRows}
      isEmpty={data.length === 0}
      emptyMessage="Belum ada data cakupan wilayah pada periode ini."
    >
      <VercelBarChart
        data={chartData}
        yFormatter={(val) => formatCompactYAxisNumber(val)}
        barColor={activeConfig.color}
        seriesName={activeConfig.label}
      />
    </VercelChartCard>
  );
}
