'use client';

import * as React from 'react';
import { Users, CheckCircle2, AlertCircle, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        {/* 1. Total Pelanggan (Blue Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-blue-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-blue-900) truncate">
              Total Pelanggan
            </span>
            <Users
              className="size-3.5 @[200px]/card:size-4 text-(--ds-blue-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-blue-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(total)}
            <span className="text-label-12 font-normal text-(--ds-blue-900)/70 ml-1.5 font-sans">
              jiwa/sambungan
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-blue-900)/80 truncate">
            Semua data master pelanggan
          </p>
        </div>

        {/* 2. Kontak Valid / WhatsApp (Green Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-green-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-green-900) truncate">
              Kontak Valid WA
            </span>
            <CheckCircle2
              className="size-3.5 @[200px]/card:size-4 text-(--ds-green-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-green-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(valid)}
            <span className="text-label-12 font-normal text-(--ds-green-900)/70 ml-1.5 font-sans">
              ({persenValid}%)
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-green-900)/80 truncate">
            Format seluler/WA terstandarisasi
          </p>
        </div>

        {/* 3. Kontak Kosong (Amber Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-amber-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-amber-900) truncate">
              Belum Ada Kontak
            </span>
            <AlertCircle
              className="size-3.5 @[200px]/card:size-4 text-(--ds-amber-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-amber-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(empty)}
            <span className="text-label-12 font-normal text-(--ds-amber-900)/70 ml-1.5 font-sans">
              ({persenEmpty}%)
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-amber-900)/80 truncate">
            Perlu dilengkapi petugas cater/admin
          </p>
        </div>

        {/* 4. Format Khusus / Perlu Cek (Gray/Slate Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-gray-200) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-gray-1000) truncate">
              Perlu Verifikasi
            </span>
            <PhoneCall
              className="size-3.5 @[200px]/card:size-4 text-(--ds-gray-900) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-gray-1000) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(invalid)}
            <span className="text-label-12 font-normal text-(--ds-gray-900)/70 ml-1.5 font-sans">
              ({persenInvalid}%)
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-gray-900)/80 truncate">
            Telepon rumah / digit tidak standar
          </p>
        </div>
      </section>
    </div>
  );
}
