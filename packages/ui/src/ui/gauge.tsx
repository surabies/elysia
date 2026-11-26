import * as React from "react";
import { cn } from "@/lib/utils";

export interface GaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "error" | "info";
  showValue?: boolean;
  valueSuffix?: string;
  label?: string;
}

/**
 * Vercel Geist Gauge Component
 * Reference: https://vercel.com/geist/gauge
 */
export function Gauge({
  value,
  size = 64,
  strokeWidth = 6,
  variant = "default",
  showValue = true,
  valueSuffix = "%",
  label,
  className,
  ...props
}: GaugeProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  const strokeColor = {
    default: "stroke-foreground",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
    error: "stroke-red-500",
    info: "stroke-blue-500",
  }[variant];

  return (
    <div
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative inline-flex flex-col items-center justify-center select-none",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] transition-all duration-300"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted/40"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(strokeColor, "transition-all duration-500 ease-out")}
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <span className="font-mono text-xs font-semibold text-foreground">
              {Math.round(safeValue)}
              <span className="text-[10px] text-muted-foreground">{valueSuffix}</span>
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
