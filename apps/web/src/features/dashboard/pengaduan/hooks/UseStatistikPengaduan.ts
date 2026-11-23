// features/dashboard/pengaduan/hooks/UseStatistikPengaduan.ts
// — ambil angka ringkasan antrean untuk kartu di atas grid.
// Menerima initialStat dari SSR agar saat reload tidak ada kedipan angka dari 0.
import * as React from "react";
import { ambilSatu } from "@/features/dashboard/api/ApiDashboard";
import type { StatistikPengaduan } from "@/features/dashboard/pengaduan/types/TipePengaduan";

export function useStatistikPengaduan(
  periode?: string,
  initialStat: StatistikPengaduan | null = null
) {
  const [stat, setStat] = React.useState<StatistikPengaduan | null>(initialStat);
  const skipFirstEffectRef = React.useRef(Boolean(initialStat));

  const muat = React.useCallback(() => {
    const params = periode && periode !== "SEMUA" ? { periode } : {};
    ambilSatu<StatistikPengaduan>("/pengaduan/statistik", params)
      .then(setStat)
      .catch(() => {});
  }, [periode]);

  React.useEffect(() => {
    if (skipFirstEffectRef.current) {
      skipFirstEffectRef.current = false;
      return;
    }
    muat();
  }, [muat]);

  return { stat, muat };
}
