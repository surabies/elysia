import { Card } from "@/components/ui/card";
import type { Kpi } from "../lib/kpi";

function KpiCard({ label, icon: Icon, value, unit, note }: Kpi) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <dl>
        <div className="flex items-center justify-between gap-2 pb-2">
          <dt className="min-w-0 truncate text-label-13 text-muted-foreground">
            {label}
          </dt>
          <Icon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </div>
        <dd className="whitespace-nowrap text-heading-24 tabular-nums text-foreground">
          {value}
          <span className="ml-1.5 text-copy-13 font-normal text-muted-foreground">
            {unit}
          </span>
        </dd>
        <dd className="mt-1 text-copy-12 text-muted-foreground">{note}</dd>
      </dl>
    </Card>
  );
}

export function KpiGrid({ items }: { items: readonly Kpi[] }) {
  return (
    <ul
      aria-label="Indikator utama"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <KpiCard {...item} />
        </li>
      ))}
    </ul>
  );
}
