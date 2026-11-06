"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
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
import type { ConsumptionBucket } from "@/src/server/services/dashboard/analytics.service";

interface ConsumptionHistogramChartProps {
  data: ConsumptionBucket[];
}

const histogramConfig = {
  jumlahSL: {
    label: "Jumlah Pelanggan (SL)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ConsumptionHistogramChart({ data }: ConsumptionHistogramChartProps) {
  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Distribusi Rentang Kubikasi Air
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
              Histogram
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sebaran pelanggan berdasarkan kelompok pemakaian m³ per bulan.
          </p>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Median: <span className="font-semibold text-foreground">15,44 m³</span> &bull; P99: <span className="font-semibold text-foreground">&gt; 50 m³</span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-[210px] w-full pt-1">
        <ChartContainer config={histogramConfig} className="h-full w-full aspect-auto">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border) / 0.6)"
            />
            <XAxis
              dataKey="kategori"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v} m³`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, p) => {
                    const row = p?.[0]?.payload as ConsumptionBucket;
                    return row ? row.label : "";
                  }}
                  formatter={(value, _, item) => {
                    const row = item.payload as ConsumptionBucket;
                    return [
                      `${Number(value).toLocaleString("id-ID")} SL (${row.persentase}%) &bull; ${row.totalM3.toLocaleString("id-ID")} m³`,
                      "Pelanggan",
                    ];
                  }}
                />
              }
            />
            <Bar
              dataKey="jumlahSL"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Mini Grid Breakdown */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-border pt-3">
        {data.map((b) => (
          <div key={b.kategori} className="rounded-md border border-border/60 bg-muted/20 p-2">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block truncate">
              {b.kategori} m³
            </span>
            <span className="text-xs font-semibold font-mono text-foreground block">
              {b.jumlahSL.toLocaleString("id-ID")} SL
            </span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              {b.persentase}% langganan
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
