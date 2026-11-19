'use client'

import * as React from 'react'
import Link from 'next/link'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  AlertTriangle,
  Clock,
  Wrench,
  MapPin,
  Search,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
  Info,
  Maximize2,
  X,
  Share2,
  Download,
  Calendar,
  Camera,
  Map,
  Check,
  ShieldCheck,
  ArrowRight,
  FileText,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type {
  BroadcastGangguanItem,
  MediaBroadcastItem,
  TipeMediaBroadcast,
} from '@/types/broadcast'

interface BroadcastDetailModalProps {
  broadcast: BroadcastGangguanItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BroadcastDetailModal({
  broadcast,
  open,
  onOpenChange,
}: BroadcastDetailModalProps) {
  const [activeMediaIndex, setActiveMediaIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [pencarianWilayah, setPencarianWilayah] = React.useState('')
  const [sudahDisalin, setSudahDisalin] = React.useState(false)

  // Listener tombol keyboard Escape untuk menutup lightbox
  React.useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setLightboxOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen])

  // Reset tab saat broadcast berganti
  React.useEffect(() => {
    setActiveMediaIndex(0)
    setPencarianWilayah('')
  }, [broadcast?.id])

  // Kumpulkan daftar media selalu di level atas
  const daftarMedia: MediaBroadcastItem[] = React.useMemo(() => {
    if (!broadcast) return []
    if (broadcast.galeriMedia && broadcast.galeriMedia.length > 0) {
      return broadcast.galeriMedia
    }
    if (broadcast.gambarUtama) {
      return [
        {
          url: broadcast.gambarUtama,
          judul: broadcast.judul,
          keterangan: broadcast.ringkasan,
          tipe: broadcast.tipeGambarUtama || (broadcast.kategori === 'EVENT' ? 'BROSUR' : 'FOTO_KEGIATAN'),
        },
      ]
    }
    return []
  }, [broadcast])

  const mediaAktif = daftarMedia[activeMediaIndex] || daftarMedia[0]

  const handleSalinTautan = () => {
    if (!broadcast || typeof window === 'undefined') return
    const url = `${window.location.origin}/#siaran-${broadcast.id}`
    navigator.clipboard.writeText(url).then(() => {
      setSudahDisalin(true)
      toast.success('Tautan informasi resmi berhasil disalin!')
      setTimeout(() => setSudahDisalin(false), 2500)
    })
  }

