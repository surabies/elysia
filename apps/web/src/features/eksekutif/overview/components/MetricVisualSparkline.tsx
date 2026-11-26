"use client";

import * as React from "react";
import { AreaSparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

interface MetricVisualSparklineProps {
  data: number[];
  labels?: string[];
  color?: string;
  unit?: string;
  height?: number;
}

interface SparklineDatum {
  index: number;
  value: number;
  label: string;
}

export function MetricVisualSparkline({
  data,
  labels,
  color = "var(--ds-blue-700, #0070f3)",
  unit,
  height = 48,
}: MetricVisualSparklineProps) {
  const [hoveredDatum, setHoveredDatum] = React.useState<SparklineDatum | null>(null);

  // Normalisasi data menjadi array objek datum agar Bklit AreaSparkline dapat membaca dataKey & label
  const points: SparklineDatum[] = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { index: 0, value: 0, label: "Tgl 1" },
        { index: 1, value: 0, label: "Tgl 2" },
      ];
    }

    // Jika hanya ada 1 titik data, duplikasi agar kurva area Bklit tetap terbentuk anggun
    const sourceData = data.length === 1 ? [data[0], data[0]] : data;

    return sourceData.map((val, idx) => ({
      index: idx,
      value: typeof val === "number" && !isNaN(val) ? val : 0,
      label: labels && labels[idx] ? labels[idx] : `Tgl ${idx + 1}`,
    }));
  }, [data, labels]);

  // Titik terakhir untuk indikator ringkasan default saat tidak hover
  const latestDatum = points[points.length - 1];

  return (
    <div className="relative flex w-full flex-col justify-end select-none">
      {/* 1. Baris Telemetri Header Mini Sparkline (Hover Tracking) */}
      <div className="flex h-5 items-center justify-between text-[11px] mb-1 px-0.5">
        {hoveredDatum ? (
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground animate-in fade-in-50 duration-150">
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
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
              className="size-1 rounded-full shrink-0 opacity-60"
              style={{ backgroundColor: color }}
            />
            <span>Tren {points.length} titik aktif</span>
          </div>
        )}

        {/* Nilai titik terakhir saat idle */}
        {!hoveredDatum && latestDatum && (
          <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
            Aktual: {Math.round(latestDatum.value).toLocaleString("id-ID")}
            {unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>

      {/* 2. Komponen Resmi Bklit AreaSparkline (https://bklit.com/docs/components/sparkline) */}
      <div className="relative w-full overflow-hidden rounded-xs">
        <AreaSparkline<SparklineDatum>
          data={points}
          dataKey="value"
          color={color}
          height={height}
          curve="monotone"
          fill="gradient"
          fillOpacity={0.25}
          strokeWidth={1.75}
          endDot={true}
          dot={true}
          crosshair="dashed"
          showHighlight={true}
          inactiveOpacity={0.4}
          animate={true}
          animationDuration={900}
          dataTransitionDuration={500}
          padding={{ top: 6, bottom: 4, left: 4, right: 4 }}
          onHoverChange={(_idx, datum) => {
            setHoveredDatum(datum);
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}
