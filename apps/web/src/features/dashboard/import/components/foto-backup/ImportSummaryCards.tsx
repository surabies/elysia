// features/dashboard/import/components/foto-backup/ImportSummaryCards.tsx
import * as React from "react";
import { Images, Users } from "lucide-react";
import { FOTO_JENIS_LIST, type FotoJenis } from "../../lib/foto-backup";
import { ImportStatCard, ImportStatGrid } from "../shared/ImportStatCard";

interface ImportSummaryCardsProps {
  totalBerkas: number;
  counts: Record<FotoJenis, number>;
  totalSL: number;
}

export function ImportSummaryCards({
  totalBerkas,
  counts,
  totalSL,
}: ImportSummaryCardsProps) {
  return (
    <ImportStatGrid columns={5}>
      <ImportStatCard
        label="Total Berkas"
        value={totalBerkas}
        unit="Foto"
        caption="Terunggah dari HP"
        icon={Images}
      />

      {FOTO_JENIS_LIST.map((meta) => (
        <ImportStatCard
          key={meta.key}
          label={meta.summaryLabel}
          value={counts[meta.key]}
          unit="Berkas"
          caption={meta.summaryCaption}
          icon={meta.icon}
          tone={meta.tone}
        />
      ))}

      <ImportStatCard
        label="Cakupan SL"
        value={totalSL}
        unit="Pelanggan"
        caption="Teridentifikasi"
        icon={Users}
        tone="green"
      />
    </ImportStatGrid>
  );
}
