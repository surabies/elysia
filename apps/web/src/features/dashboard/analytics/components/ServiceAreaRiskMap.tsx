"use client";

import * as React from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { ChoroplethChart } from "../choropleth-chart";
import { ChoroplethFeature } from "../choropleth-feature";
import { ChoroplethTooltip } from "../choropleth-tooltip";
import type { ChoroplethFeatureProperties } from "../choropleth-context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServiceAreaRisk } from "@/server/services/dashboard/analytics.service";

type RiskMetric = "nonNormal" | "usageSpike" | "standDecline";
type RiskCountKey =
  | "catatanNonNormal"
  | "lonjakanPemakaian"
  | "standMenurun";
type RiskRateKey =
  | "persentaseNonNormal"
  | "persentaseLonjakan"
  | "persentaseStandMenurun";

const RISK_METRICS: Record<
  RiskMetric,
  {
    label: string;
    countKey: RiskCountKey;
    rateKey: RiskRateKey;
  }
> = {
  nonNormal: {
    label: "Status non-normal",
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
};

interface ServiceAreaRiskMapProps {
  data: ServiceAreaRisk[];
}

interface RiskFeatureProperties extends ChoroplethFeatureProperties {
  name: string;
  kodeDesa: string;
  kecamatan: string;
  jumlahBaca: number;
  catatanNonNormal: number;
  lonjakanPemakaian: number;
  standMenurun: number;
  persentaseNonNormal: number | null;
  persentaseLonjakan: number | null;
  persentaseStandMenurun: number | null;
}

type MappedServiceAreaRisk = Omit<ServiceAreaRisk, "geometry"> & {
  geometry: NonNullable<ServiceAreaRisk["geometry"]>;
};

function hasGeometry(
  area: ServiceAreaRisk,
): area is MappedServiceAreaRisk {
  return area.geometry !== null;
}

function formatPercent(value: number | null): string {
  return `${(value ?? 0).toFixed(1)}%`;
}

function getRiskColor(value: number | null, max: number): string {
  if (value === null) return "var(--muted)";

  const stops = [
    { value: 0, shade: 100 },
    { value: 0.25, shade: 300 },
    { value: 0.5, shade: 500 },
    { value: 0.75, shade: 700 },
    { value: 1, shade: 900 },
  ];
  const position = Math.min(1, Math.max(0, value / max));
  const upperIndex = stops.findIndex((stop) => stop.value >= position);
  const lower = stops[Math.max(0, upperIndex - 1)]!;
  const upper = stops[Math.max(0, upperIndex)]!;
  const progress =
    upper.value === lower.value
      ? 0
      : (position - lower.value) / (upper.value - lower.value);

  return `color-mix(in srgb, var(--ds-blue-${lower.shade}) ${
    100 - Math.round(progress * 100)
  }%, var(--ds-blue-${upper.shade}) ${Math.round(progress * 100)}%)`;
}

export function ServiceAreaRiskMap({ data }: ServiceAreaRiskMapProps) {
  const [metric, setMetric] = React.useState<RiskMetric>("nonNormal");
  const currentMetric = RISK_METRICS[metric];

  const summary = React.useMemo(() => {
    const mappedAreas = data.filter(hasGeometry);
    const readings = mappedAreas.reduce((sum, area) => sum + area.jumlahBaca, 0);
    const flagged = mappedAreas.reduce(
      (sum, area) => sum + Number(area[currentMetric.countKey]),
      0,
    );
    const areasWithFlags = mappedAreas.filter(
      (area) => Number(area[currentMetric.countKey]) > 0,
    ).length;

    return {
      readings,
      flagged,
      areasWithFlags,
      rate: readings > 0 ? (flagged / readings) * 100 : 0,
      areasWithGeometry: mappedAreas.length,
      areasWithReadings: mappedAreas.filter((area) => area.jumlahBaca > 0).length,
    };
  }, [data, currentMetric.countKey, currentMetric.rateKey]);

  const topAreas = React.useMemo(
    () =>
      data
        .filter(
          (area) =>
            hasGeometry(area) &&
            area.jumlahBaca > 0 &&
            Number(area[currentMetric.countKey]) > 0,
        )
        .sort(
          (left, right) =>
            Number(right[currentMetric.rateKey]) -
              Number(left[currentMetric.rateKey]) ||
            Number(right[currentMetric.countKey]) -
              Number(left[currentMetric.countKey]),
        )
        .slice(0, 5),
    [data, currentMetric.countKey, currentMetric.rateKey],
  );

  const mapData = React.useMemo<
    FeatureCollection<Geometry, RiskFeatureProperties>
  >(
    () => ({
      type: "FeatureCollection",
      features: data.filter(hasGeometry).map((area) => ({
        type: "Feature",
        properties: {
          name: area.kelurahan,
          kodeDesa: area.kodeDesa,
          kecamatan: area.kecamatan,
          jumlahBaca: area.jumlahBaca,
          catatanNonNormal: area.catatanNonNormal,
          lonjakanPemakaian: area.lonjakanPemakaian,
          standMenurun: area.standMenurun,
          persentaseNonNormal: area.persentaseNonNormal,
          persentaseLonjakan: area.persentaseLonjakan,
          persentaseStandMenurun: area.persentaseStandMenurun,
        },
        geometry: area.geometry,
      })),
    }),
    [data],
  );

  const maximumRate = React.useMemo(
    () =>
      Math.max(
        1,
        ...data
          .filter(hasGeometry)
          .map((area) => area[currentMetric.rateKey] ?? 0),
      ),
    [data, currentMetric.rateKey],
  );

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.9fr)]">
      <section
        className="order-2 min-w-0 rounded-[10px] bg-card p-4 xl:order-1"
        aria-label={`Peta risiko ${currentMetric.label.toLowerCase()}`}
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Peta Risiko Pembacaan per Kelurahan
        </h2>
        {summary.areasWithGeometry > 0 ? (
          <>
            <div
              className="mt-2"
              role="group"
              aria-label={`Peta ${currentMetric.label.toLowerCase()} per kelurahan`}
            >
              <ChoroplethChart
                data={mapData}
                className="min-h-[340px]"
                aspectRatio="16 / 9"
                center={[107.6, -6.9]}
                zoomEnabled
                zoomMin={0.75}
                zoomMax={5}
                animationDuration={800}
                revealSignature={metric}
              >
                <ChoroplethFeature
                  stroke="var(--background)"
                  strokeWidth={0.8}
                  getFeatureColor={(feature) => {
                    const area = data.find(
                      (item) => item.kodeDesa === feature.properties?.id ||
                        item.kodeDesa === feature.properties?.kodeDesa,
                    );
                    return getRiskColor(
                      area?.[currentMetric.rateKey] ?? null,
                      maximumRate,
                    );
                  }}
                />
                <ChoroplethTooltip
                  backgroundColor="var(--popover)"
                  content={({ feature }) => {
                    const area = data.find(
                      (item) =>
                        item.kodeDesa === feature.properties?.kodeDesa ||
                        item.kelurahan === feature.properties?.name,
                    );
                    if (!area) return null;

                    return (
                      <div className="grid gap-1">
                        <p className="font-semibold">
                          {area.kelurahan} · {area.kecamatan}
                        </p>
                        <p className="text-muted-foreground">
                          {currentMetric.label}:{" "}
                          {Number(area[currentMetric.countKey]).toLocaleString(
                            "id-ID",
                          )}{" "}
                          ({formatPercent(area[currentMetric.rateKey])})
                        </p>
                        <p className="text-muted-foreground">
                          Pembacaan: {area.jumlahBaca.toLocaleString("id-ID")}
                        </p>
                      </div>
                    );
                  }}
                />
              </ChoroplethChart>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada geometri area layanan yang bisa digambar. Periksa sumber
            GeoJSON sebelum mengaktifkan peta.
          </div>
        )}
      </section>

      <aside className="order-1 min-w-0 rounded-[10px] border border-border bg-card p-4 xl:order-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Ringkasan Risiko Pembacaan
        </h2>
        <Tabs
          value={metric}
          onValueChange={(value) => setMetric(value as RiskMetric)}
          className="mt-3 gap-3"
        >
          <TabsList className="grid h-auto w-full grid-cols-3">
            {(Object.keys(RISK_METRICS) as RiskMetric[]).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="min-h-8 whitespace-normal px-1.5 py-1 text-[10px] leading-tight"
              >
                {RISK_METRICS[key].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Catatan indikator
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
              {summary.flagged.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {summary.rate.toFixed(1)}% dari{" "}
              {summary.readings.toLocaleString("id-ID")} bacaan
            </p>
          </div>
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Kelurahan terdampak
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
              {summary.areasWithFlags.toLocaleString("id-ID")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / {data.length}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {summary.areasWithReadings} memiliki data bacaan
            </p>
          </div>
          <div className="col-span-2 rounded-md bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Cakupan peta
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
              {summary.readings.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              bacaan terhubung ke poligon layanan
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-1 text-xs font-semibold text-foreground">
            Area dengan persentase tertinggi
          </h3>
          {topAreas.length > 0 ? (
            <ol className="divide-y divide-border">
              {topAreas.map((area) => (
                <li
                  key={area.kodeDesa}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {area.kelurahan}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {area.kecamatan} ·{" "}
                      {Number(area[currentMetric.countKey]).toLocaleString(
                        "id-ID",
                      )}{" "}
                      dari {area.jumlahBaca.toLocaleString("id-ID")} bacaan
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
                    {formatPercent(area[currentMetric.rateKey])}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
              Belum ada indikator untuk lapisan ini pada periode aktif.
            </p>
          )}
        </div>

      </aside>
    </div>
  );
}
