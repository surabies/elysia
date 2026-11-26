import * as React from "react";
import { cn } from "@/lib/utils";
import type { IPieGaugeContract } from "../contracts/component-contracts";

export interface PieGaugeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    IPieGaugeContract {}

/**
 * Geist PieGauge
 * Circular meter / donut gauge representing percentage or health.
 * Reference: https://vercel.com/geist/pie-gauge
 */
export function PieGauge({
  value,
  size = 64,
  label,
  sublabel,
  variant = "default",
  className,
  ...props
}: PieGaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  const colorVariants: Record<NonNullable<IPieGaugeContract["variant"]>, string> = {
    default: "stroke-foreground",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
    error: "stroke-red-500",
    info: "stroke-blue-500",
  };

  return (
    <div className={cn("inline-flex flex-col items-center justify-center text-center", className)} {...props}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          {/* Progress Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-500 ease-out", colorVariants[variant])}
          />
        </svg>

        <span className="absolute font-mono text-xs font-semibold text-foreground">
          {Math.round(clampedValue)}%
        </span>
      </div>

      {(label || sublabel) && (
        <div className="mt-1.5 space-y-0.5">
          {label && <p className="text-[11px] font-medium text-foreground">{label}</p>}
          {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
