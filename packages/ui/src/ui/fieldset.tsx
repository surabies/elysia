import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldsetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  footerActions?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Vercel Geist Fieldset Component
 * Reference: https://vercel.com/geist/fieldset
 */
export function Fieldset({
  title,
  description,
  footer,
  footerActions,
  children,
  disabled = false,
  className,
  ...props
}: FieldsetProps) {
  const hasHeader = Boolean(title || description);
  const hasFooter = Boolean(footer || footerActions);

  return (
    <div
      role="group"
      aria-disabled={disabled}
      className={cn(
        "w-full rounded-lg border border-border bg-card text-card-foreground shadow-xs overflow-hidden transition-colors",
        disabled && "opacity-50 pointer-events-none select-none",
        className
      )}
      {...props}
    >
      {/* Header */}
      {hasHeader && (
        <div className="border-b border-border/80 px-5 py-4">
          {title && (
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">{children}</div>

      {/* Footer */}
      {hasFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          <div className="flex-1 min-w-0">{footer}</div>
          {footerActions && <div className="shrink-0">{footerActions}</div>}
        </div>
      )}
    </div>
  );
}
