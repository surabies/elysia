import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusDotState =
  | "ready"
  | "building"
  | "queued"
  | "error"
  | "canceled"
  | "deleted";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: StatusDotState;
  label?: string;
  size?: "sm" | "md";
  showPulse?: boolean;
  titlePrefix?: string;
}

const STATE_CONFIG: Record<
  StatusDotState,
  { bg: string; pulse?: boolean; defaultLabel: string }
> = {
  ready: {
    bg: "bg-emerald-500",
    defaultLabel: "Ready",
  },
  building: {
    bg: "bg-amber-500",
    pulse: true,
    defaultLabel: "Building",
  },
  queued: {
    bg: "bg-blue-500",
    pulse: true,
    defaultLabel: "Queued",
  },
  error: {
    bg: "bg-red-500",
    defaultLabel: "Error",
  },
  canceled: {
    bg: "bg-zinc-400 dark:bg-zinc-600",
    defaultLabel: "Canceled",
  },
  deleted: {
    bg: "bg-zinc-400 dark:bg-zinc-600",
    defaultLabel: "Deleted",
  },
};

/**
 * Vercel Geist Status Dot Component
 * Reference: https://vercel.com/geist/status-dot
 */
export function StatusDot({
  state,
  label,
  size = "md",
  showPulse,
  titlePrefix,
  className,
  ...props
}: StatusDotProps) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.ready;
  const isPulsing = showPulse ?? cfg.pulse;
  const displayLabel = label ?? cfg.defaultLabel;
  const computedAria = titlePrefix
    ? `${titlePrefix}: ${displayLabel}`
    : displayLabel;

  const dotSize = size === "sm" ? "size-2" : "size-2.5";

  return (
    <span
      role="status"
      aria-label={computedAria}
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium text-foreground select-none",
        className
      )}
      {...props}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        {isPulsing && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              cfg.bg
            )}
          />
        )}
        <span className={cn("inline-block rounded-full", dotSize, cfg.bg)} />
      </span>
      {label !== undefined && (
        <span className="text-muted-foreground">{displayLabel}</span>
      )}
    </span>
  );
}
