'use client';

import * as React from 'react';
import { Users, CheckCircle2, AlertCircle, PhoneCall } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { KontakKpiStats } from '../types';

const id = (n: number) => n.toLocaleString('id-ID');

export function RingkasanKontakKpi({
  stats,
  loading = false,
}: {
  stats: KontakKpiStats | null;
  loading?: boolean;
}) {
  const total = stats?.total ?? 0;
  const valid = stats?.valid ?? 0;
  const empty = stats?.empty ?? 0;
  const invalid = stats?.invalid ?? 0;

  const persenValid = total > 0 ? Math.round((valid / total) * 100) : 0;
  const persenEmpty = total > 0 ? Math.round((empty / total) * 100) : 0;
  const persenInvalid = total > 0 ? Math.round((invalid / total) * 100) : 0;

  return (
    <div className="@container/kpi relative w-full shrink-0">
      <section
        aria-label="Indikator Ringkasan Validasi Kontak"
        className="grid min-w-0 grid-cols-2 gap-2.5 @[620px]/kpi:grid-cols-4 @[800px]/kpi:gap-3"
      >
        {/* 1. Total Pelanggan */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Total Pelanggan
            </span>
            <Users
              className="size-3.5 @[200px]/card:size-4 text-(--ds-blue-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : id(total)}
            </span>
            <span className="text-label-12 font-normal text-muted-foreground font-sans">
              SL
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Semua data master pelanggan
          </p>
        </div>

        {/* 2. Kontak Valid / WhatsApp */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Kontak Valid WA
            </span>
            <CheckCircle2
              className="size-3.5 @[200px]/card:size-4 text-(--ds-green-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : id(valid)}
            </span>
            {!loading && (
              <Badge variant="green-subtle" size="sm">
                {persenValid}%
              </Badge>
            )}
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Format seluler/WA terstandarisasi
          </p>
        </div>

        {/* 3. Kontak Kosong */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Belum Ada Kontak
            </span>
            <AlertCircle
              className="size-3.5 @[200px]/card:size-4 text-(--ds-amber-800) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : id(empty)}
            </span>
            {!loading && (
              <Badge variant="amber-subtle" size="sm">
                {persenEmpty}%
              </Badge>
            )}
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Perlu dilengkapi petugas/admin
          </p>
        </div>

        {/* 4. Format Khusus / Perlu Cek */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Perlu Verifikasi
            </span>
            <PhoneCall
              className="size-3.5 @[200px]/card:size-4 text-(--ds-gray-900) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : id(invalid)}
            </span>
            {!loading && (
              <Badge variant="gray-subtle" size="sm">
                {persenInvalid}%
              </Badge>
            )}
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Telepon rumah / digit tidak standar
          </p>
        </div>
      </section>
    </div>
  );
}
