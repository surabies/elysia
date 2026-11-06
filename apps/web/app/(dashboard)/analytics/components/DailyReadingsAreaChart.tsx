"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import type { DailyTrendItem } from "@/src/server/services/dashboard/analytics.service";

interface DailyReadingsAreaChartProps {
  data: DailyTrendItem[];
  totalBaca: number;
  rataRataHarian: number;
  puncakHarian: {
    hari: string;
    total: number;
  };
}

const chartConfig = {
  total: {
    label: "Pembacaan Meter (SL)",
    color: "hsl(var(--primary))",
  },
  kubikasi: {
    label: "Volume Air (m³)",
    color: "hsl(var(--chart-2, 199 89% 48%))",
  },
} satisfies ChartConfig;

export function DailyReadingsAreaChart({
  data,
  totalBaca,
  rataRataHarian,
  puncakHarian,
}: DailyReadingsAreaChartProps) {
  const [activeMetric, setActiveMetric] = React.useState<"total" | "kubikasi">("total");

  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      {/* Vercel Header: Title & Big Metric Legend */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Tren Harian Pembacaan Meter Air
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
              {data.length} Titik Catat
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rata-rata {rataRataHarian.toLocaleString("id-ID")} SL/hari &bull; Puncak {puncakHarian.hari} ({puncakHarian.total.toLocaleString("id-ID")} SL)
          </p>
        </div>

        {/* Right Metric Box (Gaya Vercel Observability) */}
        <div className="flex items-center gap-4">
          <div className="flex rounded-md border border-border bg-muted/30 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric("total")}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-all ${
                activeMetric === "total"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SL Terbaca
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric("kubikasi")}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-all ${
                activeMetric === "kubikasi"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Volume m³
            </button>
          </div>

          <div className="text-right">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {activeMetric === "total" ? "Total Catat" : "Total Air"}
            </span>
            <span className="text-lg font-semibold font-mono tracking-tight text-foreground">
              {activeMetric === "total"
                ? `${totalBaca.toLocaleString("id-ID")} SL`
                : `${data.reduce((acc, d) => acc + d.kubikasi, 0).toLocaleString("id-ID")} m³`}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-[230px] w-full pt-2">
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPembacaan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillKubikasi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border) / 0.6)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(val) =>
                val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
              }
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, p) => {
                    const row = p?.[0]?.payload as DailyTrendItem;
                    return row ? `${row.tanggal} (${row.label})` : "";
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("id-ID")} ${name === "total" ? "SL" : "m³"}`,
                    name === "total" ? "Pembacaan" : "Kubikasi",
                  ]}
                />
              }
            />
            {activeMetric === "total" ? (
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#fillPembacaan)"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="kubikasi"
                stroke="#0284c7"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#fillKubikasi)"
              />
            )}
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
