'use client'

import * as React from 'react'
import Image from 'next/image'

import { HoloCard, type HoloCardDisplayData } from '@/components/ui/holo-card'
import type { TicketEvent } from '@/types/home'

interface EventCardProps {
  event: TicketEvent
}

interface LayananMeta {
  href: string
  kategori: string
  deskripsi: string
  fiturUtama: string
  overlayColor: string
  bgImage: string
}

const META_LAYANAN: Record<string, LayananMeta> = {
  '1': {
    href: '/cek-tagihan',
    kategori: 'Informasi Keuangan',
    deskripsi:
      'Periksa rincian tagihan rekening air riil, status pembayaran, dan riwayat pemakaian bulanan tanpa antre.',
    fiturUtama: 'Cek Instan 24 Jam',
    overlayColor: '#0284c7',
    bgImage: '/images/layanan/tagihan.png',
  },
  '2': {
    href: '/lapor-meter',
    kategori: 'Pencatatan Mandiri',
    deskripsi:
      'Kirim foto angka stand meter secara mandiri agar tagihan akurat sesuai pemakaian riil rumah tangga.',
    fiturUtama: 'Kirim Foto Mudah',
    overlayColor: '#059669',
    bgImage: '/images/layanan/lapor.png',
  },
  '3': {
    href: '/pengaduan-air',
    kategori: 'Bantuan & Darurat',
    deskripsi:
      'Sampaikan keluhan air keruh, pipa bocor, atau debit kecil untuk segera ditangani Tim Reaksi Cepat.',
    fiturUtama: 'Tiket Aduan Cepat',
    overlayColor: '#d97706',
    bgImage: '/images/features/Pusat-Kendali.png',
  },
  '4': {
    href: '/peta-pengaduan',
    kategori: 'Monitoring Spasial',
    deskripsi:
      'Pantau sebaran titik gangguan, pekerjaan teknis, dan armada tangki air berbasis peta GIS Kota Bandung.',
    fiturUtama: 'Peta Interaktif GIS',
    overlayColor: '#6366f1',
    bgImage: '/images/layanan/peta.png',
  },
  '5': {
    href: '/pasang-baru',
    kategori: 'Registrasi Pelanggan',
    deskripsi:
      'Pengajuan sambungan pipa air minum baru untuk rumah tangga, niaga, dan industri secara online.',
    fiturUtama: 'Survei 1-2 Hari Kerja',
    overlayColor: '#0891b2',
    bgImage: '/images/features/Pusat-Kendali.png',
  },
  '6': {
    href: '/info-gangguan',
    kategori: 'Pemberitahuan Operasional',
    deskripsi:
      'Informasi jadwal perbaikan transmisi, pemeliharaan tandon, dan estimasi waktu normalisasi aliran air.',
    fiturUtama: 'Update Lapangan Real-Time',
    overlayColor: '#2563eb',
    bgImage: '/images/features/jaringan-bandung.png',
  },
}

/** Header kartu minimalis & konsisten untuk sisi depan dan belakang */
function CardTopBar({ badge }: { badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 w-full">
      <div className="inline-flex h-7 items-center gap-1.5 rounded-full bg-black/50 border border-white/15 px-2.5 backdrop-blur-md">
        <div className="relative size-4 shrink-0">
          <Image
            src="/logo.png"
            alt="Tirtawening"
            fill
            sizes="16px"
            unoptimized
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-semibold tracking-[0.14em] text-white/95 uppercase leading-none">
          Tirtawening
        </span>
      </div>

      {badge ? (
        <span className="inline-flex h-7 items-center rounded-full bg-black/50 border border-white/15 px-2.5 text-[10px] font-mono font-medium text-white/90 backdrop-blur-md truncate max-w-[120px]">
          {badge}
        </span>
      ) : null}
    </div>
  )
}

/** Kartu Layanan Unggulan Pelanggan — Minimalis & Fokus Tipografi */
export function EventCard({ event }: EventCardProps) {
  const meta = META_LAYANAN[event.id] ?? {
    href: '/cek-tagihan',
    kategori: 'Layanan Mandiri',
    deskripsi: event.venue,
    fiturUtama: event.price,
    overlayColor: '#0284c7',
    bgImage: '/images/features/Pusat-Kendali.png',
  }

  const cardData: HoloCardDisplayData = {
    name: event.title,
    subtitle: meta.kategori,
    description: meta.deskripsi,
    badge: event.date,
    primaryId: meta.fiturUtama,
    secondaryInfo: 'Kanal Resmi',
    overlayColor: meta.overlayColor,
    overlayOpacity: 28,
    backgroundImage: meta.bgImage,
    actionHref: meta.href,
    actionLabel: `Buka ${event.title}`,
  }

  return (
    <li className="shrink-0 snap-start select-none">
      <HoloCard
        data={cardData}
        width={300}
        height={400}
        showSparkles={true}
        branding={{
          logo: '/logo.png',
          logoAlt: 'Tirtawening',
          icon: '/images/favicon.svg',
          iconAlt: 'Tirtawening',
        }}
        renderFront={(data) => (
          <div className="pointer-events-none absolute inset-0 z-[4] flex h-full w-full flex-col justify-between bg-linear-to-b from-black/50 via-black/10 to-black/82 p-4 text-white">
            <CardTopBar badge={data.badge} />

            <div className="flex w-full flex-col gap-2 rounded-xl bg-black/58 p-4 backdrop-blur-md border border-white/15">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/70 truncate">
                {data.subtitle}
              </span>

              <h3
                className="font-sans text-[17px] font-semibold tracking-tight text-white leading-snug truncate"
                title={data.name}
              >
                {data.name}
              </h3>

              <div className="mt-1 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono text-white/80 truncate">
                  {data.primaryId}
                </span>
                <span className="shrink-0 font-medium text-sky-300">
                  Detail
                </span>
              </div>
            </div>
          </div>
        )}
        renderBack={(data) => (
          <div className="pointer-events-none absolute inset-0 z-[4] flex h-full w-full flex-col justify-between bg-linear-to-b from-slate-950/88 via-slate-950/82 to-slate-950/94 p-4 text-white">
            <CardTopBar badge={data.badge} />

            <div className="my-auto flex flex-col gap-2.5 rounded-xl bg-white/6 p-4 backdrop-blur-md border border-white/15">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-sky-300 truncate">
                {data.subtitle}
              </span>

              <h3 className="font-sans text-[17px] font-semibold tracking-tight text-white leading-snug">
                {data.name}
              </h3>

              <p className="text-xs leading-relaxed text-white/80">
                {data.description}
              </p>

              <div className="mt-1 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/70">
                <span>{data.secondaryInfo}</span>
                <span className="text-white/95 font-medium">{data.primaryId}</span>
              </div>
            </div>

            {data.actionHref ? (
              <a
                href={data.actionHref}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto inline-flex w-full items-center justify-center rounded-xl bg-white hover:bg-white/90 px-4 py-2.5 text-xs font-semibold tracking-tight text-slate-950 shadow-sm transition-colors cursor-pointer"
              >
                {data.actionLabel || 'Akses Layanan'}
              </a>
            ) : null}
          </div>
        )}
      />
    </li>
  )
}
