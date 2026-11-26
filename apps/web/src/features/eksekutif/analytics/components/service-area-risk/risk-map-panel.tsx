import type { FeatureCollection, Geometry } from "geojson";
import {
  ChoroplethChart,
  ChoroplethFeatureLayer,
  ChoroplethTooltip,
} from "@/components/charts/choropleth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "../../lib/format";
import {
  getFeatureCode,
  getRiskColor,
  type MappedServiceAreaRisk,
  type RiskFeatureProperties,
  type RiskMetric,
  type RiskMetricKey,
} from "../../lib/risk";

interface RiskMapPanelProps {
  className?: string;
  metricKey: RiskMetricKey;
  metric: RiskMetric;
  mapData: FeatureCollection<Geometry, RiskFeatureProperties>;
  areaByCode: ReadonlyMap<string, MappedServiceAreaRisk>;
  maxRate: number;
}

export function RiskMapPanel({
  className,
  metricKey,
  metric,
  mapData,
  areaByCode,
  maxRate,
}: RiskMapPanelProps) {
  const hasAreas = mapData.features.length > 0;

  return (
    <section
      aria-labelledby="risk-map-title"
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="risk-map-title" className="text-heading-16 text-foreground">
            Peta Risiko Pembacaan per Kelurahan
          </h2>
          <p className="mt-0.5 text-copy-13 text-muted-foreground">
            Sebaran spasial indikator risiko berdasarkan batas administrasi kelurahan.
          </p>
        </div>
        <Badge variant="subtle" size="md">
          {metric.label}
        </Badge>
      </div>

      {hasAreas ? (
        <div
          className="mt-3"
          role="group"
          aria-label={`Peta ${metric.label.toLowerCase()} per kelurahan`}
        >
          <ChoroplethChart
            data={mapData}
            className="min-h-56"
            aspectRatio="16 / 9"
            center={[107.6, -6.9]}
            zoomEnabled
            zoomMin={0.75}
            zoomMax={5}
            animationDuration={800}
            revealSignature={metricKey}
          >
            <ChoroplethFeatureLayer
              stroke="var(--background)"
              strokeWidth={0.8}
              getFeatureColor={({ properties }) =>
                getRiskColor(
                  areaByCode.get(getFeatureCode(properties))?.[metric.rateKey] ??
                    null,
                  maxRate,
                )
              }
            />
            <ChoroplethTooltip
              content={({ feature }) => {
                const area = areaByCode.get(
                  getFeatureCode(feature.properties),
                );
                if (!area) return null;

                return (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-label-13 font-semibold text-foreground">
                          {area.kelurahan}
                        </p>
                        <p className="truncate text-label-11 text-muted-foreground">
                          Kec. {area.kecamatan}
                        </p>
                      </div>
                      <Badge variant="gray-subtle" size="sm" className="shrink-0 font-mono">
                        {formatPercent(area[metric.rateKey])}
                      </Badge>
                    </div>

                    <div className="space-y-1 border-t border-border/60 pt-2 text-label-12">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatNumber(Number(area[metric.countKey]))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Total Bacaan</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatNumber(area.jumlahBaca)} SL
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </ChoroplethChart>
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-border px-4 py-8 text-center text-copy-13 text-muted-foreground">
          Belum ada geometri area layanan yang bisa digambar. Periksa sumber
          GeoJSON sebelum mengaktifkan peta.
        </p>
      )}
    </section>
  );
}
