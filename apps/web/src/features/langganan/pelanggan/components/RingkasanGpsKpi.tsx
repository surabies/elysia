'use client';

import * as React from 'react';
import { MapPin, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const persenTanpa = total > 0 ? Math.round((tanpaGps / total) * 100) : 0;

  return (
    <div className="@container/kpi relative w-full shrink-0">
      <section
        aria-label="Indikator Ringkasan Geotagging & Titik GPS"
        className="grid min-w-0 grid-cols-2 gap-2.5 @[620px]/kpi:grid-cols-4 @[800px]/kpi:gap-3"
      >
        {/* 1. Total Pelanggan */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Total Pelanggan
            </span>
            <Compass
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
            Master sambungan terdaftar
          </p>
        </div>

        {/* 2. Sudah Ber-GPS */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Sudah Ber-GPS
            </span>
            <CheckCircle2
              className="size-3.5 @[200px]/card:size-4 text-(--ds-green-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : id(berGps)}
            </span>
            {!loading && (
              <Badge variant="green-subtle" size="sm">
                {persen}%
              </Badge>
            )}
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Terplot pada layer PostGIS
          </p>
        </div>

        {/* 3. Belum Ada Titik GPS */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Belum Ada GPS
            </span>
            <AlertTriangle
              className="size-3.5 @[200px]/card:size-4 text-(--ds-amber-800) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : id(tanpaGps)}
            </span>
            {!loading && (
              <Badge variant="amber-subtle" size="sm">
                {persenTanpa}%
              </Badge>
            )}
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Prioritas geotagging lapangan
          </p>
        </div>

        {/* 4. Cakupan Spasial */}
        <div className="@container/card p-3 @[200px]/card:p-4 rounded-lg border border-border bg-card transition-colors">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-label-12 font-medium text-muted-foreground truncate">
              Cakupan Spasial
            </span>
            <MapPin
              className="size-3.5 @[200px]/card:size-4 text-(--ds-purple-700) shrink-0"
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 @[200px]/card:text-heading-24 text-foreground font-mono font-bold tabular-nums truncate">
              {loading ? '-' : `${persen}%`}
            </span>
            <span className="text-label-12 font-normal text-muted-foreground font-sans">
              terpetakan
            </span>
          </div>
          <p className="hidden @[150px]/card:block mt-1 text-copy-12 text-muted-foreground truncate">
            Kesiapan peta rute cater
          </p>
        </div>
      </section>
    </div>
  );
}
