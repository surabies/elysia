"use client";

import * as React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "@/lib/utils";

export interface RelativeTimeCardProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date | string | number;
}

/**
 * Vercel Geist Relative Time Card Component
 * Reference: https://vercel.com/geist/relative-time-card
 */
export function RelativeTimeCard({
  date,
  className,
  ...props
}: RelativeTimeCardProps) {
  const parsedDate = React.useMemo(() => new Date(date), [date]);

  const relativeText = React.useMemo(() => {
    try {
      return formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: id,
      });
    } catch {
      return String(date);
    }
  }, [parsedDate, date]);

  const absoluteText = React.useMemo(() => {
    try {
      return format(parsedDate, "EEEE, dd MMMM yyyy HH:mm:ss", { locale: id });
    } catch {
      return String(date);
    }
  }, [parsedDate, date]);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-block cursor-default text-xs text-muted-foreground border-b border-dotted border-border hover:text-foreground transition-colors",
              className
            )}
            {...props}
          >
            {relativeText}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-mono">
          {absoluteText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
