// features/dashboard/import/components/ImportHeader.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

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
    <div className="flex flex-col gap-4 border-b border-border/40 pb-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            <Badge variant="outline" className="border-border/60 font-mono text-[10px] uppercase">
              {badge}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 self-start md:self-auto">{actions}</div>}
    </div>
  );
}
