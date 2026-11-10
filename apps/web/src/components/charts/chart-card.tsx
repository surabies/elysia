import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CHART_HEIGHT = 190;

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
      <div className="flex h-68 min-h-68 w-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-none">
        <header className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-heading-16 text-foreground">
            {title}
          </h2>
          {legendLabel && legendValue !== undefined && (
            <div className="flex shrink-0 flex-col items-end text-right">
              <div className="text-label-12 text-muted-foreground">
                {legendLabel}
              </div>
              <span className="mt-0.5 text-label-14-mono tabular-nums text-foreground">
                {legendValue}
              </span>
            </div>
          )}
        </header>

        <div className="relative mt-2 h-47.5 w-full">
          {children}
        </div>
      </div>
    </section>
  );
}
