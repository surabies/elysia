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
import { ChevronDown } from "lucide-react";
import { VercelObservabilityCard } from "./VercelObservabilityCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DailyTrendItem } from "@/server/services/dashboard/analytics.service";

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
  const [isMetricMenuOpen, setIsMetricMenuOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const closeMetricMenuTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isVolume = activeMetric === "kubikasi";
  const totalKubikasi = data.reduce((sum, item) => sum + item.kubikasi, 0);
  const lineColor = isVolume ? "#0284c7" : "#ec4899";

  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      if (closeMetricMenuTimer.current) {
        clearTimeout(closeMetricMenuTimer.current);
      }
    };
  }, []);

  const openMetricMenu = () => {
    if (closeMetricMenuTimer.current) {
      clearTimeout(closeMetricMenuTimer.current);
    }
    setIsMetricMenuOpen(true);
  };
  const scheduleMetricMenuClose = () => {
    closeMetricMenuTimer.current = setTimeout(
      () => setIsMetricMenuOpen(false),
      500,
    );
  };

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
      legendLabel={
        <DropdownMenu
          open={isMetricMenuOpen}
          onOpenChange={setIsMetricMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") openMetricMenu();
              }}
              onPointerLeave={scheduleMetricMenuClose}
              className="group inline-flex items-center gap-1 rounded-sm text-[11px] leading-none text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Pilih metrik, saat ini ${isVolume ? "Total m³" : "Total SL"}`}
            >
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 transition-transform duration-200 group-hover:rotate-180 group-data-[state=open]:rotate-180"
              />
              {isVolume ? "Total m³" : "Total SL"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-32"
            onPointerEnter={openMetricMenu}
            onPointerLeave={scheduleMetricMenuClose}
          >
            <DropdownMenuRadioGroup
              value={activeMetric}
              onValueChange={(value) => {
                if (value === "total" || value === "kubikasi") {
                  setActiveMetric(value);
                }
              }}
            >
              <DropdownMenuRadioItem value="total">Total SL</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="kubikasi">
                Total m³
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      legendValue={(isVolume ? totalKubikasi : totalInvocations).toLocaleString(
        "id-ID",
      )}
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
              width={1}
              tickLine={false}
              axisLine={false}
              tick={() => null}
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
