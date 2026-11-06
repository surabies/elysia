"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { VercelObservabilityCard } from "./VercelObservabilityCard";
import type { DailyTrendItem } from "@/src/server/services/dashboard/analytics.service";

interface CdnRequestsChartProps {
  data: DailyTrendItem[];
  totalInvocations: number;
}

export function CdnRequestsChart({
  data,
  totalInvocations,
}: CdnRequestsChartProps) {
  const [activeMetric, setActiveMetric] = React.useState<"total" | "kubikasi">(
    "total",
  );
  const [isMounted, setIsMounted] = React.useState(false);
  const isVolume = activeMetric === "kubikasi";
  const totalKubikasi = data.reduce((sum, item) => sum + item.kubikasi, 0);
  const lineColor = isVolume ? "#0284c7" : "#ec4899";

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    const lastDay = Number(data.at(-1)?.hari ?? 0);
    const rowsByDay = new Map(
      data.map((item) => [Number(item.hari), item] as const),
    );
    const month = data[0]?.tanggal.slice(0, 7);

    return Array.from({ length: lastDay }, (_, index) => {
      const day = index + 1;
      const hari = String(day).padStart(2, "0");
      const row = rowsByDay.get(day);

      return {
        hari,
        tanggal: row?.tanggal ?? `${month}-${hari}`,
        total: row?.total ?? 0,
        kubikasi: row?.kubikasi ?? 0,
      };
    });
  }, [data]);

  return (
    <VercelObservabilityCard
      id="daily-meter-readings-card"
      title="Pembacaan Meter Harian"
      legendLabel={isVolume ? "Total m³" : "Total SL"}
      legendValue={(isVolume ? totalKubikasi : totalInvocations).toLocaleString(
        "id-ID",
      )}
      headerActions={
        <div
          className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-[10px]"
          role="group"
          aria-label="Metrik pembacaan"
        >
          <button
            type="button"
            aria-pressed={!isVolume}
            onClick={() => setActiveMetric("total")}
            className={`rounded-sm px-2 py-1 font-medium transition-colors ${!isVolume ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Total SL
          </button>
          <button
            type="button"
            aria-pressed={isVolume}
            onClick={() => setActiveMetric("kubikasi")}
            className={`rounded-sm px-2 py-1 font-medium transition-colors ${isVolume ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Total m³
          </button>
        </div>
      }
    >
      {!isMounted ? (
        <div className="h-46.25 w-full flex items-center justify-center">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={185}>
          <LineChart
            data={chartData}
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
              axisLine={{ stroke: "hsl(var(--border) / 0.6)" }}
              tickMargin={6}
              interval="preserveStartEnd"
              tick={({ x, y, payload }) => {
                const value = String(payload.value);
                const isFirst = value === chartData[0]?.hari;
                const isLast = value === chartData.at(-1)?.hari;

                return (
                  <text
                    x={x}
                    y={y}
                    dy={3}
                    fill="hsl(var(--muted-foreground))"
                    fontSize={11}
                    textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                  >
                    {parseInt(value, 10)}
                  </text>
                );
              }}
            />
            <YAxis
              width={50}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => Number(value).toLocaleString("id-ID")}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-md border border-border bg-popover/95 backdrop-blur-sm px-2.5 py-1.5 text-xs shadow-md text-popover-foreground">
                      <div className="font-semibold text-foreground mb-1">
                        {p.tanggal}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span
                          className="size-2 rounded-full inline-block"
                          style={{ backgroundColor: lineColor }}
                        />
                        <span className="text-muted-foreground">
                          {isVolume ? "Kubikasi:" : "Pembacaan meter:"}
                        </span>
                        <span className="font-bold text-foreground">
                          {Number(
                            isVolume ? p.kubikasi : p.total,
                          ).toLocaleString("id-ID")}{" "}
                          {isVolume ? "m³" : "SL"}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey={activeMetric}
              name={isVolume ? "Kubikasi (m³)" : "Pembacaan meter (SL)"}
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </VercelObservabilityCard>
  );
}
