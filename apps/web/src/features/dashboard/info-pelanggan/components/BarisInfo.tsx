// BarisInfo dan DaftarInfo menampilkan label dan nilai tanpa card tambahan.
import type { ReactNode } from "react";
import { cn } from "@/lib/Utilitas";

export function DaftarInfo({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col">{children}</dl>;
}

export function BarisInfo({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-border/40 py-2.5 text-sm last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-foreground",
          mono && "font-mono text-[13px] tabular-nums"
        )}
      >
        {children}
      </dd>
    </div>
  );
}
