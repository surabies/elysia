import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowMoreProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  moreLabel?: string;
  lessLabel?: string;
  noBorder?: boolean;
}

/**
 * Vercel Geist Show More Component
 * Reference: https://vercel.com/geist/show-more
 */
export function ShowMore({
  expanded,
  onToggle,
  count,
  moreLabel = "Tampilkan lebih banyak",
  lessLabel = "Sembunyikan",
  noBorder = false,
  className,
  ...props
}: ShowMoreProps) {
  const label = expanded
    ? lessLabel
    : count !== undefined
    ? `${moreLabel} (${count})`
    : moreLabel;

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center py-2.5 select-none",
        className
      )}
    >
      {!noBorder && (
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative z-10 flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap",
          "shadow-xs transition-all hover:border-foreground/40 hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        {...props}
      >
        <span className="leading-none whitespace-nowrap">{label}</span>
        {expanded ? (
          <ChevronUp className="size-3.5 shrink-0" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0" />
        )}
      </button>
    </div>
  );
}
