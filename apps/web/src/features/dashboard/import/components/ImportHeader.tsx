// features/dashboard/import/components/ImportHeader.tsx
"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImportHeaderProps {
  title: string;
  badge: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}

export function ImportHeader({
  title,
  badge,
  description,
  icon: Icon,
  actions,
}: ImportHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
          <Icon className="geist-icon" aria-hidden />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading-24 text-foreground">{title}</h1>
            <Badge variant="pill" className="uppercase">
              {badge}
            </Badge>
          </div>
          <p className="text-copy-14 text-muted-foreground">{description}</p>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
