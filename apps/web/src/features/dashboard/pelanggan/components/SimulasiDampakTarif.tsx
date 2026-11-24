'use client';

import * as React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Equal,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SimulasiTagihanData } from '../types';

const idr = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

export function SimulasiDampakTarif({
  simulasiLama,
  simulasiBaru,
  volumeM3,
}: {
  simulasiLama: SimulasiTagihanData | null;
  simulasiBaru: SimulasiTagihanData | null;
  volumeM3: number;
}) {
  if (!simulasiLama || !simulasiBaru) return null;

  const totalLama = simulasiLama.totalTagihan;
  const totalBaru = simulasiBaru.totalTagihan;
  const selisih = totalBaru - totalLama;
  const persen = totalLama > 0 ? Math.round((selisih / totalLama) * 100) : 0;

  const isNaik = selisih > 0;
  const isTurun = selisih < 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-xs">
      {/* Header Simulasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-label-14 font-semibold text-foreground">
            Simulasi Komparasi Tagihan ({volumeM3} m³)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-label-12">
          <span className="text-muted-foreground">Dampak Reklasifikasi:</span>
          {isNaik ? (
            <Badge variant="red-subtle" size="sm" className="font-semibold">
              <TrendingUp className="size-3" />
              Naik {idr(selisih)} (+{persen}%)
            </Badge>
          ) : isTurun ? (
            <Badge variant="green-subtle" size="sm" className="font-semibold">
              <TrendingDown className="size-3" />
              Turun {idr(Math.abs(selisih))} ({persen}%)
            </Badge>
          ) : (
            <Badge variant="gray-subtle" size="sm" className="font-semibold">
              <Equal className="size-3" />
              Tetap (0%)
            </Badge>
          )}
        </div>
      </div>

      {/* Grid Komparasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kartu Tarif Saat Ini (Lama) */}
        <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-label-12 font-medium text-muted-foreground uppercase tracking-wide">
              Tarif Saat Ini (Lama)
            </span>
            <Badge variant="gray-subtle" size="sm" className="font-mono font-bold">
              {simulasiLama.kode}
            </Badge>
          </div>
          <div className="text-label-13 font-medium text-foreground">
            {simulasiLama.nama}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border text-copy-12">
            <div className="flex justify-between text-muted-foreground">
              <span>Harga Air ({volumeM3} m³)</span>
              <span className="font-mono text-foreground">{idr(simulasiLama.hargaAir)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Beban & Admin</span>
              <span className="font-mono text-foreground">
                {idr(simulasiLama.beaBeban + simulasiLama.beaAdmin)}
              </span>
            </div>
            {(simulasiLama.airKotor > 0 || simulasiLama.lainLain > 0) && (
              <div className="flex justify-between text-muted-foreground">
                <span>Retribusi / Lain-lain</span>
                <span className="font-mono text-foreground">
                  {idr(simulasiLama.airKotor + simulasiLama.lainLain)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-copy-13 text-foreground pt-1.5 border-t border-border">
              <span>Estimasi Total</span>
              <span className="font-mono text-foreground">{idr(totalLama)}</span>
            </div>
          </div>
        </div>

        {/* Kartu Tarif Baru */}
        <div className="p-3.5 rounded-lg border border-(--ds-blue-300) bg-(--ds-blue-100) space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-label-12 font-medium text-(--ds-blue-800) uppercase tracking-wide">
              Tarif Reklasifikasi (Baru)
            </span>
            <Badge variant="blue-subtle" size="sm" className="font-mono font-bold">
              {simulasiBaru.kode}
            </Badge>
          </div>
          <div className="text-label-13 font-semibold text-(--ds-blue-950)">
            {simulasiBaru.nama}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-(--ds-blue-200) text-copy-12">
            <div className="flex justify-between text-(--ds-blue-900)">
              <span>Harga Air ({volumeM3} m³)</span>
              <span className="font-mono">{idr(simulasiBaru.hargaAir)}</span>
            </div>
            <div className="flex justify-between text-(--ds-blue-900)">
              <span>Biaya Beban & Admin</span>
              <span className="font-mono">
                {idr(simulasiBaru.beaBeban + simulasiBaru.beaAdmin)}
              </span>
            </div>
            {(simulasiBaru.airKotor > 0 || simulasiBaru.lainLain > 0) && (
              <div className="flex justify-between text-(--ds-blue-900)">
                <span>Retribusi / Lain-lain</span>
                <span className="font-mono">
                  {idr(simulasiBaru.airKotor + simulasiBaru.lainLain)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-copy-13 text-(--ds-blue-950) pt-1.5 border-t border-(--ds-blue-200)">
              <span>Estimasi Total</span>
              <span className="font-mono text-(--ds-blue-900)">{idr(totalBaru)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Blok Progresif Baru */}
      {simulasiBaru.rincianBlok && simulasiBaru.rincianBlok.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-label-12 font-medium text-muted-foreground mb-2">
            <Layers className="size-3.5" />
            <span>Rincian Blok Pemakaian Tarif Baru:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {simulasiBaru.rincianBlok.map((blok) => (
              <div
                key={blok.blok}
                className="p-2 rounded bg-muted/40 text-center text-label-11 border border-border"
              >
                <div className="font-medium text-muted-foreground">Blok {blok.blok}</div>
                <div className="font-mono font-bold text-foreground text-copy-12">
                  {blok.pemakaianM3} m³
                </div>
                <div className="text-muted-foreground font-mono">
                  @{idr(blok.hargaPerM3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
