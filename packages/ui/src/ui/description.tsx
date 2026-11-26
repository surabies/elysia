import * as React from "react";
import { cn } from "@/lib/utils";

export interface DescriptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  ellipsis?: boolean;
}

/**
 * Vercel Geist Description Component
 * Reference: https://vercel.com/geist/description
 */
export function Description({
  title,
  children,
  align = "left",
  ellipsis = false,
  className,
  ...props
}: DescriptionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5",
        align === "right" && "text-right items-end",
        className
      )}
      {...props}
    >
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none">
        {title}
      </dt>
      <dd
        className={cn(
          "text-xs font-medium text-foreground",
          ellipsis && "truncate"
        )}
      >
        {children}
      </dd>
    </div>
  );
}
