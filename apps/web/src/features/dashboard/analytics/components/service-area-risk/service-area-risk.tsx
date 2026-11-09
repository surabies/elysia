"use client";

import { useMemo, useState } from "react";
import {
  RISK_METRICS,
  hasGeometry,
  maxRiskRate,
  rankRiskAreas,
  summarizeRisk,
  toFeatureCollection,
  type RiskMetricKey,
} from "../../lib/risk";
import { RiskMapPanel } from "./risk-map-panel";
import { RiskSummaryPanel } from "./risk-summary-panel";
import type { ServiceAreaRisk as ServiceAreaRiskData } from "@/server/services/dashboard/analytics.service";

export function ServiceAreaRisk({ data }: { data: ServiceAreaRiskData[] }) {
  const [metricKey, setMetricKey] = useState<RiskMetricKey>("nonNormal");
  const metric = RISK_METRICS[metricKey];

  const areas = useMemo(() => data.filter(hasGeometry), [data]);
  const areaByCode = useMemo(
    () => new Map(areas.map((area) => [area.kodeDesa, area] as const)),
    [areas],
  );
  const mapData = useMemo(() => toFeatureCollection(areas), [areas]);
  const summary = useMemo(() => summarizeRisk(areas, metric), [areas, metric]);
  const topAreas = useMemo(() => rankRiskAreas(areas, metric), [areas, metric]);
  const maxRate = useMemo(() => maxRiskRate(areas, metric), [areas, metric]);

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.9fr)]">
      <RiskMapPanel
        className="order-2 xl:order-1"
        metricKey={metricKey}
        metric={metric}
        mapData={mapData}
        areaByCode={areaByCode}
        maxRate={maxRate}
      />
      <RiskSummaryPanel
        className="order-1 xl:order-2"
        metricKey={metricKey}
        onMetricChange={setMetricKey}
        metric={metric}
        summary={summary}
        topAreas={topAreas}
        totalAreas={data.length}
      />
    </div>
  );
}
