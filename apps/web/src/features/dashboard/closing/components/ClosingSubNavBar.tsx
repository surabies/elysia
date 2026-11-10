'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  GitBranch,
  Scale,
  UserPlus,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CLOSING_SUBNAV_ITEMS = [
  {
    href: '/tools-tutup/monitoring-tutup-bulan',
    label: '1. Wizard Tutup Buku',
    icon: Workflow,
    matchPaths: [
      '/tools-tutup/monitoring-tutup-bulan',
      '/tools-tutup/update-zonasi',
      '/tools-tutup/posting-datameter',
      '/tools-tutup/create-closed-drd',
      '/tools-tutup/create-bulan-baru',
      '/tools-tutup/upload-master-pelanggan',
      '/tools-tutup/sync-pelanggan-baru',
      '/tools-tutup/update-data-pelanggan',
    ],
  },
  {
    href: '/tools-tutup/stand-angkat',
    label: '2. Data Ganti Meter',
    icon: GitBranch,
    matchPaths: ['/tools-tutup/stand-angkat'],
  },
  {
    href: '/tools-tutup/create-perbandingan',
    label: '3. Perbandingan Tagihan',
    icon: BarChart3,
    matchPaths: ['/tools-tutup/create-perbandingan'],
  },
  {
    href: '/tools-tutup/cek-selisih-pelanggan',
    label: '4. Cek Selisih Rute',
    icon: Scale,
    matchPaths: ['/tools-tutup/cek-selisih-pelanggan'],
  },
  {
    href: '/tools-tutup/pbpk',
    label: '5. Pelanggan Baru (PBPK)',
    icon: UserPlus,
    matchPaths: ['/tools-tutup/pbpk'],
  },
  {
    href: '/tools-tutup/panduan',
    label: '6. Peta 12 Modul & Panduan',
    icon: BookOpen,
    matchPaths: ['/tools-tutup/panduan'],
  },
] as const;

export function ClosingSubNavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu Halaman Tutup Buku"
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-(--ds-gray-100) p-1.5"
    >
      {CLOSING_SUBNAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.matchPaths.some((p) => pathname === p);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-label-12 transition-colors duration-150',
              isActive
                ? 'border border-border bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
