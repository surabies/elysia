// features/dashboard/pengaduan/hooks/UseStatistikPengaduan.ts
// — ambil angka ringkasan antrean untuk kartu di atas grid.
import * as React from "react";
import { ambilSatu } from "@/features/dashboard/api/ApiDashboard";
import type { StatistikPengaduan } from "@/features/dashboard/pengaduan/types/TipePengaduan";

export function useStatistikPengaduan(periode?: string) {
  const [stat, setStat] = React.useState<StatistikPengaduan | null>(null);

  const muat = React.useCallback(() => {
    const params =
      periode && periode !== "SEMUA" ? { periode } : {};
    ambilSatu<StatistikPengaduan>("/pengaduan/statistik", params)
      .then(setStat)
      .catch(() => setStat(null));
  }, [periode]);

  React.useEffect(() => {
    muat();
  }, [muat]);

  return { stat, muat };
}
