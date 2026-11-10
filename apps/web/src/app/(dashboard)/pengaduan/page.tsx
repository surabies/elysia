import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Map } from "lucide-react";
import { PageContainer } from "@/components/layout/index";
import { PapanPengaduan } from "@/features/dashboard/pengaduan/components/papan-pengaduan/index";

export const metadata: Metadata = {
  title: "Daftar Pengaduan Air — PDAM Tirtawening",
  description:
    "Manajemen antrean penanganan tiket pengaduan, verifikasi SLA, dan eskalasi teknisi lapangan.",
};

export default async function PengaduanDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;

  const actions = (
    <div className="flex items-center gap-2">
      <Link
        href="/peta-pengaduan"
        target="_blank"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-colors shadow-xs"
      >
        <Map className="size-3.5" />
        Buka Peta Pengaduan GIS
        <ArrowUpRight className="size-3 text-primary/70" />
      </Link>
      <Link
        href="/pengaduan-air"
        target="_blank"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-accent text-foreground transition-colors shadow-xs"
      >
        Buka Portal Form Warga
        <ArrowUpRight className="size-3.5 text-muted-foreground" />
      </Link>
    </div>
  );

  return (
    <PageContainer
      className="flex min-h-0 flex-1 flex-col"
      breadcrumbs={[{ label: "Daftar Pengaduan", href: "/pengaduan" }]}
      actions={actions}
    >
      <PapanPengaduan initialQ={typeof q === "string" ? q : ""} />
    </PageContainer>
  );
}
