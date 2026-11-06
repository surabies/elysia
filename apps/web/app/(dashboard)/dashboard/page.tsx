import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/index';
import { PageContainer } from '@/components/layout/index';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Gauge,
  Ticket,
  Receipt,
  CheckCircle2,
  AlertCircle,
  UsersIcon,
  ArrowRight,
  Calendar,
} from '@/components/ui/hugeicons-compat';

export const metadata: Metadata = {
  title: 'Ringkasan Eksekutif — PDAM Tirtawening',
  description: 'Pusat komando operasional 3 Pilar PDAM: Pencatatan Meter, Pelayanan Pengaduan, dan Penagihan.',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;
  const now = new Date();
  const tanggalHariIni = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const periodeBulan = now.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageContainer
      breadcrumbs={[
        { label: 'Direktorat Utama', href: '/dashboard' },
        { label: 'Ringkasan Operasional' },
      ]}
      className="space-y-6"
    >
      {/* Banner Sambutan Eksekutif */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-sky-500/10 via-background to-blue-500/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Selamat Datang, {user.name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs uppercase bg-primary/10 text-primary border-primary/20">
                {user.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Sistem Informasi Manajemen Terpadu PERUMDA Air Minum Tirtawening Kota Bandung.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-xs md:self-auto">
            <Calendar className="size-4 text-sky-600 dark:text-sky-400" />
            <span>{tanggalHariIni}</span>
            <span className="text-border">|</span>
            <span className="font-semibold text-foreground">Periode {periodeBulan}</span>
          </div>
        </div>
      </div>

      {/* Tiga Pilar Utama Operasional PDAM */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tiga Pilar Terintegrasi
          </h2>
          <span className="text-xs text-muted-foreground">Sinkronisasi Realtime</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Pilar 1: Pencatatan Meter */}
          <Card className="hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">1. Pencatatan Meter (Cater)</CardTitle>
              <Gauge className="size-5 text-sky-600 dark:text-sky-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142.850</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total DPM Terjadwal Bulan Ini
              </p>
              <div className="mt-4 space-y-2 border-t pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tercatat Normal</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">128.430 (89.9%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kendala / Taksasi</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">1.240 (DK/RK/MB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lapor Mandiri Masuk</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">3.180 pelanggan</span>
                </div>
              </div>
              <div className="mt-4 pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/stand-konsumen">
                    Monitor Stand Konsumen <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 2: Pelayanan & Pengaduan */}
          <Card className="hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">2. Pelayanan & Pengaduan</CardTitle>
              <Ticket className="size-5 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">184</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tiket Pengaduan Masuk Minggu Ini
              </p>
              <div className="mt-4 space-y-2 border-t pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diproses & Investigasi</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">42 Tiket Aktif</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tuntas Sesuai SLA</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">96.4% Terpenuhi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kepuasan Pelanggan</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">★ 4.8 / 5.0</span>
                </div>
              </div>
              <div className="mt-4 pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/pengaduan">
                    Buka Papan Pengaduan <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 3: Penagihan & Keuangan */}
          <Card className="hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">3. Penagihan & DRD</CardTitle>
              <Receipt className="size-5 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 18.42 M</div>
              <p className="text-xs text-muted-foreground mt-1">
                Penerimaan Rekening Air Bulan Berjalan
              </p>
              <div className="mt-4 space-y-2 border-t pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efisiensi Penagihan</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">92.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rekening Terbit (DRD)</span>
                  <span className="font-medium text-foreground">142.100 Lembar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inquiry Publik Aktif</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">Terkoneksi API Publik</span>
                </div>
              </div>
              <div className="mt-4 pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/tarif">
                    Kelola Tarif & Rekening <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Sistem & Pintasan Cepat */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Arsitektur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kondisi Infrastruktur & Mesin Bisnis</CardTitle>
            <CardDescription>
              Status keterhubungan backend Next.js 16, Drizzle ORM, dan Elysia API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Mesin Alur Tiket & SLA</p>
                  <p className="text-xs text-muted-foreground">State machine transisi tiket aktif teruji</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Operasional
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">PostgreSQL & PostGIS Spasial</p>
                  <p className="text-xs text-muted-foreground">Koordinat pelanggan, rute, dan pengaduan</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Terhubung
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">API Publik 3 Pilar</p>
                  <p className="text-xs text-muted-foreground">Inquiry Tagihan, Lapor Mandiri, Pengaduan Air</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Siap Melayani
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Akses Modul Cepat */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akses Cepat Modul Utama</CardTitle>
            <CardDescription>
              Navigasi langsung ke modul operasional harian.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4 hover:border-sky-500/50">
              <Link href="/master/wilayah">
                <div className="flex items-center gap-2 mb-1">
                  <UsersIcon className="size-4 text-sky-600 dark:text-sky-400" />
                  <span className="font-semibold text-sm">Master Wilayah</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Kelola cabang layanan (CHN 1 - 6)
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4 hover:border-sky-500/50">
              <Link href="/master/organisasi">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold text-sm">Struktur SOTK</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  4 Direktorat & divisi operasional
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4 hover:border-sky-500/50">
              <Link href="/master/urut">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-sm">Pemetaan Rute</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Urutan pembacaan meter petugas
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4 hover:border-sky-500/50">
              <Link href="/pengaturan">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-sm">Pengaturan</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Parameter jadwal & batasan lapor
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
