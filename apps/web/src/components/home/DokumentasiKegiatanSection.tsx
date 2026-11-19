'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import {
  Camera,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Container } from '@/components/shared/Container'
import { BroadcastDetailModal } from '@/components/home/BroadcastDetailModal'
import { DAFTAR_BROADCAST_AWAL } from '@/data/broadcast'
import type { BroadcastGangguanItem } from '@/types/broadcast'

interface KegiatanCardItemProps {
  item: BroadcastGangguanItem
  index: number
  onOpenModal: (item: BroadcastGangguanItem) => void
}

function KegiatanCardItem({ item, index, onOpenModal }: KegiatanCardItemProps) {
  // Seluruh foto unik yang ada pada dokumentasi ini
  const photos = React.useMemo(() => {
    const list: { url: string; judul?: string; keterangan?: string }[] = []
    if (item.gambarUtama) {
      list.push({
        url: item.gambarUtama,
        judul: item.judul,
        keterangan: item.ringkasan,
      })
    }
    if (item.galeriMedia && Array.isArray(item.galeriMedia)) {
      item.galeriMedia.forEach((m) => {
        if (m.url && !list.some((existing) => existing.url === m.url)) {
          list.push({
            url: m.url,
            judul: m.judul || item.judul,
            keterangan: m.keterangan || item.ringkasan,
          })
        }
      })
    }
    return list
  }, [item])

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)

  // Otomatis berganti foto setiap ~3.8 detik jika memiliki lebih dari 1 foto (dijeda saat di-hover)
  React.useEffect(() => {
    if (photos.length <= 1 || isHovered) return

    // Stagger interval berdasarkan index kartu (3800ms, 4200ms, 4600ms) agar kartu tidak berganti serentak
    const intervalTime = 3800 + (index % 3) * 400
    const timer = setInterval(() => {
      setActivePhotoIdx((prev) => (prev + 1) % photos.length)
    }, intervalTime)

    return () => clearInterval(timer)
  }, [photos.length, isHovered, index])

  const currentPhoto = photos[activePhotoIdx] || photos[0]
  const isSelesai = item.status === 'SELESAI'

  // Ambil kelurahan sasaran yang valid dan ringkas
  const targetKelurahan = React.useMemo(() => {
    const list: string[] = []
    if (item.wilayahTerdampak && Array.isArray(item.wilayahTerdampak)) {
      item.wilayahTerdampak.forEach((w) => {
        if (w.kelurahan && Array.isArray(w.kelurahan)) {
          w.kelurahan.forEach((k) => {
            if (k && !list.includes(k) && !k.toLowerCase().includes('seluruh') && !k.toLowerCase().includes('semua')) {
              list.push(k)
            }
          })
        }
      })
    }
    return list.slice(0, 3)
  }, [item.wilayahTerdampak])

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenModal(item)}
      className="group relative flex flex-col justify-between rounded-lg border border-border/80 bg-card p-4 sm:p-5 shadow-none transition-all duration-200 hover:border-foreground/20 hover:shadow-xs cursor-pointer select-none h-full"
    >
      <div className="space-y-3.5">
        {/* Frame Foto 16:10 dengan Auto-Crossfade Multi-Foto */}
        <div className="group/img relative aspect-16/10 w-full overflow-hidden rounded-md bg-neutral-950 border border-border/80 shadow-none">
          {/* Ambient Backdrop Blur untuk menyesuaikan foto portrait maupun landscape */}
          {currentPhoto?.url && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-125 pointer-events-none transition-all duration-700 ease-in-out"
              style={{ backgroundImage: `url(${currentPhoto.url})` }}
            />
          )}

          {/* Layer Foto dengan Animasi Transisi Halus (Crossfade) */}
          {photos.length > 0 ? (
            photos.map((p, pIdx) => (
              <img
                key={p.url + pIdx}
                src={p.url}
                alt={p.judul || item.judul}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/features/Pusat-Kendali.png'
                }}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out",
                  pIdx === activePhotoIdx
                    ? "opacity-100 z-10 scale-100"
                    : "opacity-0 z-0 pointer-events-none scale-102"
                )}
              />
            ))
          ) : (
            <div className="relative z-10 flex h-full w-full items-center justify-center text-copy-12 text-neutral-400">
              Dokumentasi Lapangan
            </div>
          )}

          {/* Indikator Jumlah Foto Ringkas */}
          {photos.length > 1 && (
            <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/90">
              {activePhotoIdx + 1}/{photos.length}
            </div>
          )}

          {/* Panah Navigasi Mini saat Hover jika Multi-Foto */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                }}
                aria-label="Foto sebelumnya"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-25 size-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 backdrop-blur-xs cursor-pointer shadow-xs"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActivePhotoIdx((prev) => (prev + 1) % photos.length)
                }}
                aria-label="Foto berikutnya"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-25 size-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 backdrop-blur-xs cursor-pointer shadow-xs"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </>
          )}

          {/* Tag Lokasi Unit Pelayanan 5 */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-white border border-white/10 shadow-xs">
            <MapPin className="size-3 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[170px] sm:max-w-[210px]">
              {item.lokasiWilayah || 'Pelayanan Wilayah 5'}
            </span>
          </div>

          {/* Indikator Titik Pagination Mini di Bawah Foto jika Multi-Foto */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1">
              {photos.map((_, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIdx(pIdx)
                  }}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300 cursor-pointer",
                    pIdx === activePhotoIdx ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  )}
                  aria-label={`Pindah ke foto ${pIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Informasi Utama & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1 truncate max-w-[170px]">
              <Calendar className="size-3 text-muted-foreground shrink-0" />
              <span>{item.waktuMulai || 'Hari ini'}</span>
            </span>

            {isSelesai ? (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                ● Selesai 100%
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                ● {item.progresPersen}% Progres
              </span>
            )}
          </div>

          <h3 className="text-heading-16 sm:text-heading-17 font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors leading-snug line-clamp-2">
            {item.judul}
          </h3>

          <p className="text-copy-13 text-muted-foreground line-clamp-2 leading-relaxed">
            {item.ringkasan}
          </p>

          {/* Chip Kelurahan Sasaran */}
          {targetKelurahan.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {targetKelurahan.map((kel, kIdx) => (
                <span
                  key={kIdx}
                  className="text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded-md px-1.5 py-0.5"
                >
                  #{kel}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Kartu dengan Tombol Rincian */}
      <div className="mt-4 pt-3.5 border-t border-border/80 flex items-center justify-between">
        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
          <Camera className="size-3.5 text-muted-foreground" />
          <span>Dokumentasi Lapangan</span>
        </span>

        <span className="inline-flex items-center gap-1 text-copy-12 font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
          <span>Lihat Rincian</span>
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </motion.div>
  )
}

export function DokumentasiKegiatanSection() {
  const [daftar, setDaftar] = React.useState<BroadcastGangguanItem[]>(() =>
    DAFTAR_BROADCAST_AWAL.filter((item) => item.kategori === 'KEGIATAN' && item.aktif)
  )
  const [kategoriFilter, setKategoriFilter] = React.useState<string>('SEMUA')
  const [modalItem, setModalItem] = React.useState<BroadcastGangguanItem | null>(null)
  const [modalBuka, setModalBuka] = React.useState(false)
  const [activeMobileIdx, setActiveMobileIdx] = React.useState(0)
  const [isMobilePaused, setIsMobilePaused] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Filter dinamis berdasarkan agenda pekerjaan
  const daftarTerfilter = React.useMemo(() => {
    if (kategoriFilter === 'SEMUA') return daftar
    return daftar.filter((item) => {
      const text = `${item.judul} ${item.ringkasan} ${item.lokasiWilayah || ''}`.toLowerCase()
      if (kategoriFilter === 'PIPA') return text.includes('pipa') || text.includes('flushing')
      if (kategoriFilter === 'METER') return text.includes('meter') || text.includes('tera')
      if (kategoriFilter === 'PASANG_BARU') return text.includes('sambungan') || text.includes('pasang baru')
      if (kategoriFilter === 'EDUKASI') return text.includes('sosialisasi') || text.includes('edukasi') || text.includes('jemput bola')
      return true
    })
  }, [daftar, kategoriFilter])

  const handleMobileScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const card = el.firstElementChild as HTMLElement | null
    const cardWidth = card ? card.offsetWidth : el.clientWidth
    const idx = Math.round(scrollLeft / (cardWidth + 16))
    setActiveMobileIdx(Math.max(0, Math.min(idx, daftarTerfilter.length - 1)))
  }

  // Auto-Cycle Carousel di tampilan mobile (berganti otomatis seperti iklan)
  React.useEffect(() => {
    if (isMobilePaused || daftarTerfilter.length <= 1) return

    const timer = setInterval(() => {
      // Hanya berjalan pada viewport mobile (< 768px)
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return

      setActiveMobileIdx((prev) => {
        const nextIdx = (prev + 1) % daftarTerfilter.length
        const el = scrollContainerRef.current
        if (el) {
          const card = el.firstElementChild as HTMLElement | null
          const cardWidth = card ? card.offsetWidth : el.clientWidth
          el.scrollTo({ left: nextIdx * (cardWidth + 16), behavior: 'smooth' })
        }
        return nextIdx
      })
    }, 4500)

    return () => clearInterval(timer)
  }, [isMobilePaused, daftarTerfilter.length])

  // Sinkronisasi data publik dari backend & event perubahan operator di dashboard
  React.useEffect(() => {
    try {
      let tersimpan = localStorage.getItem('elysia_broadcast_items')
      if (tersimpan && tersimpan.includes('hero.jpg')) {
        tersimpan = tersimpan.replaceAll('/images/hero.jpg', '/images/features/Pusat-Kendali.png')
        localStorage.setItem('elysia_broadcast_items', tersimpan)
      }
      if (tersimpan) {
        const parsed = JSON.parse(tersimpan)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const kegiatanOnly = parsed.filter(
            (b: BroadcastGangguanItem) => b.aktif && b.kategori === 'KEGIATAN'
          )
          if (kegiatanOnly.length > 0) {
            setDaftar(kegiatanOnly)
          }
        }
      }
    } catch {}

    fetch('/api/broadcast/public')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const kegiatanOnly = json.data.filter(
            (b: BroadcastGangguanItem) => b.aktif && b.kategori === 'KEGIATAN'
          )
          if (kegiatanOnly.length > 0) {
            setDaftar(kegiatanOnly)
          }
        }
      })
      .catch(() => {})

    function handleUpdate() {
      try {
        const tersimpan = localStorage.getItem('elysia_broadcast_items')
        if (tersimpan) {
          const parsed = JSON.parse(tersimpan)
          if (Array.isArray(parsed)) {
            const kegiatanOnly = parsed.filter(
              (b: BroadcastGangguanItem) => b.aktif && b.kategori === 'KEGIATAN'
            )
            setDaftar(kegiatanOnly)
          }
        }
      } catch {}
    }

    window.addEventListener('storage', handleUpdate)
    window.addEventListener('elysia:broadcast-updated', handleUpdate)
    return () => {
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('elysia:broadcast-updated', handleUpdate)
    }
  }, [])

  const handleBukaModal = (item: BroadcastGangguanItem) => {
    setModalItem(item)
    setModalBuka(true)
    fetch(`/api/broadcast/${item.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setModalItem(json.data)
        }
      })
      .catch(() => {})
  }



  if (daftar.length === 0) return null

  return (
    <section
      id="dokumentasi-wilayah-5"
      aria-labelledby="dokumentasi-wilayah-title"
      className="section-white relative overflow-hidden py-10 sm:py-14 md:py-18 bg-transparent text-foreground"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Seksi Ringkas & Tegas */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <h2
              id="dokumentasi-wilayah-title"
              className="text-heading-24 sm:text-heading-28 md:text-heading-32 font-bold tracking-tight text-foreground"
            >
              Pelayanan Wilayah 5
            </h2>
          </div>

          {/* Subtitle & Filter Baris */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <p className="text-copy-14 sm:text-copy-15 max-w-2xl text-muted-foreground leading-relaxed">
              Dokumentasi berkala pemeliharaan jaringan transmisi, tera akurasi meter digital, dan respons teknisi Perumda Tirtawening demi menjamin kontinuitas air minum bersih bagi warga.
            </p>

            {/* Filter Tab Senada Pill Navigasi (Disembunyikan di Mobile) */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
              {[
                { id: 'SEMUA', label: 'Semua Agenda' },
                { id: 'PIPA', label: 'Jaringan Pipa' },
                { id: 'METER', label: 'Meterisasi Digital' },
                { id: 'PASANG_BARU', label: 'Sambungan Baru' },
                { id: 'EDUKASI', label: 'Layanan Warga' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setKategoriFilter(tab.id)
                    setActiveMobileIdx(0)
                    scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer select-none ${
                    kategoriFilter === tab.id
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel Otomatis di Mobile (1 Konten Penuh Lebar Layar), Grid di Layar Desktop */}
          <div
            ref={scrollContainerRef}
            onScroll={handleMobileScroll}
            onMouseEnter={() => setIsMobilePaused(true)}
            onMouseLeave={() => setIsMobilePaused(false)}
            onTouchStart={() => setIsMobilePaused(true)}
            onTouchEnd={() => setIsMobilePaused(false)}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-3 md:pb-0"
          >
            {daftarTerfilter.map((item, idx) => (
              <div
                key={item.id}
                className="w-full shrink-0 snap-center md:w-auto md:max-w-none md:shrink flex flex-col"
              >
                <KegiatanCardItem
                  item={item}
                  index={idx}
                  onOpenModal={handleBukaModal}
                />
              </div>
            ))}
          </div>

          {/* Indikator Titik Carousel Khusus Mobile */}
          {daftarTerfilter.length > 1 && (
            <div className="flex md:hidden items-center justify-center gap-1.5 pt-3 pb-1">
              {daftarTerfilter.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    const el = scrollContainerRef.current
                    if (!el) return
                    const card = el.firstElementChild as HTMLElement | null
                    const cardWidth = card ? card.offsetWidth : el.clientWidth
                    el.scrollTo({ left: dotIdx * (cardWidth + 16), behavior: 'smooth' })
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                    dotIdx === activeMobileIdx
                      ? "w-5 bg-foreground"
                      : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                  )}
                  aria-label={`Lihat agenda ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </Container>

      {/* Modal Detail & Lightbox Resolusi Penuh */}
      <BroadcastDetailModal
        broadcast={modalItem}
        open={modalBuka}
        onOpenChange={setModalBuka}
      />
    </section>
  )
}
