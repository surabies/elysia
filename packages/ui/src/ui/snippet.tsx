"use client";

import * as React from "react";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

export interface SnippetProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  prompt?: boolean;
  inverted?: boolean;
}

/**
 * Vercel Geist Snippet Component
 * Reference: https://vercel.com/geist/snippet
 */
export function Snippet({
  text,
  prompt = true,
  inverted = false,
  className,
  ...props
}: SnippetProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-between gap-3 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors",
        inverted
          ? "border-zinc-800 bg-zinc-950 text-zinc-100"
          : "border-border bg-muted/40 text-foreground",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {prompt && (
          <span className="text-muted-foreground select-none font-semibold">
            $
          </span>
        )}
        <code className="select-all font-mono whitespace-nowrap">{text}</code>
      </div>

      <CopyButton
        value={text}
        variant="ghost"
        size="icon-xs"
        className="size-6 shrink-0 opacity-70 hover:opacity-100"
      />
    </div>
  );
}
