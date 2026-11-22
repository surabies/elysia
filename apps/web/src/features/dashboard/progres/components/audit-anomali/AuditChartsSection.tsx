"use client";

import * as React from "react";
import { BarChart3, PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AturanBreakdownItem } from "@/server/services/cater/cater-progress.service";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface AuditChartsSectionProps {
  kpi: {
    totalTercatat: number;
    totalAnomali: number;
    totalWarning: number;
    totalNormal: number;
    persenAnomali: number;
    persenWarning: number;
    persenNormal: number;
  };
  breakdown: AturanBreakdownItem[];
  selectedKode: string | null;
  onSelectKode: (kode: string) => void;
}

export function AuditChartsSection({
  kpi,
  breakdown,
  selectedKode,
  onSelectKode,
}: AuditChartsSectionProps) {
  const maxJumlah = React.useMemo(() => {
    return Math.max(...breakdown.map((b) => b.jumlah), 1);
  }, [breakdown]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Kolom Kiri: Segments Komposisi 3 Pilar (4 Cols) */}
      <Card className="p-5 border-border bg-card flex flex-col justify-between lg:col-span-5">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-muted-foreground" />
              <h2 className="text-label-14 font-semibold text-foreground">
                Komposisi Observabilitas Stand Meter
              </h2>
            </div>
            <span className="font-mono text-label-12 text-muted-foreground tabular-nums">
              {numberFormat.format(kpi.totalTercatat)} SL
            </span>
          </div>

          {/* Visual Segment Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5">
              <div
                style={{ width: `${kpi.persenNormal}%` }}
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                title={`Normal: ${kpi.persenNormal}%`}
              />
              <div
                style={{ width: `${kpi.persenWarning}%` }}
                className="h-full bg-blue-500 transition-all duration-500"
                title={`Kendala Lapangan: ${kpi.persenWarning}%`}
              />
              <div
                style={{ width: `${kpi.persenAnomali}%` }}
                className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
                title={`Anomali Validasi: ${kpi.persenAnomali}%`}
              />
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="mt-6 space-y-3">
            {/* Item 1: Normal */}
            <div className="flex items-center justify-between rounded-md p-2.5 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-label-13 font-medium text-foreground">
                    Stand Wajar Murni (Normal)
                  </p>
                  <p className="text-copy-11 text-muted-foreground">
                    Langsung siap diproses ke Rekening DRD
                  </p>
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <p className="text-label-13 font-semibold text-foreground">
                  {numberFormat.format(kpi.totalNormal)}
                </p>
                <p className="text-label-11 text-muted-foreground">
                  {kpi.persenNormal}%
                </p>
              </div>
            </div>

            {/* Item 2: Warning */}
            <div className="flex items-center justify-between rounded-md p-2.5 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-label-13 font-medium text-foreground">
                    Pilar 2: Catatan Kendala Lapangan
                  </p>
                  <p className="text-copy-11 text-muted-foreground">
                    Pagar terkunci, deviasi ringan &bull; <code>WARN_*</code>
                  </p>
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <p className="text-label-13 font-semibold text-blue-700 dark:text-blue-400">
                  {numberFormat.format(kpi.totalWarning)}
                </p>
                <p className="text-label-11 text-muted-foreground">
                  {kpi.persenWarning}%
                </p>
              </div>
            </div>

            {/* Item 3: Anomali */}
            <div className="flex items-center justify-between rounded-md p-2.5 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="text-label-13 font-medium text-foreground">
                    Pilar 1: Anomali Validasi Meter
                  </p>
                  <p className="text-copy-11 text-muted-foreground">
                    Kritis/Deviasi tinggi &bull; <code>is_anomali = true</code>
                  </p>
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <p className="text-label-13 font-semibold text-amber-700 dark:text-amber-400">
                  {numberFormat.format(kpi.totalAnomali)}
                </p>
                <p className="text-label-11 text-muted-foreground">
                  {kpi.persenAnomali}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border text-label-11 text-muted-foreground">
          Penyelarasan SSOT: 100% data transaksi terkelola dalam 2 pilar aturan database terpusat.
        </div>
      </Card>

      {/* Kolom Kanan: Peringkat Frekuensi 12 Kode Aturan (7 Cols) */}
      <Card className="p-5 border-border bg-card lg:col-span-7">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            <h2 className="text-label-14 font-semibold text-foreground">
              Distribusi Frekuensi Kode Aturan Anomali &amp; Catatan
            </h2>
          </div>
          <span className="text-copy-12 text-muted-foreground">
            Klik baris untuk memfilter tabel
          </span>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {breakdown.map((item) => {
            const widthPct = Math.max(Math.round((item.jumlah / maxJumlah) * 100), item.jumlah > 0 ? 3 : 0);
            const isSelected = selectedKode === item.kode;

            return (
              <div
                key={item.kode}
                onClick={() => onSelectKode(item.kode)}
                className={cn(
                  "group flex flex-col gap-1 p-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50 border border-transparent",
                  isSelected && "bg-muted border-border font-medium"
                )}
              >
                <div className="flex items-center justify-between text-label-12">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-4">
                      {item.urutan}.
                    </span>
                    <span className="truncate font-medium text-foreground">
                      {item.nama}
                    </span>
                    <Badge
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-[9px] font-mono uppercase px-1 py-0",
                        item.dihitungSebagaiAnomali
                          ? "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/5"
                          : "border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/5"
                      )}
                    >
                      {item.dihitungSebagaiAnomali ? "Pilar 1" : "Pilar 2"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] tabular-nums">
                    <span className="font-semibold text-foreground">
                      {numberFormat.format(item.jumlah)}
                    </span>
                    <span className="text-muted-foreground w-11 text-right">
                      ({item.persentase}%)
                    </span>
                  </div>
                </div>

                {/* Bar Visual Progress */}
                <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      item.dihitungSebagaiAnomali
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
