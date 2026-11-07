"use client";

import type { ConsumptionBucket } from "@/server/services/dashboard/analytics.service";

interface ConsumptionHistogramChartProps {
  data: ConsumptionBucket[];
}

export function ConsumptionHistogramChart({
  data,
}: ConsumptionHistogramChartProps) {
  const totalCustomers = data.reduce((sum, bucket) => sum + bucket.jumlahSL, 0);
  const totalConsumption = data.reduce(
    (sum, bucket) => sum + bucket.totalM3,
    0,
  );
  const maxCustomers = Math.max(1, ...data.map((bucket) => bucket.jumlahSL));

  return (
    <section className="relative flex h-full min-w-0 flex-col rounded-[10px] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-semibold tracking-tight text-foreground">
          Distribusi Rentang Kubikasi Air
        </h3>
        <div className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
          <p>{totalCustomers.toLocaleString("id-ID")} pelanggan</p>
          <p>{totalConsumption.toLocaleString("id-ID")} m³</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="mt-3 flex flex-1 flex-col overflow-x-auto">
          <div
            className="flex min-w-[19rem] flex-1 flex-col"
            aria-label="Distribusi pelanggan berdasarkan rentang kubikasi"
          >
            <div
              className="grid grid-cols-[minmax(0,1fr)_5.5rem_3.5rem] border-b border-border px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              aria-hidden="true"
            >
              <span>Rentang</span>
              <span className="text-right">Pelanggan</span>
              <span className="text-right">Porsi</span>
            </div>
            {data.map((bucket) => {
              const width = Math.min(
                100,
                (bucket.jumlahSL / maxCustomers) * 100,
              );

              return (
                <div
                  key={bucket.kategori}
                  className="grid min-h-10 flex-1 grid-cols-[minmax(0,1fr)_5.5rem_3.5rem] border-b border-border/70 last:border-0"
                  aria-label={`${bucket.label}: ${bucket.jumlahSL.toLocaleString("id-ID")} pelanggan, ${bucket.persentase}%`}
                >
                  <div className="relative flex min-w-0 items-center overflow-hidden px-2 py-1.5">
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${width}%`,
                        backgroundColor:
                          "color-mix(in srgb, var(--ds-blue-500) 18%, var(--card))",
                      }}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 truncate text-xs font-medium text-foreground">
                      {bucket.label}
                    </span>
                  </div>
                  <span className="flex items-center justify-end px-2 py-1.5 font-mono text-xs tabular-nums text-foreground">
                    {bucket.jumlahSL.toLocaleString("id-ID")}
                  </span>
                  <span className="flex items-center justify-end px-2 py-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {bucket.persentase}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          Belum ada data kubikasi pada periode ini.
        </div>
      )}
    </section>
  );
}
