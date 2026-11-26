import * as React from "react";
import { cn } from "@/lib/utils";

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

/**
 * Geist Code Inline Primitive
 * Reference: https://vercel.com/geist/code
 */
export function Code({
  children,
  className,
  inline = true,
  ...props
}: CodeProps) {
  return (
    <code
      className={cn(
        "rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[13px] text-foreground transition-colors",
        inline ? "inline-block align-baseline" : "block p-3",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}
