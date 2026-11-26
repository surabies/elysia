// features/dashboard/import/components/shared/ImportStatCard.tsx
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  IMPORT_STAT_GRID_CLASS,
  TONE_STYLE,
  type ImportTone,
} from "../../lib/import-ui";

interface ImportStatGridProps {
  columns: keyof typeof IMPORT_STAT_GRID_CLASS;
  children: React.ReactNode;
}

export function ImportStatGrid({ columns, children }: ImportStatGridProps) {
  return <div className={IMPORT_STAT_GRID_CLASS[columns]}>{children}</div>;
}

interface ImportStatCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  caption: React.ReactNode;
  icon: LucideIcon;
  tone?: ImportTone;
  className?: string;
}

export function ImportStatCard({
  label,
  value,
  unit,
  caption,
  icon: Icon,
  tone = "neutral",
  className,
}: ImportStatCardProps) {
  const style = TONE_STYLE[tone];

  return (
    <Card
      className={cn("p-3.5 transition-colors", style.hoverBorder, className)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="truncate text-label-11 uppercase tracking-wide">
            {label}
          </span>
          <Icon className={cn("geist-icon shrink-0", style.icon)} aria-hidden />
        </div>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span
            className={cn("text-heading-24 font-mono tabular-nums", style.text)}
          >
            {value}
          </span>
          {unit && (
            <span className="text-label-11 text-muted-foreground">{unit}</span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
          <span
            className={cn(
              "inline-block size-1.5 shrink-0 rounded-full",
              style.dot,
            )}
            aria-hidden
          />
          <span className="truncate">{caption}</span>
        </div>
      </CardContent>
    </Card>
  );
}
