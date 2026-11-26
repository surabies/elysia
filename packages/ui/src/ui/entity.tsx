import * as React from "react";
import { cn } from "@/lib/utils";

export interface EntityProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  status?: React.ReactNode;
  size?: "sm" | "md";
}

/**
 * Vercel Geist Entity Row Component
 * Reference: https://vercel.com/geist/entity
 */
export function Entity({
  icon,
  title,
  subtitle,
  meta,
  action,
  status,
  size = "md",
  className,
  ...props
}: EntityProps) {
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 text-left transition-colors",
        isSm ? "py-2 px-3 text-xs" : "py-3 px-4 text-sm",
        className
      )}
      {...props}
    >
      {/* Kolom Kiri: Icon + Title & Subtitle */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {icon && (
          <div className="flex shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">
              {title}
            </span>
            {status}
          </div>
          {(subtitle || meta) && (
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground truncate">
              {subtitle && <span>{subtitle}</span>}
              {subtitle && meta && <span>•</span>}
              {meta && <span>{meta}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Aksi & Kontrol */}
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

export function EntityList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border bg-card divide-y divide-border overflow-hidden shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
