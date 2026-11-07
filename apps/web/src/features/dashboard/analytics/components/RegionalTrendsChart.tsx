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
import type { LegacyRegionalDailyTrend } from "@/server/services/dashboard/analytics.service";

interface RegionalTrendsChartProps {
  data: LegacyRegionalDailyTrend[];
}

const regionalConfig = {
  karees: {
    label: "Wilayah Karees (03)",
    color: "#2563eb", // blue-600
  },
  tegallega: {
    label: "Wilayah Tegallega (04)",
    color: "#059669", // emerald-600
  },
  bojonegara: {
    label: "Wilayah Bojonegara (01)",
    color: "#db2777", // pink-600
  },
  cibeunying: {
    label: "Wilayah Cibeunying (02)",
    color: "#d97706", // amber-600
  },
} satisfies ChartConfig;

export function RegionalTrendsChart({ data }: RegionalTrendsChartProps) {
  // Hitung summary table ala Vercel: Start, End, Low, Peak untuk tiap wilayah
  const stats = React.useMemo(() => {
    if (!data.length) return [];
    const keys: Array<keyof typeof regionalConfig> = [
      "karees",
      "tegallega",
      "bojonegara",
      "cibeunying",
    ];

    return keys.map((key) => {
      const vals = data.map((d) => d[key]);
      const start = vals[0] ?? 0;
      const end = vals[vals.length - 1] ?? 0;
      const low = Math.min(...vals);
      const peak = Math.max(...vals);
      const total = vals.reduce((a, b) => a + b, 0);

      return {
        key,
        label: regionalConfig[key].label,
        color: regionalConfig[key].color,
        start,
        end,
        low,
        peak,
        total,
      };
    });
  }, [data]);

  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Komparasi Pembacaan per Wilayah Operasional
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground"
            >
              4 Wilayah
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dinamika beban kerja harian lintas 4 cabang pelayanan PDAM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {stats.map((s) => (
            <div
              key={s.key}
              className="flex items-center gap-1.5 font-mono text-[11px]"
            >
              <span
                className="size-2 rounded-full inline-block"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-muted-foreground capitalize">{s.key}:</span>
              <span className="font-semibold text-foreground">
                {s.total.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts Multi-Line Container */}
      <div className="h-[200px] w-full pt-1">
        <ChartContainer
          config={regionalConfig}
          className="h-full w-full aspect-auto"
        >
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
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, p) => {
                    const row = p?.[0]?.payload as LegacyRegionalDailyTrend;
                    return row
                      ? `Tanggal ${row.hari} (Total: ${row.total} SL)`
                      : "";
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="karees"
              stroke="#2563eb"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="tegallega"
              stroke="#059669"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="bojonegara"
              stroke="#db2777"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cibeunying"
              stroke="#d97706"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Vercel Summary Table Underneath (Persis sample-grafik-2.md) */}
      <div className="mt-4 border-t border-border pt-3 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <th className="pb-1.5 font-normal">Wilayah Operasional</th>
              <th className="pb-1.5 font-normal text-right">Mulai (Tgl 1)</th>
              <th className="pb-1.5 font-normal text-right">Akhir (Tgl 25)</th>
              <th className="pb-1.5 font-normal text-right">Terendah</th>
              <th className="pb-1.5 font-normal text-right">Puncak</th>
              <th className="pb-1.5 font-normal text-right font-semibold text-foreground">
                Total SL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono text-[11px]">
            {stats.map((s) => (
              <tr key={s.key} className="hover:bg-muted/30 transition-colors">
                <td className="py-1.5 flex items-center gap-2 font-sans font-medium text-foreground">
                  <span
                    className="size-2 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </td>
                <td className="py-1.5 text-right text-muted-foreground">
                  {s.start}
                </td>
                <td className="py-1.5 text-right text-muted-foreground">
                  {s.end}
                </td>
                <td className="py-1.5 text-right text-muted-foreground">
                  {s.low}
                </td>
                <td className="py-1.5 text-right text-foreground font-semibold">
                  {s.peak}
                </td>
                <td className="py-1.5 text-right font-bold text-foreground">
                  {s.total.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
