import type { ReactNode } from "react";

export function TooltipPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1 rounded-md border border-border bg-popover/95 p-2 text-xs text-popover-foreground shadow-md backdrop-blur-sm">
      <p className="border-b border-border/60 pb-1 font-semibold text-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}
