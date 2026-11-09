import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className={cn("rounded-md bg-muted/40 px-3 py-2", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{note}</p>
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
        "min-w-0 rounded-[10px] border border-border bg-card p-4",
        className,
      )}
    >
      <h2
        id="risk-summary-title"
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        Ringkasan Risiko Pembacaan
      </h2>

      <Tabs
        value={metricKey}
        onValueChange={(value) => onMetricChange(value as RiskMetricKey)}
        className="mt-3 gap-3"
      >
        <TabsList className="grid h-auto w-full grid-cols-3">
          {RISK_METRIC_KEYS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="min-h-8 whitespace-normal px-1.5 py-1 text-[10px] leading-tight"
            >
              {RISK_METRICS[key].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          label="Catatan indikator"
          value={formatNumber(summary.flagged)}
          note={`${summary.rate.toFixed(1)}% dari ${formatNumber(summary.readings)} bacaan`}
        />
        <StatTile
          label="Kelurahan terdampak"
          value={
            <>
              {formatNumber(summary.areasWithFlags)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / {totalAreas}
              </span>
            </>
          }
          note={`${summary.areasWithReadings} memiliki data bacaan`}
        />
        <StatTile
          className="col-span-2"
          label="Cakupan peta"
          value={formatNumber(summary.readings)}
          note="bacaan terhubung ke poligon layanan"
        />
      </div>

      <div className="mt-5">
        <h3 className="mb-1 text-xs font-semibold text-foreground">
          Area dengan persentase tertinggi
        </h3>
        {topAreas.length > 0 ? (
          <ol className="divide-y divide-border">
            {topAreas.map((area) => (
              <li
                key={area.kodeDesa}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {area.kelurahan}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {area.kecamatan} · {formatNumber(Number(area[metric.countKey]))}{" "}
                    dari {formatNumber(area.jumlahBaca)} bacaan
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
                  {formatPercent(area[metric.rateKey])}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
            Belum ada indikator untuk lapisan ini pada periode aktif.
          </p>
        )}
      </div>
    </aside>
  );
}
