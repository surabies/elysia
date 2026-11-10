import { MetricCard } from "@/features/dashboard/overview";
import type { MetricCardData } from "@/features/dashboard/overview";

interface KpiGridProps {
  items: readonly MetricCardData[];
}

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <ul
      aria-label="Indikator utama analitik"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <MetricCard data={item} />
        </li>
      ))}
    </ul>
  );
}
