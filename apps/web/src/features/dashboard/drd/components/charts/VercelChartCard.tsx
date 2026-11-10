"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                   VERCEL GEIST ICONS & VISUAL PRIMITIVES                   */
/* -------------------------------------------------------------------------- */

export function GeistDotIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      height={16}
      width={16}
      data-slot="geist-icon"
      data-glyph="circular"
      style={{ color }}
      className="shrink-0"
    >
      <path fill="currentColor" d="M13 8A5 5 0 1 1 3 8a5 5 0 0 1 10 0" />
    </svg>
  );
}

export function GeistProgressCircle({
  percent,
  size = 20,
  color = "var(--ds-blue-700)",
  trackColor = "var(--ds-gray-alpha-400)",
}: {
  percent: number;
  size?: number;
  color?: string;
  trackColor?: string;
}) {
  const boundedPercent = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  const circumference = 267.0353755551324;
  const strokeDash = (boundedPercent / 100) * circumference;

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={boundedPercent}
      className="relative flex flex-col justify-center items-center [&_svg]:overflow-visible transform-gpu shrink-0"
      data-geist-progress-circle=""
      data-version="v1"
      role="progressbar"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        width={size}
        strokeWidth="2"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="42.5"
          strokeWidth="15"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={trackColor}
          strokeDasharray={`${circumference} ${circumference}`}
        />
        <circle
          cx="50"
          cy="50"
          r="42.5"
          strokeWidth="15"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={color}
          strokeDasharray={`${strokeDash} ${circumference}`}
          transform="rotate(-90 50 50)"
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                      VERCEL CHART CARD ARCHITECTURE                        */
/* -------------------------------------------------------------------------- */

export interface VercelBreakdownRow {
  color: string;
  label: string;
  value: string;
  share?: string;
}

export interface VercelChartCardProps {
  title: string;
  description?: string;
  meter?: {
    current: string;
    total?: string;
    percent: number;
    color?: string;
  };
  tabs?: Array<{
    value: string;
    label: string;
  }>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  updatedText?: string;
  breakdownRows?: VercelBreakdownRow[];
  collapsibleBreakdown?: boolean;
  previewRowsCount?: number;
  defaultExpanded?: boolean;
  children?: ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function VercelChartCard({
  title,
  description,
  meter,
  tabs,
  activeTab,
  onTabChange,
  updatedText = "Diperbarui periode aktif",
  breakdownRows,
  collapsibleBreakdown = true,
  previewRowsCount = 2,
  defaultExpanded = false,
  children,
  className,
  isEmpty = false,
  emptyMessage = "Belum ada data pada periode ini.",
}: VercelChartCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const radioGroupName = useId();
  // Only display tabs when the data genuinely supports 2 or more options
  const hasTabs = Boolean(tabs && tabs.length > 1);

  const totalRows = breakdownRows?.length ?? 0;
  const shouldCollapse = collapsibleBreakdown && totalRows > previewRowsCount;
  const initialRows = shouldCollapse
    ? breakdownRows!.slice(0, previewRowsCount)
    : breakdownRows ?? [];
  const extraRows = shouldCollapse
    ? breakdownRows!.slice(previewRowsCount)
    : [];
  const hiddenCount = totalRows - previewRowsCount;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
        {/* Card Header Container */}
        <div className="flex flex-col p-5 sm:p-6 pb-3 min-h-[96px]">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-heading-16 font-semibold tracking-tight text-[var(--ds-gray-1000)]">
                {title}
              </h3>
              {description && (
                <p className="text-copy-14 text-muted-foreground leading-normal line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Meter Progress Info Row */}
            {meter && (
              <div className="flex items-center gap-2 pt-0.5">
                <GeistProgressCircle
                  percent={meter.percent}
                  color={meter.color || "var(--ds-blue-700)"}
                />
                <p className="text-copy-14 text-[var(--ds-gray-1000)] font-medium tabular-nums meter-values-container">
                  {meter.current}
                  {meter.total && (
                    <>
                      <span className="text-muted-foreground font-normal mx-1">/</span>
                      <span className="text-muted-foreground font-normal">{meter.total}</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card Body Container */}
        <div className="flex flex-col flex-1 p-5 sm:p-6 pt-2">
          {/* Controls Bar: unified min-height so charts start at the exact same Y position */}
          {(hasTabs || updatedText) && (
            <div className="flex flex-row items-center justify-between gap-3 mb-4 min-h-[36px]">
              <div className="flex items-center">
                {hasTabs && (
                  <div className="flex bg-[var(--ds-background-100)] p-1 rounded-[6px] [box-shadow:0_0_0_1px_var(--ds-gray-alpha-400)] h-9 items-center">
                    {tabs!.map((tab) => {
                      const isChecked = tab.value === activeTab;
                      return (
                        <label key={tab.value} className="flex self-stretch">
                          <input
                            className="sr-only peer"
                            type="radio"
                            name={radioGroupName}
                            value={tab.value}
                            checked={isChecked}
                            onChange={() => onTabChange?.(tab.value)}
                          />
                          <div
                            className={cn(
                              "flex items-center justify-center transition-colors duration-150 cursor-pointer font-medium text-[13px] px-3 h-7 no-underline select-none",
                              isChecked
                                ? "text-[var(--ds-gray-1000)] bg-[var(--ds-gray-100)] dark:bg-[var(--ds-gray-300)] rounded-[4px]"
                                : "text-muted-foreground hover:text-[var(--ds-gray-1000)] rounded-[2px]"
                            )}
                          >
                            {tab.label}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {updatedText && (
                <p className="text-xs text-muted-foreground ml-auto">
                  {updatedText}
                </p>
              )}
            </div>
          )}

          {/* Visual Chart Area */}
          <div className="w-full overflow-visible">
            {isEmpty ? (
              <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              children
            )}
          </div>

          {/* Bottom Breakdown Table (_0dxEa_container) - pinned to bottom via mt-auto */}
          {breakdownRows && breakdownRows.length > 0 && (
            <div className="flex flex-col items-stretch justify-start gap-1 flex-initial pt-4 border-t border-border/40 mt-auto relative">
              {/* Primary / Preview Rows */}
              <div className="grid grid-cols-[1fr_auto_auto]">
                {initialRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="col-span-full grid grid-cols-subgrid items-center odd:bg-[var(--ds-background-200)] px-2 py-1.5 rounded-xs"
                  >
                    <span className="flex flex-row items-center gap-2.5 font-medium text-foreground text-xs truncate">
                      <span className="flex shrink-0" style={{ color: row.color }}>
                        <GeistDotIcon color={row.color} />
                      </span>
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span className="p-1 tabular-nums text-foreground pr-8 text-right text-xs">
                      {row.value}
                    </span>
                    <span className="p-1 tabular-nums text-muted-foreground pr-2 text-right text-xs">
                      {row.share ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Collapsible Extra Rows with Smooth CSS Grid Height Transition */}
              {shouldCollapse && (
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 grid grid-cols-[1fr_auto_auto]">
                    {extraRows.map((row, idx) => {
                      const realIdx = idx + previewRowsCount;
                      return (
                        <div
                          key={realIdx}
                          className="col-span-full grid grid-cols-subgrid items-center odd:bg-[var(--ds-background-200)] px-2 py-1.5 rounded-xs"
                        >
                          <span className="flex flex-row items-center gap-2.5 font-medium text-foreground text-xs truncate">
                            <span className="flex shrink-0" style={{ color: row.color }}>
                              <GeistDotIcon color={row.color} />
                            </span>
                            <span className="truncate">{row.label}</span>
                          </span>
                          <span className="p-1 tabular-nums text-foreground pr-8 text-right text-xs">
                            {row.value}
                          </span>
                          <span className="p-1 tabular-nums text-muted-foreground pr-2 text-right text-xs">
                            {row.share ?? "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Floating Action Trigger at Bottom Center */}
              {shouldCollapse && (
                <div className="flex justify-center pt-2 -mb-1">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    title={isExpanded ? "Ciutkan rincian" : `Tampilkan ${hiddenCount} rincian lainnya`}
                    aria-expanded={isExpanded}
                    className={cn(
                      "group/trigger inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card",
                      "text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30",
                      "shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer select-none",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                  >
                    <span>
                      {isExpanded ? "Ciutkan" : `+${hiddenCount} rincian`}
                    </span>
                    <ChevronDown
                      size={12}
                      className={cn(
                        "size-3 transition-transform duration-200 ease-in-out text-muted-foreground group-hover/trigger:text-foreground",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
