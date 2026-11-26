import * as React from "react";
import { Plus, X, RotateCcw } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import type { IFilterChipItem } from "../contracts/component-contracts";

export interface FilterBarProps {
  filters: IFilterChipItem[];
  onClearAll?: () => void;
  triggerSlot?: React.ReactNode;
  className?: string;
}

/**
 * Vercel Geist Filter Bar / Filter Params
 * Reference: https://vercel.com/geist/filter-params
 */
export function FilterBar({
  filters,
  onClearAll,
  triggerSlot,
  className,
}: FilterBarProps) {
  const hasFilters = filters.length > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-1 text-xs select-none",
        className
      )}
    >
      {triggerSlot ?? (
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-xs">
          <Plus className="size-3" />
          <span>Add Filter</span>
        </Button>
      )}

      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="gray-subtle"
          size="sm"
          className="h-7 gap-1.5 pl-2.5 pr-1 font-normal text-xs"
        >
          <span className="font-semibold text-foreground/80">
            {filter.keyLabel}:
          </span>
          <span className="text-foreground">{filter.valueLabel}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            aria-label={`Remove filter ${filter.keyLabel}`}
            className="flex items-center justify-center rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {hasFilters && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}
