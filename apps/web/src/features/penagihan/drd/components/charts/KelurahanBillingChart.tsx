"use client";

import { useMemo } from "react";
import { VercelBarChart, type VercelBarPoint } from "@/components/charts/vercel-bar-chart";
import { VercelChartCard, type VercelBreakdownRow } from "./VercelChartCard";
import {
  formatCompactNumber,
  formatCompactRupiah,
  formatCompactYAxisCurrency,
  formatCurrency,
  truncateLabel,
} from "./drd-chart-utils";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

export function KelurahanBillingChart({
  data,
}: {
  data: DrdSummary["dataKelurahan"];
}) {
  const totalTagihan = useMemo(
    () => data.reduce((sum, item) => sum + item.totalTagihan, 0),
    [data]
  );
  const totalM3 = useMemo(
    () => data.reduce((sum, item) => sum + item.pemakaianM3, 0),
    [data]
  );

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.totalTagihan - a.totalTagihan),
    [data]
  );

  // Take top 8 kelurahan to maintain clean spacing and zero X-axis label overlap
  const displayData = useMemo(() => sortedData.slice(0, 8), [sortedData]);

  const chartData: VercelBarPoint[] = useMemo(() => {
    return displayData.map((d) => ({
      key: d.kode,
      label: d.nama,
      shortLabel: truncateLabel(d.nama, 8),
      value: d.totalTagihan,
      formattedValue: formatCurrency(d.totalTagihan),
    }));
  }, [displayData]);

  const breakdownRows: VercelBreakdownRow[] = useMemo(() => {
    if (sortedData.length === 0) return [];
    const top1 = sortedData[0];
    const top2 = sortedData[1];
    const sumTop2 = (top1?.totalTagihan || 0) + (top2?.totalTagihan || 0);
    const sumOthers = Math.max(0, totalTagihan - sumTop2);

    const rows: VercelBreakdownRow[] = [];
    if (top1) {
      const share1 = totalTagihan > 0 ? ((top1.totalTagihan / totalTagihan) * 100).toFixed(1) : "0";
      rows.push({
        color: "var(--ds-blue-700)",
        label: `Kelurahan ${top1.nama}`,
        value: formatCurrency(top1.totalTagihan),
        share: `${share1}%`,
      });
    }
    if (top2) {
      const share2 = totalTagihan > 0 ? ((top2.totalTagihan / totalTagihan) * 100).toFixed(1) : "0";
      rows.push({
        color: "var(--ds-teal-700)",
        label: `Kelurahan ${top2.nama}`,
        value: formatCurrency(top2.totalTagihan),
        share: `${share2}%`,
      });
    }
    if (sortedData.length > 2) {
      const shareOthers = totalTagihan > 0 ? ((sumOthers / totalTagihan) * 100).toFixed(1) : "0";
      rows.push({
        color: "var(--ds-gray-600)",
        label: `${sortedData.length - 2} Kelurahan Lainnya`,
        value: formatCurrency(sumOthers),
        share: `${shareOthers}%`,
      });
    }
    return rows;
  }, [sortedData, totalTagihan]);

  return (
    <VercelChartCard
      title="Distribusi Tagihan per Kelurahan"
      description="Akumulasi nilai rekening ditagih (DRD) per wilayah kelurahan pada periode aktif."
      meter={{
        current: formatCompactRupiah(totalTagihan),
        total: `${formatCompactNumber(totalM3)} m³`,
        percent: 100,
        color: "var(--ds-blue-700)",
      }}
      updatedText="Diperbarui periode aktif"
      breakdownRows={breakdownRows}
      isEmpty={data.length === 0}
      emptyMessage="Belum ada data kelurahan pada periode ini."
    >
      <VercelBarChart
        data={chartData}
        yFormatter={(val) => formatCompactYAxisCurrency(val)}
        barColor="var(--ds-blue-700)"
        seriesName="Total Tagihan"
      />
    </VercelChartCard>
  );
}
