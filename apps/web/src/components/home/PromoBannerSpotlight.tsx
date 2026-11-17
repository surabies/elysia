'use client'

import * as React from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Maximize2, Tag, Check, Images, Calendar } from 'lucide-react'

import { PillButton } from '@/components/shared/PillButton'
import { BroadcastDetailModal } from '@/components/home/BroadcastDetailModal'
import { DAFTAR_BROADCAST_AWAL } from '@/data/broadcast'
import type { BroadcastGangguanItem } from '@/types/broadcast'

interface PromoSlideCardProps {
  item: BroadcastGangguanItem
  onOpenModal: (item: BroadcastGangguanItem) => void
}

function PromoSlideCard({ item, onOpenModal }: PromoSlideCardProps) {
  const details = item.promoDetails

  // Kumpulkan seluruh foto unik untuk iklan ini (mendukung 1 hingga 5+ foto)
  const allPhotos = React.useMemo(() => {
    const list: { url: string; judul?: string; tipe?: string }[] = []
    if (item.gambarUtama) {
      list.push({
        url: item.gambarUtama,
        judul: item.judul,
        tipe: item.tipeGambarUtama || 'BROSUR',
      })
    }
    if (item.galeriMedia && Array.isArray(item.galeriMedia)) {
      item.galeriMedia.forEach((m) => {
        if (m.url && !list.some((existing) => existing.url === m.url)) {
          list.push({
            url: m.url,
            judul: m.judul || item.judul,
            tipe: m.tipe || 'FOTO_KEGIATAN',
          })
        }
      })
    }
    return list
  }, [item])

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0)
  const currentPhoto = allPhotos[activePhotoIdx] || allPhotos[0]

  return (
    <div className="rounded-3xl border border-neutral-200/90 bg-neutral-50/70 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs transition-shadow hover:shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-stretch">
        
        {/* ========================================================
            KOLOM KIRI: MULTI-FOTO ADAPTIF (Landscape & Portrait)
            ======================================================== */}
        <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between">
          <div
            onClick={() => onOpenModal(item)}
            className="group/img relative flex-1 min-h-[240px] sm:min-h-[320px] md:min-h-[420px] w-full overflow-hidden rounded-2xl bg-neutral-950 flex items-center justify-center border border-neutral-200/80 shadow-xs cursor-pointer select-none"
            title="Klik untuk melihat dokumen dan brosur resolusi penuh"
          >
            {/* Ambient Blur Backdrop: Memastikan foto potret / vertikal tidak memiliki ruang kosong jelek */}
            {currentPhoto?.url && (
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-120 pointer-events-none transition-all duration-500"
                style={{ backgroundImage: `url(${currentPhoto.url})` }}
              />
            )}

            {/* Gambar Utama: object-contain agar rasio asli (potret/lanskap/persegi) tampil utuh & sempurna */}
            {currentPhoto?.url ? (
              <img
                src={currentPhoto.url}
                alt={currentPhoto.judul || item.judul}
                className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-500 group-hover/img:scale-102"
              />
            ) : (
              <div className="relative z-10 flex h-full w-full items-center justify-center text-copy-14 text-neutral-400">
                Materi Promosi
              </div>
            )}

            {/* Badge Hitungan Foto (Jika multi-foto) */}
            {allPhotos.length > 1 && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-label-11 font-mono font-semibold text-white">
                <Images className="size-3" />
                <span>{activePhotoIdx + 1}/{allPhotos.length}</span>
              </div>
            )}

            {/* Panah Navigasi Mini Antar Foto di dalam Iklan ini */}
            {allPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))
                  }}
                  aria-label="Foto sebelumnya"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer opacity-80 group-hover/img:opacity-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))
                  }}
                  aria-label="Foto selanjutnya"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer opacity-80 group-hover/img:opacity-100"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}

            {/* Strip Keterangan & Tombol Perbesar di Bawah Gambar */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white">
              <span className="text-label-12 font-medium truncate max-w-[70%]">
                {currentPhoto?.judul || 'Brosur Resmi Tirtawening'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-label-11 font-semibold shrink-0">
                <Maximize2 className="size-3" />
                <span>Perbesar</span>
              </span>
            </div>
          </div>

          {/* Thumbnail Strip (Hanya tampil jika ada 2 foto atau lebih) */}
          {allPhotos.length > 1 && (
            <div className="flex items-center gap-2 pt-3 overflow-x-auto pb-1 scrollbar-none">
              {allPhotos.map((photo, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setActivePhotoIdx(pIdx)}
                  className={`relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-neutral-900 ${
                    pIdx === activePhotoIdx
                      ? 'border-neutral-900 ring-2 ring-neutral-900/25 scale-102'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================
            KOLOM KANAN: KONTEN TEKS & PENAWARAN (FLUSH ALIGNED)
            Badge keataskan sejajar tinggi gambar, Button sejajarkan tepi bawah gambar
            ======================================================== */}
        <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between h-full">
          {/* Bagian Atas: Dimulai tepat di tepi atas gambar */}
          <div className="space-y-4">
            {/* Tag Program dan Periode Tanggal Terpisah Secara Bersih & Rapi */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-1 text-label-12 font-semibold text-neutral-900 shadow-2xs">
                <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>Program Resmi</span>
              </span>

              {details?.periode && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200/70 px-3 py-1 text-label-12 font-mono text-neutral-700">
                  <Calendar className="size-3.5 text-neutral-500 shrink-0" />
                  <span>{details.periode}</span>
                </span>
              )}
            </div>

            {/* Judul Headline Promo */}
            <h2 className="text-heading-22 sm:text-heading-26 md:text-heading-30 lg:text-heading-34 font-semibold tracking-tight text-black leading-tight">
              {item.judul}
            </h2>

            {/* Ringkasan Penjelasan */}
            <p className="text-copy-14 sm:text-copy-15 whitespace-pre-line text-neutral-600 leading-relaxed">
              {item.ringkasan}
            </p>

            {/* Highlight Penawaran & Butir Keunggulan MENYUSUN KE BAWAH TANPA DIPOTONG */}
            {details && (details.highlightDiskon || (details.keunggulan && details.keunggulan.length > 0)) && (
              <div className="rounded-2xl bg-white border border-neutral-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
                {details.highlightDiskon && (
                  <p className="text-copy-14 font-semibold text-black flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{details.highlightDiskon}</span>
                  </p>
                )}

                {/* Butir Keunggulan Menyusun ke Bawah Secara Utuh & Lengkap */}
                {details.keunggulan && details.keunggulan.length > 0 && (
                  <div className="pt-1 flex flex-col gap-2.5 text-copy-13 text-neutral-700">
                    {details.keunggulan.map((k, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                          <Check className="size-2.5 stroke-[3]" />
                        </span>
                        <span className="leading-snug">{k}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bagian Bawah: Tombol Aksi Sejajar Tepat Tepi Bawah Gambar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-neutral-200/60 mt-auto">
            <PillButton asChild className="w-full sm:w-auto text-center justify-center">
              <Link href={details?.ctaLink || '/pasang-baru'}>
                {details?.ctaText || 'Daftar Sekarang'}
              </Link>
            </PillButton>

            <button
              type="button"
              onClick={() => onOpenModal(item)}
              className="text-label-13 sm:text-label-14 font-medium text-neutral-600 hover:text-black transition-colors underline underline-offset-4 cursor-pointer text-center py-1 sm:py-0"
            >
              Lihat Syarat &amp; Dokumen
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}

export function PromoBannerSpotlight() {
  const [daftar, setDaftar] = React.useState<BroadcastGangguanItem[]>(DAFTAR_BROADCAST_AWAL)
  const [modalBuka, setModalBuka] = React.useState(false)
  const [modalItem, setModalItem] = React.useState<BroadcastGangguanItem | null>(null)
  const [isPaused, setIsPaused] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const SLIDE_DURATION = 5000

  // Embla Carousel Instance dengan looping mulus
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 25,
  })

  // Sinkronisasi data publik dari backend PostgreSQL & localStorage client-side
  React.useEffect(() => {
    try {
      const tersimpan = localStorage.getItem('elysia_broadcast_items')
      if (tersimpan) {
        const parsed = JSON.parse(tersimpan)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDaftar(parsed)
        }
      }
    } catch {}

    fetch('/api/broadcast/public')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDaftar(json.data)
          try {
            localStorage.setItem('elysia_broadcast_items', JSON.stringify(json.data))
          } catch {}
        }
      })
      .catch(() => {})

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

  const handleBukaModal = React.useCallback((target: BroadcastGangguanItem) => {
    setModalItem(target)
    setModalBuka(true)
    fetch(`/api/broadcast/${target.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setModalItem(json.data)
        }
      })
      .catch(() => {})
  }, [])
  const daftarPromo = React.useMemo(() => {
    return daftar.filter(
      (b) => b.aktif && b.tampilkanDiSpotlight !== false && (b.kategori === 'EVENT' || b.promoDetails)
    )
  }, [daftar])

  // Listener perubahan slide aktif
  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
      setProgress(0)
    }
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  // Auto-Slide Bergerak Otomatis (Setiap 5 detik, otomatis jeda saat di-hover)
  React.useEffect(() => {
    if (!emblaApi || isPaused || daftarPromo.length <= 1) return

    const stepTime = 50
    const stepIncrement = (stepTime / SLIDE_DURATION) * 100

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          emblaApi.scrollNext()
          return 0
        }
        return prev + stepIncrement
      })
    }, stepTime)

    return () => clearInterval(progressTimer)
  }, [emblaApi, isPaused, daftarPromo.length, selectedIndex])

  if (daftarPromo.length === 0) return null

  return (
    <section
      aria-labelledby="promo-spotlight-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="section-white relative bg-white pt-2 md:pt-4 pb-14 md:pb-20 text-black overflow-hidden"
    >
      {/* Kontainer Sejajar Lebar Navbar (max-w-360 / 1440px) dengan Scroll-In-View Motion */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-360 px-4 lg:px-12"
      >
        {/* Header Seksi Ringkas & Elegan */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-label-12-mono font-mono text-neutral-500 uppercase tracking-wider">
              Program &amp; Penawaran Warga
            </span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-neutral-300" />
            <span className="hidden sm:inline-block text-copy-12 text-neutral-400 font-mono">
              {daftarPromo.length} Program Aktif
            </span>
          </div>

          {daftarPromo.length > 1 && (
            <span className="font-mono text-copy-12 text-neutral-400">
              {selectedIndex + 1} / {daftarPromo.length}
            </span>
          )}
        </div>

        {/* Carousel Wrapper dengan Arrow Navigasi di Sisi Kiri & Kanan */}
        <div className="relative group">
          {/* Tombol Arrow Kiri (Sebelumnya) */}
          {daftarPromo.length > 1 && (
            <button
              type="button"
              onClick={() => {
                emblaApi?.scrollPrev()
                setProgress(0)
              }}
              aria-label="Iklan sebelumnya"
              className="absolute left-1 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 lg:size-11 rounded-full bg-white/95 hover:bg-white text-neutral-800 shadow-md border border-neutral-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
          )}

          {/* Viewport Carousel */}
          <div ref={emblaRef} className="overflow-hidden rounded-3xl">
            <div className="flex">
              {daftarPromo.map((item) => (
                <div key={item.id} className="min-w-0 flex-[0_0_100%]">
                  <PromoSlideCard
                    item={item}
                    onOpenModal={handleBukaModal}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Arrow Kanan (Selanjutnya) */}
          {daftarPromo.length > 1 && (
            <button
              type="button"
              onClick={() => {
                emblaApi?.scrollNext()
                setProgress(0)
              }}
              aria-label="Iklan selanjutnya"
              className="absolute right-1 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 lg:size-11 rounded-full bg-white/95 hover:bg-white text-neutral-800 shadow-md border border-neutral-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </button>
          )}
        </div>

        {/* Indikator Titik (Pagination Dots) dengan Visual Bar Timer Bergerak */}
        {daftarPromo.length > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            {daftarPromo.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  emblaApi?.scrollTo(idx)
                  setProgress(0)
                }}
                className={`relative h-2 rounded-full overflow-hidden transition-all cursor-pointer ${
                  idx === selectedIndex ? 'w-10 bg-neutral-200' : 'w-2.5 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Pindah ke slide ${idx + 1}`}
                title={`Pindah ke iklan ${idx + 1}`}
              >
                {idx === selectedIndex && (
                  <span
                    className="absolute inset-y-0 left-0 bg-neutral-900 rounded-full transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal Detail & Brosur Utuh Saat Di-klik */}
      <BroadcastDetailModal
        broadcast={modalItem}
        open={modalBuka}
        onOpenChange={setModalBuka}
      />
    </section>
  )
}
