"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "cn";

interface VercelObservabilityCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  href?: string;
  legendLabel?: string;
  legendValue?: string | number;
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
  className,
  children,
}: VercelObservabilityCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "relative size-full focus-visible:outline-none select-none",
        className
      )}
      tabIndex={-1}
    >
      <div className="relative size-full">
        {/* Card Vercel: Border konsisten tanpa hover border jumping */}
        <div className="relative w-full p-3 pb-2 rounded-[10px] h-[240px] min-h-[240px] border border-border bg-card shadow-xs">
          {/* Card Header (Title & Link) */}
          <div className="-mx-3 -mt-3 p-1 pb-0 pr-0">
            {href ? (
              <Link
                href={href}
                className="cursor-pointer focus-visible:outline-2 outline-offset-4 flex h-10 flex-row items-center px-[11.5px] pb-0.5 font-medium text-foreground justify-between gap-x-2 no-underline group"
              >
                <div className="flex flex-col gap-y-0 leading-4">
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
              <div className="flex h-10 flex-row items-center px-[11.5px] pb-0.5 font-medium text-foreground justify-between gap-x-2">
                <div className="flex flex-col gap-y-0 leading-4">
                  <span className="text-sm font-medium tracking-tight text-foreground">
                    {title}
                  </span>
                  {subtitle && (
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {subtitle}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chart area container (Tinggi baku 185px) */}
          <div className="-mt-0.5 h-[185px] relative">
            {/* Top Right In-Chart Legend (Vercel Style) */}
            {legendLabel && legendValue !== undefined && (
              <div className="absolute right-2 top-0 z-10 flex flex-col items-end min-w-[65px] px-1 pt-[3px] font-sans text-xs pointer-events-none">
                <span className="text-[11px] text-muted-foreground leading-none">
                  {legendLabel}
                </span>
                <span className="font-semibold text-foreground text-sm font-mono tabular-nums leading-none mt-1">
                  {legendValue}
                </span>
              </div>
            )}

            {/* Recharts Canvas */}
            <div className="w-full h-[185px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
