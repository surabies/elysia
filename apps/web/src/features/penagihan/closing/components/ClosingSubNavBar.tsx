'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChevronRight,
  GitBranch,
  Lock,
  Scale,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchClosingRouteData } from '../lib/closing-api';

const CLOSING_SUBNAV_ITEMS = [
  {
    step: 1,
    href: '/tools-tutup/stand-angkat',
    label: '1. Ganti Meter',
    icon: GitBranch,
    matchPaths: ['/tools-tutup/stand-angkat'],
  },
  {
    step: 2,
    href: '/tools-tutup/pbpk',
    label: '2. PBPK',
    icon: UserPlus,
    matchPaths: ['/tools-tutup/pbpk'],
  },
  {
    step: 3,
    href: '/tools-tutup/cek-selisih-pelanggan',
    label: '3. Cek Selisih',
    icon: Scale,
    matchPaths: ['/tools-tutup/cek-selisih-pelanggan'],
  },
  {
    step: 4,
    href: '/tools-tutup/create-perbandingan',
    label: '4. Perbandingan',
    icon: BarChart3,
    matchPaths: [
      '/tools-tutup/create-perbandingan',
      '/tools-tutup/perbandingan',
    ],
  },
  {
    step: 5,
    href: '/tools-tutup/monitoring-tutup-bulan',
    label: '5. Tutup Bulan',
    icon: Lock,
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
] as const;

export function ClosingSubNavBar() {
  const pathname = usePathname();

  // Panaskan data cache seluruh tab di latar belakang saat browser idle agar klik tab 0ms tanpa kedipan
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      prefetchClosingRouteData('/tools-tutup/monitoring-tutup-bulan');
      prefetchClosingRouteData('/tools-tutup/pbpk');
      prefetchClosingRouteData('/tools-tutup/cek-selisih-pelanggan');
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <nav
      aria-label="Tahapan Menu Tutup Bulan"
      className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/35 p-1"
    >
      {CLOSING_SUBNAV_ITEMS.map((item, idx) => {
        const Icon = item.icon;
        const isActive = item.matchPaths.some((p) => pathname === p);

        return (
          <React.Fragment key={item.href}>
            <Link
              href={item.href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={() => prefetchClosingRouteData(item.href)}
              onFocus={() => prefetchClosingRouteData(item.href)}
              className={cn(
                'inline-flex h-7.5 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all duration-150 ease-out',
                isActive
                  ? 'border-border bg-card text-foreground shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'size-3.5 shrink-0 transition-colors duration-150',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              />
              <span>{item.label}</span>
            </Link>
            {idx < CLOSING_SUBNAV_ITEMS.length - 1 && (
              <ChevronRight
                aria-hidden="true"
                className="hidden size-3 shrink-0 text-muted-foreground/50 sm:block"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