  const renderBadgeTipeMedia = (tipe: TipeMediaBroadcast) => {
    switch (tipe) {
      case 'BROSUR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-600 text-white shadow-xs backdrop-blur-md">
            <FileText className="size-3" />
            <span>Brosur Resmi</span>
          </span>
        )
      case 'FOTO_KEGIATAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-neutral-900/80 text-white shadow-xs backdrop-blur-md">
            <Camera className="size-3" />
            <span>Dokumentasi</span>
          </span>
        )
      case 'PETA_AREA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-600 text-white shadow-xs backdrop-blur-md">
            <Map className="size-3" />
            <span>Peta Wilayah</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-neutral-800 text-white shadow-xs">
            <Info className="size-3" />
            <span>Lampiran</span>
          </span>
        )
    }
  }

  const isPromoOrEvent = Boolean(
    broadcast && (broadcast.kategori === 'EVENT' || broadcast.promoDetails)
  )
  const isKegiatan = broadcast?.kategori === 'KEGIATAN'
  const isDarurat = broadcast?.kategori === 'DARURAT'
  const isPemeliharaan = broadcast?.kategori === 'PEMELIHARAAN'

  // Filter kelurahan terdampak jika siaran teknis
  const keyword = pencarianWilayah.toLowerCase().trim()
  const daftarWilayahTerfilter = (broadcast?.wilayahTerdampak || []).map((w) => {
    const cocokKecamatan = w.kecamatan.toLowerCase().includes(keyword)
    const kelurahanCocok = w.kelurahan.filter((k) =>
      k.toLowerCase().includes(keyword)
    )
    return {
      kecamatan: w.kecamatan,
      kelurahan: cocokKecamatan ? w.kelurahan : kelurahanCocok,
      terdampak: cocokKecamatan || kelurahanCocok.length > 0,
    }
  })

  const totalKelurahanTerdampak = (broadcast?.wilayahTerdampak || []).reduce(
    (acc, curr) => acc + curr.kelurahan.length,
    0
  )

  const promo = broadcast?.promoDetails

  return (
    <>
      {/* MODAL UTAMA RINCIAN SIARAN / IKLAN */}
      <Dialog open={Boolean(open && broadcast)} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-[calc(100vw-1rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90dvh] overflow-y-auto overflow-x-hidden p-0 rounded-2xl border-border bg-card shadow-2xl">
          {broadcast && (
            <div className="w-full max-w-full p-3.5 sm:p-6 md:p-8 space-y-3.5 sm:space-y-6 overflow-hidden">
              {/* Header Informasi & Meta Tag Bersih */}
              <DialogHeader className="space-y-2 sm:space-y-3 text-left pr-8 sm:pr-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground font-mono">
                    <span className="font-semibold text-foreground">
                      {isKegiatan
                        ? broadcast.lokasiWilayah || 'Pelayanan Wilayah 5'
                        : isPromoOrEvent
                          ? 'Program Resmi'
                          : broadcast.kategori}
                    </span>
                    {(promo?.periode || broadcast.estimasiSelesai) && (
                      <>
                        <span className="text-border">·</span>
                        <span>{promo?.periode || `Target: ${broadcast.estimasiSelesai}`}</span>
                      </>
                    )}
                    <span className="text-border">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {broadcast.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Tombol Bagikan / Salin Tautan */}
                  <button
                    type="button"
                    onClick={handleSalinTautan}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-copy-12 text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer shrink-0"
                    title="Salin tautan informasi resmi"
                  >
                    {sudahDisalin ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="size-3.5" />
                    )}
                    <span>{sudahDisalin ? 'Tersalin' : 'Bagikan'}</span>
                  </button>
                </div>

                <DialogTitle className="text-heading-17 sm:text-heading-20 md:text-heading-24 font-bold tracking-tight text-foreground leading-snug break-words">
                  {broadcast.judul}
                </DialogTitle>

                <DialogDescription className="text-copy-12 sm:text-copy-14 text-muted-foreground leading-relaxed whitespace-pre-line break-words">
                  {broadcast.ringkasan}
                </DialogDescription>
              </DialogHeader>

              {/* SHOWCASE MEDIA GALERI (Multi-foto, Aspect Ratio Adaptif, Tanpa Distorsi) */}
              {daftarMedia.length > 0 && mediaAktif && (
                <div className="space-y-2.5 sm:space-y-3 w-full max-w-full">
                  <div className="relative group overflow-hidden rounded-xl border border-border bg-neutral-900/90 shadow-2xs">
                    {/* Ambient Blur Backdrop */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${mediaAktif.url})` }}
                    />

                    {/* Gambar Aktif Ditampilkan Utuh */}
                    <div
                      onClick={() => setLightboxOpen(true)}
                      className="relative z-10 w-full min-h-[220px] max-h-[360px] sm:h-72 md:h-84 lg:h-96 flex items-center justify-center p-2 sm:p-3 cursor-pointer select-none"
                    >
                      <img
                        src={mediaAktif.url}
                        alt={mediaAktif.judul}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/features/Pusat-Kendali.png'
                        }}
                        className="max-h-[340px] sm:max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.01]"
                        loading="lazy"
                      />

                      {/* Tag Tipe Media di Kiri Atas */}
                      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20">
                        {renderBadgeTipeMedia(mediaAktif.tipe)}
                      </div>

                      {/* Tombol Perbesar Resolusi Penuh */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxOpen(true)
                        }}
                        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/75 hover:bg-black/90 px-2.5 sm:px-3 py-1 text-[11px] sm:text-copy-11 font-medium text-white backdrop-blur-xs transition-transform active:scale-95 border border-white/20 shadow-sm cursor-pointer"
                      >
                        <Maximize2 className="size-3" />
                        <span>Perbesar</span>
                      </button>

                      {/* Caption Gambar di Bar Bawah */}
                      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 sm:p-3 text-white">
                        <p className="text-[12px] sm:text-copy-12 font-semibold truncate">
                          {mediaAktif.judul}
                        </p>
                        {mediaAktif.keterangan && (
                          <p className="text-[11px] sm:text-copy-11 text-neutral-300 line-clamp-1">
                            {mediaAktif.keterangan}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Strip jika media > 1 */}
                  {daftarMedia.length > 1 && (
                    <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none touch-pan-x">
                      {daftarMedia.map((media, idx) => {
                        const isActive = idx === activeMediaIndex
                        return (
                          <button
                            key={`thumb-${idx}`}
                            type="button"
                            onClick={() => setActiveMediaIndex(idx)}
                            className={`relative flex items-center gap-2 rounded-lg p-1.5 pr-2.5 sm:pr-3 border text-left transition-all shrink-0 cursor-pointer max-w-[170px] sm:max-w-44 ${
                              isActive
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border bg-muted/30 hover:bg-muted/70'
                            }`}
                          >
                            <div className="relative h-8 w-11 sm:h-9 sm:w-12 rounded overflow-hidden bg-neutral-900 shrink-0">
                              <img
                                src={media.url}
                                alt={media.judul}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/features/Pusat-Kendali.png'
                                }}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold text-foreground truncate">
                                {media.judul}
                              </span>
                              <span className="block text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-mono truncate">
                                {media.tipe.replace('_', ' ')}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* KONTEN UTAMA: JIKA IKLAN / PROMO / PENAWARAN WARGA */}
              {isPromoOrEvent && (
                <div className="space-y-3.5 sm:space-y-4 w-full">
                  {/* Highlight Penawaran & Keunggulan Program */}
                  {(promo?.highlightDiskon || (promo?.keunggulan && promo.keunggulan.length > 0)) && (
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
                      {promo.highlightDiskon && (
                        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                          <Sparkles className="size-4 text-emerald-600 shrink-0" />
                          <h4 className="text-heading-14 sm:text-heading-15 font-bold text-foreground leading-snug break-words">
                            {promo.highlightDiskon}
                          </h4>
                        </div>
                      )}

                      {promo.keunggulan && promo.keunggulan.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] sm:text-copy-11 font-mono uppercase tracking-wider text-muted-foreground">
                            Keuntungan &amp; Manfaat Program:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-copy-12 text-foreground">
                            {promo.keunggulan.map((k, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  <Check className="size-2.5 stroke-[3]" />
                                </span>
                                <span className="leading-snug break-words">{k}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GRID 2 KOLOM RAPI: PERSYARATAN DOKUMEN & ALUR LANGKAH PENDAFTARAN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
                    {/* KARTU 1: PERSYARATAN DOKUMEN & KETENTUAN RESMI */}
                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-2xs flex flex-col">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-heading-14 sm:text-heading-15 pb-2 border-b border-border/60">
                        <ShieldCheck className="size-4 text-blue-600 dark:text-sky-400 shrink-0" />
                        <span>Persyaratan Dokumen &amp; Ketentuan</span>
                      </div>

                      {promo?.syaratKetentuan && promo.syaratKetentuan.length > 0 ? (
                        <ul className="space-y-2 pt-1 flex-1">
                          {promo.syaratKetentuan.map((syarat, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-copy-12 sm:text-copy-13 text-foreground leading-relaxed"
                            >
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 border border-blue-500/25 mt-0.5">
                                <Check className="size-2.5 stroke-[2.5]" />
                              </span>
                              <span className="break-words">{syarat}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-copy-12 text-muted-foreground py-1 flex-1">
                          Program ini berlaku untuk seluruh pelanggan aktif maupun warga Kota Bandung yang berminat mengajukan layanan perpipaan resmi tanpa persyaratan rumit.
                        </div>
                      )}
                    </div>

                    {/* KARTU 2: ALUR & LANGKAH PENDAFTARAN */}
                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-2xs flex flex-col">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-heading-14 sm:text-heading-15 pb-2 border-b border-border/60">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span>Alur &amp; Langkah Pendaftaran</span>
                      </div>

                      {promo?.langkahDaftar && promo.langkahDaftar.length > 0 ? (
                        <div className="space-y-2 pt-1 flex-1">
                          {promo.langkahDaftar.map((langkah, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/20 p-2 sm:p-2.5"
                            >
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-copy-12 text-foreground leading-relaxed break-words">
                                {langkah}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-copy-12 text-muted-foreground py-1 flex-1">
                          Daftar langsung secara online melalui portal resmi Tirtawening atau kunjungi kantor pelayanan terdekat.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TOMBOL AKSI & KONSULTASI RESMI */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 sm:pt-3">
                    <Link
                      href={promo?.ctaLink || '/pasang-baru'}
                      onClick={() => onOpenChange(false)}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground hover:opacity-90 text-background px-5 py-3 text-copy-13 font-semibold transition-all shadow-xs text-center active:scale-[0.99]"
                    >
                      <span>{promo?.ctaText || 'Daftar Sekarang'}</span>
                      <ArrowRight className="size-4" />
                    </Link>

                    {broadcast.kontakBantuan && (
                      <a
                        href={
                          broadcast.kontakBantuan.waLink ||
                          `https://wa.me/62${broadcast.kontakBantuan.nomor.replace(/[^0-9]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background hover:bg-muted/50 px-5 py-3 text-copy-13 font-medium text-foreground transition-colors text-center active:scale-[0.99]"
                      >
                        <PhoneCall className="size-3.5 text-emerald-600" />
                        <span>Konsultasi WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* KONTEN UTAMA: JIKA SIARAN GANGGUAN TEKNIS / DARURAT */}
              {!isPromoOrEvent && (
                <div className="space-y-4 w-full">
                  {/* Progres Penanganan */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-copy-12 font-medium">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Wrench className="size-3.5 text-primary" />
                        <span>Progres Penanganan di Lapangan</span>
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        {broadcast.progresPersen}%
                      </span>
                    </div>
                    <Progress value={broadcast.progresPersen} className="h-2" />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-copy-11 text-muted-foreground pt-1">
                      <span>Waktu Mulai: {broadcast.waktuMulai}</span>
                      <span>Target Normal: {broadcast.estimasiSelesai}</span>
                    </div>
                  </div>

                  {/* Penyebab & Dampak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-copy-12">
                    <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className={`size-3.5 ${isKegiatan ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span>{isKegiatan ? 'Tujuan & Latar Belakang' : 'Penyebab Teknis'}</span>
                      </span>
                      <p className="text-muted-foreground leading-relaxed break-words">
                        {broadcast.penyebab || (isKegiatan ? 'Pemeliharaan dan peningkatan kualitas layanan air bersih.' : 'Pekerjaan perbaikan pada jaringan distribusi air minum.')}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Info className="size-3.5 text-blue-600" />
                        <span>{isKegiatan ? 'Manfaat Bagi Pelanggan' : 'Dampak Pada Warga'}</span>
                      </span>
                      <p className="text-muted-foreground leading-relaxed break-words">
                        {broadcast.dampak || (isKegiatan ? 'Tekanan air lebih stabil dan pencatatan meter lebih akurat.' : 'Penurunan debit atau penghentian aliran sementara.')}
                      </p>
                    </div>
                  </div>

                  {/* Tindakan TRC */}
                  {broadcast.tindakanPenanganan && (
                    <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1 text-copy-12">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Wrench className="size-3.5 text-primary" />
                        <span>{isKegiatan ? 'Pelaksanaan Lapangan Tim Wilayah 5' : 'Tindakan Tim Reaksi Cepat'}</span>
                      </span>
                      <p className="text-muted-foreground leading-relaxed break-words">
                        {broadcast.tindakanPenanganan}
                      </p>
                    </div>
                  )}

                  {/* Wilayah Terdampak */}
                  {broadcast.wilayahTerdampak && broadcast.wilayahTerdampak.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-copy-13 font-semibold text-foreground">
                          <MapPin className="size-3.5 text-primary" />
                          <span>{isKegiatan ? 'Lokasi & Kelurahan Sasaran' : `Area Terdampak (${totalKelurahanTerdampak} Kelurahan)`}</span>
                        </div>
                        <div className="relative w-full sm:w-56">
                          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Cari kelurahan Anda..."
                            value={pencarianWilayah}
                            onChange={(e) => setPencarianWilayah(e.target.value)}
                            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1 text-copy-12 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-3 space-y-2 max-h-40 overflow-y-auto">
                        {daftarWilayahTerfilter.filter((w) => w.terdampak).map((wil, i) => (
                          <div key={i} className="space-y-1">
                            <span className="text-copy-11 font-semibold text-foreground font-mono">
                              Kecamatan {wil.kecamatan}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {wil.kelurahan.map((kel, j) => (
                                <span
                                  key={j}
                                  className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[11px] text-foreground"
                                >
                                  {kel}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kontak Tangki Air Darurat */}
                  {broadcast.kontakBantuan && (
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-copy-11 font-mono uppercase tracking-wider text-muted-foreground">
                          Bantuan Air Bersih Gratis
                        </span>
                        <h5 className="text-copy-13 font-semibold text-foreground">
                          {broadcast.kontakBantuan.label}
                        </h5>
                      </div>
                      <a
                        href={
                          broadcast.kontakBantuan.waLink ||
                          `tel:${broadcast.kontakBantuan.nomor}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-copy-12 font-medium shrink-0"
                      >
                        <PhoneCall className="size-3.5" />
                        <span>{broadcast.kontakBantuan.nomor}</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX RESOLUSI PENUH VIA RADIX PRIMITIVE:
          1. 100% Fullscreen Hitam Asli (Overlay gelap murni & backdrop blur, BUKAN sheet).
          2. Pointer events 100% terisolasi, tidak tembus ke background dan tidak menggeser/scroll konten belakang.
          3. Tombol Unduh dan Tombol [X] langsung aktif pada klik pertama (1x klik).
      */}
      <DialogPrimitive.Root open={Boolean(lightboxOpen && mediaAktif)} onOpenChange={setLightboxOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md animate-in fade-in duration-150" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-between p-3 sm:p-6 outline-none select-none"
            aria-label={mediaAktif?.judul || 'Pratinjau Foto Resolusi Penuh'}
          >
            <DialogPrimitive.Title className="sr-only">
              {mediaAktif?.judul || 'Pratinjau Foto Resolusi Penuh'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Pratinjau materi gambar atau brosur resolusi penuh
            </DialogPrimitive.Description>

            {/* Bar Atas Lightbox */}
            <div
              className="w-full max-w-5xl flex items-center justify-between pb-3 text-white border-b border-white/10 shrink-0 gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0 flex-1">
                <span className="block text-copy-13 sm:text-copy-14 font-semibold truncate text-white">
                  {mediaAktif?.judul}
                </span>
                {mediaAktif?.tipe && (
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    {mediaAktif.tipe.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {mediaAktif?.url && (
                  <a
                    href={mediaAktif.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 px-3 py-1.5 text-[11px] sm:text-copy-12 font-medium text-white transition-colors cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span className="hidden sm:inline">Unduh Berkas</span>
                  </a>
                )}

                {/* Tombol Tutup [X] Langsung Aktif 1x Klik */}
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    aria-label="Tutup perbesar foto"
                    className="size-8 sm:size-9 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all cursor-pointer border border-white/20 shadow-xs"
                  >
                    <X className="size-4 sm:size-5" />
                  </button>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Area Foto Utama */}
            <div
              className="relative flex-1 w-full max-w-5xl flex items-center justify-center py-3 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaAktif?.url && (
                <img
                  src={mediaAktif.url}
                  alt={mediaAktif.judul}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/features/Pusat-Kendali.png'
                  }}
                  className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>

            {/* Caption Gambar */}
            {mediaAktif?.keterangan && (
              <div
                className="w-full max-w-2xl text-center py-2 text-[11px] sm:text-copy-12 text-neutral-300 line-clamp-2 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {mediaAktif.keterangan}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
