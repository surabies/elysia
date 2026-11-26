"use client";

import { useMemo } from "react";
import { formatCompactRupiah, formatNumber } from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

export function TariffDistributionChart({
  data,
}: {
  data: DrdSummary["dataTarif"];
}) {
  const activeTarif = useMemo(
    () => data.filter((item) => item.totalTagihan > 0),
    [data]
  );

  const totalTagihan = useMemo(
    () => activeTarif.reduce((sum, item) => sum + item.totalTagihan, 0),
    [activeTarif]
  );

  const sortedTarif = useMemo(
    () => [...activeTarif].sort((a, b) => b.totalTagihan - a.totalTagihan),
    [activeTarif]
  );

  const colors = [
    "var(--ds-blue-700)",
    "var(--ds-teal-700)",
    "var(--ds-amber-700)",
    "var(--ds-purple-700)",
    "var(--ds-pink-700)",
  ];

  const topItems = useMemo(() => {
    return sortedTarif.slice(0, 5).map((item, idx) => {
      const share =
        totalTagihan > 0
          ? ((item.totalTagihan / totalTagihan) * 100).toFixed(1)
          : "0.0";
      const shareNum =
        totalTagihan > 0 ? (item.totalTagihan / totalTagihan) * 100 : 0;

      return {
        ...item,
        color: colors[idx % colors.length],
        share,
        shareNum,
      };
    });
  }, [sortedTarif, totalTagihan, colors]);

  const top1 = topItems[0];

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header Container */}
      <div className="flex flex-col p-5 sm:p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
              Komposisi Tagihan per Tarif
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Pangsa pendapatan berdasarkan kelompok tarif pelanggan
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {formatCompactRupiah(totalTagihan)}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {activeTarif.length} Golongan Aktif
            </p>
          </div>
        </div>

        {/* Multi-Segment Stacked Proportion Bar */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--ds-background-200)]">
            {topItems.map((item) => (
              <div
                key={item.kode}
                style={{
                  width: `${item.shareNum}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.kode} · ${item.nama}: ${item.share}% (${formatCompactRupiah(item.totalTagihan)})`}
                className="h-full transition-all duration-300"
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            {top1 ? (
              <span className="flex items-center gap-1.5 truncate">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: top1.color }}
                />
                Pangsa terbesar <strong className="text-foreground font-medium truncate">{top1.kode} ({top1.share}%)</strong>
              </span>
            ) : (
              <span>Belum ada data</span>
            )}
            <span className="shrink-0">Top 5 Kontributor</span>
          </div>
        </div>
      </div>

      {/* Rincian Top Kelompok Tarif - Clean, borderless rows */}
      <div className="flex flex-col flex-1 px-5 sm:px-6 pb-5 pt-0 justify-between">
        <div className="flex flex-col gap-2 pt-1">
          {topItems.map((item) => (
            <div
              key={item.kode}
              className="px-2.5 py-1.5 rounded-md hover:bg-[var(--ds-background-200)] transition-colors flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-foreground truncate">
                    {item.kode} · {item.nama}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 tabular-nums shrink-0">
                  <span className="font-semibold text-foreground text-xs">
                    {formatCompactRupiah(item.totalTagihan)}
                  </span>
                  <span className="text-[11px] text-muted-foreground w-11 text-right">
                    {item.share}%
                  </span>
                </div>
              </div>

              {/* Micro proportion bar */}
              <div className="h-1 w-full bg-[var(--ds-background-200)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.shareNum}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Total {formatNumber(activeTarif.reduce((s, it) => s + it.jumlahPelanggan, 0))} Pelanggan Terdaftar</span>
          <span className="tabular-nums font-mono text-muted-foreground">100% Tercakup</span>
        </div>
      </div>
    </div>
  );
}
