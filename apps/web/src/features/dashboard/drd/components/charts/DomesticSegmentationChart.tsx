"use client";

import { useMemo, useState } from "react";
import { VercelBarChart, type VercelBarPoint } from "@/components/charts/vercel-bar-chart";
import { VercelChartCard, type VercelBreakdownRow } from "./VercelChartCard";
import {
  formatCompactRupiah,
  formatCompactYAxisCurrency,
  formatCompactYAxisNumber,
  formatCurrency,
  formatNumber,
} from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

export function DomesticSegmentationChart({
  data,
  totalDomestic,
}: {
  data: DrdSummary["dataDomestik"];
  totalDomestic: number;
}) {
  const [metric, setMetric] = useState<"pemakaianM3" | "totalTagihan">("pemakaianM3");

  const totalVolume = useMemo(
    () => data.reduce((sum, item) => sum + item.pemakaianM3, 0),
    [data]
  );
  const totalTagihan = useMemo(
    () => data.reduce((sum, item) => sum + item.totalTagihan, 0),
    [data]
  );

  const chartData: VercelBarPoint[] = useMemo(() => {
    return data.map((d) => ({
      key: d.kode,
      label: `Golongan ${d.kode} (${d.nama})`,
      shortLabel: d.kode,
      value: metric === "pemakaianM3" ? d.pemakaianM3 : d.totalTagihan,
      formattedValue:
        metric === "pemakaianM3"
          ? `${formatNumber(d.pemakaianM3)} m³`
          : formatCurrency(d.totalTagihan),
    }));
  }, [data, metric]);

  const breakdownRows: VercelBreakdownRow[] = useMemo(() => {
    return data.map((item, idx) => {
      const colors = [
        "var(--ds-blue-700)",
        "var(--ds-teal-700)",
        "var(--ds-amber-700)",
        "var(--ds-purple-700)",
      ];
      const color = colors[idx % colors.length];
      const val =
        metric === "pemakaianM3"
          ? `${formatNumber(item.pemakaianM3)} m³`
          : formatCompactRupiah(item.totalTagihan);
      const totalBase = metric === "pemakaianM3" ? totalVolume : totalTagihan;
      const share =
        totalBase > 0
          ? `${(((metric === "pemakaianM3" ? item.pemakaianM3 : item.totalTagihan) / totalBase) * 100).toFixed(1)}%`
          : "—";

      return {
        color,
        label: `Golongan ${item.kode} (${item.nama})`,
        value: val,
        share,
      };
    });
  }, [data, metric, totalVolume, totalTagihan]);

  return (
    <VercelChartCard
      title="Segmentasi Sambungan Domestik"
      description="Komposisi pemakaian air dan nilai tagihan kelompok pelanggan rumah tangga (2A1–2A4)."
      meter={{
        current: `${formatNumber(totalDomestic)} SL`,
        total: "Sambungan Domestik",
        percent: 100,
        color: "var(--ds-blue-700)",
      }}
      tabs={[
        { value: "pemakaianM3", label: "Volume (m³)" },
        { value: "totalTagihan", label: "Tagihan (Rp)" },
      ]}
      activeTab={metric}
      onTabChange={(val) => setMetric(val as "pemakaianM3" | "totalTagihan")}
      updatedText="Diperbarui periode aktif"
      breakdownRows={breakdownRows}
      isEmpty={data.length === 0}
      emptyMessage="Belum ada data sambungan domestik pada periode ini."
    >
      <VercelBarChart
        data={chartData}
        yFormatter={(val) =>
          metric === "pemakaianM3"
            ? formatCompactYAxisNumber(val)
            : formatCompactYAxisCurrency(val)
        }
        barColor={metric === "pemakaianM3" ? "var(--ds-blue-700)" : "var(--ds-amber-700)"}
        seriesName={metric === "pemakaianM3" ? "Volume Konsumsi" : "Nilai Tagihan"}
      />
    </VercelChartCard>
  );
}
