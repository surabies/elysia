import type { FeatureCollection, Geometry } from "geojson";
import type { ChoroplethFeatureProperties } from "@/components/charts/choropleth";
import type { ServiceAreaRisk } from "@/server/services/dashboard/analytics.service";
import { RISK_TOP_LIMIT } from "../constants";

export type RiskMetricKey = "nonNormal" | "usageSpike" | "standDecline";

interface RiskMetricConfig {
  label: string;
  countKey: "catatanNonNormal" | "lonjakanPemakaian" | "standMenurun";
  rateKey:
    | "persentaseNonNormal"
    | "persentaseLonjakan"
    | "persentaseStandMenurun";
}

export const RISK_METRICS = {
  nonNormal: {
    label: "Anomali",
    countKey: "catatanNonNormal",
    rateKey: "persentaseNonNormal",
  },
  usageSpike: {
    label: "Lonjakan pemakaian",
    countKey: "lonjakanPemakaian",
    rateKey: "persentaseLonjakan",
  },
  standDecline: {
    label: "Stand menurun",
    countKey: "standMenurun",
    rateKey: "persentaseStandMenurun",
  },
} as const satisfies Record<RiskMetricKey, RiskMetricConfig>;

export const RISK_METRIC_KEYS = Object.keys(RISK_METRICS) as RiskMetricKey[];

export type RiskMetric = RiskMetricConfig;

export type MappedServiceAreaRisk = Omit<ServiceAreaRisk, "geometry"> & {
  geometry: NonNullable<ServiceAreaRisk["geometry"]>;
};

export function hasGeometry(
  area: ServiceAreaRisk,
): area is MappedServiceAreaRisk {
  return area.geometry !== null;
}

export interface RiskFeatureProperties extends ChoroplethFeatureProperties {
  name: string;
  kodeDesa: string;
  kecamatan: string;
  jumlahBaca: number;
}

export function getFeatureCode(
  properties?: ChoroplethFeatureProperties | null,
): string {
  return String(properties?.kodeDesa ?? properties?.id ?? "");
}

export function toFeatureCollection(
  areas: readonly MappedServiceAreaRisk[],
): FeatureCollection<Geometry, RiskFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: areas.map((area) => ({
      type: "Feature",
      properties: {
        name: area.kelurahan,
        kodeDesa: area.kodeDesa,
        kecamatan: area.kecamatan,
        jumlahBaca: area.jumlahBaca,
      },
      geometry: area.geometry,
    })),
  };
}

export interface RiskSummary {
  readings: number;
  flagged: number;
  rate: number;
  areasWithFlags: number;
  areasWithReadings: number;
}

export function summarizeRisk(
  areas: readonly MappedServiceAreaRisk[],
  metric: RiskMetric,
): RiskSummary {
  const readings = areas.reduce((sum, a) => sum + a.jumlahBaca, 0);
  const flagged = areas.reduce((sum, a) => sum + Number(a[metric.countKey]), 0);

  return {
    readings,
    flagged,
    rate: readings > 0 ? (flagged / readings) * 100 : 0,
    areasWithFlags: areas.filter((a) => Number(a[metric.countKey]) > 0).length,
    areasWithReadings: areas.filter((a) => a.jumlahBaca > 0).length,
  };
}

export function rankRiskAreas(
  areas: readonly MappedServiceAreaRisk[],
  metric: RiskMetric,
): MappedServiceAreaRisk[] {
  return areas
    .filter((a) => a.jumlahBaca > 0 && Number(a[metric.countKey]) > 0)
    .sort(
      (a, b) =>
        Number(b[metric.rateKey]) - Number(a[metric.rateKey]) ||
        Number(b[metric.countKey]) - Number(a[metric.countKey]),
    )
    .slice(0, RISK_TOP_LIMIT);
}

export function maxRiskRate(
  areas: readonly MappedServiceAreaRisk[],
  metric: RiskMetric,
): number {
  return Math.max(1, ...areas.map((a) => a[metric.rateKey] ?? 0));
}

const COLOR_STOPS = [
  { at: 0, shade: 100 },
  { at: 0.25, shade: 300 },
  { at: 0.5, shade: 500 },
  { at: 0.75, shade: 700 },
  { at: 1, shade: 900 },
] as const;

/** Interpolasi skala biru berdasarkan rasio nilai terhadap maksimum. */
export function getRiskColor(value: number | null, max: number): string {
  if (value === null) return "var(--muted)";

  const position = Math.min(1, Math.max(0, value / max));
  const upperIndex = Math.max(
    0,
    COLOR_STOPS.findIndex((stop) => stop.at >= position),
  );
  const upper = COLOR_STOPS[upperIndex];
  const lower = COLOR_STOPS[Math.max(0, upperIndex - 1)];
  const progress =
    upper.at === lower.at ? 0 : (position - lower.at) / (upper.at - lower.at);
  const upperPct = Math.round(progress * 100);

  return `color-mix(in srgb, var(--ds-blue-${lower.shade}) ${100 - upperPct}%, var(--ds-blue-${upper.shade}) ${upperPct}%)`;
}
