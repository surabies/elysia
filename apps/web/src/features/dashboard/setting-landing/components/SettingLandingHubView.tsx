// features/dashboard/setting-landing/components/SettingLandingHubView.tsx
// Hub Sentral Modul Setting Landing Page & CMS Publik

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  Layers,
  Newspaper,
  Radio,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileText,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModulCard {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  stats: string;
  sublinks: { label: string; href: string }[];
}

const DAFTAR_MODUL_LANDING: ModulCard[] = [
  {
    title: 'Profil & Kantor Pelayanan',
    href: '/setting-landing/profil',
    description:
      'Identitas resmi perusahaan, visi misi, sejarah pendirian, call center 24 jam, dan direktori 6 Kantor Cabang Wilayah Bandung.',
    icon: Building2,
    tag: 'Identitas & Kontak',
    stats: '6 Kantor Cabang Aktif',
    sublinks: [
      { label: 'Profil & Visi Misi', href: '/setting-landing/profil' },
      { label: 'Kantor Cabang Wilayah 1-6', href: '/setting-landing/profil' },
      { label: 'Pratinjau /profil', href: '/profil' },
      { label: 'Pratinjau /kontak', href: '/kontak' },
    ],
  },
  {
    title: 'Konten Layanan Publik CMS',
    href: '/setting-landing/konten',
    description:
      'Dokumen persyaratan sambungan air baru, panduan alur teknis, metode & mitra pembayaran tagihan rekening air, dan tabel tarif blok progresif.',
    icon: Layers,
    tag: 'Layanan & Kebijakan',
    stats: '3 Sub-Modul CMS',
    sublinks: [
      { label: 'Syarat Pasang Baru', href: '/setting-landing/konten' },
      { label: 'Cara Pembayaran Rekening', href: '/setting-landing/konten' },
      { label: 'Struktur Tarif Air', href: '/setting-landing/konten' },
      { label: 'Pratinjau /pasang-baru', href: '/pasang-baru' },
      { label: 'Pratinjau /tarif-air', href: '/tarif-air' },
    ],
  },
  {
    title: 'Berita & Pengumuman Publik',
    href: '/setting-landing/berita',
    description:
      'Manajemen rilis informasi kegiatan perusahaan, berita resmi, pengumuman operasional, serta artikel edukasi hemat air.',
    icon: Newspaper,
    tag: 'Publikasi Humas',
    stats: 'Artikel & Rilis Pers',
    sublinks: [
      { label: 'Daftar Artikel', href: '/setting-landing/berita' },
      { label: 'Tulis Rilis Baru', href: '/setting-landing/berita' },
      { label: 'Pratinjau /berita', href: '/berita' },
    ],
  },
  {
    title: 'Siaran & Info Gangguan Pipa',
    href: '/broadcast',
    description:
      'Pengumuman darurat kebocoran pipa transmisi, jadwal pemadaman aliran air, interkoneksi jaringan, dan banner peringatan di halaman muka.',
    icon: Radio,
    tag: 'Siaran Lapangan',
    stats: 'Banner & Tiket Real-time',
    sublinks: [
      { label: 'Kelola Siaran', href: '/broadcast' },
      { label: 'Tambah Siaran Pipa', href: '/broadcast/tambah' },
      { label: 'Pratinjau /info-gangguan', href: '/info-gangguan' },
    ],
  },
];

export function SettingLandingHubView() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Konsol Pengaturan Landing Page & Portal Publik"
          description="Pusat konfigurasi mandiri konten portal warga PERUMDA Tirtawening. Terpisah seutuhnya dari pengaturan teknis operasional sistem."
          badge="Hub Setting Landing Page"
        />

        {/* Banner Penjelasan Pemisahan Arsitektur */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Modul Terpisah & Mandiri
                </span>
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Pengaturan Portal Publik Kini Berdiri Sendiri
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seluruh konten yang tayang langsung ke warga (profil kantor cabang, syarat sambungan baru, kanal pembayaran, struktur tarif air, berita, dan siaran darurat pipa) telah dikelompokkan ke dalam menu mandiri agar tidak bercampur dengan parameter operasional billing & cater.
              </p>
            </div>

            <Button asChild size="sm" className="shrink-0 gap-1.5 text-xs">
              <Link href="/setting-landing/profil">
                Mulai Atur Profil <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Kartu Modul Utama */}
        <div className="grid gap-5 md:grid-cols-2">
          {DAFTAR_MODUL_LANDING.map((modul) => {
            const Icon = modul.icon;
            return (
              <div
                key={modul.href}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {modul.title}
                        </h3>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {modul.tag}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {modul.stats}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {modul.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
                    {modul.sublinks.map((sub, i) => (
                      <Link
                        key={i}
                        href={sub.href}
                        className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {sub.label.startsWith('Pratinjau') && (
                          <ExternalLink className="size-2.5 opacity-60" />
                        )}
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-xs group-hover:bg-foreground group-hover:text-background transition-colors cursor-pointer"
                  >
                    <Link href={modul.href}>
                      <span>Buka Modul {modul.title}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
