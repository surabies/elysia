"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DistributionCard,
  RankedBarList,
  type RankedBarRow,
} from "@/components/charts/distribution-card";
import { STATUS_INITIAL_COUNT } from "../constants";
import { formatNumber } from "../lib/format";
import type { AnomalyCategory } from "@/server/services/dashboard/analytics.service";

/** Kode "01" (normal) dan catatan bebas tidak ditampilkan sebagai badge. */
function toRow(status: AnomalyCategory): RankedBarRow {
  const hideCode = status.kode === "01" || status.kode.startsWith("CATATAN:");

  return {
    key: status.kode,
    label: status.keterangan,
    value: status.jumlah,
    share: status.persentase,
    badge: hideCode ? null : status.kode,
  };
}

export function ReadingStatusDistribution({ data }: { data: AnomalyCategory[] }) {
  const [expanded, setExpanded] = useState(false);

  const total = data.reduce((sum, status) => sum + status.jumlah, 0);
  const rows = (expanded ? data : data.slice(0, STATUS_INITIAL_COUNT)).map(toRow);
  const canToggle = data.length > STATUS_INITIAL_COUNT;

  return (
    <DistributionCard
      title="Distribusi Status Pembacaan"
      summary={
        data.length > 0 && (
          <>
            <p>{formatNumber(total)} bacaan</p>
            <p>{data.length} status</p>
          </>
        )
      }
      isEmpty={data.length === 0}
      emptyMessage="Belum ada data status pembacaan pada periode ini."
    >
      <RankedBarList
        rows={rows}
        headers={{ label: "Status", value: "Bacaan" }}
        ariaLabel="Peringkat status pembacaan"
        className={expanded ? "max-h-80 overflow-y-auto" : undefined}
      />

      {canToggle && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 self-start"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-3.5" />
          )}
          {expanded ? "Tampilkan ringkas" : `Lihat semua ${data.length} status`}
        </Button>
      )}
    </DistributionCard>
  );
}
