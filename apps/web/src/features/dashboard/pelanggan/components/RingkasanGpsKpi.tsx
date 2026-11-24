'use client';

import * as React from 'react';
import { MapPin, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';
import type { GpsKpiStats } from '../types';

const id = (n: number) => n.toLocaleString('id-ID');

export function RingkasanGpsKpi({
  stats,
  loading = false,
}: {
  stats: GpsKpiStats | null;
  loading?: boolean;
}) {
  const total = stats?.total ?? 0;
  const berGps = stats?.berGps ?? 0;
  const tanpaGps = stats?.tanpaGps ?? 0;
  const persen = stats?.persen ?? (total > 0 ? Math.round((berGps / total) * 100) : 0);

  return (
    <div className="@container/kpi relative w-full shrink-0">
      <section
        aria-label="Indikator Ringkasan Geotagging & Titik GPS"
        className="grid min-w-0 grid-cols-2 gap-2.5 @[620px]/kpi:grid-cols-4 @[800px]/kpi:gap-3"
      >
        {/* 1. Total Pelanggan (Blue Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-blue-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-blue-900) truncate">
              Total Pelanggan
            </span>
            <Compass
              className="size-3.5 @[200px]/card:size-4 text-(--ds-blue-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-blue-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(total)}
            <span className="text-label-12 font-normal text-(--ds-blue-900)/70 ml-1.5 font-sans">
              sambungan
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-blue-900)/80 truncate">
            Master sambungan aktif & terdaftar
          </p>
        </div>

        {/* 2. Sudah Ber-GPS (Green Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-green-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-green-900) truncate">
              Sudah Ber-GPS
            </span>
            <CheckCircle2
              className="size-3.5 @[200px]/card:size-4 text-(--ds-green-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-green-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(berGps)}
            <span className="text-label-12 font-normal text-(--ds-green-900)/70 ml-1.5 font-sans">
              ({persen}%)
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-green-900)/80 truncate">
            Terplot pada layer PostGIS GIS
          </p>
        </div>

        {/* 3. Belum Ada Titik GPS (Amber Subtle Theme - Prioritas Geotagging) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-amber-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-amber-900) truncate">
              Belum Ada GPS (Antrean)
            </span>
            <AlertTriangle
              className="size-3.5 @[200px]/card:size-4 text-(--ds-amber-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-amber-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : id(tanpaGps)}
            <span className="text-label-12 font-normal text-(--ds-amber-900)/70 ml-1.5 font-sans">
              ({total > 0 ? Math.round((tanpaGps / total) * 100) : 0}%)
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-amber-900)/80 truncate">
            Prioritas pemutakhiran titik lapangan
          </p>
        </div>

        {/* 4. Kelengkapan Spasial (Purple Subtle Theme) */}
        <div className="@container/card p-3 @[200px]/card:p-3.5 rounded-lg bg-(--ds-purple-100) transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-(--ds-purple-900) truncate">
              Cakupan Spasial
            </span>
            <MapPin
              className="size-3.5 @[200px]/card:size-4 text-(--ds-purple-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1 @[200px]/card:mt-1.5 text-heading-20 @[200px]/card:text-heading-24 text-(--ds-purple-900) font-mono font-bold tabular-nums truncate">
            {loading ? '-' : `${persen}%`}
            <span className="text-label-12 font-normal text-(--ds-purple-900)/70 ml-1.5 font-sans">
              terpetakan
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-0.5 @[200px]/card:mt-1 text-copy-12 text-(--ds-purple-900)/80 truncate">
            Rasio kesiapan peta rute cater
          </p>
        </div>
      </section>
    </div>
  );
}
