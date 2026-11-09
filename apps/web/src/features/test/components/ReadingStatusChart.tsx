"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnomalyCategory } from "@/server/services/dashboard/analytics.service";

interface ReadingStatusChartProps {
  data: AnomalyCategory[];
}

const INITIAL_STATUS_COUNT = 8;

export function ReadingStatusChart({ data }: ReadingStatusChartProps) {
  const [showAll, setShowAll] = React.useState(false);
  const totalReadings = data.reduce((sum, status) => sum + status.jumlah, 0);
  const maxReadings = Math.max(1, ...data.map((status) => status.jumlah));
  const visibleStatuses = showAll ? data : data.slice(0, INITIAL_STATUS_COUNT);

  return (
    <section className="relative flex h-full min-w-0 flex-col rounded-[10px] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Distribusi Status Pembacaan
          </h3>
        </div>
        {data.length > 0 && (
          <p className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
            {totalReadings.toLocaleString("id-ID")} bacaan
            <span className="block">{data.length} status</span>
          </p>
        )}
      </div>

      {data.length > 0 ? (
        <>
          <div
            className={`mt-3 flex flex-1 flex-col overflow-x-auto ${
              showAll ? "max-h-80 overflow-y-auto" : ""
            }`}
          >
            <div
              className="flex min-w-[19rem] flex-1 flex-col"
              aria-label="Peringkat status pembacaan"
            >
              <div
                className="grid grid-cols-[minmax(0,1fr)_5.5rem_3.5rem] border-b border-border px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                aria-hidden="true"
              >
                <span>Status</span>
                <span className="text-right">Bacaan</span>
                <span className="text-right">Porsi</span>
              </div>
              {visibleStatuses.map((status) => {
                const statusCode =
                  status.kode === "01" || status.kode.startsWith("CATATAN:")
                  ? null
                  : status.kode;
                const width = Math.min(
                  100,
                  (status.jumlah / maxReadings) * 100,
                );

                return (
                  <div
                    key={status.kode}
                    className="grid min-h-9 flex-1 grid-cols-[minmax(0,1fr)_5.5rem_3.5rem] border-b border-border/70 last:border-0"
                    aria-label={`${status.keterangan}: ${status.jumlah.toLocaleString("id-ID")} bacaan, ${status.persentase}%`}
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
                        {status.keterangan}
                      </span>
                      {statusCode && (
                        <span className="relative z-10 ml-1.5 shrink-0 text-[10px] text-muted-foreground">
                          {statusCode}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center justify-end px-2 py-1.5 font-mono text-xs tabular-nums text-foreground">
                      {status.jumlah.toLocaleString("id-ID")}
                    </span>
                    <span className="flex items-center justify-end px-2 py-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {status.persentase}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {data.length > INITIAL_STATUS_COUNT && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 h-7 px-2 text-xs text-muted-foreground"
              aria-expanded={showAll}
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? (
                <>
                  <ChevronUp aria-hidden="true" className="size-4" />
                  Tampilkan ringkas
                </>
              ) : (
                <>
                  <ChevronDown aria-hidden="true" className="size-4" />
                  Lihat semua {data.length} status
                </>
              )}
            </Button>
          )}
        </>
      ) : (
        <div className="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          Belum ada data status pembacaan pada periode ini.
        </div>
      )}
    </section>
  );
}
