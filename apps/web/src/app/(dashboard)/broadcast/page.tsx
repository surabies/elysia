'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Radio,
  Plus,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  RotateCcw,
  Sparkles,
  MapPin,
  Eye,
  Tag,
  Camera,
  Map,
  ImageIcon,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BroadcastDetailModal } from '@/components/home/BroadcastDetailModal'
import { DAFTAR_BROADCAST_AWAL } from '@/data/broadcast'
import type {
  BroadcastGangguanItem,
  KategoriBroadcast,
  StatusBroadcast,
  TipeMediaBroadcast,
} from '@/types/broadcast'

export default function BroadcastDashboardPage() {
  const [daftar, setDaftar] = React.useState<BroadcastGangguanItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const tersimpan = localStorage.getItem('elysia_broadcast_items')
        if (tersimpan) {
          const parsed = JSON.parse(tersimpan)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {
        // Fallback default
      }
    }
    return DAFTAR_BROADCAST_AWAL
  })

  // Modal Form State
  const [modalBuka, setModalBuka] = React.useState(false)
  const [editItem, setEditItem] = React.useState<BroadcastGangguanItem | null>(null)

  // Preview Modal Warga State
  const [previewItem, setPreviewItem] = React.useState<BroadcastGangguanItem | null>(null)
  const [previewModalBuka, setPreviewModalBuka] = React.useState(false)

  // Form Fields Umum
  const [judul, setJudul] = React.useState('')
  const [ringkasan, setRingkasan] = React.useState('')
  const [kategori, setKategori] = React.useState<KategoriBroadcast>('DARURAT')
  const [status, setStatus] = React.useState<StatusBroadcast>('DALAM_PENGERJAAN')
  const [progresPersen, setProgresPersen] = React.useState(50)
  const [prioritas, setPrioritas] = React.useState<'TINGGI' | 'SEDANG' | 'NORMAL'>('TINGGI')
  const [waktuMulai, setWaktuMulai] = React.useState('Hari ini, 08.00 WIB')
  const [estimasiSelesai, setEstimasiSelesai] = React.useState('Hari ini, 17.00 WIB')
  const [penyebab, setPenyebab] = React.useState('')
  const [dampak, setDampak] = React.useState('')
  const [tindakanPenanganan, setTindakanPenanganan] = React.useState('')
  const [kecamatanInput, setKecamatanInput] = React.useState('Sumur Bandung, Coblong')
  const [kontakNomor, setKontakNomor] = React.useState('0811-222-7771')

  // Form Fields Media (Foto Kegiatan, Brosur Gebyar, Peta Area Gangguan)
  const [gambarUtama, setGambarUtama] = React.useState('')
  const [tipeGambarUtama, setTipeGambarUtama] = React.useState<TipeMediaBroadcast>('FOTO_KEGIATAN')
  const [gambarTambahanUrl, setGambarTambahanUrl] = React.useState('')
  const [gambarTambahanJudul, setGambarTambahanJudul] = React.useState('')
  const [tipeGambarTambahan, setTipeGambarTambahan] = React.useState<TipeMediaBroadcast>('PETA_AREA')

  // Form Fields Khusus Event / Iklan / Promo
  const [highlightDiskon, setHighlightDiskon] = React.useState('Diskon Pasang Baru s.d. 35% & Bebas Balik Nama')
  const [periodePromo, setPeriodePromo] = React.useState('1 November – 30 November 2026')
  const [keunggulanInput, setKeunggulanInput] = React.useState(
    'Diskon Biaya Penyambungan Pipa s.d. 35%\nBebas Biaya Balik Nama Rekening Air 100%\nCicilan Biaya Pasang 0% hingga 6 Bulan\nPemasangan Meter Air Digital Berstandar SNI'
  )
  const [syaratInput, setSyaratInput] = React.useState(
    'Fotokopi KTP/KK pemohon warga Kota Bandung\nFotokopi bukti kepemilikan persil/rumah atau PBB\nJaringan pipa dinas telah tersedia di depan persil'
  )
  const [langkahInput, setLangkahInput] = React.useState(
    'Isi formulir online di menu Pasang Baru\nPetugas melakukan survei lapangan & verifikasi (1-2 hari)\nKonfirmasi biaya promo & instalasi meter air\nAir bersih perpipaan langsung mengalir ke rumah'
  )
  const [ctaLink, setCtaLink] = React.useState('/pasang-baru')
  const [ctaText, setCtaText] = React.useState('Daftar Pasang Baru Sekarang')

  const simpanKeStorage = (items: BroadcastGangguanItem[]) => {
    setDaftar(items)
    if (typeof window !== 'undefined') {
      localStorage.setItem('elysia_broadcast_items', JSON.stringify(items))
      window.dispatchEvent(new Event('elysia:broadcast-updated'))
    }
  }

  const toggleAktif = (id: string) => {
    const baru = daftar.map((item) =>
      item.id === id ? { ...item, aktif: !item.aktif } : item
    )
    simpanKeStorage(baru)
    const target = baru.find((i) => i.id === id)
    if (target?.aktif) {
      toast.success(`Siaran "${target.judul}" sekarang AKTIF di Landing Page`)
    } else {
      toast.info(`Siaran "${target?.judul}" dinonaktifkan dari Landing Page`)
    }
  }

  const hapusItem = (id: string) => {
    if (confirm('Yakin ingin menghapus siaran informasi ini?')) {
      const baru = daftar.filter((item) => item.id !== id)
      simpanKeStorage(baru)
      toast.success('Siaran berhasil dihapus')
    }
  }

  const bukaFormTambah = () => {
    setEditItem(null)
    setJudul('')
    setRingkasan('')
    setKategori('DARURAT')
    setStatus('DALAM_PENGERJAAN')
    setProgresPersen(50)
    setPrioritas('TINGGI')
    setWaktuMulai('Hari ini, 08.00 WIB')
    setEstimasiSelesai('Hari ini, 18.00 WIB')
    setPenyebab('Kebocoran pipa distribusi transmisi')
    setDampak('Aliran air mengecil atau mati sementara')
    setTindakanPenanganan('Tim Reaksi Cepat sedang melakukan penggantian flange & sleeve pipa')
    setKecamatanInput('Sumur Bandung, Regol')
    setKontakNomor('0811-222-7771')

    // Media
    setGambarUtama('/images/meter/petugas.jpg')
    setTipeGambarUtama('FOTO_KEGIATAN')
    setGambarTambahanUrl('/images/features/jaringan-bandung.png')
    setGambarTambahanJudul('Peta Area Gangguan & Terdampak')
    setTipeGambarTambahan('PETA_AREA')

    // Promo
    setHighlightDiskon('Diskon Pasang Baru s.d. 35%')
    setPeriodePromo('1 November – 30 November 2026')
    setKeunggulanInput('Diskon Pasang Baru 35%\nBebas Biaya Balik Nama\nCicilan 0%')
    setSyaratInput('Fotokopi KTP\nFotokopi PBB Terakhir')
    setLangkahInput('Daftar Online\nSurvei Lapangan\nPemasangan Meter Air')
    setCtaLink('/pasang-baru')
    setCtaText('Daftar Pasang Baru Sekarang')

    setModalBuka(true)
  }

  const bukaFormEdit = (item: BroadcastGangguanItem) => {
    setEditItem(item)
    setJudul(item.judul)
    setRingkasan(item.ringkasan)
    setKategori(item.kategori)
    setStatus(item.status)
    setProgresPersen(item.progresPersen)
    setPrioritas(item.prioritas)
    setWaktuMulai(item.waktuMulai)
    setEstimasiSelesai(item.estimasiSelesai)
    setPenyebab(item.penyebab)
    setDampak(item.dampak)
    setTindakanPenanganan(item.tindakanPenanganan)
    setKecamatanInput(item.wilayahTerdampak.map((w) => w.kecamatan).join(', '))
    setKontakNomor(item.kontakBantuan?.nomor ?? '0811-222-7771')

    // Media
    setGambarUtama(item.gambarUtama || '')
    setTipeGambarUtama(item.tipeGambarUtama || (item.kategori === 'EVENT' ? 'BROSUR' : 'FOTO_KEGIATAN'))
    const galeriTambahan = item.galeriMedia && item.galeriMedia[1]
    if (galeriTambahan) {
      setGambarTambahanUrl(galeriTambahan.url)
      setGambarTambahanJudul(galeriTambahan.judul)
      setTipeGambarTambahan(galeriTambahan.tipe)
    } else {
      setGambarTambahanUrl('')
      setGambarTambahanJudul('')
      setTipeGambarTambahan('PETA_AREA')
    }

    // Promo
    if (item.promoDetails) {
      setHighlightDiskon(item.promoDetails.highlightDiskon || '')
      setPeriodePromo(item.promoDetails.periode || '')
      setKeunggulanInput((item.promoDetails.keunggulan || []).join('\n'))
      setSyaratInput((item.promoDetails.syaratKetentuan || []).join('\n'))
      setLangkahInput((item.promoDetails.langkahDaftar || []).join('\n'))
      setCtaLink(item.promoDetails.ctaLink || '/pasang-baru')
      setCtaText(item.promoDetails.ctaText || 'Daftar Pasang Baru Sekarang')
    }

    setModalBuka(true)
  }

  const bukaPratinjauWarga = (item: BroadcastGangguanItem) => {
    setPreviewItem(item)
    setPreviewModalBuka(true)
  }

  // Preset Template Cepat
  const terapkanTemplateBrosurGebyar = () => {
    setJudul('Promo Gebyar Sambungan Baru & Bebas Biaya Balik Nama')
    setRingkasan('Diskon biaya pemasangan sambungan rumah tangga baru hingga 35% dan bebas biaya balik nama selama bulan ini.')
    setKategori('EVENT')
    setStatus('DALAM_PENGERJAAN')
    setProgresPersen(100)
    setPrioritas('NORMAL')
    setWaktuMulai('1 November 2026')
    setEstimasiSelesai('30 November 2026')
    setGambarUtama('/images/brosur-gebyar.svg')
    setTipeGambarUtama('BROSUR')
    setGambarTambahanUrl('/images/hero.jpg')
    setGambarTambahanJudul('Dokumentasi Layanan Loket Terpadu')
    setTipeGambarTambahan('FOTO_KEGIATAN')
    setHighlightDiskon('Diskon Pasang Baru s.d. 35% & Bebas Balik Nama')
    setPeriodePromo('1 November – 30 November 2026')
    setKeunggulanInput(
      'Diskon Biaya Penyambungan Pipa Rumah Tangga s.d. 35%\nBebas Biaya Balik Nama Rekening Air 100%\nFasilitas Cicilan Biaya Pasang 0% hingga 6 Bulan\nPemasangan Meter Air Digital Berstandar SNI'
    )
    setSyaratInput(
      'Warga Kota Bandung dengan menunjukkan fotokopi KTP/KK pemohon\nFotokopi bukti kepemilikan persil/rumah atau PBB\nJaringan pipa distribusi Tirtawening telah tersedia di depan persil'
    )
    setLangkahInput(
      'Buka formulir online di menu Pasang Baru pada portal web ini\nPetugas melakukan survei lapangan & verifikasi (1-2 hari kerja)\nKonfirmasi jadwal instalasi & persetujuan biaya hemat\nPemasangan meter air resmi dan pengaliran air bersih langsung aktif'
    )
    setCtaLink('/pasang-baru')
    setCtaText('Daftar Pasang Baru Sekarang')
    toast.success('Template Brosur Gebyar berhasil diterapkan ke formulir!')
  }

  const terapkanTemplateFotoPipa = () => {
    setJudul('Pekerjaan Darurat Pipa Transmisi Cisangkuy Ø 400mm')
    setRingkasan('Penurunan tekanan hingga penghentian sementara aliran air bersih di wilayah Bandung Tengah & Selatan.')
    setKategori('DARURAT')
    setStatus('DALAM_PENGERJAAN')
    setProgresPersen(75)
    setPrioritas('TINGGI')
    setWaktuMulai('Hari ini, 06.30 WIB')
    setEstimasiSelesai('Hari ini, 17.00 WIB')
    setPenyebab('Pergeseran tanah yang memicu kebocoran sambungan pipa transmisi utama jalur Cisangkuy.')
    setDampak('Aliran air mengecil atau terhenti sementara pada jam beban puncak.')
    setTindakanPenanganan('Tim Reaksi Cepat Wilayah Selatan sedang melakukan penggantian flange & pengelasan sleeve pipa.')
    setKecamatanInput('Sumur Bandung, Regol, Lengkong')
    setKontakNomor('0811-222-7771')
    setGambarUtama('/images/meter/petugas.jpg')
    setTipeGambarUtama('FOTO_KEGIATAN')
    setGambarTambahanUrl('/images/features/jaringan-bandung.png')
    setGambarTambahanJudul('Peta Jalur Transmisi & Wilayah Terdampak')
    setTipeGambarTambahan('PETA_AREA')
    toast.success('Template Foto Perbaikan & Peta Lapangan berhasil diterapkan!')
  }

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul.trim()) {
      toast.error('Judul siaran wajib diisi')
      return
    }

    const daftarKecamatan = kecamatanInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    // Siapkan galeri media
    const galeri: { url: string; judul: string; keterangan?: string; tipe: TipeMediaBroadcast }[] = []
    if (gambarUtama.trim()) {
      galeri.push({
        url: gambarUtama.trim(),
        judul: judul.trim(),
        keterangan: ringkasan.trim(),
        tipe: tipeGambarUtama,
      })
    }
    if (gambarTambahanUrl.trim()) {
      galeri.push({
        url: gambarTambahanUrl.trim(),
        judul: gambarTambahanJudul.trim() || 'Lampiran Pendukung',
        keterangan: 'Dokumentasi pendukung siaran operasional',
        tipe: tipeGambarTambahan,
      })
    }

    const itemBaru: BroadcastGangguanItem = {
      id: editItem ? editItem.id : `bc-${Date.now().toString().slice(-4)}`,
      judul: judul.trim(),
      ringkasan: ringkasan.trim() || judul.trim(),
      kategori,
      status,
      progresPersen,
      prioritas,
      waktuMulai,
      estimasiSelesai,
      penyebab,
      dampak,
      tindakanPenanganan,
      wilayahTerdampak: daftarKecamatan.map((kec) => ({
        kecamatan: kec,
        kelurahan: [`Seluruh Kelurahan di Kec. ${kec}`],
      })),
      kontakBantuan: kontakNomor
        ? {
            label: kategori === 'EVENT' ? 'Konsultasi Layanan Pelanggan' : 'Layanan Tangki Air Darurat',
            nomor: kontakNomor,
            waLink: `https://wa.me/62${kontakNomor.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=Halo%20Tirtawening,%20informasi%20terkait%20siaran%20${encodeURIComponent(judul.trim())}`,
          }
        : undefined,
      gambarUtama: gambarUtama.trim() || undefined,
      tipeGambarUtama,
      galeriMedia: galeri.length > 0 ? galeri : undefined,
      promoDetails:
        kategori === 'EVENT'
          ? {
              highlightDiskon: highlightDiskon.trim(),
              periode: periodePromo.trim(),
              keunggulan: keunggulanInput.split('\n').map((k) => k.trim()).filter(Boolean),
              syaratKetentuan: syaratInput.split('\n').map((s) => s.trim()).filter(Boolean),
              langkahDaftar: langkahInput.split('\n').map((l) => l.trim()).filter(Boolean),
              ctaLink: ctaLink.trim() || '/pasang-baru',
              ctaText: ctaText.trim() || 'Daftar Pasang Baru Sekarang',
            }
          : undefined,
      aktif: true,
      diperbaruiPada: 'Baru saja',
    }

    let hasil: BroadcastGangguanItem[]
    if (editItem) {
      hasil = daftar.map((item) => (item.id === editItem.id ? itemBaru : item))
      toast.success('Siaran informasi & media berhasil diperbarui!')
    } else {
      hasil = [itemBaru, ...daftar]
      toast.success('Siaran baru dengan media berhasil diterbitkan ke Landing Page!')
    }

    simpanKeStorage(hasil)
    setModalBuka(false)
  }

  const resetKeDefault = () => {
    if (confirm('Kembalikan ke data contoh default Tirtawening lengkap dengan Brosur, Foto Kegiatan, & Peta?')) {
      simpanKeStorage(DAFTAR_BROADCAST_AWAL)
      toast.info('Data siaran telah di-reset ke default lengkap.')
    }
  }

  const totalAktif = daftar.filter((d) => d.aktif).length
  const totalDarurat = daftar.filter((d) => d.aktif && d.kategori === 'DARURAT').length
  const totalEvent = daftar.filter((d) => d.aktif && d.kategori === 'EVENT').length

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>Manajemen Siaran Publik &amp; Iklan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Siaran Gangguan, Foto Kegiatan &amp; Brosur Gebyar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Kelola penyayangan iklan dan pemberitahuan resmi. Dukungan lampiran foto kegiatan tim lapangan,
            brosur gebyar promosi, dan gambar peta zonasi gangguan yang tampil informatif dan elegan di Landing Page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetKeDefault}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Contoh Lengkap</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Buka Landing Page</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
          <button
            type="button"
            onClick={bukaFormTambah}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Siaran / Iklan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Siaran Aktif Saat Ini</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {totalAktif}
            </span>
            <span className="text-xs text-slate-500">tampil di running text</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Iklan / Event Promosi Aktif</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalEvent}
            </span>
            <span className="text-xs text-slate-500">dengan Brosur Gebyar</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Gangguan Darurat Lapangan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {totalDarurat}
            </span>
            <span className="text-xs text-slate-500">dengan Peta &amp; Foto Perbaikan</span>
          </div>
        </div>
      </div>

      {/* Daftar Siaran Card */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daftar Siaran, Media Foto Kegiatan &amp; Brosur
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Total {daftar.length} entri siaran
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {daftar.map((item) => {
            const isDarurat = item.kategori === 'DARURAT'
            const isPemeliharaan = item.kategori === 'PEMELIHARAAN'
            const isEvent = item.kategori === 'EVENT'

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Thumbnail Gambar Media di Kiri */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    onClick={() => bukaPratinjauWarga(item)}
                    className="relative h-16 w-24 sm:h-20 sm:w-32 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-800 cursor-pointer group/thumb"
                    title="Klik untuk pratinjau modal warga"
                  >
                    {item.gambarUtama ? (
                      <img
                        src={item.gambarUtama}
                        alt={item.judul}
                        className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-500">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Konten Teks */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isDarurat
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : isPemeliharaan
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : isEvent
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                        }`}
                      >
                        {isEvent && <Sparkles className="h-3 w-3" />}
                        {isDarurat && <AlertTriangle className="h-3 w-3" />}
                        {isPemeliharaan && <Wrench className="h-3 w-3" />}
                        <span>{item.kategori}</span>
                      </span>

                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono font-medium"
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>

                      {item.tipeGambarUtama && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:text-slate-400">
                          {item.tipeGambarUtama === 'BROSUR' && <Tag className="h-2.5 w-2.5 text-emerald-500" />}
                          {item.tipeGambarUtama === 'FOTO_KEGIATAN' && <Camera className="h-2.5 w-2.5 text-cyan-500" />}
                          {item.tipeGambarUtama === 'PETA_AREA' && <Map className="h-2.5 w-2.5 text-amber-500" />}
                          <span>{item.tipeGambarUtama.replace('_', ' ')}</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 ml-auto sm:ml-0 font-mono">
                        Target: {item.estimasiSelesai}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.judul}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.ringkasan}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                        Wilayah:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {item.wilayahTerdampak.map((w) => w.kecamatan).join(', ')}
                        </strong>
                      </span>
                      {isEvent && item.promoDetails?.highlightDiskon ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ★ {item.promoDetails.highlightDiskon}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-mono">
                          <Wrench className="h-3.5 w-3.5 text-slate-400" />
                          Progres: {item.progresPersen}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Kontrol & Aksi */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {item.aktif ? 'Tayang' : 'Nonaktif'}
                    </span>
                    <Switch
                      checked={item.aktif}
                      onCheckedChange={() => toggleAktif(item.id)}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Tombol Pratinjau Tampilan Warga */}
                    <button
                      type="button"
                      onClick={() => bukaPratinjauWarga(item)}
                      aria-label="Pratinjau tampilan modal warga"
                      title="Pratinjau tampilan modal warga"
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Pratinjau</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => bukaFormEdit(item)}
                      aria-label="Edit siaran"
                      title="Edit siaran"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => hapusItem(item.id)}
                      aria-label="Hapus siaran"
                      title="Hapus siaran"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL FORM TAMBAH / EDIT SIARAN DENGAN MEDIA LENGKAP */}
      <Dialog open={modalBuka} onOpenChange={setModalBuka}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-7">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold">
              {editItem ? 'Edit Konten Siaran & Media' : 'Buat Siaran / Iklan Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Input foto kegiatan lapangan, brosur gebyar promosi, atau gambar peta area gangguan agar warga dapat memahami informasi dengan jelas dan fungsional.
            </DialogDescription>
          </DialogHeader>

          {/* Tombol Template Cepat */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Template Cepat:</span>
            <button
              type="button"
              onClick={terapkanTemplateBrosurGebyar}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              <span>Brosur Gebyar Diskon</span>
            </button>
            <button
              type="button"
              onClick={terapkanTemplateFotoPipa}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 font-semibold transition-colors"
            >
              <Wrench className="h-3 w-3" />
              <span>Foto Perbaikan &amp; Peta Lapangan</span>
            </button>
          </div>

          <form onSubmit={handleSimpan} className="space-y-4 pt-1">
            {/* Judul */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Informasi / Iklan:
              </label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Cth: Promo Gebyar Sambungan Baru 2026 / Perbaikan Pipa Transmisi Cisangkuy"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Kategori & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kategori Informasi:
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as KategoriBroadcast)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white font-medium"
                >
                  <option value="EVENT">EVENT / IKLAN &amp; PROMO (Hijau/Emerald)</option>
                  <option value="DARURAT">DARURAT (Merah/Rose)</option>
                  <option value="PEMELIHARAAN">PEMELIHARAAN (Kuning/Amber)</option>
                  <option value="INFORMASI">INFORMASI UMUM (Biru/Cyan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusBroadcast)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="DALAM_PENGERJAAN">DALAM PENGERJAAN / AKTIF</option>
                  <option value="TERJADWAL">TERJADWAL</option>
                  <option value="SELESAI">SELESAI</option>
                </select>
              </div>
            </div>

            {/* SECTION MEDIA INPUT: Foto Kegiatan, Brosur Gebyar, Gambar Area Gangguan */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3 dark:border-cyan-500/40 dark:bg-cyan-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-950 dark:text-cyan-300 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-cyan-600" />
                  Media Visual Utama (Foto Kegiatan / Brosur Gebyar / Gambar Area Gangguan)
                </span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold">
                  Tampil di Showcase Modal Warga
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    URL Gambar / Path Berkas:
                  </label>
                  <input
                    type="text"
                    value={gambarUtama}
                    onChange={(e) => setGambarUtama(e.target.value)}
                    placeholder="/images/brosur-gebyar.svg atau /images/meter/petugas.jpg"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Tipe Media:
                  </label>
                  <select
                    value={tipeGambarUtama}
                    onChange={(e) => setTipeGambarUtama(e.target.value as TipeMediaBroadcast)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-semibold"
                  >
                    <option value="BROSUR">BROSUR GEBYAR</option>
                    <option value="FOTO_KEGIATAN">FOTO KEGIATAN LAPANGAN</option>
                    <option value="PETA_AREA">GAMBAR PETA AREA GANGGUAN</option>
                    <option value="DOKUMENTASI">DOKUMENTASI LAINNYA</option>
                  </select>
                </div>
              </div>

              {/* Media Tambahan / Peta Pendukung */}
              <div className="pt-2 border-t border-cyan-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Media Tambahan / Peta Gangguan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={gambarTambahanUrl}
                    onChange={(e) => setGambarTambahanUrl(e.target.value)}
                    placeholder="/images/features/jaringan-bandung.png"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Judul Lampiran:
                  </label>
                  <input
                    type="text"
                    value={gambarTambahanJudul}
                    onChange={(e) => setGambarTambahanJudul(e.target.value)}
                    placeholder="Peta Jalur Transmisi"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* KHUSUS EVENT / IKLAN: Highlight Diskon & Keunggulan */}
            {kategori === 'EVENT' && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 dark:border-emerald-500/40 dark:bg-emerald-950/20">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Informasi Promosi, Keunggulan &amp; Syarat Pendaftaran
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Highlight Diskon / Penawaran:
                    </label>
                    <input
                      type="text"
                      value={highlightDiskon}
                      onChange={(e) => setHighlightDiskon(e.target.value)}
                      placeholder="Diskon Pasang Baru s.d. 35% & Bebas Balik Nama"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Periode Promo:
                    </label>
                    <input
                      type="text"
                      value={periodePromo}
                      onChange={(e) => setPeriodePromo(e.target.value)}
                      placeholder="1 November – 30 November 2026"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Keunggulan Program (1 baris per poin):
                  </label>
                  <textarea
                    rows={3}
                    value={keunggulanInput}
                    onChange={(e) => setKeunggulanInput(e.target.value)}
                    placeholder="Diskon Pasang Baru 35%&#10;Bebas Biaya Balik Nama 100%&#10;Cicilan 0% 6 Bulan"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Langkah Pendaftaran:
                    </label>
                    <textarea
                      rows={3}
                      value={langkahInput}
                      onChange={(e) => setLangkahInput(e.target.value)}
                      placeholder="1. Isi formulir online&#10;2. Survei lapangan&#10;3. Pemasangan meter air"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Syarat Dokumen:
                    </label>
                    <textarea
                      rows={3}
                      value={syaratInput}
                      onChange={(e) => setSyaratInput(e.target.value)}
                      placeholder="Fotokopi KTP Pemohon&#10;Fotokopi Bukti PBB"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Tautan Tombol CTA (Link):
                    </label>
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="/pasang-baru"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Teks Tombol CTA:
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Daftar Pasang Baru Sekarang"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ringkasan */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ringkasan Informasi (Lede):
              </label>
              <textarea
                rows={2}
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Penjelasan ringkas yang mudah dipahami warga..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Wilayah Terdampak */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kecamatan / Wilayah Sasaran (Pisahkan dengan koma):
              </label>
              <input
                type="text"
                value={kecamatanInput}
                onChange={(e) => setKecamatanInput(e.target.value)}
                placeholder="Sumur Bandung, Coblong, Regol atau Seluruh Wilayah Kota Bandung"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Estimasi Waktu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Waktu Mulai:
                </label>
                <input
                  type="text"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Selesai / Batas Waktu:
                </label>
                <input
                  type="text"
                  value={estimasiSelesai}
                  onChange={(e) => setEstimasiSelesai(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Hotline Bantuan WhatsApp */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nomor WhatsApp Call Center / Layanan Pelanggan:
              </label>
              <input
                type="text"
                value={kontakNomor}
                onChange={(e) => setKontakNomor(e.target.value)}
                placeholder="0811-222-7771"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Tombol Aksi Form */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalBuka(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-bold"
              >
                Simpan &amp; Tayangkan ke Publik
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL PRATINJAU WARGA LANGSUNG DARI DASHBOARD */}
      <BroadcastDetailModal
        broadcast={previewItem}
        open={previewModalBuka}
        onOpenChange={setPreviewModalBuka}
      />
    </div>
  )
}
