import Link from "next/link";
import {
  Gauge,
  Receipt,
  Users as UsersIcon,
  Droplets,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/reui/icon-tile";
import type {
  DashboardMetricSummary,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka, formatRupiah } from "./format-ringkasan";

interface KartuMetrikProps {
  periode: PeriodeInfo;
  summary: DashboardMetricSummary;
}

export function KartuMetrik({ periode, summary }: KartuMetrikProps) {
  return (
    <section>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-label-12 font-medium uppercase tracking-wider text-muted-foreground">
          Metrik Operasional Utama (Data Riil Database)
        </h2>
        <span className="font-mono text-label-12 text-muted-foreground sm:text-right">
          {formatAngka(summary.totalRute)} Rute &bull; {summary.totalPetugas}{" "}
          Petugas Aktif
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-label-12 font-medium uppercase tracking-wider text-muted-foreground">
              Total Pelanggan Aktif
            </CardTitle>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <UsersIcon />
            </IconTile>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="text-heading-24 text-foreground">
              {formatAngka(summary.totalPelanggan)}
            </div>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Sambungan Langganan (SL) Terdaftar
            </p>
            <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Rute Terpetakan</span>
                <span className="font-medium text-foreground">
                  {summary.totalRute} Rute
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Zona Wilayah</span>
                <span className="font-medium text-foreground">4 Wilayah</span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                asChild
                variant="default"
                size="default"
                className="w-full"
              >
                <Link href="/pelanggan">Buka Data Pelanggan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-label-12 font-medium uppercase tracking-wider text-muted-foreground">
              Capaian Catat Meter (Cater)
            </CardTitle>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Gauge />
            </IconTile>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="text-heading-24 text-foreground">
              {formatAngka(summary.totalCater)}
            </div>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Progres {summary.persenSelesai}% Terbaca
            </p>
            <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Stand Normal</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatAngka(summary.totalNormal)} (
                  {summary.totalCater > 0
                    ? Math.round(
                        (summary.totalNormal / summary.totalCater) * 100,
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">
                  Anomali / Kendala
                </span>
                <span className="font-medium text-foreground">
                  {formatAngka(summary.totalAnomali)} SL
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                asChild
                variant="default"
                size="default"
                className="w-full"
              >
                <Link href="/cater">Monitor Catat Meter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-label-12 font-medium uppercase tracking-wider text-muted-foreground">
              Volume Air Terdistribusi
            </CardTitle>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Droplets />
            </IconTile>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="text-heading-24 text-foreground">
              {formatAngka(summary.totalKubikasiM3)} m³
            </div>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Total Pemakaian Air Terbaca
            </p>
            <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">
                  Rata-rata Konsumsi
                </span>
                <span className="font-medium text-foreground">
                  {summary.totalPelanggan > 0
                    ? (
                        summary.totalKubikasiM3 / summary.totalPelanggan
                      ).toFixed(1)
                    : 0}{" "}
                  m³ / SL
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">
                  Petugas Lapangan
                </span>
                <span className="font-medium text-foreground">
                  {summary.totalPetugas} Cater Aktif
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                asChild
                variant="default"
                size="default"
                className="w-full"
              >
                <Link href="/progres/cater">Produktivitas Cater</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-label-12 font-medium uppercase tracking-wider text-muted-foreground">
              Rekening Tagihan (DRD)
            </CardTitle>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Receipt />
            </IconTile>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="text-heading-24 text-foreground">
              {formatRupiah(summary.totalRupiahDrd)}
            </div>
            <p className="mt-0.5 text-copy-13 text-muted-foreground">
              Nilai Tagihan Periode {periode.label}
            </p>
            <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">
                  Rata-rata Rekening
                </span>
                <span className="font-medium text-foreground">
                  {summary.totalPelanggan > 0
                    ? formatRupiah(
                        Math.round(
                          summary.totalRupiahDrd / summary.totalPelanggan,
                        ),
                      )
                    : "Rp 0"}
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Lembar Terbit</span>
                <span className="font-medium text-foreground">
                  {formatAngka(summary.totalCater)} Lembar
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                asChild
                variant="default"
                size="default"
                className="w-full"
              >
                <Link href="/laporan/lap-drd">Lihat Rekap DRD</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
