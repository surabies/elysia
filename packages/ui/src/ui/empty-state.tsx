import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  dashed?: boolean;
}

/**
 * Vercel Geist Empty State Component
 * Reference: https://vercel.com/geist/empty-state
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  dashed = true,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label="Empty state"
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-lg p-8 text-center select-none",
        dashed
          ? "border border-dashed border-border/80 bg-muted/10 dark:bg-muted/5"
          : "border border-border bg-card",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-xs">
          {icon}
        </div>
      )}

      <h3 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
