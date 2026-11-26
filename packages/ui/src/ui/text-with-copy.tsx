import * as React from "react";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";
import type { ITextWithCopyContract } from "../contracts/component-contracts";

export interface TextWithCopyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ITextWithCopyContract {}

/**
 * Geist Text With Copy Button
 * Clean text label combined with 1-click copy feedback.
 * Reference: https://vercel.com/geist/text-with-copy-button
 */
export function TextWithCopy({
  text,
  label,
  truncate = false,
  copyTooltip = "Salin",
  className,
  ...props
}: TextWithCopyProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-xs",
        className
      )}
      {...props}
    >
      {label && <span className="font-medium text-muted-foreground">{label}:</span>}
      <span
        className={cn(
          "font-mono text-foreground select-all",
          truncate && "max-w-[200px] truncate"
        )}
      >
        {text}
      </span>
      <CopyButton value={text} className="size-5" />
    </div>
  );
}
