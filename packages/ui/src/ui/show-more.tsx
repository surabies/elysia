import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowMoreProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
        "relative flex w-full items-center justify-center py-2 select-none",
        className
      )}
    >
      {!noBorder && (
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative z-10 flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground",
          "shadow-xs transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        {...props}
      >
        <span>{label}</span>
        {expanded ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>
    </div>
  );
}
