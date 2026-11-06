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
  Users as UsersIcon,
  ArrowRight,
  Calendar,
} from 'lucide-react';

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
      <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Selamat Datang, {user.name}
              </h1>
              <Badge variant="outline" className="font-mono text-[11px] font-medium uppercase border-border bg-muted/60 text-foreground rounded-full">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sistem Informasi Manajemen Terpadu PERUMDA Air Minum Tirtawening Kota Bandung.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground md:self-auto">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>{tanggalHariIni}</span>
            <span className="text-border">|</span>
            <span className="font-medium text-foreground">Periode {periodeBulan}</span>
          </div>
        </div>
      </div>

      {/* Tiga Pilar Utama Operasional PDAM */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tiga Pilar Terintegrasi
          </h2>
          <span className="text-xs text-muted-foreground">Sinkronisasi Realtime</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Pilar 1: Pencatatan Meter */}
          <Card className="hover:border-foreground/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">1. Pencatatan Meter (Cater)</CardTitle>
              <Gauge className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">142.850</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total DPM Terjadwal Bulan Ini
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
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
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs font-medium rounded-md border-border">
                  <Link href="/stand-konsumen">
                    Monitor Stand Konsumen <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 2: Pelayanan & Pengaduan */}
          <Card className="hover:border-foreground/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">2. Pelayanan & Pengaduan</CardTitle>
              <Ticket className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">184</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tiket Pengaduan Masuk Minggu Ini
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
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
                  <span className="font-medium text-foreground">★ 4.8 / 5.0</span>
                </div>
              </div>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs font-medium rounded-md border-border">
                  <Link href="/pengaduan">
                    Buka Papan Pengaduan <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 3: Penagihan & Keuangan */}
          <Card className="hover:border-foreground/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">3. Penagihan & DRD</CardTitle>
              <Receipt className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-semibold tracking-tight text-foreground">Rp 18.42 M</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Penerimaan Rekening Air Bulan Berjalan
              </p>
              <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
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
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs font-medium rounded-md border-border">
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Arsitektur */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">Kondisi Infrastruktur & Mesin Bisnis</CardTitle>
            <CardDescription className="text-xs">
              Status keterhubungan backend Next.js 16, Drizzle ORM, dan Elysia API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 p-5 pt-0">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">Mesin Alur Tiket & SLA</p>
                  <p className="text-[11px] text-muted-foreground">State machine transisi tiket aktif teruji</p>
                </div>
              </div>
              <Badge variant="outline" className="border-border text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">
                Operasional
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">PostgreSQL & PostGIS Spasial</p>
                  <p className="text-[11px] text-muted-foreground">Koordinat pelanggan, rute, dan pengaduan</p>
                </div>
              </div>
              <Badge variant="outline" className="border-border text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">
                Terhubung
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">API Publik 3 Pilar</p>
                  <p className="text-[11px] text-muted-foreground">Inquiry Tagihan, Lapor Mandiri, Pengaduan Air</p>
                </div>
              </div>
              <Badge variant="outline" className="border-border text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">
                Siap Melayani
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Akses Modul Cepat */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">Akses Cepat Modul Utama</CardTitle>
            <CardDescription className="text-xs">
              Navigasi langsung ke modul operasional harian.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2.5 p-5 pt-0">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60">
              <Link href="/master/wilayah">
                <div className="flex items-center gap-2 mb-1">
                  <UsersIcon className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">Master Wilayah</span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Kelola cabang layanan (CHN 1 - 6)
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60">
              <Link href="/master/organisasi">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">Struktur SOTK</span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  4 Direktorat & divisi operasional
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60">
              <Link href="/master/urut">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">Pemetaan Rute</span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
                  Urutan pembacaan meter petugas
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-3 rounded-md border-border hover:bg-accent/60">
              <Link href="/pengaturan">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">Pengaturan</span>
                </div>
                <span className="text-[11px] text-muted-foreground text-left">
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
