"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, CHART_HEIGHT } from "@/components/charts/chart-card";
import { TooltipPanel, TooltipRow } from "@/components/charts/chart-tooltip";
import {
  DistributionCard,
  RankedBarList,
  type RankedBarRow,
} from "@/components/charts/distribution-card";
import { HoverSelect, type SelectOption } from "@/components/charts/hover-select";
import { Button } from "@/components/ui/button";
import { useHasMounted } from "@/hooks/use-has-mounted";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

/* -------------------------------------------------------------------------- */
/*                                 FORMATTERS                                 */
/* -------------------------------------------------------------------------- */

const numberFormat = new Intl.NumberFormat("id-ID");
const currencyFormat = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatNumber(val: number): string {
  return numberFormat.format(val);
}

function formatCurrency(val: number): string {
  return currencyFormat.format(val);
}

function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/* -------------------------------------------------------------------------- */
/*                        1. DISTRIBUSI KELURAHAN                             */
/* -------------------------------------------------------------------------- */

function KelurahanBillingChart({
  data,
}: {
  data: DrdSummary["dataKelurahan"];
}) {
  const hasMounted = useHasMounted();

  const totalTagihan = useMemo(
    () => data.reduce((sum, item) => sum + item.totalTagihan, 0),
    [data]
  );

  return (
    <ChartCard
      title="Distribusi Tagihan per Kelurahan"
      legendLabel="Total Tagihan"
      legendValue={formatCompactRupiah(totalTagihan)}
    >
      {!hasMounted ? (
        <div
          className="flex w-full items-center justify-center"
          style={{ height: CHART_HEIGHT }}
        >
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Belum ada data kelurahan
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={data}
            margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="var(--ds-gray-alpha-300)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
            <XAxis
              dataKey="nama"
              stroke="none"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={6}
              interval={0}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(val: string) =>
                val.length > 8 ? `${val.slice(0, 7)}…` : val
              }
            />
            <YAxis width={1} tickLine={false} axisLine={false} tick={false} />
            <Tooltip
              cursor={{ fill: "var(--ds-gray-alpha-200, rgba(0,0,0,0.04))" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as
                  | DrdSummary["dataKelurahan"][number]
                  | undefined;
                if (!active || !point) return null;
                return (
                  <TooltipPanel title={point.nama}>
                    <TooltipRow
                      color="#0284c7"
                      label="Tagihan"
                      value={formatCurrency(point.totalTagihan)}
                    />
                    <TooltipRow
                      color="#10b981"
                      label="Pemakaian"
                      value={`${formatNumber(point.pemakaianM3)} m³`}
                    />
                  </TooltipPanel>
                );
              }}
            />
            <Bar
              dataKey="totalTagihan"
              fill="#0284c7"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                        2. CAKUPAN LAYANAN WILAYAH                          */
/* -------------------------------------------------------------------------- */

const COVERAGE_METRICS = {
  sl: { label: "Sambungan (SL)", unit: "SL", color: "#0284c7" },
  pemakaianM3: { label: "Konsumsi (m³)", unit: "m³", color: "#10b981" },
} as const;

type CoverageMetric = keyof typeof COVERAGE_METRICS;

const COVERAGE_OPTIONS: SelectOption<CoverageMetric>[] = [
  { value: "sl", label: COVERAGE_METRICS.sl.label },
  { value: "pemakaianM3", label: COVERAGE_METRICS.pemakaianM3.label },
];

function CoverageChart({ data }: { data: DrdSummary["dataCakupan"] }) {
  const [metric, setMetric] = useState<CoverageMetric>("sl");
  const hasMounted = useHasMounted();

  const totalSL = useMemo(
    () => data.reduce((sum, item) => sum + item.sl, 0),
    [data]
  );
  const totalM3 = useMemo(
    () => data.reduce((sum, item) => sum + item.pemakaianM3, 0),
    [data]
  );

  const activeConfig = COVERAGE_METRICS[metric];

  return (
    <ChartCard
      title="Cakupan Layanan Wilayah"
      legendLabel={
        <HoverSelect
          label="Pilih metrik"
          value={metric}
          options={COVERAGE_OPTIONS}
          onValueChange={setMetric}
        />
      }
      legendValue={
        metric === "sl"
          ? `${formatNumber(totalSL)} SL`
          : `${formatNumber(totalM3)} m³`
      }
    >
      {!hasMounted ? (
        <div
          className="flex w-full items-center justify-center"
          style={{ height: CHART_HEIGHT }}
        >
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Belum ada data cakupan wilayah
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={data}
            margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="var(--ds-gray-alpha-300)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
            <XAxis
              dataKey="kelurahan"
              stroke="none"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={6}
              interval={0}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(val: string) =>
                val.length > 8 ? `${val.slice(0, 7)}…` : val
              }
            />
            <YAxis width={1} tickLine={false} axisLine={false} tick={false} />
            <Tooltip
              cursor={{ fill: "var(--ds-gray-alpha-200, rgba(0,0,0,0.04))" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as
                  | DrdSummary["dataCakupan"][number]
                  | undefined;
                if (!active || !point) return null;
                return (
                  <TooltipPanel title={point.kelurahan}>
                    <TooltipRow
                      color="#0284c7"
                      label="Sambungan"
                      value={`${formatNumber(point.sl)} SL`}
                    />
                    <TooltipRow
                      color="#10b981"
                      label="Konsumsi"
                      value={`${formatNumber(point.pemakaianM3)} m³`}
                    />
                  </TooltipPanel>
                );
              }}
            />
            <Bar
              dataKey={metric}
              fill={activeConfig.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                        3. SEGMENTASI DOMESTIK                              */
/* -------------------------------------------------------------------------- */

function DomesticSegmentationChart({
  data,
  totalDomestic,
}: {
  data: DrdSummary["dataDomestik"];
  totalDomestic: number;
}) {
  const hasMounted = useHasMounted();

  return (
    <ChartCard
      title="Segmentasi Domestik"
      legendLabel="Total Domestik"
      legendValue={`${formatNumber(totalDomestic)} SL`}
    >
      {!hasMounted ? (
        <div
          className="flex w-full items-center justify-center"
          style={{ height: CHART_HEIGHT }}
        >
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Belum ada data sambungan domestik
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={data}
            margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="var(--ds-gray-alpha-300)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
            <XAxis
              dataKey="kode"
              stroke="none"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={6}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis width={1} tickLine={false} axisLine={false} tick={false} />
            <Tooltip
              cursor={{ fill: "var(--ds-gray-alpha-200, rgba(0,0,0,0.04))" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as
                  | DrdSummary["dataDomestik"][number]
                  | undefined;
                if (!active || !point) return null;
                return (
                  <TooltipPanel title={`Golongan Domestik ${point.kode}`}>
                    <TooltipRow
                      color="#0284c7"
                      label="Pemakaian"
                      value={`${formatNumber(point.pemakaianM3)} m³`}
                    />
                    <TooltipRow
                      color="#10b981"
                      label="Nilai Tagihan"
                      value={formatCurrency(point.totalTagihan)}
                    />
                  </TooltipPanel>
                );
              }}
            />
            <Bar
              dataKey="pemakaianM3"
              fill="#0284c7"
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                        4. SEBARAN TAA PER KELURAHAN                        */
/* -------------------------------------------------------------------------- */

function TaaKelurahanChart({
  data,
}: {
  data: DrdSummary["dataTaaKelurahan"];
}) {
  const hasMounted = useHasMounted();

  const totalTaa = useMemo(
    () => data.reduce((sum, item) => sum + item.jumlahTaa, 0),
    [data]
  );

  return (
    <ChartCard
      title="Sebaran TAA per Kelurahan"
      legendLabel="Total TAA"
      legendValue={`${formatNumber(totalTaa)} Rekening`}
    >
      {!hasMounted ? (
        <div
          className="flex w-full items-center justify-center"
          style={{ height: CHART_HEIGHT }}
        >
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Tidak ada catatan TAA pada kelurahan
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={data}
            margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="var(--ds-gray-alpha-300)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
            <XAxis
              dataKey="kelurahan"
              stroke="none"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={6}
              interval={0}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(val: string) =>
                val.length > 8 ? `${val.slice(0, 7)}…` : val
              }
            />
            <YAxis width={1} tickLine={false} axisLine={false} tick={false} />
            <Tooltip
              cursor={{ fill: "var(--ds-gray-alpha-200, rgba(0,0,0,0.04))" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as
                  | DrdSummary["dataTaaKelurahan"][number]
                  | undefined;
                if (!active || !point) return null;
                return (
                  <TooltipPanel title={point.kelurahan}>
                    <TooltipRow
                      color="#f59e0b"
                      label="Rekening TAA"
                      value={`${formatNumber(point.jumlahTaa)} Rekening`}
                    />
                  </TooltipPanel>
                );
              }}
            />
            <Bar
              dataKey="jumlahTaa"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                        5. KOMPOSISI TARIF (DISTRIBUTION)                   */
/* -------------------------------------------------------------------------- */

const TARIF_INITIAL_COUNT = 5;

function TariffDistribution({ data }: { data: DrdSummary["dataTarif"] }) {
  const [expanded, setExpanded] = useState(false);

  const activeTarif = useMemo(
    () => data.filter((item) => item.totalTagihan > 0),
    [data]
  );

  const totalTagihan = useMemo(
    () => activeTarif.reduce((sum, item) => sum + item.totalTagihan, 0),
    [activeTarif]
  );

  const sortedTarif = useMemo(
    () => [...activeTarif].sort((a, b) => b.totalTagihan - a.totalTagihan),
    [activeTarif]
  );

  const rows: RankedBarRow[] = useMemo(() => {
    const slice = expanded ? sortedTarif : sortedTarif.slice(0, TARIF_INITIAL_COUNT);
    return slice.map((t) => ({
      key: t.kode,
      label: t.nama,
      badge: t.kode,
      value: t.totalTagihan,
      formattedValue: formatCompactRupiah(t.totalTagihan),
      share: totalTagihan > 0 ? Math.round((t.totalTagihan / totalTagihan) * 100) : 0,
    }));
  }, [expanded, sortedTarif, totalTagihan]);

  const canToggle = sortedTarif.length > TARIF_INITIAL_COUNT;

  return (
    <DistributionCard
      title="Komposisi Tagihan per Tarif"
      summary={
        activeTarif.length > 0 && (
          <>
            <p>{formatCompactRupiah(totalTagihan)}</p>
            <p>{activeTarif.length} kelompok tarif</p>
          </>
        )
      }
      isEmpty={activeTarif.length === 0}
      emptyMessage="Belum ada tagihan tarif pada periode ini."
    >
      <RankedBarList
        rows={rows}
        headers={{ label: "Kelompok Tarif", value: "Tagihan" }}
        ariaLabel="Peringkat tagihan berdasarkan kelompok tarif"
        className={expanded ? "max-h-80 overflow-y-auto" : undefined}
      />

      {canToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 h-7 self-start px-2 text-xs text-muted-foreground"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
          {expanded
            ? "Tampilkan ringkas"
            : `Lihat semua ${sortedTarif.length} kelompok tarif`}
        </Button>
      )}
    </DistributionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                     6. RASIO STATUS TAA (DISTRIBUTION)                     */
/* -------------------------------------------------------------------------- */

function TaaServiceRatioDistribution({
  data,
}: {
  data: DrdSummary["dataTaaStatus"];
}) {
  const totalRekening = data.normal + data.taa;
  const persenNormal = totalRekening > 0 ? 100 - data.persenTaa : 0;

  const rows: RankedBarRow[] = useMemo(() => {
    const totalTaaTarif = data.sebaranTarif.reduce(
      (sum, item) => sum + item.jumlahTaa,
      0
    );
    return data.sebaranTarif
      .filter((item) => item.jumlahTaa > 0)
      .sort((a, b) => b.jumlahTaa - a.jumlahTaa)
      .map((item) => ({
        key: item.kode,
        label: `Golongan Tarif ${item.kode}`,
        badge: item.kode,
        value: item.jumlahTaa,
        formattedValue: `${formatNumber(item.jumlahTaa)} rek`,
        share:
          totalTaaTarif > 0
            ? Math.round((item.jumlahTaa / totalTaaTarif) * 100)
            : 0,
      }));
  }, [data.sebaranTarif]);

  return (
    <DistributionCard
      title="Rasio Layanan & Status TAA"
      summary={
        totalRekening > 0 && (
          <>
            <p>{data.persenTaa}% Anomali TAA</p>
            <p>{formatNumber(totalRekening)} total rekening</p>
          </>
        )
      }
      isEmpty={totalRekening === 0}
      emptyMessage="Belum ada data status rekening."
    >
      <div className="mt-3 space-y-3">
        {/* Horizontal proportion strip */}
        <div className="space-y-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${persenNormal}%` }}
              title={`Normal: ${persenNormal}%`}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${data.persenTaa}%` }}
              title={`TAA: ${data.persenTaa}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500" />
              Normal {formatNumber(data.normal)} ({persenNormal}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <span className="size-2 rounded-full bg-amber-500" />
              TAA {formatNumber(data.taa)} ({data.persenTaa}%)
            </span>
          </div>
        </div>

        {/* Breakdown tarif sebaran TAA */}
        {rows.length > 0 && (
          <div className="border-t border-border/60 pt-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              Sebaran Kasus TAA per Tarif:
            </p>
            <RankedBarList
              rows={rows}
              headers={{ label: "Tarif", value: "Rekening" }}
              ariaLabel="Sebaran kasus TAA per kelompok tarif"
              className="mt-1.5 max-h-48 overflow-y-auto"
            />
          </div>
        )}
      </div>
    </DistributionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                   7. KOMPONEN TAGIHAN DRD (DISTRIBUTION)                   */
/* -------------------------------------------------------------------------- */

function BillingComponentsDistribution({
  data,
}: {
  data: DrdSummary["dataTagihanKomposisi"];
}) {
  const items = useMemo(
    () => [
      { key: "hargaAir", label: "Harga Air", value: data.hargaAir, badge: "AIR" },
      { key: "beaBeban", label: "Bea Beban Tetap", value: data.beaBeban, badge: "BBN" },
      { key: "beaAdmin", label: "Bea Administrasi", value: data.beaAdmin, badge: "ADM" },
      { key: "airKotor", label: "Pelayanan Air Kotor", value: data.airKotor, badge: "KTR" },
      { key: "lainLain", label: "Pendapatan Lain-lain", value: data.lainLain, badge: "LAIN" },
    ],
    [data]
  );

  const totalKomposisi = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items]
  );

  const rows: RankedBarRow[] = useMemo(() => {
    return items
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        key: item.key,
        label: item.label,
        badge: item.badge,
        value: item.value,
        formattedValue: formatCompactRupiah(item.value),
        share:
          totalKomposisi > 0
            ? Math.round((item.value / totalKomposisi) * 100)
            : 0,
      }));
  }, [items, totalKomposisi]);

  return (
    <DistributionCard
      title="Komponen Tagihan DRD"
      summary={
        totalKomposisi > 0 && (
          <>
            <p>{formatCompactRupiah(totalKomposisi)}</p>
            <p>5 komponen pendapatan</p>
          </>
        )
      }
      isEmpty={totalKomposisi === 0}
      emptyMessage="Belum ada komponen tagihan pada periode ini."
    >
      <RankedBarList
        rows={rows}
        headers={{ label: "Komponen", value: "Nominal" }}
        ariaLabel="Rincian komponen tagihan DRD"
      />
    </DistributionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN EXPORT                                   */
/* -------------------------------------------------------------------------- */

export function DrdCharts({ data }: { data: DrdSummary }) {
  return (
    <div className="space-y-4">
      {/* Baris 1: Sisi Spasial & Volume Layanan */}
      <div className="grid gap-4 xl:grid-cols-2">
        <KelurahanBillingChart data={data.dataKelurahan} />
        <CoverageChart data={data.dataCakupan} />
      </div>

      {/* Baris 2: Segmentasi Domestik & Anomali Wilayah */}
      <div className="grid gap-4 xl:grid-cols-2">
        <DomesticSegmentationChart
          data={data.dataDomestik}
          totalDomestic={data.jumlahDomestik}
        />
        <TaaKelurahanChart data={data.dataTaaKelurahan} />
      </div>

      {/* Baris 3: Distribusi Proporsi Finansial & Risiko */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TariffDistribution data={data.dataTarif} />
        <TaaServiceRatioDistribution data={data.dataTaaStatus} />
        <BillingComponentsDistribution data={data.dataTagihanKomposisi} />
      </div>
    </div>
  );
}
