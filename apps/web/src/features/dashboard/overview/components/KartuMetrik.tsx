import Link from "next/link";
import {
  ArrowUpRight,
  Droplets,
  Gauge,
  Receipt,
  Users as UsersIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  DashboardMetricSummary,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka, formatRupiah } from "../lib/format-ringkasan";

interface KartuMetrikProps {
  periode: PeriodeInfo;
  summary: DashboardMetricSummary;
}

export function KartuMetrik({ periode, summary }: KartuMetrikProps) {
  return (
    <section>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading-14 text-foreground">
          Metrik Operasional Utama
        </h2>
        <span className="text-label-12-mono tabular-nums text-muted-foreground sm:text-right">
          {formatAngka(summary.totalRute)} Rute &bull; {summary.totalPetugas}{" "}
          Petugas Aktif
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div>
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <CardTitle className="text-label-13 text-muted-foreground">
                Total Pelanggan Aktif
              </CardTitle>
              <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-heading-24 tabular-nums text-foreground">
                {formatAngka(summary.totalPelanggan)}
              </div>
              <p className="mt-0.5 text-copy-12 text-muted-foreground">
                Sambungan Langganan (SL) terdaftar
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Rute Terpetakan</span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    {summary.totalRute} Rute
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Zona Wilayah</span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    4 Wilayah
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
          <div className="mt-4">
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full justify-between"
            >
              <Link href="/pelanggan">
                <span>Buka Data Pelanggan</span>
                <ArrowUpRight className="size-3.5 opacity-80" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div>
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <CardTitle className="text-label-13 text-muted-foreground">
                Capaian Catat Meter
              </CardTitle>
              <Gauge className="size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-heading-24 tabular-nums text-foreground">
                {formatAngka(summary.totalCater)}
              </div>
              <p className="mt-0.5 text-copy-12 text-muted-foreground">
                Progres {summary.persenSelesai}% terbaca
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Stand Normal</span>
                  <span className="text-label-13 tabular-nums text-(--ds-green-700) dark:text-(--ds-green-800)">
                    {formatAngka(summary.totalNormal)} (
                    {summary.totalCater > 0
                      ? Math.round(
                          (summary.totalNormal / summary.totalCater) * 100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    Anomali / Kendala
                  </span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    {formatAngka(summary.totalAnomali)} SL
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
          <div className="mt-4">
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full justify-between"
            >
              <Link href="/cater">
                <span>Monitor Catat Meter</span>
                <ArrowUpRight className="size-3.5 opacity-80" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div>
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <CardTitle className="text-label-13 text-muted-foreground">
                Volume Air Terdistribusi
              </CardTitle>
              <Droplets className="size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-heading-24 tabular-nums text-foreground">
                {formatAngka(summary.totalKubikasiM3)} m³
              </div>
              <p className="mt-0.5 text-copy-12 text-muted-foreground">
                Total pemakaian air terbaca
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    Rata-rata Konsumsi
                  </span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    {summary.totalPelanggan > 0
                      ? (
                          summary.totalKubikasiM3 / summary.totalPelanggan
                        ).toFixed(1)
                      : 0}{" "}
                    m³ / SL
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    Petugas Lapangan
                  </span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    {summary.totalPetugas} Cater Aktif
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
          <div className="mt-4">
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full justify-between"
            >
              <Link href="/progres/cater">
                <span>Produktivitas Cater</span>
                <ArrowUpRight className="size-3.5 opacity-80" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div>
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <CardTitle className="text-label-13 text-muted-foreground">
                Rekening Tagihan (DRD)
              </CardTitle>
              <Receipt className="size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-heading-24 tabular-nums text-foreground">
                {formatRupiah(summary.totalRupiahDrd)}
              </div>
              <p className="mt-0.5 text-copy-12 text-muted-foreground">
                Nilai tagihan periode {periode.label}
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-copy-13">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    Rata-rata Rekening
                  </span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    {summary.totalPelanggan > 0
                      ? formatRupiah(
                          Math.round(
                            summary.totalRupiahDrd / summary.totalPelanggan,
                          ),
                        )
                      : "Rp 0"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Lembar Terbit</span>
                  <span className="text-label-13 tabular-nums text-foreground">
                    {formatAngka(summary.totalCater)} Lembar
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
          <div className="mt-4">
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full justify-between"
            >
              <Link href="/laporan/lap-drd">
                <span>Lihat Rekap DRD</span>
                <ArrowUpRight className="size-3.5 opacity-80" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
