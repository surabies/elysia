'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Save,
  Eye,
  RefreshCw,
  Sparkles,
  Calendar,
  Tag,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Radio,
  Sliders,
  Layers,
  Plus,
  Images,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Camera,
  MapPin,
  Clock,
  PhoneCall,
  Check,
  FileText,
  ShieldCheck,
  Info,
  ArrowUpRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageContainer } from '@/components/layout/index'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CloudinaryImageUploader } from '@/components/broadcast/CloudinaryImageUploader'
import type {
  BroadcastGangguanItem,
  KategoriBroadcast,
  StatusBroadcast,
  TipeMediaBroadcast,
  MediaBroadcastItem,
} from '@/types/broadcast'

export type ContentMode = 'IKLAN_PROMO' | 'DOKUMENTASI_WILAYAH' | 'GANGGUAN_TEKNIS'

interface BroadcastFormPageProps {
  idEdit?: string
}

export function BroadcastFormPage({ idEdit }: BroadcastFormPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(Boolean(idEdit))
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Mode Penayangan (Iklan Promo vs Dokumentasi Wilayah 5 vs Gangguan Teknis)
  const [mode, setMode] = React.useState<ContentMode>('IKLAN_PROMO')

  // Form State Utama
  const [judul, setJudul] = React.useState('')
  const [ringkasan, setRingkasan] = React.useState('')
  const [kategori, setKategori] = React.useState<KategoriBroadcast>('EVENT')
  const [status, setStatus] = React.useState<StatusBroadcast>('DALAM_PENGERJAAN')
  const [progresPersen, setProgresPersen] = React.useState<number>(100)
  const [prioritas, setPrioritas] = React.useState<'TINGGI' | 'SEDANG' | 'NORMAL'>('NORMAL')
  const [waktuMulai, setWaktuMulai] = React.useState('Hari ini')
  const [estimasiSelesai, setEstimasiSelesai] = React.useState('30 November 2026')
  const [penyebab, setPenyebab] = React.useState('')
  const [dampak, setDampak] = React.useState('')
  const [tindakanPenanganan, setTindakanPenanganan] = React.useState('')
  const [kecamatanInput, setKecamatanInput] = React.useState('Kiaracondong, Batununggal, Rancasari, Buahbatu')
  const [kontakNomor, setKontakNomor] = React.useState('0811-222-7771')

  // Kanal & Visibilitas
  const [aktif, setAktif] = React.useState(true)
  const [tampilkanDiSpotlight, setTampilkanDiSpotlight] = React.useState(true)
  const [tampilkanDiTicker, setTampilkanDiTicker] = React.useState(true)
  const [lokasiWilayah, setLokasiWilayah] = React.useState('Pelayanan Wilayah 5')
  const [urutan, setUrutan] = React.useState(0)

  // Media Utama & Galeri Multi-Foto (Mendukung Cloudinary & URL)
  const [gambarUtama, setGambarUtama] = React.useState('/images/promo-gebyar-pasang-baru.svg')
  const [gambarUtamaPublicId, setGambarUtamaPublicId] = React.useState<string | undefined>(undefined)
  const [tipeGambarUtama, setTipeGambarUtama] = React.useState<TipeMediaBroadcast>('BROSUR')
  const [galeriMedia, setGaleriMedia] = React.useState<MediaBroadcastItem[]>([])

  // State Input Tambah Foto Galeri Baru
  const [fotoTambahanUrl, setFotoTambahanUrl] = React.useState('')
  const [fotoTambahanJudul, setFotoTambahanJudul] = React.useState('')
  const [bukaInputFotoGaleri, setBukaInputFotoGaleri] = React.useState(false)

  // State Preview Live Active Photo
  const [previewActivePhotoIdx, setPreviewActivePhotoIdx] = React.useState(0)

  // State Khusus Mode IKLAN_PROMO
  const [highlightDiskon, setHighlightDiskon] = React.useState('Diskon Pasang Baru s.d. 35% & Bebas Balik Nama')
  const [periodePromo, setPeriodePromo] = React.useState('1 November – 30 November 2026')
  const [keunggulanInput, setKeunggulanInput] = React.useState(
    'Diskon Biaya Penyambungan Pipa Rumah Tangga s.d. 35%\nBebas Biaya Balik Nama Rekening Air 100%\nFasilitas Cicilan Biaya Pasang 0% hingga 6 Bulan\nPemasangan Meter Air Digital Berstandar SNI'
  )
  const [syaratInput, setSyaratInput] = React.useState(
    'Warga Kota Bandung dengan fotokopi KTP/KK pemohon\nFotokopi bukti kepemilikan persil/rumah atau PBB\nJaringan pipa distribusi Tirtawening telah tersedia di depan persil'
  )
  const [langkahInput, setLangkahInput] = React.useState(
    'Buka menu Pasang Baru pada portal web resmi Tirtawening\nIsi data identitas diri, alamat persil, dan unggah foto KTP\nTim teknisi Tirtawening survei lokasi & verifikasi jaringan\nPemasangan meter air resmi oleh teknisi bersertifikat'
  )
  const [ctaLink, setCtaLink] = React.useState('/pasang-baru')
  const [ctaText, setCtaText] = React.useState('Daftar Pasang Baru Sekarang')

  // Switch Mode Handler dengan Prefill yang Sesuai
  const handleGantiMode = (targetMode: ContentMode) => {
    setMode(targetMode)
    if (targetMode === 'DOKUMENTASI_WILAYAH') {
      setKategori('KEGIATAN')
      setTipeGambarUtama('FOTO_KEGIATAN')
      setTampilkanDiSpotlight(false)
      setLokasiWilayah('Pelayanan Wilayah 5 (Kiaracondong, Batununggal, Rancasari, Buahbatu)')
      if (!idEdit) {
        setJudul('Pemeliharaan Jaringan Pipa & Flushing Zona Wilayah 5')
        setRingkasan('Aksi nyata tim teknisi Pelayanan Wilayah 5 Perumda Tirtawening Kota Bandung dalam pemeliharaan berkala kualitas air bersih.')
        setGambarUtama('/images/benefits/reaksi-cepat.webp.png')
        setPenyebab('Pemeliharaan preventif kualitas air bersih zona timur & selatan Kota Bandung.')
        setDampak('Tekanan air stabil dan kejernihan air bersih di persil warga meningkat.')
        setTindakanPenanganan('Tim teknisi Wilayah 5 melakukan flushing wash-out pada 4 titik persilangan pipa distribusi.')
        setKecamatanInput('Kiaracondong, Rancasari')
        setKontakNomor('0811-222-7775')
      }
    } else if (targetMode === 'IKLAN_PROMO') {
      setKategori('EVENT')
      setTipeGambarUtama('BROSUR')
      setTampilkanDiSpotlight(true)
      if (!idEdit) {
        setJudul('Promo Gebyar Sambungan Baru 2026')
        setRingkasan('Diskon biaya pemasangan sambungan rumah tangga baru hingga 35% dan bebas biaya balik nama selama bulan ini.')
        setGambarUtama('/images/promo-gebyar-pasang-baru.svg')
        setKontakNomor('0811-222-7771')
      }
    } else {
      setKategori('DARURAT')
      setTipeGambarUtama('FOTO_KEGIATAN')
      setTampilkanDiSpotlight(false)
      setTampilkanDiTicker(true)
      if (!idEdit) {
        setJudul('Pekerjaan Darurat Sambungan Pipa Distribusi Utama')
        setRingkasan('Penurunan debit sementara aliran air bersih akibat perbaikan sambungan pipa transmisi.')
        setGambarUtama('/images/meter/petugas.jpg')
        setPenyebab('Pergeseran tanah yang memicu kebocoran sambungan pipa pipa distribusi.')
        setDampak('Aliran air mengecil sementara pada jam beban puncak.')
        setTindakanPenanganan('Tim Reaksi Cepat sedang melakukan pengelasan sleeve pipa dan normalisasi bertahap.')
        setKontakNomor('(022) 2509030')
      }
    }
  }

  // Load Data jika Mode Edit
  React.useEffect(() => {
    if (!idEdit) return

    setIsLoading(true)
    fetch(`/api/broadcast/${idEdit}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const item: BroadcastGangguanItem = json.data
          setJudul(item.judul)
          setRingkasan(item.ringkasan)
          setKategori(item.kategori)
          setStatus(item.status)
          setProgresPersen(item.progresPersen ?? 100)
          setPrioritas(item.prioritas || 'NORMAL')
          setWaktuMulai(item.waktuMulai)
          setEstimasiSelesai(item.estimasiSelesai)
          setPenyebab(item.penyebab || '')
          setDampak(item.dampak || '')
          setTindakanPenanganan(item.tindakanPenanganan || '')
          setAktif(item.aktif)
          setTampilkanDiSpotlight(item.tampilkanDiSpotlight !== false)
          setTampilkanDiTicker(item.tampilkanDiTicker !== false)
          if (item.lokasiWilayah) setLokasiWilayah(item.lokasiWilayah)
          if (item.urutan !== undefined) setUrutan(item.urutan)

          // Tentukan mode berdasarkan kategori
          if (item.kategori === 'KEGIATAN') {
            setMode('DOKUMENTASI_WILAYAH')
          } else if (item.kategori === 'EVENT' || item.promoDetails) {
            setMode('IKLAN_PROMO')
          } else {
            setMode('GANGGUAN_TEKNIS')
          }

          if (item.wilayahTerdampak && item.wilayahTerdampak.length > 0) {
            setKecamatanInput(item.wilayahTerdampak.map((w) => w.kecamatan).join(', '))
          }
          if (item.kontakBantuan?.nomor) {
            setKontakNomor(item.kontakBantuan.nomor)
          }
          if (item.gambarUtama) {
            setGambarUtama(item.gambarUtama)
            setGambarUtamaPublicId(item.gambarUtamaPublicId)
            setTipeGambarUtama(item.tipeGambarUtama || (item.kategori === 'EVENT' ? 'BROSUR' : 'FOTO_KEGIATAN'))
          }
          if (item.galeriMedia && Array.isArray(item.galeriMedia)) {
            setGaleriMedia(item.galeriMedia.filter((m) => m.url !== item.gambarUtama))
          }
          if (item.promoDetails) {
            setHighlightDiskon(item.promoDetails.highlightDiskon || '')
            setPeriodePromo(item.promoDetails.periode || '')
            if (item.promoDetails.keunggulan) {
              setKeunggulanInput(item.promoDetails.keunggulan.join('\n'))
            }
            if (item.promoDetails.syaratKetentuan) {
              setSyaratInput(item.promoDetails.syaratKetentuan.join('\n'))
            }
            if (item.promoDetails.langkahDaftar) {
              setLangkahInput(item.promoDetails.langkahDaftar.join('\n'))
            }
            setCtaLink(item.promoDetails.ctaLink || '/pasang-baru')
            setCtaText(item.promoDetails.ctaText || 'Daftar Pasang Baru Sekarang')
          }
        }
      })
      .catch((err) => {
        console.error('[LOAD_BROADCAST_EDIT_ERR]', err)
        toast.error('Gagal mengambil data konten dari server')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [idEdit])

  // Inisialisasi awal jika ada query parameter kategori=KEGIATAN
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !idEdit) {
      const params = new URLSearchParams(window.location.search)
      const kat = params.get('kategori')
      if (kat === 'KEGIATAN') {
        handleGantiMode('DOKUMENTASI_WILAYAH')
      }
    }
  }, [idEdit])

  // Kumpulan seluruh foto untuk form & pratinjau
  const semuaFoto = React.useMemo(() => {
    const list: MediaBroadcastItem[] = []
    if (gambarUtama) {
      list.push({
        url: gambarUtama,
        judul: judul || 'Foto Sampul Utama',
        tipe: tipeGambarUtama,
      })
    }
    galeriMedia.forEach((g) => {
      if (g.url && !list.some((existing) => existing.url === g.url)) {
        list.push(g)
      }
    })
    return list
  }, [gambarUtama, tipeGambarUtama, galeriMedia, judul])

  const currentPreviewPhoto = semuaFoto[previewActivePhotoIdx] || semuaFoto[0]

  // Handler Tambah Foto ke Galeri
  const handleTambahFotoGaleri = (urlFoto: string, judulFoto?: string) => {
    if (!urlFoto.trim()) return
    const fotoBaru: MediaBroadcastItem = {
      url: urlFoto.trim(),
      judul: judulFoto?.trim() || `Dokumentasi ${semuaFoto.length + 1}`,
      tipe: mode === 'IKLAN_PROMO' ? 'BROSUR' : 'FOTO_KEGIATAN',
    }
    setGaleriMedia((prev) => [...prev, fotoBaru])
    setFotoTambahanUrl('')
    setFotoTambahanJudul('')
    setBukaInputFotoGaleri(false)
    toast.success('Foto baru berhasil ditambahkan ke galeri!')
  }

  // Handler Hapus Foto Galeri
  const handleHapusFotoGaleri = (urlTarget: string) => {
    setGaleriMedia((prev) => prev.filter((m) => m.url !== urlTarget))
    toast.info('Foto dihapus dari galeri')
  }

  // Handler Jadikan Foto Utama
  const handleJadikanFotoUtama = (photo: MediaBroadcastItem) => {
    const fotoLama = gambarUtama
    setGambarUtama(photo.url)
    setTipeGambarUtama(photo.tipe || (mode === 'IKLAN_PROMO' ? 'BROSUR' : 'FOTO_KEGIATAN'))
    setGaleriMedia((prev) => {
      const filtered = prev.filter((m) => m.url !== photo.url)
      if (fotoLama && fotoLama !== photo.url) {
        filtered.unshift({
          url: fotoLama,
          judul: 'Foto Dokumentasi',
          tipe: 'FOTO_KEGIATAN',
        })
      }
      return filtered
    })
    toast.success('Foto utama sampul berhasil diubah!')
  }

  // Submit Handler
  const simpanKonten = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!judul.trim()) {
      toast.error('Judul konten wajib diisi')
      return
    }

    setIsSubmitting(true)

    const daftarKecamatan = kecamatanInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    const listKeunggulan = keunggulanInput
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean)

    const listSyarat = syaratInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const listLangkah = langkahInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const payload: Partial<BroadcastGangguanItem> = {
      judul: judul.trim(),
      ringkasan: ringkasan.trim() || judul.trim(),
      kategori,
      status,
      progresPersen: Number(progresPersen),
      prioritas,
      waktuMulai: waktuMulai.trim(),
      estimasiSelesai: estimasiSelesai.trim(),
      penyebab: penyebab.trim(),
      dampak: dampak.trim(),
      tindakanPenanganan: tindakanPenanganan.trim(),
      wilayahTerdampak: daftarKecamatan.map((kec) => ({
        kecamatan: kec,
        kelurahan: [`Seluruh Kelurahan di Kec. ${kec}`],
      })),
      kontakBantuan: kontakNomor
        ? {
            label:
              mode === 'DOKUMENTASI_WILAYAH'
                ? 'Posko Layanan Wilayah 5'
                : mode === 'IKLAN_PROMO'
                ? 'Konsultasi Layanan Pelanggan'
                : 'Layanan Tangki Air Darurat',
            nomor: kontakNomor,
            waLink: `https://wa.me/62${kontakNomor.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=Halo%20Tirtawening,%20informasi%20terkait%20${encodeURIComponent(judul.trim())}`,
          }
        : undefined,
      gambarUtama: gambarUtama.trim() || undefined,
      gambarUtamaPublicId: gambarUtamaPublicId || undefined,
      tipeGambarUtama,
      galeriMedia: semuaFoto,
      lokasiWilayah: lokasiWilayah.trim() || 'Pelayanan Wilayah 5',
      promoDetails:
        mode === 'IKLAN_PROMO'
          ? {
              highlightDiskon: highlightDiskon.trim(),
              periode: periodePromo.trim(),
              keunggulan: listKeunggulan,
              syaratKetentuan: listSyarat,
              langkahDaftar: listLangkah,
              ctaLink: ctaLink.trim() || '/pasang-baru',
              ctaText: ctaText.trim() || 'Daftar Pasang Baru Sekarang',
            }
          : undefined,
      aktif,
      tampilkanDiTicker,
      tampilkanDiSpotlight: mode === 'IKLAN_PROMO' ? tampilkanDiSpotlight : false,
      urutan: Number(urutan) || 0,
      diperbaruiPada: 'Baru saja',
    }

    try {
      if (idEdit) {
        const res = await fetch(`/api/broadcast/${idEdit}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Gagal memperbarui ke server')
        toast.success('Konten berhasil diperbarui!')
      } else {
        const res = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Gagal menyimpan ke server')
        toast.success('Konten baru berhasil diterbitkan!')
      }

      // Update local storage cache untuk instant feedback di client
      try {
        const cached = localStorage.getItem('elysia_broadcast_items')
        let items: BroadcastGangguanItem[] = cached ? JSON.parse(cached) : []
        if (idEdit) {
          items = items.map((it) => (it.id === idEdit ? { ...it, ...payload } : it))
        } else {
          items.unshift({ ...payload, id: `bc-${Date.now().toString().slice(-6)}` } as BroadcastGangguanItem)
        }
        localStorage.setItem('elysia_broadcast_items', JSON.stringify(items))
        window.dispatchEvent(new Event('elysia:broadcast-updated'))
      } catch {}

      router.push('/broadcast')
    } catch (err: any) {
      console.warn('[SIMPAN_KONTEN_WARN]', err)
      toast.warning('Konten disimpan ke browser cache lokal (server offline)')
      router.push('/broadcast')
    } finally {
      setIsSubmitting(false)
    }
  }

  const listKeunggulanPreview = keunggulanInput.split('\n').filter(Boolean)

  return (
    <PageContainer className="space-y-6">
      {/* Header Halaman Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Radio className="size-3.5" />
            <span>Manajemen Konten Portal Tirtawening</span>
            {idEdit && (
              <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                ID: {idEdit}
              </Badge>
            )}
          </div>
          <h1 className="text-heading-24 font-bold tracking-tight text-foreground">
            {idEdit
              ? `Edit Konten: ${judul || idEdit}`
              : mode === 'DOKUMENTASI_WILAYAH'
              ? 'Tambah Dokumentasi Kegiatan Pelayanan Wilayah 5'
              : mode === 'IKLAN_PROMO'
              ? 'Buat Materi Banner Iklan & Promosi Warga'
              : 'Buat Siaran Gangguan & Info Pemeliharaan'}
          </h1>
          <p className="text-copy-13 text-muted-foreground max-w-3xl">
            Formulir terstruktur berbasis shadcn/ui dengan pratinjau live yang presisi sesuai tampilan akhir warga di landing page.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/broadcast')}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="konten-form"
            disabled={isSubmitting}
            className="gap-2 px-5 font-semibold"
          >
            {isSubmitting ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>{idEdit ? 'Simpan Perubahan' : 'Terbitkan Konten'}</span>
          </Button>
        </div>
      </div>

      {/* ========================================================
          PILIHAN MODE KONTEN (3-TAB CARD SELECTOR ELEGAN)
          ======================================================== */}
      <div className="space-y-2">
        <Label className="text-copy-12 font-semibold text-muted-foreground uppercase tracking-wider">
          Pilih Jenis Konten yang Dikelola:
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opsi 1: Iklan & Promo */}
          <div
            onClick={() => handleGantiMode('IKLAN_PROMO')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              mode === 'IKLAN_PROMO'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                : 'border-border bg-card hover:border-neutral-300 dark:hover:border-neutral-700 opacity-75 hover:opacity-100'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${mode === 'IKLAN_PROMO' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-copy-14 font-bold text-foreground">Iklan &amp; Promo Warga</span>
                {mode === 'IKLAN_PROMO' && <span className="size-2 rounded-full bg-blue-600 animate-pulse" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Tayang di Spotlight Carousel beranimasi (Gebyar pasang baru, diskon, relaksasi denda).
              </p>
            </div>
          </div>

          {/* Opsi 2: Dokumentasi Wilayah 5 */}
          <div
            onClick={() => handleGantiMode('DOKUMENTASI_WILAYAH')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              mode === 'DOKUMENTASI_WILAYAH'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs'
                : 'border-border bg-card hover:border-neutral-300 dark:hover:border-neutral-700 opacity-75 hover:opacity-100'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${mode === 'DOKUMENTASI_WILAYAH' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              <Camera className="size-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-copy-14 font-bold text-foreground">Dokumentasi Wilayah 5</span>
                {mode === 'DOKUMENTASI_WILAYAH' && <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Galeri foto aksi teknisi, pemeliharaan pipa, tera meter, dan pelayanan Pelayanan Wilayah 5.
              </p>
            </div>
          </div>

          {/* Opsi 3: Gangguan & Pemeliharaan Teknis */}
          <div
            onClick={() => handleGantiMode('GANGGUAN_TEKNIS')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              mode === 'GANGGUAN_TEKNIS'
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs'
                : 'border-border bg-card hover:border-neutral-300 dark:hover:border-neutral-700 opacity-75 hover:opacity-100'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${mode === 'GANGGUAN_TEKNIS' ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-copy-14 font-bold text-foreground">Siaran Gangguan Teknis</span>
                {mode === 'GANGGUAN_TEKNIS' && <span className="size-2 rounded-full bg-amber-600 animate-pulse" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Siaran perbaikan pipa darurat, jadwal pemeliharaan, dan teks berjalan (running text ticker).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Kolom Kiri Formulir Isian & Kolom Kanan Media + Live Preview */}
      <form id="konten-form" onSubmit={simpanKonten} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================
            KOLOM KIRI (7 Kolom): FORM INPUT TERSTRUKTUR SHADCN/UI
            ======================================================== */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">

          {/* CARD 1: SALURAN & STATUS PENAYANGAN */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <CardTitle className="text-heading-15">1. Saluran Penayangan &amp; Status</CardTitle>
              </div>
              <CardDescription>
                Atur status keaktifan dan kanal tampil konten di portal web warga.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Saklar Status Aktif */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-copy-13 font-semibold text-foreground">
                    Status Konten Aktif
                  </Label>
                  <p className="text-copy-11 text-muted-foreground">
                    Nonaktifkan jika ingin menyimpan draft tanpa menampilkannya ke publik
                  </p>
                </div>
                <Switch checked={aktif} onCheckedChange={setAktif} />
              </div>

              {/* Pilihan Khusus Mode Iklan */}
              {mode === 'IKLAN_PROMO' && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-blue-50/30 dark:bg-blue-950/20">
                  <div className="space-y-0.5">
                    <Label className="text-copy-13 font-semibold text-foreground">
                      Tampilkan di Spotlight Carousel Landing Page
                    </Label>
                    <p className="text-copy-11 text-muted-foreground">
                      Konten bergerak otomatis dalam slider promosi di bawah hero banner
                    </p>
                  </div>
                  <Switch checked={tampilkanDiSpotlight} onCheckedChange={setTampilkanDiSpotlight} />
                </div>
              )}

              {/* Pilihan Khusus Mode Gangguan */}
              {mode === 'GANGGUAN_TEKNIS' && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-amber-50/30 dark:bg-amber-950/20">
                  <div className="space-y-0.5">
                    <Label className="text-copy-13 font-semibold text-foreground">
                      Running Text Ticker Paling Atas
                    </Label>
                    <p className="text-copy-11 text-muted-foreground">
                      Muncul di strip baris teks berjalan paling atas portal web
                    </p>
                  </div>
                  <Switch checked={tampilkanDiTicker} onCheckedChange={setTampilkanDiTicker} />
                </div>
              )}

              {/* Select Shadcn Sizing & Proper Chevrons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {mode === 'GANGGUAN_TEKNIS' && (
                  <div className="space-y-1.5">
                    <Label className="text-copy-12 font-medium">Kategori Gangguan:</Label>
                    <Select
                      value={kategori}
                      onValueChange={(val) => setKategori(val as KategoriBroadcast)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DARURAT">GANGGUAN DARURAT (Pipa Bocor)</SelectItem>
                        <SelectItem value="PEMELIHARAAN">PEMELIHARAAN BERKALA</SelectItem>
                        <SelectItem value="INFORMASI">INFORMASI UMUM OPERASIONAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-copy-12 font-medium">Prioritas Penayangan:</Label>
                  <Select
                    value={prioritas}
                    onValueChange={(val) => setPrioritas(val as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="SEDANG">Sedang</SelectItem>
                      <SelectItem value="TINGGI">Tinggi (Unggulan / Mendesak)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'DOKUMENTASI_WILAYAH' && (
                  <div className="space-y-1.5">
                    <Label className="text-copy-12 font-medium">Status Pelaksanaan:</Label>
                    <Select
                      value={status}
                      onValueChange={(val) => {
                        const s = val as StatusBroadcast
                        setStatus(s)
                        if (s === 'SELESAI') setProgresPersen(100)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELESAI">SELESAI (100% Tuntas)</SelectItem>
                        <SelectItem value="DALAM_PENGERJAAN">DALAM PENGERJAAN</SelectItem>
                        <SelectItem value="TERJADWAL">TERJADWAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Slider Progres Khusus Mode Dokumentasi & Gangguan */}
              {mode !== 'IKLAN_PROMO' && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-copy-12 font-medium">
                      Progres Penyelesaian Pekerjaan:
                    </Label>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {progresPersen}%
                    </Badge>
                  </div>
                  <Slider
                    value={[progresPersen]}
                    onValueChange={(vals) => setProgresPersen(vals[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              )}

              {/* Input Lokasi Unit Pelayanan Khusus Mode Dokumentasi */}
              {mode === 'DOKUMENTASI_WILAYAH' && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-copy-12 font-medium">Lokasi / Unit Pelayanan:</Label>
                  <Input
                    value={lokasiWilayah}
                    onChange={(e) => setLokasiWilayah(e.target.value)}
                    placeholder="Contoh: Pelayanan Wilayah 5 (Kiaracondong, Batununggal, Rancasari)"
                    className="text-copy-13"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Label unit pelayanan yang ditampilkan pada chip lokasi foto dokumentasi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 2: INFORMASI UTAMA KONTEN */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <CardTitle className="text-heading-15">
                  2. {mode === 'DOKUMENTASI_WILAYAH' ? 'Informasi Kegiatan Lapangan' : mode === 'IKLAN_PROMO' ? 'Judul & Penawaran Promosi' : 'Informasi Siaran Gangguan'}
                </CardTitle>
              </div>
              <CardDescription>
                Teks utama yang langsung dibaca warga pada judul kartu dan ringkasan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="judul" className="text-copy-12 font-semibold">
                  {mode === 'DOKUMENTASI_WILAYAH'
                    ? 'Nama / Judul Kegiatan Dokumentasi'
                    : mode === 'IKLAN_PROMO'
                    ? 'Judul Program Iklan & Promosi'
                    : 'Judul Siaran Gangguan Teknis'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="judul"
                  placeholder={
                    mode === 'DOKUMENTASI_WILAYAH'
                      ? 'Contoh: Pemeliharaan Pipa Transmisi & Normalisasi Aliran Zona Kiaracondong'
                      : mode === 'IKLAN_PROMO'
                      ? 'Contoh: Promo Gebyar Sambungan Baru 2026'
                      : 'Contoh: Pekerjaan Darurat Sambungan Pipa Ø 400mm'
                  }
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="text-copy-14 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ringkasan" className="text-copy-12 font-semibold">
                  Ringkasan / Penjelasan Singkat
                </Label>
                <Textarea
                  id="ringkasan"
                  rows={3}
                  placeholder={
                    mode === 'DOKUMENTASI_WILAYAH'
                      ? 'Jelaskan ringkasan pekerjaan lapangan yang telah dikerjakan oleh tim teknisi Wilayah 5...'
                      : 'Jelaskan penawaran atau informasi secara ringkas dan komunikatif kepada warga...'
                  }
                  value={ringkasan}
                  onChange={(e) => setRingkasan(e.target.value)}
                  className="text-copy-13 resize-none"
                />
              </div>

              {/* Tanggal / Waktu Pengerjaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="waktuMulai" className="text-copy-12 font-medium">
                    {mode === 'DOKUMENTASI_WILAYAH' ? 'Tanggal Pelaksanaan:' : 'Waktu Mulai:'}
                  </Label>
                  <Input
                    id="waktuMulai"
                    placeholder="Contoh: 15 November 2026, 08:30 WIB"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="text-copy-13"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estimasiSelesai" className="text-copy-12 font-medium">
                    {mode === 'DOKUMENTASI_WILAYAH' ? 'Target / Waktu Selesai:' : 'Estimasi Normalisasi / Berakhir:'}
                  </Label>
                  <Input
                    id="estimasiSelesai"
                    placeholder="Contoh: 15 November 2026, 14:00 WIB (Selesai)"
                    value={estimasiSelesai}
                    onChange={(e) => setEstimasiSelesai(e.target.value)}
                    className="text-copy-13"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3 (KONDISIONAL): RINCIAN SPESIFIK SESUAI MODE */}
          {mode === 'IKLAN_PROMO' && (
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="pb-3.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <CardTitle className="text-heading-15">3. Rincian Materi Promosi Warga</CardTitle>
                </div>
                <CardDescription>
                  Data keunggulan, syarat pendaftaran, dan tombol CTA pada kartu iklan spotlight.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="highlightDiskon" className="text-copy-12 font-medium">
                      Highlight Diskon / Penawaran Khusus:
                    </Label>
                    <Input
                      id="highlightDiskon"
                      placeholder="Contoh: Diskon Pasang Baru s.d. 35%"
                      value={highlightDiskon}
                      onChange={(e) => setHighlightDiskon(e.target.value)}
                      className="text-copy-13"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="periode" className="text-copy-12 font-medium">
                      Periode Promosi:
                    </Label>
                    <Input
                      id="periode"
                      placeholder="Contoh: 1 November – 30 November 2026"
                      value={periodePromo}
                      onChange={(e) => setPeriodePromo(e.target.value)}
                      className="text-copy-13"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ctaText" className="text-copy-12 font-medium">
                      Teks Tombol Aksi (CTA):
                    </Label>
                    <Input
                      id="ctaText"
                      placeholder="Contoh: Daftar Pasang Baru Sekarang"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="text-copy-13"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ctaLink" className="text-copy-12 font-medium">
                      Tautan URL Tujuan:
                    </Label>
                    <Input
                      id="ctaLink"
                      placeholder="Contoh: /pasang-baru atau /cek-tagihan"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      className="text-copy-13"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="keunggulan" className="text-copy-12 font-medium">
                    Butir Keunggulan Program (1 butir per baris):
                  </Label>
                  <Textarea
                    id="keunggulan"
                    rows={3}
                    placeholder="Diskon Biaya Penyambungan s.d. 35%&#10;Bebas Biaya Balik Nama Rekening 100%&#10;Fasilitas Cicilan 0%"
                    value={keunggulanInput}
                    onChange={(e) => setKeunggulanInput(e.target.value)}
                    className="text-copy-12 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="syarat" className="text-copy-12 font-medium">
                    Persyaratan Dokumen (1 butir per baris):
                  </Label>
                  <Textarea
                    id="syarat"
                    rows={3}
                    placeholder="Warga Kota Bandung dengan fotokopi KTP/KK pemohon&#10;Fotokopi bukti kepemilikan persil/PBB"
                    value={syaratInput}
                    onChange={(e) => setSyaratInput(e.target.value)}
                    className="text-copy-12 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="langkah" className="text-copy-12 font-medium">
                    Alur &amp; Langkah Pendaftaran (1 langkah per baris):
                  </Label>
                  <Textarea
                    id="langkah"
                    rows={3}
                    placeholder="Buka menu Pasang Baru pada portal resmi Tirtawening&#10;Isi data identitas diri dan alamat persil&#10;Survei teknisi lapangan"
                    value={langkahInput}
                    onChange={(e) => setLangkahInput(e.target.value)}
                    className="text-copy-12 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* CARD 3 KHUSUS DOKUMENTASI WILAYAH 5 */}
          {mode === 'DOKUMENTASI_WILAYAH' && (
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="pb-3.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-emerald-600" />
                  <CardTitle className="text-heading-15">3. Rincian Pelaksanaan Lapangan Wilayah 5</CardTitle>
                </div>
                <CardDescription>
                  Detail teknis latar belakang, manfaat bagi warga, dan aksi lapangan teknisi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="penyebab" className="text-copy-12 font-medium">
                    Tujuan &amp; Latar Belakang Pekerjaan:
                  </Label>
                  <Textarea
                    id="penyebab"
                    rows={2}
                    placeholder="Contoh: Program pemeliharaan preventif pengurasan pipa distribusi sekunder zona Kiaracondong..."
                    value={penyebab}
                    onChange={(e) => setPenyebab(e.target.value)}
                    className="text-copy-13 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dampak" className="text-copy-12 font-medium">
                    Manfaat Nyata bagi Pelanggan:
                  </Label>
                  <Textarea
                    id="dampak"
                    rows={2}
                    placeholder="Contoh: Kejernihan air minum terjamin dan tekanan aliran air di rumah warga lebih stabil..."
                    value={dampak}
                    onChange={(e) => setDampak(e.target.value)}
                    className="text-copy-13 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tindakanPenanganan" className="text-copy-12 font-medium">
                    Tindakan &amp; Pekerjaan Teknisi Wilayah 5:
                  </Label>
                  <Textarea
                    id="tindakanPenanganan"
                    rows={3}
                    placeholder="Contoh: Tim teknisi Wilayah 5 melakukan pembukaan wash-out valve pipa 4 titik persilangan serta uji kekeruhan air di laboratorium..."
                    value={tindakanPenanganan}
                    onChange={(e) => setTindakanPenanganan(e.target.value)}
                    className="text-copy-13 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kecamatanInput" className="text-copy-12 font-medium">
                    Kelurahan &amp; Kecamatan Sasaran (dipisah tanda koma):
                  </Label>
                  <Input
                    id="kecamatanInput"
                    placeholder="Contoh: Kiaracondong, Rancasari, Batununggal"
                    value={kecamatanInput}
                    onChange={(e) => setKecamatanInput(e.target.value)}
                    className="text-copy-13"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* CARD 3 KHUSUS GANGGUAN TEKNIS */}
          {mode === 'GANGGUAN_TEKNIS' && (
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="pb-3.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <CardTitle className="text-heading-15">3. Kerusakan Teknis &amp; Mitigasi TRC</CardTitle>
                </div>
                <CardDescription>
                  Penyebab kebocoran, estimasi normalisasi, dan wilayah terdampak.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="penyebab" className="text-copy-12 font-medium">
                    Penyebab Gangguan Teknis:
                  </Label>
                  <Textarea
                    id="penyebab"
                    rows={2}
                    placeholder="Contoh: Pergeseran tanah yang memicu kebocoran sambungan pipa transmisi..."
                    value={penyebab}
                    onChange={(e) => setPenyebab(e.target.value)}
                    className="text-copy-13 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dampak" className="text-copy-12 font-medium">
                    Dampak Aliran Air bagi Warga:
                  </Label>
                  <Textarea
                    id="dampak"
                    rows={2}
                    placeholder="Contoh: Penurunan debit atau penghentian sementara pasokan air bersih..."
                    value={dampak}
                    onChange={(e) => setDampak(e.target.value)}
                    className="text-copy-13 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tindakanPenanganan" className="text-copy-12 font-medium">
                    Tindakan Tim Reaksi Cepat (TRC):
                  </Label>
                  <Textarea
                    id="tindakanPenanganan"
                    rows={3}
                    placeholder="Contoh: Teknisi sedang melakukan penggantian flange dan pengelasan pipa..."
                    value={tindakanPenanganan}
                    onChange={(e) => setTindakanPenanganan(e.target.value)}
                    className="text-copy-13 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kecamatanInput" className="text-copy-12 font-medium">
                    Kecamatan Terdampak (dipisah koma):
                  </Label>
                  <Input
                    id="kecamatanInput"
                    placeholder="Contoh: Sumur Bandung, Regol, Lengkong"
                    value={kecamatanInput}
                    onChange={(e) => setKecamatanInput(e.target.value)}
                    className="text-copy-13"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* CARD 4: KONTAK LAYANAN */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-4 text-primary" />
                <CardTitle className="text-heading-15">4. Kontak Bantuan &amp; Konsultasi</CardTitle>
              </div>
              <CardDescription>
                Nomor WhatsApp atau call center yang dapat dihubungi warga terkait konten ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="kontakNomor" className="text-copy-12 font-medium">
                  Nomor WhatsApp / Telepon Layanan:
                </Label>
                <Input
                  id="kontakNomor"
                  placeholder="Contoh: 0811-222-7771 atau (022) 2509030"
                  value={kontakNomor}
                  onChange={(e) => setKontakNomor(e.target.value)}
                  className="text-copy-13"
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ========================================================
            KOLOM KANAN (5 Kolom): MULTI-FOTO CLOUDINARY & LIVE PREVIEW NYATA
            ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-6">
          
          {/* CARD MEDIA UTAMA (FOTO SAMPUL) */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading-15">
                  {mode === 'DOKUMENTASI_WILAYAH'
                    ? 'Foto Sampul Kegiatan Wilayah 5'
                    : mode === 'IKLAN_PROMO'
                    ? 'Brosur Utama / Flyer Promosi'
                    : 'Foto Lapangan / Peta Skematik'}
                </CardTitle>
                <Badge variant="secondary" size="sm" className="text-[10px]">
                  Foto Utama
                </Badge>
              </div>
              <CardDescription>
                Gambar sampul yang pertama kali terlihat oleh warga di landing page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-4">
              <CloudinaryImageUploader
                label="Unggah Berkas Sampul (Cloudinary)"
                keterangan="Otomatis dikompresi ke format WebP modern berkualitas tinggi."
                value={gambarUtama}
                publicId={gambarUtamaPublicId}
                jenis={mode === 'IKLAN_PROMO' ? 'brosur' : 'kegiatan'}
                identifier="broadcast-sampul"
                onChange={(url, pId) => {
                  setGambarUtama(url)
                  setGambarUtamaPublicId(pId)
                }}
              />
            </CardContent>
          </Card>

          {/* CARD GALERI MULTI-FOTO DOKUMENTASI (BISA LEBIH DARI 1 FOTO) */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Images className="size-4 text-primary" />
                  <CardTitle className="text-heading-15">
                    Galeri Foto ({semuaFoto.length} Foto)
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setBukaInputFotoGaleri(!bukaInputFotoGaleri)}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3" />
                  <span>Tambah Foto</span>
                </Button>
              </div>
              <CardDescription>
                Tambahkan foto dokumentasi lapangan multi-angle atau brosur lampiran.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Form Tambah Foto Galeri (Cloudinary / URL) */}
              {bukaInputFotoGaleri && (
                <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label className="text-copy-12 font-medium">Unggah Foto via Cloudinary:</Label>
                    <CloudinaryImageUploader
                      label="Pilih Foto Dokumentasi"
                      keterangan="Otomatis masuk ke galeri foto konten ini."
                      value={fotoTambahanUrl}
                      onChange={(url) => {
                        handleTambahFotoGaleri(url, fotoTambahanJudul)
                      }}
                      jenis="kegiatan"
                      identifier="broadcast-galeri"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">atau URL:</span>
                    <Input
                      placeholder="https://... atau /images/..."
                      value={fotoTambahanUrl}
                      onChange={(e) => setFotoTambahanUrl(e.target.value)}
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => handleTambahFotoGaleri(fotoTambahanUrl, fotoTambahanJudul)}
                      disabled={!fotoTambahanUrl.trim()}
                    >
                      Tambah
                    </Button>
                  </div>
                </div>
              )}

              {/* Daftar Foto Galeri */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {semuaFoto.map((foto, idx) => {
                  const isSampul = foto.url === gambarUtama
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                        isSampul
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/80 bg-background hover:bg-muted/40'
                      }`}
                    >
                      <div className="relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={foto.url} alt="" className="h-full w-full object-cover" />
                        {isSampul && (
                          <span className="absolute bottom-0 inset-x-0 bg-primary text-[8px] font-bold text-primary-foreground text-center py-0.2">
                            SAMPUL
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-copy-12 font-medium truncate text-foreground">
                          {foto.judul || `Foto ${idx + 1}`}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate" title={foto.url}>
                          {foto.url}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isSampul && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleJadikanFotoUtama(foto)}
                            className="text-[11px] h-7 px-2"
                            title="Jadikan Foto Sampul Utama"
                          >
                            Sampul
                          </Button>
                        )}
                        {!isSampul && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleHapusFotoGaleri(foto.url)}
                            className="text-destructive hover:bg-destructive/10"
                            title="Hapus foto dari galeri"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ========================================================
              CARD REAL-TIME LIVE PREVIEW SESUAI MODE PENAYANGAN
              ======================================================== */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading-15 flex items-center gap-1.5">
                  <Eye className="size-4 text-primary" />
                  <span>
                    Pratinjau Tampilan Warga:{' '}
                    {mode === 'DOKUMENTASI_WILAYAH'
                      ? 'Dokumentasi Wilayah 5'
                      : mode === 'IKLAN_PROMO'
                      ? 'Spotlight Iklan'
                      : 'Siaran Gangguan'}
                  </span>
                </CardTitle>
                <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                  Real-Time
                </Badge>
              </div>
              <CardDescription>
                Simulasi presisi 100% sesuai kartu yang akan ditayangkan di portal web warga.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4">

              {/* ----------------------------------------------------
                  1. PREVIEW KHUSUS MODE DOKUMENTASI KEGIATAN WILAYAH 5
                  ---------------------------------------------------- */}
              {mode === 'DOKUMENTASI_WILAYAH' && (
                <div className="rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-5 space-y-3.5 text-neutral-900 shadow-xs">
                  {/* Aspect 16:10 Frame Foto Lapangan */}
                  <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-200/80 shadow-2xs">
                    {currentPreviewPhoto?.url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-125 pointer-events-none transition-all duration-700"
                        style={{ backgroundImage: `url(${currentPreviewPhoto.url})` }}
                      />
                    )}

                    {semuaFoto.length > 0 ? (
                      semuaFoto.map((p, pIdx) => (
                        <img
                          key={p.url + pIdx}
                          src={p.url}
                          alt=""
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                            pIdx === previewActivePhotoIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                          }`}
                        />
                      ))
                    ) : (
                      <div className="relative z-10 flex h-full w-full items-center justify-center text-copy-12 text-neutral-400">
                        Belum ada foto dokumentasi
                      </div>
                    )}

                    {semuaFoto.length > 1 && (
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-semibold text-white shadow-xs">
                        <Images className="size-2.5 text-cyan-400" />
                        <span>{previewActivePhotoIdx + 1}/{semuaFoto.length} Foto</span>
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-white border border-white/10 shadow-xs">
                      <MapPin className="size-2.5 text-emerald-400" />
                      <span className="truncate max-w-[190px]">
                        {lokasiWilayah || 'Pelayanan Wilayah 5'}
                      </span>
                    </div>

                    {/* Indikator titik mini */}
                    {semuaFoto.length > 1 && (
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1">
                        {semuaFoto.map((_, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setPreviewActivePhotoIdx(pIdx)}
                            className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                              pIdx === previewActivePhotoIdx ? 'w-3.5 bg-white' : 'w-1.5 bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip jika Multi-Foto */}
                  {semuaFoto.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {semuaFoto.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewActivePhotoIdx(idx)}
                          className={`relative h-9 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === previewActivePhotoIdx
                              ? 'border-neutral-900 ring-1 ring-neutral-900/30'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={p.url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Metadata Tanggal & Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-neutral-400" />
                        <span>{waktuMulai || 'Hari ini'}</span>
                      </span>

                      {status === 'SELESAI' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full px-2 py-0.5 shrink-0">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span>Selesai 100%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-full px-2 py-0.5 shrink-0">
                          <Clock className="size-3 text-blue-600" />
                          <span>{progresPersen}% Progres</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-copy-15 font-bold text-neutral-900 line-clamp-2 leading-snug">
                      {judul || 'Judul Kegiatan Lapangan Wilayah 5'}
                    </h4>

                    <p className="text-copy-12 text-neutral-600 line-clamp-2 leading-relaxed">
                      {ringkasan || 'Ringkasan tindakan teknisi Pelayanan Wilayah 5 akan tampil di sini...'}
                    </p>
                  </div>

                  {/* Footer Tombol Rincian */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                      <Camera className="size-3 text-neutral-400" />
                      <span>Dokumentasi Lapangan</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-copy-12 font-semibold text-neutral-900">
                      <span>Lihat Rincian</span>
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  2. PREVIEW KHUSUS MODE IKLAN & PROGRAM PROMOSI
                  ---------------------------------------------------- */}
              {mode === 'IKLAN_PROMO' && (
                <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 space-y-3.5">
                  <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 flex items-center justify-center">
                    {currentPreviewPhoto?.url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-120 pointer-events-none"
                        style={{ backgroundImage: `url(${currentPreviewPhoto.url})` }}
                      />
                    )}

                    {currentPreviewPhoto?.url ? (
                      <img
                        src={currentPreviewPhoto.url}
                        alt=""
                        className="relative z-10 max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="relative z-10 flex h-full w-full items-center justify-center text-copy-12 text-neutral-400">
                        Belum ada brosur
                      </div>
                    )}

                    {semuaFoto.length > 1 && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-medium text-white">
                        <Images className="size-2.5" />
                        <span>{previewActivePhotoIdx + 1}/{semuaFoto.length}</span>
                      </div>
                    )}
                  </div>

                  {semuaFoto.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {semuaFoto.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewActivePhotoIdx(idx)}
                          className={`relative h-9 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === previewActivePhotoIdx
                              ? 'border-neutral-900 ring-1 ring-neutral-900/30'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={p.url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-900 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-blue-600" />
                        <span>Program Resmi</span>
                      </span>
                      {periodePromo && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200/60 px-2 py-0.5 text-[10px] font-mono text-neutral-600">
                          <Calendar className="size-2.5" />
                          <span>{periodePromo}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-copy-15 font-semibold text-neutral-900 leading-snug">
                      {judul || 'Judul Promosi Akan Muncul di Sini'}
                    </h4>
                    <p className="text-copy-12 text-neutral-600 line-clamp-2">
                      {ringkasan || 'Ringkasan informasi promosi akan muncul di sini...'}
                    </p>
                  </div>

                  {highlightDiskon && (
                    <div className="rounded-lg border border-neutral-200/80 bg-white p-2.5 text-copy-12 font-medium text-neutral-900 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{highlightDiskon}</span>
                    </div>
                  )}

                  {listKeunggulanPreview.length > 0 && (
                    <div className="space-y-1 text-copy-11 text-neutral-600">
                      {listKeunggulanPreview.slice(0, 3).map((k, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug truncate">{k}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-1">
                    <div className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 text-white px-4 py-2 text-xs font-semibold shadow-xs">
                      <span>{ctaText || 'Daftar Sekarang'}</span>
                      <ArrowRight className="size-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  3. PREVIEW KHUSUS MODE GANGGUAN TEKNIS
                  ---------------------------------------------------- */}
              {mode === 'GANGGUAN_TEKNIS' && (
                <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="amber-subtle" size="sm" className="font-semibold">
                      <AlertTriangle className="size-3 mr-1" />
                      <span>{kategori}</span>
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Target: {estimasiSelesai || 'Hari ini'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-copy-15 font-bold text-foreground leading-snug">
                      {judul || 'Judul Siaran Gangguan'}
                    </h4>
                    <p className="text-copy-12 text-muted-foreground line-clamp-2">
                      {ringkasan || 'Ringkasan gangguan dan normalisasi...'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex justify-between font-mono">
                      <span>Progres Penanganan TRC:</span>
                      <span className="font-bold">{progresPersen}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-600 h-1.5 rounded-full transition-all" style={{ width: `${progresPersen}%` }} />
                    </div>
                  </div>

                  {kecamatanInput && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-primary shrink-0" />
                      <span className="truncate">Area: {kecamatanInput}</span>
                    </div>
                  )}

                  {kontakNomor && (
                    <div className="pt-1">
                      <div className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-amber-100/60 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 px-3 py-1.5 text-xs font-semibold">
                        <PhoneCall className="size-3" />
                        <span>Tangki Darurat: {kontakNomor}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </form>
    </PageContainer>
  )
}
