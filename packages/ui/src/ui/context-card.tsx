import * as React from "react";
import { cn } from "@/lib/utils";
import type { IContextCardContract } from "../contracts/component-contracts";

export interface ContextCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    IContextCardContract {}

/**
 * Geist Context Card
 * Displays contextual information with title, metadata, author avatar, badges, and actions.
 * Reference: https://vercel.com/geist/context-card
 */
export function ContextCard({
  title,
  subtitle,
  description,
  meta,
  badge,
  avatar,
  action,
  href,
  className,
  ...props
}: ContextCardProps) {
  const CardContent = (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/40",
        href && "cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {avatar && <div className="shrink-0">{avatar}</div>}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground group-hover:underline">
                  {title}
                </span>
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {meta && (
        <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          {meta}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block no-underline">
        {CardContent}
      </a>
    );
  }

  return CardContent;
}
