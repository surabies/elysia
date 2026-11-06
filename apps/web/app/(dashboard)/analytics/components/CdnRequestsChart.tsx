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
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    return data.map((d, i) => ({
      name: d.label,
      hari: d.hari,
      tanggal: d.tanggal,
      tirtawening: d.total,
      // Garis putus-putus untuk titik proyeksi akhir ala Vercel
      tirtaweningSolid: i <= data.length - 2 ? d.total : null,
      tirtaweningDash: i >= data.length - 2 ? d.total : null,
    }));
  }, [data]);

  return (
    <VercelObservabilityCard
      id="cdn-requests-card"
      title="CDN Requests / Invocations"
      href="/analytics"
      legendLabel="Invocations"
      legendValue={totalInvocations.toLocaleString("id-ID")}
    >
      {!isMounted ? (
        <div className="h-[185px] w-full flex items-center justify-center">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={185}>
          <LineChart
            data={chartData}
            margin={{ top: 25, right: 12, left: -20, bottom: 5 }}
            style={{ cursor: "crosshair" }}
          >
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border) / 0.5)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="name"
              stroke="none"
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border) / 0.6)" }}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-md border border-border bg-popover/95 backdrop-blur-sm px-2.5 py-1.5 text-xs shadow-md text-popover-foreground">
                      <div className="font-semibold text-foreground mb-1">
                        {p.tanggal} ({p.name})
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="size-2 rounded-full bg-pink-500 inline-block" />
                        <span className="text-muted-foreground">tirtawening:</span>
                        <span className="font-bold text-foreground">
                          {Number(p.tirtawening).toLocaleString("id-ID")} req
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
              dataKey="tirtawening"
              name="tirtawening"
              stroke="#ec4899"
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
