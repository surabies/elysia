import type { Metadata } from "next";
import {
  AlertTriangle,
  Droplets,
  MapPin,
  Receipt,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { IconTile } from "@/components/reui/icon-tile";
import {
  DrdCharts,
  DrdCsvExportButton,
  DrdNavbarControls,
  DrdTable,
} from "@/features/dashboard/drd";
import {
  drdService,
  type DrdTab,
} from "@/server/services/dashboard/drd.service";

export const metadata: Metadata = {
  title: "Laporan DRD — PDAM Tirtawening",
  description:
    "Ringkasan, analisis, dan rincian Daftar Rekening Ditagih berdasarkan periode.",
};

const formatAngka = (value: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
        </div>
        <IconTile
          aria-hidden="true"
          size="sm"
          variant="frame"
          className="text-muted-foreground"
        >
          <Icon />
        </IconTile>
      </CardContent>
    </Card>
  );
}

export default async function LaporanDrdPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await drdService.getPageData({
    thbl: firstValue(params.periode),
    tab: firstValue(params.tab),
    page: firstValue(params.page),
    pageSize: firstValue(params.pageSize),
    q: firstValue(params.q),
  });
  const periodLabel = data.periodeAktif
    ? new Date(
        Number(data.periodeAktif.slice(0, 4)),
        Number(data.periodeAktif.slice(4, 6)) - 1,
        1,
      ).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : "Belum tersedia";
  const summary = data.ringkasan;

  return (
    <PageContainer
      penuh={!summary}
      className={
        summary
          ? "space-y-5"
          : "flex h-full min-h-0 flex-col overflow-hidden"
      }
    >
      <DrdNavbarControls
        period={data.periodeAktif}
        periods={data.periodes}
        tab={data.tab}
        query={data.pencarian}
        page={data.halaman}
        pageSize={data.ukuranHalaman}
        total={data.total}
        totalPages={data.totalHalaman}
        exportAction={
          summary ? undefined : (
            <DrdCsvExportButton
              columns={data.kolom}
              rows={data.baris}
              period={data.periodeAktif}
              tab={data.tab as Exclude<DrdTab, "ringkasan">}
            />
          )
        }
      />

      {summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              label="Lembar tagihan"
              value={formatAngka(summary.jumlahPelanggan)}
              detail={periodLabel}
              icon={Users}
            />
            <MetricCard
              label="Pemakaian air"
              value={`${formatAngka(summary.pemakaianM3)} m³`}
              detail="Akumulasi periode"
              icon={Droplets}
            />
            <MetricCard
              label="Total tagihan"
              value={formatRupiah(summary.totalTagihan)}
              detail="Nilai DRD periode"
              icon={Receipt}
            />
            <MetricCard
              label="Catatan TAA"
              value={formatAngka(summary.jumlahTaa)}
              detail={`${summary.dataTaaStatus.persenTaa}% dari lembar tagihan`}
              icon={AlertTriangle}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            Data mencakup {formatAngka(summary.jumlahKelurahan)} kelurahan dan{" "}
            {formatAngka(summary.jumlahDomestik)} sambungan domestik.
          </div>
          <DrdCharts data={summary} />
        </div>
      ) : (
        <DrdTable
          columns={data.kolom}
          rows={data.baris}
          footer={data.barisFooter}
          period={data.periodeAktif}
          tab={data.tab as Exclude<DrdTab, "ringkasan">}
        />
      )}
    </PageContainer>
  );
}
