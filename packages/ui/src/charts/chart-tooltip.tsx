import type { ReactNode } from "react";

export function TooltipPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="material-menu min-w-44 space-y-1.5 rounded-lg px-3 py-2 text-popover-foreground">
      <p className="border-b border-border pb-1 text-label-12 text-foreground">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
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
    <div className="flex items-center justify-between gap-4 text-label-12">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{label}</span>
      </span>
      <span className="text-label-12-mono tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
