"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { TooltipPanel, TooltipRow } from "@/components/charts/chart-tooltip";
import { DailyLineChart } from "@/components/charts/daily-line-chart";
import { HoverSelect } from "@/components/charts/hover-select";
import { formatNumber } from "../lib/format";
import {
  rankTopAreas,
  toChartPoints,
  toSeries,
  type AreaLevel,
  type RegionalPoint,
  type RegionalSeries,
} from "../lib/regional";
import type { RegionalDailyTrend } from "@/server/services/dashboard/analytics.service";

const LEVEL_OPTIONS = [
  { value: "kecamatan", label: "Kecamatan" },
  { value: "kelurahan", label: "Kelurahan" },
] as const satisfies readonly { value: AreaLevel; label: string }[];

function RegionalTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: RegionalPoint }>;
  series: readonly RegionalSeries[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <TooltipPanel
      title={`${point.tanggal} • Total ${formatNumber(point.total)} SL`}
    >
      {series.map((item) => (
        <TooltipRow
          key={item.id}
          color={item.color}
          label={`${item.label}:`}
          value={formatNumber(Number(point[item.dataKey]))}
        />
      ))}
    </TooltipPanel>
  );
}

export function RegionalReadingsChart({ data }: { data: RegionalDailyTrend[] }) {
  const [level, setLevel] = useState<AreaLevel>("kecamatan");

  const series = useMemo(() => toSeries(rankTopAreas(data, level), level), [data, level]);
  const points = useMemo(() => toChartPoints(data, level, series), [data, level, series]);

  return (
    <ChartCard
      title="Pembacaan Wilayah"
      legendLabel={
        <HoverSelect
          label="Pilih tingkat wilayah"
          value={level}
          options={LEVEL_OPTIONS}
          onValueChange={setLevel}
        />
      }
      legendValue={`${series.length} Teratas`}
    >
      <DailyLineChart
        data={points}
        series={series.map(({ dataKey, label, color }) => ({
          dataKey,
          name: label,
          color,
        }))}
        tooltip={<RegionalTooltip series={series} />}
      />
    </ChartCard>
  );
}
