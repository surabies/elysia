"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import type { DailyTrendItem } from "@/server/services/dashboard/analytics.service";

interface CumulativeTargetLineChartProps {
  data: DailyTrendItem[];
  totalTarget: number;
}

const cumulativeConfig = {
  kumulatifAktual: {
    label: "Realisasi Kumulatif",
    color: "#2563eb",
  },
  kumulatifTarget: {
    label: "Target Kuota Linear",
    color: "#94a3b8",
  },
} satisfies ChartConfig;

export function CumulativeTargetLineChart({
  data,
  totalTarget,
}: CumulativeTargetLineChartProps) {
  const latest = data[data.length - 1];
  const persenTercapai =
    totalTarget > 0 && latest
      ? Math.round((latest.kumulatifAktual / totalTarget) * 1000) / 10
      : 0;

  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Kurva Kecepatan Pembacaan (Kurva S vs Target)
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
              S-Curve Velocity
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Komparasi akumulasi hasil catat riil terhadap garis target linear {totalTarget.toLocaleString("id-ID")} SL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="size-2 rounded-full bg-blue-600 inline-block" />
            <span className="text-muted-foreground">Aktual:</span>
            <span className="font-semibold text-foreground">
              {latest?.kumulatifAktual.toLocaleString("id-ID") ?? 0} SL ({persenTercapai}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="size-2 rounded-full bg-slate-400 inline-block" />
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium text-foreground">
              {totalTarget.toLocaleString("id-ID")} SL
            </span>
          </div>
        </div>
      </div>

      <div className="h-[210px] w-full pt-1">
        <ChartContainer config={cumulativeConfig} className="h-full w-full aspect-auto">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border) / 0.6)"
            />
            <XAxis
              dataKey="hari"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `Tgl ${parseInt(v, 10)}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, p) => {
                    const row = p?.[0]?.payload as DailyTrendItem;
                    return row ? `${row.tanggal} (${row.label})` : "";
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("id-ID")} SL`,
                    name === "kumulatifAktual" ? "Realisasi" : "Target Kuota",
                  ]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="kumulatifAktual"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="kumulatifTarget"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
