'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ChevronRight,
  X,
  Wrench,
  Sparkles,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import { BroadcastDetailModal } from '@/components/home/BroadcastDetailModal'
import { DAFTAR_BROADCAST_AWAL } from '@/data/broadcast'
import type { BroadcastGangguanItem } from '@/types/broadcast'

interface BroadcastGangguanBannerProps {
  daftarBroadcast?: BroadcastGangguanItem[]
}

export function BroadcastGangguanBanner({
  daftarBroadcast = DAFTAR_BROADCAST_AWAL,
}: BroadcastGangguanBannerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isDismissed, setIsDismissed] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [modalBuka, setModalBuka] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<BroadcastGangguanItem | null>(null)

  const [daftar, setDaftar] = React.useState<BroadcastGangguanItem[]>(daftarBroadcast)

  React.useEffect(() => {
    setMounted(true)

    // Sinkronkan cache lokal setelah mount (bebas hydration mismatch)
    try {
      const tersimpan = localStorage.getItem('elysia_broadcast_items')
      if (tersimpan) {
        const parsed = JSON.parse(tersimpan)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDaftar(parsed)
        }
      }
    } catch {}

    // Ambil siaran terbaru dari backend API
    fetch('/api/broadcast/public')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDaftar(json.data)
        }
      })
      .catch(() => {})
  }, [])

  // Sinkronisasi jika ada pembaruan siaran dari tab dashboard
  React.useEffect(() => {
    function handleStorageChange() {
      try {
        const tersimpan = localStorage.getItem('elysia_broadcast_items')
        if (tersimpan) {
          const parsed = JSON.parse(tersimpan)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDaftar(parsed)
          }
        }
      } catch {}
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('elysia:broadcast-updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('elysia:broadcast-updated', handleStorageChange)
    }
  }, [])

  // Filter siaran aktif yang diatur tampil di ticker
  const broadcastAktif = React.useMemo(() => {
    return daftar
      .filter((b) => b.aktif && b.tampilkanDiTicker !== false)
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          DARURAT: 1,
          PEMELIHARAAN: 2,
          EVENT: 3,
          INFORMASI: 4,
        }
        return (priorityOrder[a.kategori] || 5) - (priorityOrder[b.kategori] || 5)
      })
  }, [daftar])

  // Duplikasi item agar marquee track selalu kontinu tanpa celah kosong
  const displayItems = React.useMemo(() => {
    if (broadcastAktif.length === 0) return []
    if (broadcastAktif.length === 1) {
      return [broadcastAktif[0], broadcastAktif[0], broadcastAktif[0], broadcastAktif[0]]
    }
    if (broadcastAktif.length === 2) {
      return [...broadcastAktif, ...broadcastAktif]
    }
    return broadcastAktif
  }, [broadcastAktif])

  // Kecepatan santai dan nyaman dibaca (~32px/s)
  const tickerDuration = Math.max(30, displayItems.length * 15)

  if (!mounted || isDismissed || broadcastAktif.length === 0) {
    return null
  }

  const adaDarurat = broadcastAktif.some((b) => b.kategori === 'DARURAT')
  const adaPemeliharaan = broadcastAktif.some((b) => b.kategori === 'PEMELIHARAAN')

  const handleDismiss = () => {
    setIsDismissed(true)
    toast.info('Pemberitahuan ditutup sementara', {
      description: 'Muat ulang (refresh) halaman untuk menampilkan kembali siaran informasi.',
      duration: 3500,
    })
  }

  const handleBukaDetail = (item: BroadcastGangguanItem) => {
    setSelectedItem(item)
    setModalBuka(true)
  }

  const renderBadge = (kategori: string) => {
    switch (kategori) {
      case 'DARURAT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800 shrink-0 uppercase tracking-wide">
            <AlertTriangle className="size-2.5 text-rose-600 shrink-0" />
            <span>Darurat</span>
          </span>
        )
      case 'PEMELIHARAAN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900 shrink-0 uppercase tracking-wide">
            <Wrench className="size-2.5 text-amber-700 shrink-0" />
            <span>Pemeliharaan</span>
          </span>
        )
      case 'EVENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-300 px-2 py-0.5 text-[10px] font-bold text-sky-900 shrink-0 uppercase tracking-wide">
            <Sparkles className="size-2.5 text-sky-600 shrink-0" />
            <span>Program Resmi</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold text-neutral-800 shrink-0 uppercase tracking-wide">
            <Info className="size-2.5 text-neutral-600 shrink-0" />
            <span>Pengumuman</span>
          </span>
        )
    }
  }

  const renderTrackContent = (items: BroadcastGangguanItem[], prefix: string) => {
    return (
      <div className="flex items-center">
        {items.map((item, idx) => (
          <React.Fragment key={`${prefix}-${item.id}-${idx}`}>
            <button
              type="button"
              onClick={() => handleBukaDetail(item)}
              className="group/item inline-flex items-center gap-2 px-3 py-1 text-left text-copy-12 text-sky-950 hover:text-blue-700 transition-colors cursor-pointer shrink-0"
              title={`Klik untuk melihat detail: ${item.judul}`}
            >
              {renderBadge(item.kategori)}

              <span className="font-bold text-sky-950 tracking-tight group-hover/item:text-blue-700 transition-colors whitespace-nowrap">
                {item.judul}
              </span>

              {item.estimasiSelesai && (
                <span className="text-sky-700/80 text-[11px] font-mono hidden sm:inline whitespace-nowrap">
                  ({item.estimasiSelesai})
                </span>
              )}

              <span className="text-sky-300 text-[11px] select-none">•</span>

              <span className="text-sky-800/85 text-copy-11 max-w-64 sm:max-w-md truncate whitespace-nowrap font-normal">
                {item.ringkasan}
              </span>

              <span className="inline-flex items-center gap-0.5 text-blue-600 group-hover/item:text-blue-800 text-[11px] font-semibold whitespace-nowrap underline underline-offset-2 ml-1">
                <span>Detail</span>
                <ChevronRight className="size-3" />
              </span>
            </button>

            {/* Separator Titik Lembut antar item */}
            <span
              aria-hidden="true"
              className="size-1 rounded-full bg-sky-300 mx-3 sm:mx-4 select-none shrink-0"
            />
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <>
      <aside
        aria-label="Pemberitahuan Siaran Resmi"
        className="relative z-30 w-full bg-sky-50 text-sky-950 border-b border-sky-200/90 text-copy-12 select-none overflow-hidden"
      >
        {/* Subtle Top Border Glow (Biru muda logo Tirtawening) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none"
        />

        <div className="mx-auto flex h-9 sm:h-10 max-w-360 items-center justify-between px-3 sm:px-4 lg:px-12">
          {/* Label Kiri Tetap (Fixed Indicator) */}
          <div className="flex items-center shrink-0 gap-1.5 sm:gap-2 pr-2.5 sm:pr-3 border-r border-sky-200 z-20">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  adaDarurat
                    ? 'bg-rose-400'
                    : adaPemeliharaan
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  adaDarurat
                    ? 'bg-rose-600'
                    : adaPemeliharaan
                      ? 'bg-amber-600'
                      : 'bg-sky-600'
                }`}
              />
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-sky-900 uppercase tracking-wider hidden xs:inline">
              {adaDarurat ? 'Darurat' : adaPemeliharaan ? 'Pemeliharaan' : 'Siaran Resmi'}
            </span>
            <span className="text-[10px] font-mono text-sky-800 px-1.5 py-0.2 rounded bg-sky-200/70 hidden md:inline">
              {broadcastAktif.length}
            </span>
          </div>

          {/* Area Ticker Teks Bergerak Otomatis (Pause saat di-hover) */}
          <div
            className="relative flex-1 overflow-hidden flex items-center min-w-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Vignette fade masks di ujung kiri dan kanan selaras dengan background biru muda */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-8 bg-gradient-to-r from-sky-50 via-sky-50/90 to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-8 bg-gradient-to-l from-sky-50 via-sky-50/90 to-transparent z-10"
            />

            {/* Seamless Infinite Ticker Track */}
            <div
              className="flex w-max shrink-0 items-center animate-broadcast-ticker select-none"
              style={
                {
                  '--ticker-duration': `${tickerDuration}s`,
                  animationPlayState: isHovered ? 'paused' : 'running',
                } as React.CSSProperties
              }
            >
              {renderTrackContent(displayItems, 'track-1')}
            </div>
            <div
              aria-hidden="true"
              className="flex w-max shrink-0 items-center animate-broadcast-ticker select-none"
              style={
                {
                  '--ticker-duration': `${tickerDuration}s`,
                  animationPlayState: isHovered ? 'paused' : 'running',
                } as React.CSSProperties
              }
            >
              {renderTrackContent(displayItems, 'track-2')}
            </div>
          </div>

          {/* Tombol Tutup [X] di Ujung Kanan */}
          <div className="flex items-center shrink-0 pl-2 sm:pl-3 border-l border-sky-200 z-20">
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup sementara banner informasi"
              title="Tutup sementara pemberitahuan"
              className="size-6 rounded-md flex items-center justify-center text-sky-600 hover:text-sky-950 hover:bg-sky-200/60 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Detail Saat Item Ticker Diklik */}
      <BroadcastDetailModal
        broadcast={selectedItem}
        open={modalBuka}
        onOpenChange={setModalBuka}
      />
    </>
  )
}
