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
import type { RegionalDailyTrend } from "@/src/server/services/dashboard/analytics.service";

interface TopRegionsChartProps {
  data: RegionalDailyTrend[];
}

export function TopRegionsChart({ data }: TopRegionsChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const seriesConfig = [
    {
      id: "sin1",
      namaPdam: "sin1 (Karees)",
      color: "#2563eb",
      dataKey: "karees" as const,
    },
    {
      id: "sfo1",
      namaPdam: "sfo1 (Tegallega)",
      color: "#059669",
      dataKey: "tegallega" as const,
    },
    {
      id: "fra1",
      namaPdam: "fra1 (Bojonegara)",
      color: "#db2777",
      dataKey: "bojonegara" as const,
    },
    {
      id: "cbe1",
      namaPdam: "cbe1 (Cibeunying)",
      color: "#d97706",
      dataKey: "cibeunying" as const,
    },
  ];

  return (
    <VercelObservabilityCard
      id="top-regions-card"
      title="Top Regions"
      href="/analytics"
      legendLabel="Regions"
      legendValue="4 Active"
    >
      {!isMounted ? (
        <div className="h-[185px] w-full flex items-center justify-center">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={185}>
          <LineChart
            data={data}
            margin={{ top: 25, right: 12, left: -20, bottom: 5 }}
            style={{ cursor: "crosshair" }}
          >
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border) / 0.5)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="hari"
              stroke="none"
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border) / 0.6)" }}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `Tgl ${parseInt(v, 10)}`}
            />
            <YAxis
              stroke="none"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as RegionalDailyTrend;
                  return (
                    <div className="rounded-md border border-border bg-popover/95 backdrop-blur-sm p-2 text-xs shadow-md text-popover-foreground space-y-1">
                      <div className="font-semibold text-foreground border-b border-border/60 pb-1">
                        Tanggal {p.hari} &bull; Total {p.total} SL
                      </div>
                      {seriesConfig.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 font-mono text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full inline-block"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-muted-foreground">{s.namaPdam}:</span>
                          </div>
                          <span className="font-bold text-foreground">
                            {Number(p[s.dataKey]).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {seriesConfig.map((s) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.dataKey}
                name={s.namaPdam}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </VercelObservabilityCard>
  );
}
