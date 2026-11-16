'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  ChevronRight,
  Sparkles,
  Maximize2,
  X,
  Share2,
  Download,
  Tag,
  Calendar,
  Camera,
  Map,
  Check,
  ShieldCheck,
  ArrowRight,
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

  // Reset media tab saat item berganti
  React.useEffect(() => {
    setActiveMediaIndex(0)
    setPencarianWilayah('')
  }, [broadcast?.id])

  if (!broadcast) return null

  const isDarurat = broadcast.kategori === 'DARURAT'
  const isPemeliharaan = broadcast.kategori === 'PEMELIHARAAN'
  const isEvent = broadcast.kategori === 'EVENT'

  // Kumpulkan daftar media (foto kegiatan, brosur gebyar, gambar area gangguan)
  const daftarMedia: MediaBroadcastItem[] = React.useMemo(() => {
    if (broadcast.galeriMedia && broadcast.galeriMedia.length > 0) {
      return broadcast.galeriMedia
    }
    if (broadcast.gambarUtama) {
      return [
        {
          url: broadcast.gambarUtama,
          judul: broadcast.judul,
          keterangan: broadcast.ringkasan,
          tipe: broadcast.tipeGambarUtama || (isEvent ? 'BROSUR' : 'FOTO_KEGIATAN'),
        },
      ]
    }
    return []
  }, [broadcast, isEvent])

  const mediaAktif = daftarMedia[activeMediaIndex] || daftarMedia[0]

  // Filter kelurahan terdampak sesuai input pencarian
  const keyword = pencarianWilayah.toLowerCase().trim()
  const daftarWilayahTerfilter = broadcast.wilayahTerdampak.map((w) => {
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

  const totalKelurahanTerdampak = broadcast.wilayahTerdampak.reduce(
    (acc, curr) => acc + curr.kelurahan.length,
    0
  )

  const handleSalinTautan = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/#siaran-${broadcast.id}`
      navigator.clipboard.writeText(url).then(() => {
        setSudahDisalin(true)
        toast.success('Tautan siaran berhasil disalin ke papan klip!')
        setTimeout(() => setSudahDisalin(false), 2500)
      })
    }
  }

  const renderBadgeTipeMedia = (tipe: TipeMediaBroadcast) => {
    switch (tipe) {
      case 'BROSUR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white shadow-xs backdrop-blur-md">
            <Tag className="h-3 w-3" />
            <span>Brosur Gebyar Resmi</span>
          </span>
        )
      case 'FOTO_KEGIATAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/90 text-slate-950 shadow-xs backdrop-blur-md">
            <Camera className="h-3 w-3" />
            <span>Foto Dokumentasi Lapangan</span>
          </span>
        )
      case 'PETA_AREA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-slate-950 shadow-xs backdrop-blur-md">
            <Map className="h-3 w-3" />
            <span>Peta Wilayah Terdampak</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white shadow-xs backdrop-blur-md">
            <Info className="h-3 w-3" />
            <span>Lampiran Visual</span>
          </span>
        )
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-w-3xl">
          {/* Header Accent Glow Bar */}
          <div
            className={`h-2.5 w-full ${
              isDarurat
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600'
                : isPemeliharaan
                  ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500'
                  : isEvent
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600'
            }`}
          />

          <div className="p-5 sm:p-7 space-y-6">
            {/* Header Meta Info */}
            <DialogHeader className="space-y-3 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                    isDarurat
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                      : isPemeliharaan
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                        : isEvent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isDarurat
                          ? 'bg-rose-400'
                          : isPemeliharaan
                            ? 'bg-amber-400'
                            : isEvent
                              ? 'bg-emerald-400'
                              : 'bg-cyan-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isDarurat
                          ? 'bg-rose-500'
                          : isPemeliharaan
                            ? 'bg-amber-500'
                            : isEvent
                              ? 'bg-emerald-500'
                              : 'bg-cyan-500'
                      }`}
                    />
                  </span>
                  <span>{broadcast.kategori}</span>
                </span>

                <Badge
                  variant="outline"
                  className="text-xs font-medium text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800"
                >
                  {broadcast.status.replace('_', ' ')}
                </Badge>

                {isEvent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    Promo Terbatas
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <span>Pembaruan: {broadcast.diperbaruiPada}</span>
                  <button
                    type="button"
                    onClick={handleSalinTautan}
                    title="Salin tautan informasi ini"
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    {sudahDisalin ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                {broadcast.judul}
              </DialogTitle>

              <DialogDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {broadcast.ringkasan}
              </DialogDescription>
            </DialogHeader>

            {/* SHOWCASE MEDIA VISUAL (Brosur Gebyar, Foto Kegiatan, Peta Area Gangguan) */}
            {daftarMedia.length > 0 && (
              <div className="space-y-3">
                <div className="relative group overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 dark:border-slate-800">
                  {/* Container Gambar Aktif */}
                  <div
                    onClick={() => setLightboxOpen(true)}
                    className="relative w-full h-56 sm:h-80 md:h-96 cursor-pointer bg-slate-900 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={mediaAktif.url}
                      alt={mediaAktif.judul}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-102"
                      loading="lazy"
                    />

                    {/* Tag Tipe Media di pojok kiri atas */}
                    <div className="absolute top-3 left-3 z-10">
                      {renderBadgeTipeMedia(mediaAktif.tipe)}
                    </div>

                    {/* Tombol Perbesar / Lightbox di pojok kanan atas */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxOpen(true)
                      }}
                      className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 hover:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-transform active:scale-95 border border-white/20"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Perbesar Gambar</span>
                    </button>

                    {/* Caption Bar di bagian bawah */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 sm:p-4 text-white">
                      <p className="text-xs sm:text-sm font-semibold tracking-tight">
                        {mediaAktif.judul}
                      </p>
                      {mediaAktif.keterangan && (
                        <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 sm:line-clamp-2 mt-0.5">
                          {mediaAktif.keterangan}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thumbnails Galeri jika media > 1 */}
                {daftarMedia.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {daftarMedia.map((media, idx) => {
                      const isActive = idx === activeMediaIndex
                      return (
                        <button
                          key={`thumb-${idx}`}
                          type="button"
                          onClick={() => setActiveMediaIndex(idx)}
                          className={`relative flex items-center gap-2 rounded-xl p-1.5 pr-3 border text-left transition-all shrink-0 cursor-pointer ${
                            isActive
                              ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/40'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60'
                          }`}
                        >
                          <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                            <img
                              src={media.url}
                              alt={media.judul}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold text-slate-800 dark:text-white truncate max-w-44">
                              {media.judul}
                            </span>
                            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
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

            {/* KONTEN SESUAI RELEVANSI: EVENT / IKLAN / PROMO */}
            {isEvent && broadcast.promoDetails && (
              <div className="space-y-5">
                {/* Highlight Diskon & Periode */}
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white p-5 sm:p-6 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 dark:border-emerald-800/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Penawaran Terbatas
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                        {broadcast.promoDetails.highlightDiskon || 'Promo Gebyar Sambungan Baru'}
                      </h4>
                    </div>
                    {broadcast.promoDetails.periode && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs self-start sm:self-auto">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{broadcast.promoDetails.periode}</span>
                      </div>
                    )}
                  </div>

                  {/* Keunggulan Program */}
                  {broadcast.promoDetails.keunggulan && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
                      {broadcast.promoDetails.keunggulan.map((keunggulan, idx) => (
                        <div
                          key={`keunggulan-${idx}`}
                          className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3 border border-emerald-100 shadow-2xs dark:bg-slate-900/80 dark:border-emerald-900/40"
                        >
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mt-0.5">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {keunggulan}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Langkah Pendaftaran Berurutan */}
                {broadcast.promoDetails.langkahDaftar && (
                  <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/40">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Langkah Mudah Pendaftaran Sambungan Baru
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {broadcast.promoDetails.langkahDaftar.map((langkah, idx) => (
                        <div
                          key={`langkah-${idx}`}
                          className="flex items-start gap-3 rounded-xl bg-white p-3 border border-slate-100 shadow-2xs dark:bg-slate-900/90 dark:border-slate-800"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold dark:bg-cyan-500 dark:text-slate-950">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {langkah}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Syarat & Ketentuan Ringkas */}
                {broadcast.promoDetails.syaratKetentuan && (
                  <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="h-4 w-4 text-cyan-600" />
                      Persyaratan Dokumen &amp; Ketentuan
                    </div>
                    <ul className="space-y-1.5 pt-1">
                      {broadcast.promoDetails.syaratKetentuan.map((syarat, idx) => (
                        <li
                          key={`syarat-${idx}`}
                          className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                          <span>{syarat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tombol Aksi Call-To-Action (CTA) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Link
                    href={broadcast.promoDetails.ctaLink || '/pasang-baru'}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 active:scale-95 transition-all text-center"
                    onClick={() => onOpenChange(false)}
                  >
                    <span>{broadcast.promoDetails.ctaText || 'Daftar Pasang Baru Sekarang'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {broadcast.kontakBantuan && (
                    <a
                      href={broadcast.kontakBantuan.waLink || `https://wa.me/62${broadcast.kontakBantuan.nomor.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <PhoneCall className="h-4 w-4 text-emerald-600" />
                      <span>Konsultasi WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* KONTEN SESUAI RELEVANSI: GANGGUAN DARURAT & PEMELIHARAAN TEKNIS */}
            {!isEvent && (
              <div className="space-y-5">
                {/* Progres Penanganan Lapangan */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-cyan-500" />
                      Progres Penanganan Lapangan
                    </span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      {broadcast.progresPersen}%
                    </span>
                  </div>
                  <Progress
                    value={broadcast.progresPersen}
                    className="h-2.5 bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Mulai: {broadcast.waktuMulai}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Target Normal: {broadcast.estimasiSelesai}</span>
                    </div>
                  </div>
                </div>

                {/* Penyebab & Dampak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Penyebab Teknis
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {broadcast.penyebab}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                      <Info className="h-4 w-4 text-blue-500" />
                      Dampak Pada Pelanggan
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {broadcast.dampak}
                    </p>
                  </div>
                </div>

                {/* Tindakan Penanganan */}
                {broadcast.tindakanPenanganan && (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs sm:text-sm dark:border-cyan-500/30 dark:bg-cyan-950/20">
                    <div className="flex items-center gap-2 font-semibold text-cyan-900 dark:text-cyan-300 mb-1">
                      <Wrench className="h-4 w-4 text-cyan-500" />
                      Tindakan Penanganan Tim Reaksi Cepat
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {broadcast.tindakanPenanganan}
                    </p>
                  </div>
                )}

                {/* Area Gangguan Terdampak Spasial */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Area Wilayah Terdampak
                        </h4>
                        <p className="text-xs text-slate-500">
                          Total {totalKelurahanTerdampak} Kelurahan di{' '}
                          {broadcast.wilayahTerdampak.length} Kecamatan
                        </p>
                      </div>
                    </div>

                    {/* Pencarian Cepat Wilayah */}
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik kelurahan Anda..."
                        value={pencarianWilayah}
                        onChange={(e) => setPencarianWilayah(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* List Kecamatan & Kelurahan Chips */}
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
                    {daftarWilayahTerfilter.every((w) => !w.terdampak) ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Kelurahan atau Kecamatan &quot;{pencarianWilayah}&quot; tidak
                        ditemukan di area gangguan ini.
                      </div>
                    ) : (
                      daftarWilayahTerfilter
                        .filter((w) => w.terdampak)
                        .map((wil, i) => (
                          <div key={i} className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Kecamatan {wil.kecamatan}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {wil.kelurahan.map((kel, j) => (
                                <span
                                  key={j}
                                  className="inline-flex items-center rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs border border-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                >
                                  {kel}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Layanan Tangki Air Darurat & Bantuan */}
                {broadcast.kontakBantuan && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 dark:border-rose-500/30 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Bantuan Darurat Air Bersih
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {broadcast.kontakBantuan.label}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Pelanggan di wilayah terdampak dapat mengajukan pasokan mobil
                        tangki air bersih secara gratis.
                      </p>
                    </div>

                    <a
                      href={broadcast.kontakBantuan.waLink || `tel:${broadcast.kontakBantuan.nomor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-900/20 active:scale-95 transition-all shrink-0"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>Hubungi: {broadcast.kontakBantuan.nomor}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FULLSCREEN LIGHTBOX PREVIEW (Brosur / Peta / Foto Kegiatan) */}
      {lightboxOpen && mediaAktif && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 p-4 sm:p-6"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar Lightbox */}
          <div
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-white border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {renderBadgeTipeMedia(mediaAktif.tipe)}
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {mediaAktif.judul}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={mediaAktif.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                title="Buka atau simpan gambar resolusi penuh"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unduh / Buka Tab</span>
              </a>

              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Tutup pratinjau penuh"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Expanded Image Canvas */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center py-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={mediaAktif.url}
              alt={mediaAktif.judul}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Description Caption di bawah */}
          {mediaAktif.keterangan && (
            <div
              className="w-full max-w-3xl text-center text-xs text-slate-300 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p>{mediaAktif.keterangan}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
