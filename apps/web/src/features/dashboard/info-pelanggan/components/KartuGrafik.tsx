// Kartu grafik pemakaian per periode.
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GrafikPemakaian } from "./GrafikPemakaian";
import type { BarisRiwayat, DataCatat } from "../types";

export function KartuGrafik({
  catat,
  riwayat,
}: {
  catat: DataCatat;
  riwayat: BarisRiwayat[];
}) {
  return (
    <Card className="rounded-lg border-border/80 bg-card shadow-none">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 shrink-0 text-foreground/80 stroke-[1.5]" />
            <CardTitle className="text-[15px] sm:text-[16px] font-medium tracking-tight text-foreground">
              Pemakaian per Periode
            </CardTitle>
          </div>
          <span className="font-mono text-xs text-muted-foreground">(m³)</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <GrafikPemakaian
          periode={catat.periode}
          pemakaianM3={catat.pemakaianM3}
          riwayat={riwayat}
        />
      </CardContent>
    </Card>
  );
}
