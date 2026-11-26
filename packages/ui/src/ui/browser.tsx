import * as React from "react";
import { cn } from "@/lib/utils";
import type { IBrowserContract } from "../contracts/component-contracts";

export interface BrowserProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    IBrowserContract {}

/**
 * Geist Browser Window Mockup Frame
 * Reference: https://vercel.com/geist/browser
 */
export function Browser({
  url = "https://vercel.com",
  title,
  addressBar = true,
  children,
  className,
  ...props
}: BrowserProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {/* Browser Bar */}
      <div className="flex h-10 items-center gap-2 border-b border-border bg-muted/40 px-3.5">
        {/* Traffic Light Dots */}
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400 dark:bg-red-500/80 inline-block" />
          <span className="size-2.5 rounded-full bg-amber-400 dark:bg-amber-500/80 inline-block" />
          <span className="size-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500/80 inline-block" />
        </div>

        {/* Address Bar */}
        {addressBar && (
          <div className="mx-auto flex h-6 max-w-sm flex-1 items-center justify-center rounded-md border border-border/80 bg-background/80 px-2.5 text-[11px] text-muted-foreground shadow-2xs font-mono">
            <span className="truncate">{url}</span>
          </div>
        )}

        {/* Optional Title */}
        {title && !addressBar && (
          <div className="mx-auto text-xs font-medium text-muted-foreground truncate">
            {title}
          </div>
        )}
      </div>

      {/* Browser Content */}
      <div className="relative flex-1 overflow-auto bg-background p-4">
        {children}
      </div>
    </div>
  );
}
