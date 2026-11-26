import * as React from "react";
import { SearchInput } from "./search-input";
import { cn } from "@/lib/utils";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Vercel Geist Standard Page & Data Toolbar
 */
export function Toolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Filter atau cari data...",
  filterSlot,
  actionSlot,
  children,
  className,
  ...props
}: ToolbarProps) {
  const showSearch = onSearchChange !== undefined;

  return (
    <div
      data-slot="toolbar"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 py-2",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-56">
        {showSearch && (
          <div className="w-full sm:w-64 md:w-72">
            <SearchInput
              size="sm"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        {filterSlot}
        {children}
      </div>

      {actionSlot && (
        <div className="flex items-center gap-2 shrink-0">{actionSlot}</div>
      )}
    </div>
  );
}
