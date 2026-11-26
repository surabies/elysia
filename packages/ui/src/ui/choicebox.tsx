import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChoiceboxItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  type?: "radio" | "checkbox";
}

/**
 * Vercel Geist Choicebox Item
 * Reference: https://vercel.com/geist/choicebox
 */
export function ChoiceboxItem({
  title,
  description,
  badge,
  icon,
  selected = false,
  disabled = false,
  onSelect,
  type = "radio",
  className,
  ...props
}: ChoiceboxItemProps) {
  return (
    <div
      role={type}
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled && onSelect) onSelect();
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-all select-none outline-none",
        "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
        selected
          ? "border-foreground bg-accent/30 dark:bg-accent/20"
          : "border-border bg-card hover:border-foreground/40 hover:bg-muted/30",
        disabled && "opacity-50 pointer-events-none cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Indicator Checkbox/Radio */}
      <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border">
        {selected && (
          <span
            className={cn(
              "bg-foreground",
              type === "radio" ? "size-2 rounded-full" : "size-2 rounded-xs"
            )}
          />
        )}
      </div>

      {icon && <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-foreground leading-tight">
            {title}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export interface ChoiceboxGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChoiceboxGroup({
  children,
  className,
  ...props
}: ChoiceboxGroupProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-2.5 sm:grid-cols-2", className)} {...props}>
      {children}
    </div>
  );
}
