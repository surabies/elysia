"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { OfficerProductivity } from "@/src/server/services/dashboard/analytics.service";

interface OfficerProductivityTableProps {
  data: OfficerProductivity[];
}

export function OfficerProductivityTable({ data }: OfficerProductivityTableProps) {
  const maxBaca = Math.max(...data.map((d) => d.totalBaca), 1);

  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Produktivitas & Ranking Petugas Lapangan
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
              {data.length} Petugas Cater
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Komposisi hasil pembacaan meter, kubikasi tercatat, dan rasio anomali per petugas.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {data.map((officer, index) => {
          const barWidth = Math.round((officer.totalBaca / maxBaca) * 100);

          return (
            <div key={officer.kodepetugas} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <span className="font-medium text-foreground">
                    {officer.nama}
                  </span>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] px-1.5 py-0 text-muted-foreground"
                  >
                    {officer.kodepetugas}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    {officer.totalKubikasi.toLocaleString("id-ID")} m³
                  </span>
                  <span className="font-semibold text-foreground">
                    {officer.totalBaca.toLocaleString("id-ID")} SL
                  </span>
                  <span className="text-[11px] text-muted-foreground w-12 text-right">
                    ({officer.persentaseBeban}%)
                  </span>
                </div>
              </div>

              {/* Minimal Vercel Relative Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full bg-foreground/75 transition-all duration-300 rounded-full"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
