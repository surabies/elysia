'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Receipt,
  Camera,
  AlertTriangle,
  MapPin,
  Droplets,
  Wrench,
  ArrowRight,
  Sparkles,
  RotateCw,
} from 'lucide-react'

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
  icon: React.ComponentType<{ className?: string }>
  warnaIcon: string
}

const META_LAYANAN: Record<string, LayananMeta> = {
  '1': {
    href: '/cek-tagihan',
    kategori: 'Informasi Keuangan',
    deskripsi:
      'Periksa rincian tagihan rekening air riil, status pembayaran, dan riwayat pemakaian bulanan tanpa antre.',
    fiturUtama: 'Cek Instan 24 Jam',
    overlayColor: '#0284c7', // Sky Blue
    bgImage: '/images/layanan/tagihan.png',
    icon: Receipt,
    warnaIcon: 'text-sky-400',
  },
  '2': {
    href: '/lapor-meter',
    kategori: 'Pencatatan Mandiri',
    deskripsi:
      'Kirim foto angka stand meter secara mandiri agar tagihan akurat sesuai pemakaian riil rumah tangga.',
    fiturUtama: 'Kirim Foto Mudah',
    overlayColor: '#059669', // Emerald
    bgImage: '/images/layanan/lapor.png',
    icon: Camera,
    warnaIcon: 'text-emerald-400',
  },
  '3': {
    href: '/pengaduan-air',
    kategori: 'Bantuan & Darurat',
    deskripsi:
      'Sampaikan keluhan air keruh, pipa bocor, atau debit kecil untuk segera ditangani Tim Reaksi Cepat.',
    fiturUtama: 'Tiket Aduan Cepat',
    overlayColor: '#d97706', // Amber
    bgImage: '/images/features/Pusat-Kendali.png',
    icon: AlertTriangle,
    warnaIcon: 'text-amber-400',
  },
  '4': {
    href: '/peta-pengaduan',
    kategori: 'Monitoring Spasial',
    deskripsi:
      'Pantau sebaran titik gangguan, pekerjaan teknis, dan armada tangki air berbasis peta GIS Kota Bandung.',
    fiturUtama: 'Peta Interaktif GIS',
    overlayColor: '#6366f1', // Indigo
    bgImage: '/images/layanan/peta.png',
    icon: MapPin,
    warnaIcon: 'text-indigo-400',
  },
  '5': {
    href: '/pasang-baru',
    kategori: 'Registrasi Pelanggan',
    deskripsi:
      'Pengajuan sambungan pipa air minum baru untuk rumah tangga, niaga, dan industri secara online.',
    fiturUtama: 'Survei 1-2 Hari Kerja',
    overlayColor: '#0891b2', // Cyan
    bgImage: '/images/features/Pusat-Kendali.png',
    icon: Droplets,
    warnaIcon: 'text-cyan-400',
  },
  '6': {
    href: '/info-gangguan',
    kategori: 'Pemberitahuan Operasional',
    deskripsi:
      'Informasi jadwal perbaikan transmisi, pemeliharaan tandon, dan estimasi waktu normalisasi aliran air.',
    fiturUtama: 'Update Lapangan Real-Time',
    overlayColor: '#2563eb', // Royal Blue
    bgImage: '/images/features/jaringan-bandung.png',
    icon: Wrench,
    warnaIcon: 'text-blue-400',
  },
}

/** Kartu Layanan Unggulan Pelanggan Berbasis HoloCard 3D Holografik Interaktif */
export function EventCard({ event }: EventCardProps) {
  const meta = META_LAYANAN[event.id] ?? {
    href: '/cek-tagihan',
    kategori: 'Layanan Mandiri',
    deskripsi: event.venue,
    fiturUtama: event.price,
    overlayColor: '#0284c7',
    bgImage: '/images/features/Pusat-Kendali.png',
    icon: Sparkles,
    warnaIcon: 'text-sky-400',
  }

  const IconComponent = meta.icon

  const cardData: HoloCardDisplayData = {
    name: event.title,
    subtitle: meta.kategori,
    description: meta.deskripsi,
    badge: event.date,
    primaryId: meta.fiturUtama,
    secondaryInfo: 'Kanal Resmi',
    overlayColor: meta.overlayColor,
    overlayOpacity: 35,
    backgroundImage: meta.bgImage,
    actionHref: meta.href,
    actionLabel: `Buka ${event.title}`,
  }

  return (
    <li className="shrink-0 snap-start select-none">
      <HoloCard
        data={cardData}
        width={310}
        height={415}
        showSparkles={true}
        branding={{
          logo: '/images/logo.png',
          logoAlt: 'Tirtawening',
          icon: '/images/favicon.svg',
          iconAlt: 'Tirtawening',
        }}
        renderFront={(data) => (
          <div className="pointer-events-none absolute z-[2] flex h-full w-full flex-col justify-between p-4.5 text-white">
            {/* Bar Atas: Logo Bersih (Tanpa BG Rounded) & Badge Status */}
            <div className="flex items-center justify-between w-full">
              <Image
                src="/images/logo.png"
                alt="Tirtawening"
                width={80}
                height={26}
                className="object-contain drop-shadow"
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/25 px-2.5 py-1 text-[11px] font-mono font-semibold text-white backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{data.badge}</span>
              </span>
            </div>

            {/* Bar Bawah: Info & Hint Flip (Judul Ringkas 1 Baris Konsisten) */}
            <div className="relative flex w-full flex-col gap-1.5 overflow-hidden rounded-lg bg-black/55 p-4 backdrop-blur-md border border-white/15">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                {data.subtitle}
              </span>
              <h3
                className="font-sans text-base sm:text-lg font-bold tracking-tight text-white truncate"
                title={data.name}
              >
                {data.name}
              </h3>

              <div className="mt-1 pt-2 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
                <span className="font-mono text-[11px] text-white/90">
                  {data.primaryId}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300">
                  <RotateCw className="size-3" />
                  <span>Klik untuk detail</span>
                </span>
              </div>
            </div>
          </div>
        )}
      />
    </li>
  )
}
