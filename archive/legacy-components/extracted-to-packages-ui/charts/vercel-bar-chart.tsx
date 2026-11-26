"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                         DATA TYPES & UTILITIES                             */
/* -------------------------------------------------------------------------- */

export interface VercelBarPoint {
  key?: string | number;
  label: string;
  shortLabel?: string;
  value: number;
  formattedValue?: string;
}

export type VercelVisxPoint = VercelBarPoint;

export interface VercelBarChartProps {
  data: VercelBarPoint[];
  yFormatter?: (val: number) => string;
  barColor?: string;
  seriesName?: string;
  chartHeight?: number;
  className?: string;
}

export function truncateChartLabel(text: string, maxChars = 8): string {
  if (!text) return "";
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

export function calculateNiceMax(max: number): number {
  if (max <= 0) return 100;
  const rawStep = max / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceNormalized =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  const niceStep = niceNormalized * magnitude;
  return niceStep * 5;
}

export function defaultCompactNumberFormatter(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}Jt`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(value);
}

/* -------------------------------------------------------------------------- */
/*                   STANDARDIZED VERCEL VISX BAR CHART                       */
/* -------------------------------------------------------------------------- */

export function VercelBarChart({
  data,
  yFormatter = defaultCompactNumberFormatter,
  barColor = "var(--ds-blue-700)",
  seriesName = "Nilai",
  chartHeight = 180,
  className,
}: VercelBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState<number>(500);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const lastActiveColumnRef = useRef<any>(null);

  const yAxisWidth = 52;
  const chartTop = 14; // 14px headroom ensuring top Y tick label is never clipped
  const baseline = chartTop + chartHeight; // default 194px
  const totalSvgHeight = 227; // Vercel standard chart SVG height

  // Responsive width calculation tied strictly to window resize (preventing any internal hover feedback jitter)
  useEffect(() => {
    if (!containerRef.current) return;
    const calculateWidth = () => {
      if (containerRef.current) {
        const fullWidth = containerRef.current.clientWidth;
        setPlotWidth(Math.max(100, fullWidth - yAxisWidth));
      }
    };
    calculateWidth();

    window.addEventListener("resize", calculateWidth);
    return () => window.removeEventListener("resize", calculateWidth);
  }, [yAxisWidth]);

  // Compute maximum scale
  const rawMax = useMemo(() => {
    if (!data.length) return 100;
    return Math.max(...data.map((d) => d.value));
  }, [data]);

  const niceMax = useMemo(() => calculateNiceMax(rawMax), [rawMax]);

  // Exact 6 grid rows spaced evenly from chartTop down to baseline
  const yTicks = useMemo(() => {
    const stepHeight = chartHeight / 5;
    return [
      { y: chartTop, value: niceMax },
      { y: chartTop + stepHeight * 1, value: niceMax * 0.8 },
      { y: chartTop + stepHeight * 2, value: niceMax * 0.6 },
      { y: chartTop + stepHeight * 3, value: niceMax * 0.4 },
      { y: chartTop + stepHeight * 4, value: niceMax * 0.2 },
      { y: baseline, value: 0 },
    ];
  }, [baseline, chartHeight, chartTop, niceMax]);

  // Compute bar positions and tightly bounded hover overlay (comfortably enlarged with rounded corners)
  const columns = useMemo(() => {
    const count = data.length;
    if (count === 0) return [];
    const slotWidth = plotWidth / count;
    const barWidth = Math.max(8, Math.min(22, slotWidth * 0.55));
    const barXOffset = (slotWidth - barWidth) / 2;

    const maxPadding = Math.max(4, Math.floor((slotWidth - barWidth - 4) / 2));
    const hoverPadding = Math.min(8, maxPadding);
    const overlayWidth = barWidth + hoverPadding * 2;

    return data.map((item, idx) => {
      const slotX = idx * slotWidth;
      const barX = slotX + barXOffset;
      const overlayX = barX - hoverPadding;

      const barHeight = (item.value / (niceMax || 1)) * chartHeight;
      const barY = baseline - barHeight;

      return {
        item,
        index: idx,
        slotX,
        slotWidth,
        barX,
        barWidth,
        barHeight,
        barY,
        overlayX,
        overlayWidth,
      };
    });
  }, [baseline, chartHeight, data, niceMax, plotWidth]);

  // Sampled X-axis ticks (never overcrowded or colliding)
  const xTicks = useMemo(() => {
    const count = data.length;
    if (count === 0) return [];
    if (count <= 8) {
      return columns.map((col) => ({
        x: col.slotX + col.slotWidth / 2,
        label: col.item.shortLabel ?? truncateChartLabel(col.item.label, 8),
      }));
    }

    const desiredCount = 5;
    const step = (count - 1) / (desiredCount - 1);
    const ticks: Array<{ x: number; label: string }> = [];

    for (let i = 0; i < desiredCount; i++) {
      const idx = Math.min(count - 1, Math.round(i * step));
      const col = columns[idx];
      if (col) {
        ticks.push({
          x: col.slotX + col.slotWidth / 2,
          label: col.item.shortLabel ?? truncateChartLabel(col.item.label, 8),
        });
      }
    }
    return ticks;
  }, [columns, data.length]);

  const activeColumn = hoveredIndex !== null ? columns[hoveredIndex] : null;
  if (activeColumn) {
    lastActiveColumnRef.current = activeColumn;
  }
  const displayColumn = activeColumn || lastActiveColumnRef.current;

  // Tooltip geometry: mathematically bounded to prevent any clipping on left/right edges
  const tooltipWidth = 190;
  const targetCol = displayColumn;
  const barCenter = targetCol
    ? yAxisWidth + targetCol.barX + targetCol.barWidth / 2
    : 0;
  const minLeft = 8;
  const maxLeft = Math.max(minLeft, plotWidth + yAxisWidth - tooltipWidth - 8);
  const tooltipLeft = Math.max(minLeft, Math.min(maxLeft, barCenter - tooltipWidth / 2));
  const arrowCenter = barCenter - tooltipLeft;
  const arrowLeft = Math.max(14, Math.min(tooltipWidth - 14, arrowCenter));

  return (
    <figure
      className={cn("lFBDKW_figure relative w-full select-none overflow-visible", className)}
      style={{ visibility: "visible" }}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div
        ref={containerRef}
        className="lFBDKW_auto-visibility flex items-start w-full overflow-visible"
      >
        {/* SVG Left Y-Axis */}
        <svg
          height={totalSvgHeight}
          width={yAxisWidth}
          className="shrink-0 overflow-visible"
        >
          <g className="visx-group visx-axis visx-axis-left" transform="translate(8, 0)">
            {yTicks.map((tick, i) => (
              <g key={i} className="visx-group visx-axis-tick" transform="translate(0, 0)">
                <svg x="0" y="0" fontSize="13" style={{ overflow: "visible" }}>
                  <text
                    x="-8"
                    y={tick.y}
                    fill="var(--accents-5)"
                    fontSize="13"
                    dominantBaseline="middle"
                    textAnchor="start"
                    className="font-sans tabular-nums"
                  >
                    <tspan x="-8" dy="0em">
                      {yFormatter(tick.value)}
                    </tspan>
                  </text>
                </svg>
              </g>
            ))}
          </g>
        </svg>

        {/* SVG Main Chart Area */}
        <svg
          height={totalSvgHeight}
          width={plotWidth}
          className="overflow-visible"
        >
          {/* Bottom X-Axis */}
          <g
            className="visx-group visx-axis visx-axis-bottom"
            transform={`translate(0, ${baseline})`}
          >
            {xTicks.map((tick, i) => (
              <g key={i} className="visx-group visx-axis-tick" transform="translate(0, 0)">
                <svg x="0" y="0" fontSize="13" style={{ overflow: "visible" }}>
                  <text
                    x={tick.x}
                    y="22"
                    fill="var(--accents-5)"
                    fontSize="13"
                    textAnchor="middle"
                    className="font-sans"
                  >
                    <tspan x={tick.x} dy="0em">
                      {tick.label}
                    </tspan>
                  </text>
                </svg>
              </g>
            ))}
          </g>

          {/* Horizontal Grid Lines */}
          <g className="visx-group visx-rows" transform="translate(0, 0)">
            {yTicks.map((tick, i) => (
              <line
                key={i}
                className="visx-line"
                x1="0"
                y1={tick.y}
                x2={plotWidth}
                y2={tick.y}
                fill="transparent"
                shapeRendering="crispEdges"
                stroke="var(--accents-2)"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Modular Columns & Bars */}
          <g className="visx-group" transform="translate(0, 0)">
            {/* Invisible Slot Hit Areas for effortless cursor interaction */}
            {columns.map((col) => (
              <rect
                key={`hit-${col.index}`}
                className="cursor-pointer"
                height={chartHeight + 25}
                width={col.slotWidth}
                x={col.slotX}
                y={chartTop}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(col.index)}
              />
            ))}

            {/* Hover Highlight Overlay: slightly enlarged with rounded corners */}
            {columns.map((col) =>
              hoveredIndex === col.index ? (
                <rect
                  key={`overlay-${col.index}`}
                  className="lFBDKW_bar-overlay pointer-events-none transition-opacity duration-150"
                  height={chartHeight}
                  width={col.overlayWidth}
                  x={col.overlayX}
                  y={chartTop}
                  rx={3}
                  fill="var(--ds-gray-alpha-200)"
                />
              ) : null
            )}

            {/* Flat-Edge Solid Bars */}
            {columns.map((col) =>
              col.barHeight > 0 ? (
                <rect
                  key={`bar-${col.index}`}
                  className="lFBDKW_bar pointer-events-none transition-colors duration-150"
                  fill={barColor}
                  height={col.barHeight}
                  width={col.barWidth}
                  x={col.barX}
                  y={col.barY}
                />
              ) : null
            )}
          </g>
        </svg>
      </div>

      {/* Floating Vercel Tooltip Popover with silky smooth motion, zero borders, caret arrow, level with X axis text */}
      {displayColumn && (
        <div
          className={cn(
            "absolute z-30 pointer-events-none rounded-lg bg-[var(--ds-background-100)]/95 backdrop-blur-sm px-3 py-2 text-xs text-foreground w-[190px]",
            "shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.7)]",
            "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activeColumn
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-1"
          )}
          style={{
            left: tooltipLeft,
            top: baseline + 8,
          }}
        >
          {/* Caret pointing directly up to the active bar */}
          <div
            className="absolute -top-[5px] size-2.5 rotate-45 bg-[var(--ds-background-100)] transition-[left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ left: arrowLeft - 5 }}
          />
          <div className="font-semibold text-foreground truncate text-[12px] leading-tight mb-1">
            {displayColumn.item.label}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground truncate">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: barColor }}
              />
              <span className="text-[11px] truncate">{seriesName}</span>
            </span>
            <span className="font-mono tabular-nums text-[12px] font-semibold text-foreground shrink-0">
              {displayColumn.item.formattedValue ?? displayColumn.item.value.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}
    </figure>
  );
}

// Aliases for compatibility
export const VercelVisxBarChart = VercelBarChart;
