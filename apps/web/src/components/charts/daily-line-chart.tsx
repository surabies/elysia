"use client";

import type { ReactElement } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { CHART_HEIGHT } from "./chart-card";
import { EdgeAlignedTick } from "./edge-aligned-tick";

export interface LineSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface DailyLineChartProps<T extends { hari: string }> {
  data: T[];
  series: readonly LineSeries[];
  tooltip: ReactElement;
}

export function DailyLineChart<T extends { hari: string }>({
  data,
  series,
  tooltip,
}: DailyLineChartProps<T>) {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return (
      <div
        className="flex w-full items-center justify-center"
        style={{ height: CHART_HEIGHT }}
      >
        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart
        data={data}
        margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
        style={{ cursor: "crosshair" }}
      >
        <CartesianGrid
          horizontal
          vertical={false}
          stroke="var(--ds-gray-alpha-300)"
          strokeDasharray="3 4"
          strokeWidth={1}
        />
        <XAxis
          dataKey="hari"
          stroke="none"
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tickMargin={6}
          interval="preserveStartEnd"
          tick={
            <EdgeAlignedTick
              firstValue={data[0]?.hari}
              lastValue={data.at(-1)?.hari}
            />
          }
        />
        <YAxis width={1} tickLine={false} axisLine={false} tick={false} />
        <Tooltip content={tooltip} />
        {series.map((item) => (
          <Line
            key={item.dataKey}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name}
            stroke={item.color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
