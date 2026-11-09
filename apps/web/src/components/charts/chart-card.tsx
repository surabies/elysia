import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CHART_HEIGHT = 185;

interface ChartCardProps {
  title: string;
  legendLabel?: ReactNode;
  legendValue?: string | number;
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  legendLabel,
  legendValue,
  className,
  children,
}: ChartCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("size-full select-none", className)}
    >
      <div className="h-60 min-h-60 w-full rounded-[10px] border border-border bg-card p-3 pb-2 shadow-xs">
        <header className="-mx-2 -mt-2 flex h-10 items-center px-[11.5px] pb-0.5">
          <h2
            id={titleId}
            className="text-sm font-medium tracking-tight text-foreground"
          >
            {title}
          </h2>
        </header>

        <div className="relative -mt-0.5 h-46.25">
          {legendLabel && legendValue !== undefined && (
            <div className="absolute right-2 top-0 z-10 flex min-w-16.25 flex-col items-end px-1 pt-0.75 text-xs">
              <span className="text-[11px] leading-none text-muted-foreground">
                {legendLabel}
              </span>
              <span className="mt-1 font-mono text-sm font-semibold leading-none tabular-nums text-foreground">
                {legendValue}
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
