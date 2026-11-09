"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { TooltipPanel, TooltipRow } from "@/components/charts/chart-tooltip";
import { DailyLineChart } from "@/components/charts/daily-line-chart";
import { HoverSelect } from "@/components/charts/hover-select";
import { expandByDay } from "../lib/chart-series";
import { formatNumber } from "../lib/format";
import type { DailyTrendItem } from "@/server/services/dashboard/analytics.service";

const METRICS = {
  total: { label: "Total SL", rowLabel: "Pembacaan meter", unit: "SL", color: "#ec4899" },
  kubikasi: { label: "Total m³", rowLabel: "Kubikasi", unit: "m³", color: "#0284c7" },
} as const;

type Metric = keyof typeof METRICS;

const METRIC_OPTIONS = (Object.keys(METRICS) as Metric[]).map((value) => ({
  value,
  label: METRICS[value].label,
}));

interface DailyPoint {
  hari: string;
  tanggal: string;
  total: number;
  kubikasi: number;
}

function DailyReadingsTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: DailyPoint }>;
  metric: Metric;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const { rowLabel, unit, color } = METRICS[metric];

  return (
    <TooltipPanel title={point.tanggal}>
      <TooltipRow
        color={color}
        label={rowLabel}
        value={`${formatNumber(point[metric])} ${unit}`}
      />
    </TooltipPanel>
  );
}

interface DailyReadingsChartProps {
  data: DailyTrendItem[];
  totalReadings: number;
}

export function DailyReadingsChart({
  data,
  totalReadings,
}: DailyReadingsChartProps) {
  const [metric, setMetric] = useState<Metric>("total");

  const points = useMemo(
    () =>
      expandByDay<DailyTrendItem, DailyPoint>(data, (row, day) => ({
        ...day,
        total: row?.total ?? 0,
        kubikasi: row?.kubikasi ?? 0,
      })),
    [data],
  );

  const totalVolume = useMemo(
    () => data.reduce((sum, row) => sum + row.kubikasi, 0),
    [data],
  );

  const { rowLabel, unit, color } = METRICS[metric];

  return (
    <ChartCard
      title="Pembacaan Meter Harian"
      legendLabel={
        <HoverSelect
          label="Pilih metrik"
          value={metric}
          options={METRIC_OPTIONS}
          onValueChange={setMetric}
        />
      }
      legendValue={formatNumber(metric === "total" ? totalReadings : totalVolume)}
    >
      <DailyLineChart
        data={points}
        series={[{ dataKey: metric, name: `${rowLabel} (${unit})`, color }]}
        tooltip={<DailyReadingsTooltip metric={metric} />}
      />
    </ChartCard>
  );
}
