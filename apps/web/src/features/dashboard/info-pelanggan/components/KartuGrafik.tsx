// Kartu grafik pemakaian per periode.
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
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Pemakaian per Periode
        </h3>
        <span className="font-mono text-xs text-muted-foreground">(m³)</span>
      </div>
      <GrafikPemakaian
        periode={catat.periode}
        pemakaianM3={catat.pemakaianM3}
        riwayat={riwayat}
      />
    </div>
  );
}
