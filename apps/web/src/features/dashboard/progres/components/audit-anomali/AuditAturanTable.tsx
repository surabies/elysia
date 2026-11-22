"use client";

import * as React from "react";
import { Filter, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AturanBreakdownItem } from "@/server/services/cater/cater-progress.service";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface AuditAturanTableProps {
  breakdown: AturanBreakdownItem[];
  selectedKode: string | null;
  onSelectKode: (kode: string | null) => void;
}

export function AuditAturanTable({
  breakdown,
  selectedKode,
  onSelectKode,
}: AuditAturanTableProps) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <h2 className="text-label-14 font-semibold text-foreground">
            Matriks 12 Aturan Anomali &amp; Catatan SSOT (Database Terpusat)
          </h2>
        </div>
        {selectedKode && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onSelectKode(null)}
            className="text-label-11 text-muted-foreground hover:text-foreground"
          >
            Reset Filter Kode ({selectedKode})
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">No.</TableHead>
            <TableHead>Kode Anomali</TableHead>
            <TableHead>Nama Aturan &amp; Deskripsi</TableHead>
            <TableHead>Klasifikasi Pilar</TableHead>
            <TableHead>Tingkat Keparahan</TableHead>
            <TableHead className="text-right">Jumlah Kasus</TableHead>
            <TableHead className="text-right">Pangsa (%)</TableHead>
            <TableHead className="text-center w-28">Drill-Down</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-label-12">
          {breakdown.map((item) => {
            const isSelected = selectedKode === item.kode;
            const isAnomali = item.dihitungSebagaiAnomali;

            return (
              <TableRow
                key={item.kode}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected && "bg-muted/70 font-medium"
                )}
                onClick={() => onSelectKode(isSelected ? null : item.kode)}
              >
                <TableCell className="text-center font-mono text-muted-foreground">
                  {item.urutan}
                </TableCell>
                <TableCell className="font-mono font-semibold text-foreground">
                  {item.kode}
                </TableCell>
                <TableCell className="font-sans">
                  <div className="font-medium text-foreground">{item.nama}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Tipe: {item.tipeAturan}
                  </div>
                </TableCell>
                <TableCell>
                  {isAnomali ? (
                    <Badge variant="amber-subtle" size="sm">
                      Pilar 1: Anomali Validasi
                    </Badge>
                  ) : (
                    <Badge variant="blue-subtle" size="sm">
                      Pilar 2: Catatan Lapangan
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.tingkatKeparahan === "KRITIS" ? (
                    <Badge variant="red-subtle" size="sm">KRITIS</Badge>
                  ) : item.tingkatKeparahan === "TINGGI" ? (
                    <Badge variant="amber-subtle" size="sm">TINGGI</Badge>
                  ) : item.tingkatKeparahan === "SEDANG" ? (
                    <Badge variant="outline" size="sm" className="border-amber-500/40 text-amber-600">SEDANG</Badge>
                  ) : (
                    <Badge variant="gray-subtle" size="sm">PERINGATAN</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                  {numberFormat.format(item.jumlah)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                  {item.persentase}%
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant={isSelected ? "secondary" : "outline"}
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectKode(isSelected ? null : item.kode);
                    }}
                    className="gap-1 text-[11px] h-6 px-2"
                  >
                    <Filter className="size-3" />
                    <span>{isSelected ? "Dipilih" : "Filter"}</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
