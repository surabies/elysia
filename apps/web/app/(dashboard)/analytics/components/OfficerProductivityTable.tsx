"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OfficerProductivity } from "@/src/server/services/dashboard/analytics.service";

interface OfficerProductivityTableProps {
  data: OfficerProductivity[];
}

export function OfficerProductivityTable({
  data,
}: OfficerProductivityTableProps) {
  return (
    <div className="relative w-full rounded-[10px] border border-border bg-card p-4 transition-all">
      <h3 className="pb-3 text-sm font-semibold tracking-tight text-foreground">
        Produktivitas & Ranking Petugas Lapangan
      </h3>

      <Table className="min-w-95 text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-7 px-1 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Petugas
            </TableHead>
            <TableHead className="h-7 px-1 py-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
              Terbaca
            </TableHead>
            <TableHead className="h-7 px-1 py-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
              Kubikasi
            </TableHead>
            <TableHead className="h-7 px-1 py-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
              Beban
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((officer) => (
            <TableRow key={officer.kodepetugas} className="hover:bg-muted/30">
              <TableCell className="max-w-0 px-1 py-1.5 font-medium text-foreground">
                <span className="block truncate">{officer.nama}</span>
              </TableCell>
              <TableCell className="px-1 py-1.5 text-right font-mono tabular-nums font-semibold text-foreground">
                {officer.totalBaca.toLocaleString("id-ID")} SL
              </TableCell>
              <TableCell className="px-1 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                {officer.totalKubikasi.toLocaleString("id-ID")} m³
              </TableCell>
              <TableCell className="px-1 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                {officer.persentaseBeban}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
