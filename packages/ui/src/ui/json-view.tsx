import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import type { IJsonViewContract } from "../contracts/component-contracts";

export interface JsonViewProps
  extends React.HTMLAttributes<HTMLDivElement>,
    IJsonViewContract {}

/**
 * Geist JsonView
 * Interactive and syntax-highlighted JSON viewer.
 * Reference: https://vercel.com/geist/json-view
 */
export function JsonView({
  data,
  collapsed = false,
  maxDepth = 3,
  className,
  ...props
}: JsonViewProps) {
  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-muted/20 p-3.5 font-mono text-xs shadow-2xs",
        className
      )}
      {...props}
    >
      <div className="absolute top-2.5 right-2.5 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <CopyButton value={jsonString} />
      </div>

      <pre className="overflow-x-auto text-foreground/90 leading-relaxed">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
