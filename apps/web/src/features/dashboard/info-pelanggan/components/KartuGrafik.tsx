// Kartu grafik pemakaian per periode.
import { GrafikPemakaian } from "./GrafikPemakaian";
import { PanelDasbor } from "@/features/dashboard/shared";
import type { BarisRiwayat, DataCatat } from "../types";

export function KartuGrafik({
  catat,
  riwayat,
}: {
  catat: DataCatat;
  riwayat: BarisRiwayat[];
}) {
  return (
    <PanelDasbor label="Pemakaian per periode" deskripsi="(m³)">
      <GrafikPemakaian
        periode={catat.periode}
        pemakaianM3={catat.pemakaianM3}
        riwayat={riwayat}
      />
    </PanelDasbor>
  );
}
