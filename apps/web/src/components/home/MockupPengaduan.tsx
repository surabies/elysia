"use client"

import {
  LocateFixed,
  TriangleAlert,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
} from "@/components/ui/hugeicons-compat"

/**
 * Mockup visual interaktif untuk fitur "Pengaduan Kebocoran & Gangguan Aliran 24 Jam".
 * Menampilkan simulasi peta spasial pelacakan GPS Tim Reaksi Cepat (TRC) dan tiket aduan warga.
 */
export function MockupPengaduan() {
  return (
    <div className="group relative aspect-4/5 w-full overflow-hidden rounded-4 border border-neutral-800 bg-neutral-950 font-sans text-white select-none shadow-2xl">
      {/* 1. Latar Belakang Peta Spasial Vektor GIS Bandung */}
      <div className="absolute inset-0 overflow-hidden bg-[#0c1017]">
        {/* Grid Garis Jalanan Vektor Kota Bandung */}
        <svg
          className="absolute inset-0 size-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0070f3" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Blok-blok wilayah perkotaan */}
          <rect x="20" y="30" width="80" height="90" rx="4" fill="#151d28" />
          <rect x="120" y="40" width="130" height="70" rx="4" fill="#182230" />
          <rect x="270" y="20" width="110" height="110" rx="4" fill="#151d28" />
          <rect x="30" y="140" width="120" height="110" rx="4" fill="#182230" />
          <rect x="170" y="130" width="90" height="120" rx="4" fill="#151d28" />
          <rect x="280" y="150" width="100" height="90" rx="4" fill="#182230" />
          <rect x="40" y="270" width="100" height="90" rx="4" fill="#151d28" />
          <rect x="160" y="270" width="110" height="100" rx="4" fill="#182230" />
          <rect x="290" y="260" width="90" height="110" rx="4" fill="#151d28" />

          {/* Garis Jaringan Jalan Raya */}
          <path
            d="M 0 125 Q 150 120 400 135"
            stroke="#223247"
            strokeWidth="14"
            fill="none"
          />
          <path
            d="M 155 0 Q 160 250 145 500"
            stroke="#223247"
            strokeWidth="12"
            fill="none"
          />
          <path
            d="M 265 0 L 275 500"
            stroke="#1f2c3d"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M 0 255 L 400 250"
            stroke="#1f2c3d"
            strokeWidth="10"
            fill="none"
          />

          {/* Rute Navigasi Armada Tim Reaksi Cepat (Biru Bercahaya) */}
          <path
            d="M 80 80 L 155 125 L 230 180"
            stroke="url(#routeGrad)"
            strokeWidth="4"
            strokeDasharray="6 4"
            fill="none"
            className="animate-pulse"
          />

          {/* Titik Armada TRC Berangkat */}
          <circle cx="80" cy="80" r="7" fill="#0070f3" />
          <circle cx="80" cy="80" r="14" fill="#0070f3" opacity="0.25" />
        </svg>

        {/* Pin Lokasi Insiden Kebocoran Air (Titik Merah/Kuning Pulse) */}
        <div className="absolute top-[35%] left-[58%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            {/* Gelombang Ripple Air Bocor */}
            <span className="absolute size-14 animate-ping rounded-full bg-amber-500/30 duration-1000" />
            <span className="absolute size-9 rounded-full bg-amber-500/20" />
            <div className="relative flex size-7 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-[0_0_15px_#f59e0b]">
              <TriangleAlert className="size-4" />
            </div>

            {/* Label Lokasi Pin */}
            <div className="absolute -top-7 whitespace-nowrap rounded-md border border-amber-500/40 bg-neutral-950/90 px-2 py-0.5 text-[9px] font-semibold text-amber-300 shadow-md backdrop-blur-sm">
              Pipa Bocor · Dago No. 120
            </div>
          </div>
        </div>

        {/* Pin Armada TRC Bergerak */}
        <div className="absolute top-[16%] left-[20%] -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1.5 rounded-full border border-ds-blue-700/50 bg-neutral-950/90 px-2.5 py-1 text-[9px] font-medium text-blue-400 shadow-lg backdrop-blur-md">
            <span className="size-2 animate-ping rounded-full bg-blue-400" />
            Armada TRC-03 (Menuju Lokasi)
          </div>
        </div>

        {/* Gradien Vignette Tepi */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/85 via-transparent to-neutral-950/95 pointer-events-none" />
      </div>

      {/* 2. Layer Konten UI HUD */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4.5 sm:p-6">
        {/* Header HUD */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-900/80 px-3.5 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-neutral-950">
              <LocateFixed className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white uppercase">
                Peta Kendali Tanggap 24 Jam
              </p>
              <p className="text-[10px] text-neutral-400">Tim Reaksi Cepat</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1">
            <Clock className="size-3 text-blue-400" />
            <span className="text-[10px] font-medium tracking-wide text-blue-400">
              SLA ~18 Menit
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Card Status Tiket Terpadu */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-900/90 p-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-0.5 font-mono text-[11px] font-bold text-white tracking-wider">
                TW-2611-BCR09
              </span>
              <span className="text-[10px] text-neutral-400">Coblong, Bandung</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
              <Wrench className="size-3" />
              Diproses Lapangan
            </span>
          </div>

          {/* Detail Gangguan */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2.5 text-xs">
            <p className="font-semibold text-neutral-200">
              Pipa Distribusi Tekanan Tinggi Bocor
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Laporan warga terverifikasi otomatis via koordinat GPS perangkat.
            </p>
          </div>

          {/* Mini Timeline Progres */}
          <div className="grid grid-cols-3 gap-2 border-t border-neutral-800/80 pt-2 text-[10px]">
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="size-3 shrink-0" />
              <span>Diterima</span>
            </div>
            <div className="flex items-center gap-1 text-blue-400 font-semibold">
              <span className="size-1.5 animate-pulse rounded-full bg-blue-400" />
              <span>Meluncur</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <ShieldCheck className="size-3 shrink-0" />
              <span>Penanganan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
