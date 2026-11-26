import * as React from "react";
import { GitBranch, Globe, ArrowUpRight } from "lucide-react";
import { StatusDot } from "./status-dot";
import { cn } from "@/lib/utils";
import type { IProjectBannerContract } from "../contracts/component-contracts";

export interface ProjectBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    IProjectBannerContract {}

/**
 * Geist Project Banner
 * Project overview card showing active deployment state, git branch, commit, and link.
 * Reference: https://vercel.com/geist/project-banner
 */
export function ProjectBanner({
  name,
  url,
  gitBranch = "main",
  gitCommit,
  status = "ready",
  timeAgo,
  framework = "Next.js",
  className,
  ...props
}: ProjectBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/30 sm:flex-row sm:items-center shadow-2xs",
        className
      )}
      {...props}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <StatusDot state={status} />
          <h3 className="text-base font-semibold text-foreground tracking-tight">{name}</h3>
          {framework && (
            <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
              {framework}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {url && (
            <a
              href={`https://${url}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-foreground hover:underline"
            >
              <Globe className="size-3.5" />
              <span>{url}</span>
              <ArrowUpRight className="size-3" />
            </a>
          )}
          {gitBranch && (
            <div className="flex items-center gap-1 font-mono">
              <GitBranch className="size-3.5" />
              <span>{gitBranch}</span>
            </div>
          )}
          {gitCommit && (
            <span className="font-mono text-muted-foreground">({gitCommit})</span>
          )}
          {timeAgo && <span>• {timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
