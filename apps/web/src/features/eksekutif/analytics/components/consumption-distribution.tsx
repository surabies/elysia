import {
  DistributionCard,
  RankedBarList,
  type RankedBarRow,
} from "@/components/charts/distribution-card";
import { formatNumber } from "../lib/format";
import type { ConsumptionBucket } from "@/server/services/dashboard/analytics.service";

export function ConsumptionDistribution({ data }: { data: ConsumptionBucket[] }) {
  const totalCustomers = data.reduce((sum, b) => sum + b.jumlahSL, 0);
  const totalVolume = data.reduce((sum, b) => sum + b.totalM3, 0);

  const rows: RankedBarRow[] = data.map((bucket) => ({
    key: bucket.kategori,
    label: bucket.label,
    value: bucket.jumlahSL,
    share: bucket.persentase,
  }));

  return (
    <DistributionCard
      title="Distribusi Rentang Kubikasi Air"
      summary={
        <>
          <p>{formatNumber(totalCustomers)} pelanggan</p>
          <p>{formatNumber(totalVolume)} m³</p>
        </>
      }
      isEmpty={data.length === 0}
      emptyMessage="Belum ada data kubikasi pada periode ini."
    >
      <RankedBarList
        rows={rows}
        headers={{ label: "Rentang", value: "Pelanggan" }}
        ariaLabel="Distribusi pelanggan berdasarkan rentang kubikasi"
      />
    </DistributionCard>
  );
}
