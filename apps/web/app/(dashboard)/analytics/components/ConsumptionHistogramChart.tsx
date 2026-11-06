"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { ConsumptionBucket } from "@/src/server/services/dashboard/analytics.service";

interface ConsumptionHistogramChartProps {
  data: ConsumptionBucket[];
}

const histogramConfig = {
  jumlahSL: {
    label: "Pelanggan",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const histogramColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--ds-gray-600)",
];

export function ConsumptionHistogramChart({
  data,
}: ConsumptionHistogramChartProps) {
  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Distribusi Rentang Kubikasi Air
        </h3>
      </div>

      {/* Bar Chart Container */}
      <div className="h-70 w-full pt-1">
        <ChartContainer
          config={histogramConfig}
          className="h-full w-full aspect-auto"
        >
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              horizontal
              strokeDasharray="3 4"
              vertical={false}
              stroke="var(--ds-gray-alpha-300)"
              strokeWidth={1}
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
              width={50}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => Number(value).toLocaleString("id-ID")}
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
            <Bar dataKey="jumlahSL" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((bucket, index) => (
                <Cell
                  key={bucket.kategori}
                  fill={histogramColors[index % histogramColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
