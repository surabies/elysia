"use client";

import { useMemo } from "react";
import { formatCompactRupiah, formatNumber } from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";
import { cn } from "@/lib/utils";

export function BillingComponentsChart({
  data,
}: {
  data: DrdSummary["dataTagihanKomposisi"];
}) {
  const items = useMemo(
    () => [
      {
        key: "hargaAir",
        label: "Harga Air Murni",
        sublabel: "Tarif progresif volume kubikasi",
        value: data.hargaAir,
        color: "var(--ds-blue-700)",
      },
      {
        key: "beaBeban",
        label: "Bea Beban Tetap",
        sublabel: "Biaya abonemen & pemeliharaan meter",
        value: data.beaBeban,
        color: "var(--ds-amber-700)",
      },
      {
        key: "beaAdmin",
        label: "Bea Administrasi",
        sublabel: "Pengelolaan rekening & transaksi",
        value: data.beaAdmin,
        color: "var(--ds-teal-700)",
      },
      {
        key: "airKotor",
        label: "Pelayanan Air Kotor",
        sublabel: "Retribusi pengolahan air limbah",
        value: data.airKotor,
        color: "var(--ds-purple-700)",
      },
      {
        key: "lainLain",
        label: "Pendapatan Lain-lain",
        sublabel: "Denda keterlambatan & segel",
        value: data.lainLain,
        color: "var(--ds-pink-700)",
      },
    ],
    [data]
  );

  const totalKomposisi = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items]
  );

  const airPercent =
    totalKomposisi > 0 ? ((data.hargaAir / totalKomposisi) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header Container */}
      <div className="flex flex-col p-5 sm:p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
              Komponen Tagihan DRD
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Struktur pembentuk nilai rekening ditagih periode ini
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {formatCompactRupiah(totalKomposisi)}
            </span>
            <p className="text-[11px] text-muted-foreground">Total Nilai</p>
          </div>
        </div>

        {/* Multi-Segment Stacked Proportion Bar */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--ds-background-200)]">
            {items
              .filter((item) => item.value > 0)
              .map((item) => {
                const sharePercent =
                  totalKomposisi > 0 ? (item.value / totalKomposisi) * 100 : 0;
                return (
                  <div
                    key={item.key}
                    style={{
                      width: `${sharePercent}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.label}: ${sharePercent.toFixed(1)}% (${formatCompactRupiah(item.value)})`}
                    className="h-full transition-all duration-300"
                  />
                );
              })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: "var(--ds-blue-700)" }}
              />
              Air Murni mendominasi <strong className="text-foreground font-medium">{airPercent}%</strong>
            </span>
            <span>5 Komponen</span>
          </div>
        </div>
      </div>

      {/* Rincian 5 Komponen Tagihan - Clean, borderless rows */}
      <div className="flex flex-col flex-1 px-5 sm:px-6 pb-5 pt-0 justify-between">
        <div className="flex flex-col gap-2 pt-1">
          {items.map((item) => {
            const share =
              totalKomposisi > 0
                ? ((item.value / totalKomposisi) * 100).toFixed(1)
                : "0.0";
            const shareNum = totalKomposisi > 0 ? (item.value / totalKomposisi) * 100 : 0;

            return (
              <div
                key={item.key}
                className="px-2 py-1.5 rounded-md hover:bg-[var(--ds-background-200)] transition-colors flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-foreground truncate">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 tabular-nums shrink-0">
                    <span className="font-semibold text-foreground text-xs">
                      {formatCompactRupiah(item.value)}
                    </span>
                    <span className="text-[11px] text-muted-foreground w-11 text-right">
                      {share}%
                    </span>
                  </div>
                </div>

                {/* Micro proportion bar */}
                <div className="h-1 w-full bg-[var(--ds-background-200)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${shareNum}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Struktur: Air + Beban + Adm + Limbah</span>
          <span className="tabular-nums font-mono text-muted-foreground">100% Klir</span>
        </div>
      </div>
    </div>
  );
}
