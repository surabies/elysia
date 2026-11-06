import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/index";
import { PageContainer } from "@/components/layout/index";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gauge,
  Receipt,
  Users as UsersIcon,
  ArrowRight,
  Calendar,
  Building2,
  Droplets,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
} from "lucide-react";
import { dashboardService } from "@/src/server/services/dashboard/dashboard.service";

export const metadata: Metadata = {
  title: "Ringkasan Eksekutif — PDAM Tirtawening",
  description:
    "Pusat komando operasional 3 Pilar PDAM: Pencatatan Meter, Pelayanan Pengaduan, dan Penagihan.",
};

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatAngka = (val: number) => {
  return new Intl.NumberFormat("id-ID").format(val);
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const now = new Date();
  const tanggalHariIni = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Query database real-time via DashboardService (termasuk periode THBL aktif di database)
  const { periode, summary, wilayah, tarif, antrean } =
    await dashboardService.getDashboardData();

  return (
    <PageContainer className="space-y-6">
      <div className="rounded-lg border border-border bg-card px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              PDAM Tirtawening
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Ringkasan Operasional
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.name} <span className="px-1 text-border">/</span>
              {user.role}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-x-4 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Periode
              </p>
              <p className="truncate text-xs font-medium text-foreground">
                {periode.label}
              </p>
            </div>
            <div className="min-w-0 border-l border-border pl-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Kode
              </p>
              <p className="font-mono text-xs font-medium text-foreground">
                {periode.thbl}
              </p>
            </div>
            <div className="min-w-0 border-l border-border pl-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Hari ini
              </p>
              <p className="whitespace-nowrap text-xs font-medium text-foreground">
                {tanggalHariIni}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Kartu KPI Utama (Live Database) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Metrik Operasional Utama (Data Riil Database)
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {formatAngka(summary.totalRute)} Rute &bull; {summary.totalPetugas}{" "}
            Petugas Aktif
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Pelanggan Terlayani */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Pelanggan Aktif
              </CardTitle>
              <UsersIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {formatAngka(summary.totalPelanggan)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sambungan Langganan (SL) Terdaftar
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rute Terpetakan</span>
                  <span className="font-medium text-foreground">
                    {summary.totalRute} Rute
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zona Wilayah</span>
                  <span className="font-medium text-foreground">4 Wilayah</span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="w-full h-8 text-xs font-medium rounded-md"
                >
                  <Link href="/pelanggan">Buka Data Pelanggan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Capaian Pembacaan Meter */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Capaian Catat Meter (Cater)
              </CardTitle>
              <Gauge className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {formatAngka(summary.totalCater)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Progres {summary.persenSelesai}% Terbaca
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
                <div className="flex justify-between">
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
                <div className="flex justify-between">
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
                  size="sm"
                  className="w-full h-8 text-xs font-medium rounded-md"
                >
                  <Link href="/cater">Monitor Catat Meter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kubikasi Air Terjual */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Volume Air Terdistribusi
              </CardTitle>
              <Droplets className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {formatAngka(summary.totalKubikasiM3)} m³
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Pemakaian Air Terbaca
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
                <div className="flex justify-between">
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
                <div className="flex justify-between">
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
                  size="sm"
                  className="w-full h-8 text-xs font-medium rounded-md"
                >
                  <Link href="/progres/cater">Produktivitas Cater</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Rekening DRD Terbit */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rekening Tagihan (DRD)
              </CardTitle>
              <Receipt className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {formatRupiah(summary.totalRupiahDrd)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nilai Tagihan Periode {periode.label}
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
                <div className="flex justify-between">
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
                <div className="flex justify-between">
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
                  size="sm"
                  className="w-full h-8 text-xs font-medium rounded-md"
                >
                  <Link href="/laporan/lap-drd">Lihat Rekap DRD</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sebaran Wilayah & Golongan Tarif */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Panel 1: Sebaran 4 Wilayah Operasional */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Sebaran Wilayah Pelayanan
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Distribusi pelanggan, konsumsi air, dan nilai DRD per wilayah
                  kerja.
                </CardDescription>
              </div>
              <Building2 className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-3.5">
            {wilayah.map((w) => (
              <div key={w.kode} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Wilayah {w.kode} &bull; {w.nama}
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      {formatAngka(w.totalPelanggan)} SL
                    </strong>{" "}
                    ({w.persentasePelanggan}%)
                  </span>
                </div>
                {/* Visual Progress Bar Geist */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full bg-foreground/75 transition-all duration-300 rounded-full"
                    style={{ width: `${w.persentasePelanggan}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Konsumsi: {formatAngka(w.totalPakaiM3)} m³</span>
                  <span className="font-mono text-foreground font-medium">
                    {formatRupiah(w.totalRupiah)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Panel 2: Golongan Tarif Pelanggan Dominan */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Golongan Tarif Pelanggan Dominan
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Struktur langganan berdasarkan kategori tarif aktif PDAM STI.
                </CardDescription>
              </div>
              <Layers className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Golongan
                  </TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pelanggan
                  </TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pemakaian
                  </TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tagihan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarif.map((t) => (
                  <TableRow key={t.kode}>
                    <TableCell className="py-2 pr-3">
                      <span className="font-medium text-foreground">
                        {t.nama}
                      </span>
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                        {t.kode}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">
                      {formatAngka(t.totalPelanggan)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatAngka(t.totalPakaiM3)} m³
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {formatRupiah(t.totalRupiah)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Status Sistem & Pintasan Cepat */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Antrean Verifikasi & Operasional */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Status Integritas Basis Data & Infrastruktur
            </CardTitle>
            <CardDescription className="text-xs">
              Koneksi engine Next.js 15, Drizzle ORM, PostgreSQL & PostGIS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 p-5 pt-0">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    PostgreSQL & PostGIS Spasial
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    22.549 data pelanggan & 22.078 meter air terkoneksi
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-border text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full"
              >
                Terhubung (Aktif)
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Siklus Verifikasi Multi-Tier (V1-V3)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Alur screening supervisor, approval cabang & pengesahan DRD
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-border text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full"
              >
                Siap Melayani
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Elysia 4-Tier Backend Engine
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Transport, Service, Domain Logic, dan Data Access aktif
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-border text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full"
              >
                Normal (100%)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Akses Pintasan Cepat */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Pintasan Modul Utama
            </CardTitle>
            <CardDescription className="text-xs">
              Akses cepat ke modul operasional harian PDAM Tirtawening.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2.5 p-5 pt-0">
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60"
            >
              <Link href="/cater">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">
                    Baca Meter CHN
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Tabel data 22.549 pembacaan meter & anomali
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60"
            >
              <Link href="/pelanggan">
                <div className="flex items-center gap-2 mb-1">
                  <UsersIcon className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">
                    Master Pelanggan
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Direktori pencarian nolg, rute, dan alamat
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60"
            >
              <Link href="/places">
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">
                    Pemetaan Spasial
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Peta sebaran koordinat PostGIS pelanggan
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60"
            >
              <Link href="/analytics">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">
                    Observabilitas & Grafik
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Grafik Vercel time-series, kubikasi & beban kerja
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60"
            >
              <Link href="/laporan/lap-drd">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">
                    Laporan DRD
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Rekapitulasi nilai rekening tagihan air
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
