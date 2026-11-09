# Pemetaan file lama -> baru
page.tsx (UI + data)           -> app/.../analytics/page.tsx (routing + auth + fetch) + features/.../analytics-dashboard.tsx
CdnRequestsChart               -> features/.../daily-readings-chart.tsx
TopRegionsChart                -> features/.../regional-readings-chart.tsx
ConsumptionHistogramChart      -> features/.../consumption-distribution.tsx
ReadingStatusChart             -> features/.../reading-status-distribution.tsx
OfficerProductivityTable       -> features/.../officer-productivity-table.tsx
ServiceAreaRiskMap             -> features/.../service-area-risk/{service-area-risk,risk-map-panel,risk-summary-panel}.tsx + lib/risk.ts
VercelObservabilityCard        -> components/charts/chart-card.tsx
choropleth-*.tsx + index.ts    -> components/charts/choropleth/ (tidak diubah isinya, barrel dirapikan)

# Tidak dimigrasi (tidak dipakai page ini): hapus bila memang usang
RegionalTrendsChart, DailyReadingsAreaChart, CumulativeTargetLineChart, sparkline.ts
