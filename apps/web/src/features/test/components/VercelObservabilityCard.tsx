"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "cn";

interface VercelObservabilityCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  href?: string;
  legendLabel?: React.ReactNode;
  legendValue?: string | number;
  headerActions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function VercelObservabilityCard({
  id,
  title,
  subtitle,
  href,
  legendLabel,
  legendValue,
  headerActions,
  className,
  children,
}: VercelObservabilityCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "relative size-full focus-visible:outline-none select-none",
        className,
      )}
      tabIndex={-1}
    >
      <div className="relative size-full">
        {/* Card Vercel: Border konsisten tanpa hover border jumping */}
        <div className="relative w-full p-3 pb-2 rounded-[10px] h-60 min-h-60 border border-border bg-card shadow-xs">
          {/* Card Header (Title & Link) */}
          <div className="-mx-3 -mt-3 p-1 pb-0 pr-0">
            <div className="flex h-10 items-center justify-between gap-2 px-[11.5px] pb-0.5">
              {href ? (
                <Link
                  href={href}
                  className="group flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-x-2 no-underline focus-visible:outline-2 outline-offset-4"
                >
                  <div className="flex min-w-0 flex-col gap-y-0 leading-4">
                    <span className="text-sm font-medium tracking-tight text-foreground group-hover:underline">
                      {title}
                    </span>
                    {subtitle && (
                      <span className="text-[11px] text-muted-foreground font-normal">
                        {subtitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-x-2">
                    <div className="rounded-sm p-1 transition-colors duration-100 group-hover:bg-muted">
                      <svg
                        viewBox="0 0 16 16"
                        height="16"
                        width="16"
                        className="text-muted-foreground group-hover:text-foreground"
                      >
                        <path
                          fill="currentColor"
                          fillRule="evenodd"
                          d="m6.75 3.94.53.53 2.82 2.82a1 1 0 0 1 0 1.42l-2.82 2.82-.53.53L5.69 11l.53-.53L8.69 8 6.22 5.53 5.69 5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col gap-y-0 leading-4">
                  <span className="text-sm font-medium tracking-tight text-foreground">
                    {title}
                  </span>
                  {subtitle && (
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {subtitle}
                    </span>
                  )}
                </div>
              )}
              {headerActions && <div className="shrink-0">{headerActions}</div>}
            </div>
          </div>

          {/* Chart area container (Tinggi baku 185px) */}
          <div className="-mt-0.5 h-46.25 relative">
            {/* Top Right In-Chart Legend (Vercel Style) */}
            {legendLabel && legendValue !== undefined && (
              <div className="absolute right-2 top-0 z-10 flex flex-col items-end min-w-16.25 px-1 pt-0.75 font-sans text-xs pointer-events-auto">
                <span className="text-[11px] text-muted-foreground leading-none">
                  {legendLabel}
                </span>
                <span className="font-semibold text-foreground text-sm font-mono tabular-nums leading-none mt-1">
                  {legendValue}
                </span>
              </div>
            )}

            {/* Recharts Canvas */}
            <div className="w-full h-46.25">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
