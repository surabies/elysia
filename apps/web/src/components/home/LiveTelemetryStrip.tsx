'use client'

import * as React from 'react'
import {
  Activity,
  Gauge,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  Radio,
} from 'lucide-react'

export function LiveTelemetryStrip() {
  return (
    <section
      aria-label="Statistik Operasional Terkini"
      className="mx-auto w-full max-w-360 px-4 lg:px-12 py-6 sm:py-8"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5 sm:p-7 shadow-xs dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Telemetri Operasional Terpadu
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sistem Real-Time
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemantauan transmisi perpipaan & kualitas air minum Kota Bandung
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Pembaruan sensor otomatis setiap 5 menit
          </div>
        </div>

        {/* 4 Telemetry Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5">
          {/* Card 1: Tekanan */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs hover:shadow-md transition-shadow dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Tekanan Distribusi</span>
              <Gauge className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                1.9
              </span>
              <span className="text-xs font-semibold text-slate-500">Bar</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Stabil & Terjaga
            </p>
          </div>

          {/* Card 2: Debit Distribusi */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs hover:shadow-md transition-shadow dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Debit Air Bersih</span>
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                2.850
              </span>
              <span className="text-xs font-semibold text-slate-500">L/detik</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              <span>Produksi Maksimal</span>
            </p>
          </div>

          {/* Card 3: Kecepatan Respon Aduan */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs hover:shadow-md transition-shadow dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Respon Tim Cepat</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                &lt; 2
              </span>
              <span className="text-xs font-semibold text-slate-500">Jam</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              98.4% Tuntas 24 Jam
            </p>
          </div>

          {/* Card 4: Kualitas Standar Permenkes */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs hover:shadow-md transition-shadow dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Kekeruhan (NTU)</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                0.8
              </span>
              <span className="text-xs font-semibold text-slate-500">NTU</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Sesuai Permenkes 2023
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
