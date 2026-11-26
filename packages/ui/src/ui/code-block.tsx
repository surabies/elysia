import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import type { ICodeBlockContract } from "../contracts/component-contracts";

export interface CodeBlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ICodeBlockContract {}

/**
 * Geist CodeBlock with Header, Filename, Syntax Highlighting frame and Copy Action
 * Reference: https://vercel.com/geist/code-block
 */
export function CodeBlock({
  code,
  language = "typescript",
  filename,
  copyable = true,
  lineNumbers = true,
  className,
  ...props
}: CodeBlockProps) {
  const lines = code.trim().split("\n");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-zinc-950 text-zinc-100 dark:bg-zinc-900/90 shadow-2xs font-mono text-xs",
        className
      )}
      {...props}
    >
      {(filename || copyable || language) && (
        <div className="flex h-9 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-3.5 text-zinc-400">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="font-medium text-zinc-200">{filename}</span>
            )}
            {!filename && language && (
              <span className="text-[11px] uppercase tracking-wider text-zinc-400">
                {language}
              </span>
            )}
          </div>
          {copyable && <CopyButton value={code} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" />}
        </div>
      )}

      <div className="overflow-x-auto p-3.5">
        <pre className="flex leading-relaxed">
          {lineNumbers && (
            <div className="mr-4 select-none text-right text-zinc-600">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <code className="flex-1 font-mono">{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
}
