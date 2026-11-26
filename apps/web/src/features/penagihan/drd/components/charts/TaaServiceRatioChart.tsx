"use client";

import { useMemo } from "react";
import { formatNumber } from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaaServiceRatioChart({
  data,
}: {
  data: DrdSummary["dataTaaStatus"];
}) {
  const totalRekening = data.normal + data.taa;
  const persenNormal =
    totalRekening > 0 ? (100 - data.persenTaa).toFixed(1) : "0";

  const topTarif = useMemo(() => {
    if (!data.sebaranTarif || data.sebaranTarif.length === 0) return [];
    return [...data.sebaranTarif]
      .sort((a, b) => b.jumlahTaa - a.jumlahTaa)
      .slice(0, 3);
  }, [data.sebaranTarif]);

  const isHealthy = data.persenTaa < 3;

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header Container */}
      <div className="flex flex-col p-5 sm:p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
              Rasio Layanan & Status TAA
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Audit kepatuhan pembacaan meter & risiko tagihan anomali
            </p>
          </div>
          <div className="text-right shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                isHealthy
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
              )}
            >
              {isHealthy ? "Toleransi Aman" : "Perlu Verifikasi"}
            </span>
          </div>
        </div>

        {/* Dual Health Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="flex flex-col p-2.5 rounded-md bg-[var(--ds-background-200)] border border-border/60">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <CheckCircle2 className="size-3 text-[var(--ds-blue-700)] shrink-0" />
              <span className="truncate">Rekening Normal</span>
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums mt-1">
              {formatNumber(data.normal)}
            </span>
            <span className="text-[11px] text-[var(--ds-blue-700)] font-medium tabular-nums">
              {persenNormal}% dari total
            </span>
          </div>

          <div className="flex flex-col p-2.5 rounded-md bg-[var(--ds-background-200)] border border-border/60">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <AlertTriangle className="size-3 text-[var(--ds-amber-700)] shrink-0" />
              <span className="truncate">Anomali TAA</span>
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums mt-1">
              {formatNumber(data.taa)}
            </span>
            <span className="text-[11px] text-[var(--ds-amber-700)] font-medium tabular-nums">
              {data.persenTaa}% butuh audit
            </span>
          </div>
        </div>

        {/* Dual Track Proportion Bar */}
        <div className="mt-3.5 flex flex-col gap-1">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--ds-background-200)]">
            <div
              className="bg-[var(--ds-blue-700)] transition-all duration-300"
              style={{ width: `${persenNormal}%` }}
              title={`Normal: ${persenNormal}%`}
            />
            <div
              className="bg-[var(--ds-amber-700)] transition-all duration-300"
              style={{ width: `${data.persenTaa}%` }}
              title={`Anomali TAA: ${data.persenTaa}%`}
            />
          </div>
        </div>
      </div>

      {/* Rincian Sebaran Tarif TAA - Clean, borderless rows */}
      <div className="flex flex-col flex-1 px-5 sm:px-6 pb-5 pt-0 justify-between">
        <div className="pt-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Penyumbang TAA Terbanyak
          </p>

          <div className="flex flex-col gap-1.5">
            {topTarif.length > 0 ? (
              topTarif.map((item, idx) => {
                const colors = [
                  "var(--ds-amber-700)",
                  "var(--ds-orange-700)",
                  "var(--ds-teal-700)",
                ];
                const shareInTaa =
                  data.taa > 0
                    ? ((item.jumlahTaa / data.taa) * 100).toFixed(1)
                    : "0";

                return (
                  <div
                    key={item.kode}
                    className="px-2.5 py-1.5 rounded-md hover:bg-[var(--ds-background-200)] transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span className="font-medium text-foreground truncate">
                        Golongan Tarif {item.kode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums shrink-0">
                      <span className="font-semibold text-foreground text-xs">
                        {formatNumber(item.jumlahTaa)} rek
                      </span>
                      <span className="text-[11px] text-muted-foreground w-11 text-right">
                        {shareInTaa}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Nir-anomali: Seluruh meter terbaca normal sesuai stand.
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Total Basis: {formatNumber(totalRekening)} Lembar</span>
          <span className="tabular-nums font-mono text-muted-foreground">Ambang batas 5.0%</span>
        </div>
      </div>
    </div>
  );
}
