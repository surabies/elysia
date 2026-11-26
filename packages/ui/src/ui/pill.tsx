import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEIST_STATUS_TONES } from "../contracts/tokens";
import type { IPillContract } from "../contracts/component-contracts";

export interface PillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "prefix">,
    IPillContract {}

/**
 * Geist Pill
 * Compact rounded pill badge with optional dismissible action and semantic tones.
 * Reference: https://vercel.com/geist/pill
 */
export function Pill({
  label,
  tone = "neutral",
  onRemove,
  prefix,
  className,
  ...props
}: PillProps) {
  const toneStyle = GEIST_STATUS_TONES[tone]?.badgeSubtle || GEIST_STATUS_TONES.neutral.badgeSubtle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        toneStyle,
        className
      )}
      {...props}
    >
      {prefix && <span className="shrink-0">{prefix}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Hapus pill"
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  );
}
