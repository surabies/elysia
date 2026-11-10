"use client"

import Image from "next/image"
import { CheckCircle2, Camera, Sparkles } from "@/components/ui/hugeicons-compat"

/**
 * Mockup visual interaktif untuk fitur "Pelaporan Stand Meter Mandiri yang Akurat".
 * Menampilkan simulasi UI pemindai OCR meteran air Tirtawening di atas foto meter asli.
 */
export function MockupLaporMeter() {
  return (
    <div className="group relative aspect-4/5 w-full overflow-hidden rounded-4 border border-neutral-800 bg-neutral-950 font-sans text-white select-none shadow-2xl">
      {/* 1. Latar Belakang Foto Meteran Asli */}
      <div className="absolute inset-0">
        <Image
          src="/images/meter/mock.png"
          alt="Stand Meter Air Tirtawening"
          fill
          unoptimized
          sizes="(min-width: 1280px) 516px, 50vw"
          className="object-cover opacity-45 transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Lapisan gradien agar elemen UI & HUD terbaca dengan kontras tajam */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-transparent to-neutral-950/95" />
        <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-neutral-950/30 to-neutral-950/90" />
      </div>

      {/* 2. Konten Tampilan Kamera UI */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4.5 sm:p-6">
        {/* Top Header UI */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-900/80 px-3.5 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-ds-blue-700 text-white">
              <Camera className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white uppercase">
                Pemindai Stand Meter
              </p>
              <p className="text-[10px] text-neutral-400">Tirtawening Mandiri</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium tracking-wide text-emerald-400">
              Live OCR
            </span>
          </div>
        </div>

        {/* Viewfinder Target (Area Bidik Scanner) */}
        <div className="relative mx-auto my-auto flex aspect-4/3 w-[86%] max-w-[340px] items-center justify-center">
          {/* Garis Sudut Viewfinder */}
          <div className="absolute -top-1 -left-1 size-5 rounded-tl-md border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -top-1 -right-1 size-5 rounded-tr-md border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute -bottom-1 -left-1 size-5 rounded-bl-md border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-1 -right-1 size-5 rounded-br-md border-b-2 border-r-2 border-cyan-400" />

          {/* Garis Bidik Tengah */}
          <div className="size-3 rounded-full border border-cyan-400/60" />

          {/* Animasi Garis Laser Scan */}
          <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 shadow-[0_0_12px_#22d3ee]" />

          {/* Badge Indikator Fokus */}
          <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md bg-neutral-900/90 px-2 py-0.5 text-[9px] font-mono text-cyan-300 backdrop-blur-sm border border-cyan-500/30">
            <Sparkles className="size-2.5" />
            Fokus Terkunci (99.4%)
          </div>
        </div>

        {/* Panel Hasil Deteksi Angka Stand */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-900/90 p-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
              Angka Terbaca · Stand Akhir
            </span>
            <span className="text-[10px] text-cyan-400 font-medium">
              Nov 2026
            </span>
          </div>

          {/* Roll Meter Digits (Hitam: m3, Merah: liter) */}
          <div className="flex items-center justify-between gap-1 rounded-xl border border-neutral-700/80 bg-neutral-950 p-2 font-mono">
            {/* Angka Hitam (m³) */}
            <div className="flex gap-1">
              {["0", "0", "1", "4", "5"].map((d, i) => (
                <span
                  key={i}
                  className="flex size-7 sm:size-8 items-center justify-center rounded bg-neutral-800 text-sm sm:text-base font-bold text-white shadow-inner"
                >
                  {d}
                </span>
              ))}
            </div>

            <span className="text-xs font-sans text-neutral-500 font-bold px-0.5">
              m³
            </span>

            {/* Angka Merah (desimal/liter) */}
            <div className="flex gap-1 border-l border-neutral-800 pl-1.5">
              {["5", "0"].map((d, i) => (
                <span
                  key={i}
                  className="flex size-7 sm:size-8 items-center justify-center rounded bg-red-950/80 border border-red-800/50 text-sm sm:text-base font-bold text-red-400 shadow-inner"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Validasi & Status */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span className="font-medium text-[11px] sm:text-xs">
                Foto Jernih · Siap Diverifikasi Staf
              </span>
            </div>
            <span className="rounded bg-ds-blue-700/20 px-2 py-0.5 text-[10px] font-semibold text-ds-blue-700 border border-ds-blue-700/40">
              14 m³
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
