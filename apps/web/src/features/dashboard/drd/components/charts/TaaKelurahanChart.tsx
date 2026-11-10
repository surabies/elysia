"use client";

import { useMemo } from "react";
import { VercelBarChart, type VercelBarPoint } from "@/components/charts/vercel-bar-chart";
import { VercelChartCard, type VercelBreakdownRow } from "./VercelChartCard";
import {
  formatCompactYAxisNumber,
  formatNumber,
  truncateLabel,
} from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

export function TaaKelurahanChart({
  data,
}: {
  data: DrdSummary["dataTaaKelurahan"];
}) {
  const totalTaa = useMemo(
    () => data.reduce((sum, item) => sum + item.jumlahTaa, 0),
    [data]
  );

  // Top 8 TAA areas
  const displayData = useMemo(() => data.slice(0, 8), [data]);

  const chartData: VercelBarPoint[] = useMemo(() => {
    return displayData.map((d) => ({
      key: d.kelurahan,
      label: d.kelurahan,
      shortLabel: truncateLabel(d.kelurahan, 8),
      value: d.jumlahTaa,
      formattedValue: `${formatNumber(d.jumlahTaa)} rek`,
    }));
  }, [displayData]);

  const breakdownRows: VercelBreakdownRow[] = useMemo(() => {
    if (data.length === 0) return [];
    const top3 = data.slice(0, 3);
    const sumTop3 = top3.reduce((s, it) => s + it.jumlahTaa, 0);
    const sumOthers = Math.max(0, totalTaa - sumTop3);

    const rows: VercelBreakdownRow[] = top3.map((it, idx) => {
      const colors = ["var(--ds-amber-700)", "var(--ds-teal-700)", "var(--ds-blue-700)"];
      return {
        color: colors[idx % colors.length],
        label: `Kelurahan ${it.kelurahan}`,
        value: `${formatNumber(it.jumlahTaa)} rek`,
        share: totalTaa > 0 ? `${((it.jumlahTaa / totalTaa) * 100).toFixed(1)}%` : "0%",
      };
    });

    if (data.length > 3) {
      rows.push({
        color: "var(--ds-gray-600)",
        label: `${data.length - 3} Wilayah Lainnya`,
        value: `${formatNumber(sumOthers)} rek`,
        share: totalTaa > 0 ? `${((sumOthers / totalTaa) * 100).toFixed(1)}%` : "0%",
      });
    }

    return rows;
  }, [data, totalTaa]);

  return (
    <VercelChartCard
      title="Sebaran Kasus TAA per Kelurahan"
      description="Konsentrasi anomali meter dan tanpa angka akhir (TAA) pada wilayah pembacaan meter."
      meter={{
        current: `${formatNumber(totalTaa)} Rekening`,
        total: "Kasus TAA Wilayah",
        percent: Math.min(100, Math.round((totalTaa / 500) * 100)),
        color: "var(--ds-amber-700)",
      }}
      updatedText="Diperbarui periode aktif"
      breakdownRows={breakdownRows}
      isEmpty={data.length === 0}
      emptyMessage="Tidak ada catatan kasus TAA pada kelurahan periode ini."
    >
      <VercelBarChart
        data={chartData}
        yFormatter={(val) => formatCompactYAxisNumber(val)}
        barColor="var(--ds-amber-700)"
        seriesName="Kasus TAA"
      />
    </VercelChartCard>
  );
}
