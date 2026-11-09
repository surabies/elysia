import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/reui/icon-tile";
import type { Kpi } from "../lib/kpi";

function KpiCard({ label, icon: Icon, value, unit, note }: Kpi) {
  return (
    <Card className="min-w-0 rounded-[10px] border-border/80 p-3 sm:p-4">
      <dl>
        <div className="flex items-center justify-between pb-1">
          <dt className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px] sm:tracking-wider">
            {label}
          </dt>
          <IconTile
            aria-hidden="true"
            size="sm"
            variant="frame"
            className="text-muted-foreground"
          >
            <Icon />
          </IconTile>
        </div>
        <dd className="whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {value}
          <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        </dd>
        <dd className="mt-1 text-[11px] text-muted-foreground">{note}</dd>
      </dl>
    </Card>
  );
}

export function KpiGrid({ items }: { items: readonly Kpi[] }) {
  return (
    <ul
      aria-label="Indikator utama"
      className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4"
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <KpiCard {...item} />
        </li>
      ))}
    </ul>
  );
}
