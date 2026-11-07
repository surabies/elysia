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
import type {
  RegionalAreaTrend,
  RegionalDailyTrend,
} from "@/server/services/dashboard/analytics.service";

interface TopRegionsChartProps {
  data: RegionalDailyTrend[];
}

type AreaLevel = "kecamatan" | "kelurahan";

interface RegionalChartPoint {
  tanggal: string;
  hari: string;
  total: number;
  [key: string]: number | string;
}

const SERIES_COLORS = ["#2563eb", "#059669", "#db2777", "#d97706"];

export function TopRegionsChart({ data }: TopRegionsChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [activeLevel, setActiveLevel] = React.useState<AreaLevel>("kecamatan");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const topAreas = React.useMemo(() => {
    const totals = new Map<string, RegionalAreaTrend>();

    for (const daily of data) {
      for (const area of daily[activeLevel]) {
        const existing = totals.get(area.kode);
        totals.set(area.kode, {
          ...area,
          jumlahBaca: (existing?.jumlahBaca ?? 0) + area.jumlahBaca,
        });
      }
    }

    return Array.from(totals.values())
      .sort(
        (left, right) =>
          right.jumlahBaca - left.jumlahBaca ||
          left.nama.localeCompare(right.nama, "id-ID"),
      )
      .slice(0, 4);
  }, [data, activeLevel]);

  const seriesConfig = React.useMemo(
    () =>
      topAreas.map((area, index) => ({
        id: area.kode,
        nama:
          activeLevel === "kelurahan" && area.kecamatanNama
            ? `${area.nama} (${area.kecamatanNama})`
            : area.nama,
        color: SERIES_COLORS[index],
        dataKey: `area${index}`,
      })),
    [topAreas, activeLevel],
  );

  const chartData = React.useMemo(() => {
    const lastDay = Number(data.at(-1)?.hari ?? 0);
    const rowsByDay = new Map(data.map((daily) => [Number(daily.hari), daily]));
    const month = data[0]?.tanggal.slice(0, 7) ?? "";

    return Array.from({ length: lastDay }, (_, index) => {
      const day = index + 1;
      const hari = String(day).padStart(2, "0");
      const daily = rowsByDay.get(day);
      const point: RegionalChartPoint = {
        tanggal: daily?.tanggal ?? `${month}-${hari}`,
        hari,
        total: daily?.total ?? 0,
      };

      seriesConfig.forEach((series) => {
        const area = daily?.[activeLevel].find(
          (item) => item.kode === series.id,
        );
        point[series.dataKey] = area?.jumlahBaca ?? 0;
      });

      return point;
    });
  }, [data, activeLevel, seriesConfig]);

  return (
    <VercelObservabilityCard
      id="regional-meter-readings-card"
      title="Pembacaan Wilayah"
      legendLabel={activeLevel === "kecamatan" ? "Kecamatan" : "Kelurahan"}
      legendValue={`${seriesConfig.length} Teratas`}
      headerActions={
        <div
          className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-[10px]"
          role="group"
          aria-label="Tingkat wilayah"
        >
          {(["kecamatan", "kelurahan"] as const).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={activeLevel === level}
              onClick={() => setActiveLevel(level)}
              className={`rounded-sm px-2 py-1 font-medium capitalize transition-colors ${activeLevel === level ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              {level}
            </button>
          ))}
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
                  const p = payload[0].payload as RegionalChartPoint;
                  return (
                    <div className="rounded-md border border-border bg-popover/95 backdrop-blur-sm p-2 text-xs shadow-md text-popover-foreground space-y-1">
                      <div className="font-semibold text-foreground border-b border-border/60 pb-1">
                        {p.tanggal} &bull; Total{" "}
                        {p.total.toLocaleString("id-ID")} SL
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
                            <span className="text-muted-foreground">
                              {s.nama}:
                            </span>
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
                name={s.nama}
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
