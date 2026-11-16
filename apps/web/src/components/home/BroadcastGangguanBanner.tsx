'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  ChevronRight,
  X,
  Clock,
  Sparkles,
  Wrench,
  Megaphone,
  MapPin,
  Play,
  Pause,
  Tag,
  Camera,
  Map,
} from 'lucide-react'

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
  const [isDismissedPermanently, setIsDismissedPermanently] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [modalBuka, setModalBuka] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<BroadcastGangguanItem | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [daftar, setDaftar] = React.useState<BroadcastGangguanItem[]>(() => {
    // Coba baca dari localStorage jika ada update dari Dashboard Siaran
    if (typeof window !== 'undefined') {
      try {
        const tersimpan = localStorage.getItem('elysia_broadcast_items')
        if (tersimpan) {
          const parsed = JSON.parse(tersimpan)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch {
        // Fallback default
      }
    }
    return daftarBroadcast
  })

  // Sinkronisasi jika ada event dispatch dari dashboard di window atau tab yang sama
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
      } catch {
        // Ignore
      }
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('elysia:broadcast-updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('elysia:broadcast-updated', handleStorageChange)
    }
  }, [])

  const broadcastAktif = React.useMemo(() => {
    return daftar.filter((b) => b.aktif)
  }, [daftar])

  // Pengulangan item agar track marquee selalu terisi penuh tanpa celah kosong pada layar lebar
  const displayItems = React.useMemo(() => {
    if (broadcastAktif.length === 0) return []
    if (broadcastAktif.length === 1) {
      return [broadcastAktif[0], broadcastAktif[0], broadcastAktif[0]]
    }
    if (broadcastAktif.length === 2) {
      return [...broadcastAktif, ...broadcastAktif]
    }
    return broadcastAktif
  }, [broadcastAktif])

  // Durasi animasi yang seimbang agar teks bergerak santai dan nyaman dibaca (~40px/s)
  const tickerDuration = Math.max(28, displayItems.length * 14)

  if (broadcastAktif.length === 0) return null

  // Prioritas tertinggi untuk tema visual banner & ambient glow
  const adaDarurat = broadcastAktif.some((b) => b.kategori === 'DARURAT')
  const adaPemeliharaan = broadcastAktif.some((b) => b.kategori === 'PEMELIHARAAN')
  const adaEvent = broadcastAktif.some((b) => b.kategori === 'EVENT')

  const topBroadcast =
    broadcastAktif.find((b) => b.kategori === 'DARURAT') ||
    broadcastAktif.find((b) => b.kategori === 'PEMELIHARAAN') ||
    broadcastAktif.find((b) => b.kategori === 'EVENT') ||
    broadcastAktif[0]

  const activeModalItem = selectedItem || topBroadcast

  const handleRestore = () => {
    setIsMinimized(false)
    if (typeof window !== 'undefined' && window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Floating widget saat banner diperkecil
  const floatingWidget = (
    <div
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-50 flex items-center shadow-2xl rounded-full animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className={`flex items-center gap-2 rounded-full p-1.5 pl-3.5 pr-2 backdrop-blur-xl border transition-all duration-200 ${
          adaDarurat
            ? 'bg-slate-950/95 border-rose-500/60 text-white shadow-xl shadow-rose-950/40'
            : adaPemeliharaan
              ? 'bg-slate-950/95 border-amber-500/60 text-white shadow-xl shadow-amber-950/40'
              : adaEvent
                ? 'bg-slate-950/95 border-emerald-500/60 text-white shadow-xl shadow-emerald-950/40'
                : 'bg-slate-950/95 border-cyan-500/60 text-white shadow-xl shadow-cyan-950/40'
        }`}
      >
        {/* Live Pulsing Indicator Dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              adaDarurat
                ? 'bg-rose-400'
                : adaPemeliharaan
                  ? 'bg-amber-400'
                  : adaEvent
                    ? 'bg-emerald-400'
                    : 'bg-cyan-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              adaDarurat
                ? 'bg-rose-500'
                : adaPemeliharaan
                  ? 'bg-amber-500'
                  : adaEvent
                    ? 'bg-emerald-500'
                    : 'bg-cyan-500'
            }`}
          />
        </span>

        {/* Restore Top Banner Click Area */}
        <button
          type="button"
          onClick={handleRestore}
          className="flex items-center gap-1.5 text-left hover:opacity-85 transition-opacity"
        >
          <span className="text-xs font-bold tracking-tight">
            <span className="inline sm:hidden">
              {adaDarurat ? 'Info Darurat' : adaEvent ? 'Info Promo' : 'Siaran Air'}
            </span>
            <span className="hidden sm:inline">
              {topBroadcast.judul.length > 28
                ? `${topBroadcast.judul.slice(0, 28)}...`
                : topBroadcast.judul}
            </span>
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-slate-200">
            {broadcastAktif.length}
          </span>
        </button>

        {/* View Detail Modal */}
        <button
          type="button"
          onClick={() => {
            setSelectedItem(topBroadcast)
            setModalBuka(true)
          }}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 ${
            adaDarurat
              ? 'bg-rose-500/90 text-white hover:bg-rose-600'
              : adaPemeliharaan
                ? 'bg-amber-500/90 text-slate-950 hover:bg-amber-400'
                : adaEvent
                  ? 'bg-emerald-500/90 text-slate-950 hover:bg-emerald-400'
                  : 'bg-cyan-500/90 text-slate-950 hover:bg-cyan-400'
          }`}
        >
          <span>Lihat</span>
          <ChevronRight className="h-3 w-3" />
        </button>

        {/* Dismiss Floating Pill Button */}
        <button
          type="button"
          onClick={() => setIsDismissedPermanently(true)}
          title="Tutup pemberitahuan"
          aria-label="Tutup pemberitahuan"
          className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/15 transition-colors ml-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )

  if (isMinimized) {
    return (
      <>
        {mounted && !isDismissedPermanently && createPortal(floatingWidget, document.body)}
        <BroadcastDetailModal
          broadcast={activeModalItem}
          open={modalBuka}
          onOpenChange={setModalBuka}
        />
      </>
    )
  }

  // Render satu track item siaran berita/iklan bergerak
  const renderTrackContent = (items: BroadcastGangguanItem[], prefix: string) => {
    return (
      <div className="flex items-center">
        {items.map((item, idx) => {
          const isDarurat = item.kategori === 'DARURAT'
          const isPemeliharaan = item.kategori === 'PEMELIHARAAN'
          const isEvent = item.kategori === 'EVENT'

          return (
            <React.Fragment key={`${prefix}-${item.id}-${idx}`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(item)
                  setModalBuka(true)
                }}
                className="group/item inline-flex items-center gap-2 sm:gap-2.5 px-2.5 py-1 rounded-full hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 shrink-0"
                title={`Klik untuk detail: ${item.judul}`}
              >
                {/* Category Pill */}
                <span
                  className={`inline-flex items-center shrink-0 gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-transform group-hover/item:scale-105 ${
                    isDarurat
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                      : isPemeliharaan
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                        : isEvent
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                          : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                  }`}
                >
                  {isDarurat && <AlertTriangle className="h-3 w-3 shrink-0" />}
                  {isPemeliharaan && <Wrench className="h-3 w-3 shrink-0" />}
                  {isEvent && <Sparkles className="h-3 w-3 shrink-0" />}
                  {!isDarurat && !isPemeliharaan && !isEvent && (
                    <Megaphone className="h-3 w-3 shrink-0" />
                  )}
                  <span>{item.kategori}</span>
                </span>

                {/* Judul Broadcast */}
                <span className="font-semibold text-white text-xs sm:text-sm tracking-tight group-hover/item:text-cyan-300 transition-colors whitespace-nowrap">
                  {item.judul}
                </span>

                {/* Badge Lampiran Media (Brosur Gebyar / Foto Lapangan / Peta Area) */}
                {item.tipeGambarUtama === 'BROSUR' && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                    <Tag className="h-2.5 w-2.5" />
                    <span>Brosur Gebyar</span>
                  </span>
                )}
                {item.tipeGambarUtama === 'FOTO_KEGIATAN' && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                    <Camera className="h-2.5 w-2.5" />
                    <span>Foto Kegiatan</span>
                  </span>
                )}
                {item.tipeGambarUtama === 'PETA_AREA' && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/35 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                    <Map className="h-2.5 w-2.5" />
                    <span>Peta Wilayah</span>
                  </span>
                )}

                {/* Separator Dot */}
                <span className="text-slate-500 text-xs select-none">•</span>

                {/* Ringkasan */}
                <span className="text-slate-300 text-xs font-normal max-w-72 sm:max-w-md lg:max-w-lg truncate whitespace-nowrap">
                  {item.ringkasan}
                </span>

                {/* Target Waktu / Estimasi Selesai */}
                {item.estimasiSelesai && (
                  <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 whitespace-nowrap">
                    <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                    <span>Target: {item.estimasiSelesai}</span>
                  </span>
                )}

                {/* Wilayah Terdampak */}
                {item.wilayahTerdampak && item.wilayahTerdampak.length > 0 && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
                    <MapPin className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                    <span>
                      {item.wilayahTerdampak.map((w) => w.kecamatan).join(', ')}
                    </span>
                  </span>
                )}

                {/* Action Chip */}
                <span className="inline-flex items-center gap-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold group-hover/item:bg-cyan-500 group-hover/item:text-slate-950 transition-colors whitespace-nowrap ml-0.5">
                  <span>Detail</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </button>

              {/* Separator antar item siaran */}
              <span
                aria-hidden="true"
                className="mx-3 sm:mx-5 text-slate-600/80 select-none text-xs font-mono"
              >
                ✦
              </span>
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <section
        role="region"
        aria-label="Siaran Pengumuman dan Informasi Berjalan"
        className="w-full bg-slate-950 text-white border-b border-slate-800/80 relative overflow-hidden"
      >
        {/* Glow ambient background effect */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 opacity-25 blur-2xl pointer-events-none transition-colors duration-500 ${
            adaDarurat
              ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700'
              : adaPemeliharaan
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600'
                : adaEvent
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600'
          }`}
        />

        <div className="relative mx-auto max-w-360 px-3 sm:px-4 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Sisi Kiri: Fixed Headliner Label & Live Pulse Indicator */}
            <div className="flex items-center shrink-0 gap-1.5 sm:gap-2 pr-2 sm:pr-3 border-r border-white/10 z-20">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-colors ${
                  adaDarurat
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : adaPemeliharaan
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : adaEvent
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      adaDarurat
                        ? 'bg-rose-400'
                        : adaPemeliharaan
                          ? 'bg-amber-400'
                          : adaEvent
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      adaDarurat
                        ? 'bg-rose-500'
                        : adaPemeliharaan
                          ? 'bg-amber-500'
                          : adaEvent
                            ? 'bg-emerald-500'
                            : 'bg-cyan-500'
                    }`}
                  />
                </span>
                <span className="hidden sm:inline">
                  {adaDarurat
                    ? 'SIARAN DARURAT'
                    : adaPemeliharaan
                      ? 'INFO PEMELIHARAAN'
                      : adaEvent
                        ? 'EVENT & PROMO'
                        : 'INFO TERKINI'}
                </span>
                <span className="inline sm:hidden">
                  {adaDarurat ? 'DARURAT' : adaEvent ? 'PROMO' : 'INFO'}
                </span>
              </div>

              <span className="hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-300 whitespace-nowrap">
                {broadcastAktif.length} Siaran
              </span>
            </div>

            {/* Area Tengah: Running Text (Marquee Ticker) dengan Soft Vignette Gradient */}
            <div
              className="relative flex-1 overflow-hidden flex items-center min-w-0"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Vignette fade masks di tepi kiri & kanan */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10"
              />

              {/* Track Ticker Marquee yang bergerak terus-menerus */}
              <div
                className="flex w-max shrink-0 items-center animate-broadcast-ticker select-none"
                style={
                  {
                    '--ticker-duration': `${tickerDuration}s`,
                    animationPlayState: isPaused || isHovered ? 'paused' : 'running',
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
                    animationPlayState: isPaused || isHovered ? 'paused' : 'running',
                  } as React.CSSProperties
                }
              >
                {renderTrackContent(displayItems, 'track-2')}
              </div>
            </div>

            {/* Sisi Kanan: Action Buttons & Kontrol Kecepatan/Pause */}
            <div className="flex items-center shrink-0 gap-1 sm:gap-1.5 pl-2 sm:pr-0 border-l border-white/10 z-20">
              {/* Tombol Play / Pause untuk Aksesibilitas */}
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Jalankan teks berjalan' : 'Jeda teks berjalan'}
                title={isPaused ? 'Jalankan teks berjalan' : 'Jeda teks berjalan'}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Tombol Buka Modal Detail */}
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(topBroadcast)
                  setModalBuka(true)
                }}
                className={`hidden sm:inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold shadow-xs transition-all active:scale-95 whitespace-nowrap ${
                  adaDarurat
                    ? 'bg-rose-500/90 text-white hover:bg-rose-600 shadow-rose-900/30'
                    : adaPemeliharaan
                      ? 'bg-amber-500/90 text-slate-950 hover:bg-amber-400 font-bold shadow-amber-900/30'
                      : adaEvent
                        ? 'bg-emerald-500/90 text-slate-950 hover:bg-emerald-400 font-bold shadow-emerald-900/30'
                        : 'bg-cyan-500/90 text-slate-950 hover:bg-cyan-400 font-bold shadow-cyan-900/30'
                }`}
              >
                <span>Lihat Info</span>
                <ChevronRight className="h-3 w-3" />
              </button>

              {/* Tombol Minimize */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                aria-label="Perkecil pemberitahuan"
                title="Perkecil pemberitahuan"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Detail Gangguan / Promo / Event */}
      <BroadcastDetailModal
        broadcast={activeModalItem}
        open={modalBuka}
        onOpenChange={setModalBuka}
      />
    </>
  )
}
