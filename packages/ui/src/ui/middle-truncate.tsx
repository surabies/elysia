"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "@/lib/utils";

export interface MiddleTruncateProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  start?: number;
  end?: number;
  delimiter?: string;
  tooltip?: boolean;
}

/**
 * Vercel Geist Middle Truncate Component
 * Reference: https://vercel.com/geist/middle-truncate
 */
export function MiddleTruncate({
  text,
  start = 8,
  end = 8,
  delimiter = "…",
  tooltip = true,
  className,
  ...props
}: MiddleTruncateProps) {
  const truncated = React.useMemo(() => {
    if (!text || text.length <= start + end + 3) {
      return text;
    }
    return `${text.slice(0, start)}${delimiter}${text.slice(text.length - end)}`;
  }, [text, start, end, delimiter]);

  const content = (
    <span
      className={cn("font-mono tabular-nums text-xs", className)}
      {...props}
    >
      {truncated}
    </span>
  );

  if (!tooltip || text === truncated) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-border">
            {content}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-mono text-xs max-w-sm break-all">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
