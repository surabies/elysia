import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "../../lib/format";
import {
  RISK_METRICS,
  RISK_METRIC_KEYS,
  type MappedServiceAreaRisk,
  type RiskMetric,
  type RiskMetricKey,
  type RiskSummary,
} from "../../lib/risk";

interface RiskSummaryPanelProps {
  className?: string;
  metricKey: RiskMetricKey;
  onMetricChange: (key: RiskMetricKey) => void;
  metric: RiskMetric;
  summary: RiskSummary;
  topAreas: readonly MappedServiceAreaRisk[];
  totalAreas: number;
}

function StatTile({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: ReactNode;
  note: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-(--ds-gray-100) px-3.5 py-3",
        className,
      )}
    >
      <p className="text-label-12 text-muted-foreground">{label}</p>
      <p className="mt-1 text-heading-20 tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-copy-12 text-muted-foreground">{note}</p>
    </div>
  );
}

export function RiskSummaryPanel({
  className,
  metricKey,
  onMetricChange,
  metric,
  summary,
  topAreas,
  totalAreas,
}: RiskSummaryPanelProps) {
  return (
    <aside
      aria-labelledby="risk-summary-title"
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card p-5",
        className,
      )}
    >
      <h2 id="risk-summary-title" className="text-heading-16 text-foreground">
        Ringkasan Risiko Pembacaan
      </h2>

      <Tabs
        value={metricKey}
        onValueChange={(value) => onMetricChange(value as RiskMetricKey)}
        className="mt-3 gap-3"
      >
        <TabsList className="grid w-full grid-cols-3">
          {RISK_METRIC_KEYS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="truncate px-2 text-label-12"
            >
              {RISK_METRICS[key].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          label="Catatan Indikator"
          value={formatNumber(summary.flagged)}
          note={`${summary.rate.toFixed(1)}% dari ${formatNumber(summary.readings)} bacaan`}
        />
        <StatTile
          label="Kelurahan Terdampak"
          value={
            <>
              {formatNumber(summary.areasWithFlags)}
              <span className="ml-1 text-copy-12 font-normal text-muted-foreground">
                / {totalAreas}
              </span>
            </>
          }
          note={`${summary.areasWithReadings} memiliki data bacaan`}
        />
        <StatTile
          className="col-span-2"
          label="Cakupan Peta Spasial"
          value={formatNumber(summary.readings)}
          note="Total bacaan terhubung ke poligon kelurahan"
        />
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-label-13 text-foreground">
          Kelurahan dengan Persentase Tertinggi
        </h3>
        {topAreas.length > 0 ? (
          <ol className="divide-y divide-border">
            {topAreas.map((area) => (
              <li
                key={area.kodeDesa}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-label-13 text-foreground">
                    {area.kelurahan}
                  </p>
                  <p className="truncate text-copy-12 text-muted-foreground">
                    {area.kecamatan} &bull;{" "}
                    {formatNumber(Number(area[metric.countKey]))} dari{" "}
                    {formatNumber(area.jumlahBaca)} bacaan
                  </p>
                </div>
                <Badge
                  variant="blue-subtle"
                  size="sm"
                  className="shrink-0 font-mono tabular-nums"
                >
                  {formatPercent(area[metric.rateKey])}
                </Badge>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-copy-12 text-muted-foreground">
            Belum ada indikator untuk lapisan ini pada periode aktif.
          </p>
        )}
      </div>
    </aside>
  );
}
