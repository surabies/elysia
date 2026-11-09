import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DistributionCardProps {
  title: string;
  summary?: ReactNode;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export function DistributionCard({
  title,
  summary,
  isEmpty,
  emptyMessage,
  children,
}: DistributionCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex h-full min-w-0 flex-col rounded-[10px] border border-border bg-card p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <h2
          id={titleId}
          className="min-w-0 text-sm font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
        {summary && (
          <div className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
            {summary}
          </div>
        )}
      </header>

      {isEmpty ? (
        <p className="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

export interface RankedBarRow {
  key: string;
  label: string;
  value: number;
  /** Persentase porsi (0-100). */
  share: number;
  badge?: string | null;
  formattedValue?: string;
}

interface RankedBarListProps {
  rows: readonly RankedBarRow[];
  headers: { label: string; value: string };
  ariaLabel: string;
  className?: string;
}

const GRID = "grid grid-cols-[minmax(0,1fr)_5.5rem_3.5rem]";

export function RankedBarList({
  rows,
  headers,
  ariaLabel,
  className,
}: RankedBarListProps) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className={cn("mt-3 flex flex-1 flex-col overflow-x-auto", className)}>
      <div className="flex min-w-[19rem] flex-1 flex-col">
        <div
          aria-hidden="true"
          className={cn(
            GRID,
            "border-b border-border px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
          )}
        >
          <span>{headers.label}</span>
          <span className="text-right">{headers.value}</span>
          <span className="text-right">Porsi</span>
        </div>

        <ol aria-label={ariaLabel} className="flex flex-1 flex-col">
          {rows.map((row) => (
            <li
              key={row.key}
              className={cn(
                GRID,
                "min-h-9 flex-1 border-b border-border/70 last:border-0",
              )}
            >
              <div className="relative flex min-w-0 items-center overflow-hidden px-2 py-1.5">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--ds-blue-500)_18%,var(--card))]"
                  style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
                />
                <span className="relative z-10 truncate text-xs font-medium text-foreground">
                  {row.label}
                </span>
                {row.badge && (
                  <span className="relative z-10 ml-1.5 shrink-0 text-[10px] text-muted-foreground">
                    {row.badge}
                  </span>
                )}
              </div>
              <span className="flex items-center justify-end px-2 py-1.5 font-mono text-xs tabular-nums text-foreground">
                {row.formattedValue ?? row.value.toLocaleString("id-ID")}
              </span>
              <span className="flex items-center justify-end px-2 py-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                {row.share}%
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
