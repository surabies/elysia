import { REGIONAL_SERIES_COLORS, REGIONAL_TOP_LIMIT } from "../constants";
import { expandByDay } from "./chart-series";
import type {
  RegionalAreaTrend,
  RegionalDailyTrend,
} from "@/server/services/dashboard/analytics.service";

export type AreaLevel = "kecamatan" | "kelurahan";

export interface RegionalSeries {
  id: string;
  label: string;
  color: string;
  dataKey: string;
}

export interface RegionalPoint {
  hari: string;
  tanggal: string;
  total: number;
  [dataKey: string]: number | string;
}

export function rankTopAreas(
  data: readonly RegionalDailyTrend[],
  level: AreaLevel,
): RegionalAreaTrend[] {
  const totals = new Map<string, RegionalAreaTrend>();

  for (const daily of data) {
    for (const area of daily[level]) {
      const prev = totals.get(area.kode);
      totals.set(area.kode, {
        ...area,
        jumlahBaca: (prev?.jumlahBaca ?? 0) + area.jumlahBaca,
      });
    }
  }

  return [...totals.values()]
    .sort(
      (a, b) =>
        b.jumlahBaca - a.jumlahBaca || a.nama.localeCompare(b.nama, "id-ID"),
    )
    .slice(0, REGIONAL_TOP_LIMIT);
}

export function toSeries(
  areas: readonly RegionalAreaTrend[],
  level: AreaLevel,
): RegionalSeries[] {
  return areas.map((area, index) => ({
    id: area.kode,
    label:
      level === "kelurahan" && area.kecamatanNama
        ? `${area.nama} (${area.kecamatanNama})`
        : area.nama,
    color: REGIONAL_SERIES_COLORS[index] ?? REGIONAL_SERIES_COLORS[0],
    dataKey: `area${index}`,
  }));
}

export function toChartPoints(
  data: readonly RegionalDailyTrend[],
  level: AreaLevel,
  series: readonly RegionalSeries[],
): RegionalPoint[] {
  return expandByDay(data, (daily, day) => {
    const point: RegionalPoint = { ...day, total: daily?.total ?? 0 };
    for (const item of series) {
      point[item.dataKey] =
        daily?.[level].find((area) => area.kode === item.id)?.jumlahBaca ?? 0;
    }
    return point;
  });
}
