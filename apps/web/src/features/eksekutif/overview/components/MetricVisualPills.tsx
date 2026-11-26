"use client";

import * as React from "react";
import { BarSparkline } from "@/components/charts/sparkline";

interface MetricVisualPillsProps {
  values: number[];
  labels?: string[];
  tone?: "problem" | "neutral";
  unit?: string;
  height?: number;
  color?: string;
}

interface SparklineBarDatum {
  index: number;
  value: number;
  label: string;
}

export function MetricVisualPills({
  values,
  labels,
  tone = "neutral",
  unit,
  height = 48,
  color: customColor,
}: MetricVisualPillsProps) {
  const [hoveredDatum, setHoveredDatum] = React.useState<SparklineBarDatum | null>(null);

  // Normalisasi data ke array objek datum Bklit
  const points: SparklineBarDatum[] = React.useMemo(() => {
    if (!values || values.length === 0) {
      return [
        { index: 0, value: 0, label: "Tgl 1" },
        { index: 1, value: 0, label: "Tgl 2" },
      ];
    }

    const sourceData = values.length === 1 ? [values[0], values[0]] : values;

    return sourceData.map((val, idx) => ({
      index: idx,
      value: typeof val === "number" && !isNaN(val) ? val : 0,
      label: labels && labels[idx] ? labels[idx] : `Tgl ${idx + 1}`,
    }));
  }, [values, labels]);

  // Penentuan warna bar Bklit sesuai tone
  const barColor = React.useMemo(() => {
    if (customColor) return customColor;
    if (tone === "problem") {
      return "var(--ds-red-700, #e5202e)";
    }
    return "var(--ds-blue-700, #0070f3)";
  }, [customColor, tone]);

  const latestDatum = points[points.length - 1];

  return (
    <div className="relative flex w-full flex-col justify-end select-none">
      {/* 1. Baris Telemetri Header Mini Sparkline (Hover Tracking) */}
      <div className="flex h-5 items-center justify-between text-[11px] mb-1 px-0.5">
        {hoveredDatum ? (
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground animate-in fade-in-50 duration-150">
            <span
              className="size-1.5 rounded-xs shrink-0"
              style={{ backgroundColor: barColor }}
            />
            <span className="text-muted-foreground">{hoveredDatum.label}:</span>
            <span className="font-semibold tabular-nums">
              {Math.round(hoveredDatum.value).toLocaleString("id-ID")}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/80">
            <span
              className="size-1 rounded-xs shrink-0 opacity-60"
              style={{ backgroundColor: barColor }}
            />
            <span>Distribusi {points.length} bar harian</span>
          </div>
        )}

        {/* Nilai bar terakhir saat idle */}
        {!hoveredDatum && latestDatum && (
          <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
            Aktual: {Math.round(latestDatum.value).toLocaleString("id-ID")}
            {unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>

      {/* 2. Komponen Resmi Bklit BarSparkline (https://bklit.com/docs/components/sparkline) */}
      <div className="relative w-full overflow-hidden rounded-xs">
        <BarSparkline<SparklineBarDatum>
          data={points}
          dataKey="value"
          color={barColor}
          height={height}
          barGap={3}
          barRadius={2}
          inactiveOpacity={0.35}
          crosshair={false}
          dot={false}
          animate={true}
          animationDuration={900}
          dataTransitionDuration={500}
          padding={{ top: 4, bottom: 2, left: 2, right: 2 }}
          onHoverChange={(_idx, datum) => {
            setHoveredDatum(datum);
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}
