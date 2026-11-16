'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageContainer } from '@/components/layout/index'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CloudinaryImageUploader } from '@/components/broadcast/CloudinaryImageUploader'
import type {
  BroadcastGangguanItem,
  KategoriBroadcast,
  StatusBroadcast,
  TipeMediaBroadcast,
  MediaBroadcastItem,
} from '@/types/broadcast'

interface BroadcastFormPageProps {
  idEdit?: string
}

export function BroadcastFormPage({ idEdit }: BroadcastFormPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(Boolean(idEdit))
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [judul, setJudul] = React.useState('')
  const [ringkasan, setRingkasan] = React.useState('')
  const [kategori, setKategori] = React.useState<KategoriBroadcast>('EVENT')
  const [status, setStatus] = React.useState<StatusBroadcast>('DALAM_PENGERJAAN')
  const [progresPersen, setProgresPersen] = React.useState(100)
  const [prioritas, setPrioritas] = React.useState<'TINGGI' | 'SEDANG' | 'NORMAL'>('NORMAL')
  const [waktuMulai, setWaktuMulai] = React.useState('Hari ini')
  const [estimasiSelesai, setEstimasiSelesai] = React.useState('30 November 2026')
  const [penyebab, setPenyebab] = React.useState('')
  const [dampak, setDampak] = React.useState('')
  const [tindakanPenanganan, setTindakanPenanganan] = React.useState('')
  const [kecamatanInput, setKecamatanInput] = React.useState('Seluruh Wilayah Kota Bandung')
  const [kontakNomor, setKontakNomor] = React.useState('0811-222-7771')

  // Kanal Tayang
  const [aktif, setAktif] = React.useState(true)
  const [tampilkanDiSpotlight, setTampilkanDiSpotlight] = React.useState(true)
  const [tampilkanDiTicker, setTampilkanDiTicker] = React.useState(true)

  // Media Utama & Galeri Multi-Foto (Mendukung 1 hingga 5+ foto)
  const [gambarUtama, setGambarUtama] = React.useState('/images/promo-gebyar-pasang-baru.svg')
  const [gambarUtamaPublicId, setGambarUtamaPublicId] = React.useState<string | undefined>(undefined)
  const [tipeGambarUtama, setTipeGambarUtama] = React.useState<TipeMediaBroadcast>('BROSUR')
  const [galeriMedia, setGaleriMedia] = React.useState<MediaBroadcastItem[]>([])

  // State untuk tambah foto galeri baru
  const [fotoTambahanUrl, setFotoTambahanUrl] = React.useState('')
  const [fotoTambahanJudul, setFotoTambahanJudul] = React.useState('')
  const [fotoTambahanTipe, setFotoTambahanTipe] = React.useState<TipeMediaBroadcast>('FOTO_KEGIATAN')
  const [bukaInputFotoGaleri, setBukaInputFotoGaleri] = React.useState(false)

  // State Preview Live Active Photo
  const [previewActivePhotoIdx, setPreviewActivePhotoIdx] = React.useState(0)

  // Rincian Promo / Iklan
  const [highlightDiskon, setHighlightDiskon] = React.useState('Diskon Pasang Baru s.d. 35% & Bebas Balik Nama')
  const [periodePromo, setPeriodePromo] = React.useState('1 November – 30 November 2026')
  const [keunggulanInput, setKeunggulanInput] = React.useState(
    'Diskon Biaya Penyambungan Pipa Rumah Tangga s.d. 35%\nBebas Biaya Balik Nama Rekening Air 100%\nFasilitas Cicilan Biaya Pasang 0% hingga 6 Bulan\nPemasangan Meter Air Digital Berstandar SNI'
  )
  const [syaratInput, setSyaratInput] = React.useState(
    'Warga Kota Bandung dengan fotokopi KTP/KK pemohon\nFotokopi bukti kepemilikan persil/rumah atau PBB\nJaringan pipa distribusi Tirtawening telah tersedia di depan persil'
  )
  const [langkahInput, setLangkahInput] = React.useState(
    'Buka menu Pasang Baru pada portal web resmi Tirtawening\nIsi data identitas diri, alamat persil, dan unggah foto KTP\nTim teknisi Tirtawening melakukan survei lokasi & verifikasi jaringan (1-2 hari kerja)\nPemasangan meter air resmi oleh teknisi bersertifikat'
  )
  const [ctaLink, setCtaLink] = React.useState('/pasang-baru')
  const [ctaText, setCtaText] = React.useState('Daftar Pasang Baru Sekarang')

  // Ambil data jika mode edit
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
          setProgresPersen(item.progresPersen)
          setPrioritas(item.prioritas)
          setWaktuMulai(item.waktuMulai)
          setEstimasiSelesai(item.estimasiSelesai)
          setPenyebab(item.penyebab || '')
          setDampak(item.dampak || '')
          setTindakanPenanganan(item.tindakanPenanganan || '')
          setAktif(item.aktif)
          setTampilkanDiSpotlight(item.tampilkanDiSpotlight !== false)
          setTampilkanDiTicker(item.tampilkanDiTicker !== false)

          if (item.wilayahTerdampak && item.wilayahTerdampak.length > 0) {
            setKecamatanInput(item.wilayahTerdampak.map((w) => w.kecamatan).join(', '))
          }
          if (item.kontakBantuan?.nomor) {
            setKontakNomor(item.kontakBantuan.nomor)
          }
          if (item.gambarUtama) {
            setGambarUtama(item.gambarUtama)
            setGambarUtamaPublicId(item.gambarUtamaPublicId)
            setTipeGambarUtama(item.tipeGambarUtama || 'BROSUR')
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
        toast.error('Gagal mengambil data siaran dari server')
      })
      .finally(() => {
        setIsLoading(false)
      })
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
      if (g.url && !list.some((item) => item.url === g.url)) {
        list.push(g)
      }
    })
    return list
  }, [gambarUtama, judul, tipeGambarUtama, galeriMedia])

  // Handler Tambah Foto ke Galeri
  const handleTambahFotoGaleri = (urlFoto: string, judulFoto?: string) => {
    if (!urlFoto.trim()) return
    const fotoBaru: MediaBroadcastItem = {
      url: urlFoto.trim(),
      judul: judulFoto?.trim() || `Foto Galeri ${galeriMedia.length + 1}`,
      tipe: fotoTambahanTipe,
    }
    setGaleriMedia((prev) => [...prev, fotoBaru])
    setFotoTambahanUrl('')
    setFotoTambahanJudul('')
    setBukaInputFotoGaleri(false)
    toast.success('Foto baru ditambahkan ke galeri iklan!')
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
    setTipeGambarUtama(photo.tipe || 'BROSUR')
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
      gambarUtamaPublicId: gambarUtamaPublicId || undefined,
      tipeGambarUtama,
      galeriMedia: semuaFoto,
      promoDetails: {
        highlightDiskon: highlightDiskon.trim(),
        periode: periodePromo.trim(),
        keunggulan: listKeunggulan,
        syaratKetentuan: listSyarat,
        langkahDaftar: listLangkah,
        ctaLink: ctaLink.trim() || '/pasang-baru',
        ctaText: ctaText.trim() || 'Daftar Pasang Baru Sekarang',
      },
      aktif,
      tampilkanDiTicker,
      tampilkanDiSpotlight,
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
        toast.success('Siaran & materi iklan berhasil diperbarui!')
      } else {
        const res = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Gagal menyimpan ke server')
        toast.success('Siaran & iklan baru berhasil diterbitkan!')
      }

      // Notifikasi ke tab lain
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('elysia:broadcast-updated'))
      }

      router.push('/broadcast')
    } catch (err: any) {
      console.error('[SUBMIT_BROADCAST_ERR]', err)
      toast.error('Gagal menyimpan perubahan ke database')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  const listKeunggulanPreview = keunggulanInput
    .split('\n')
    .map((k) => k.trim())
    .filter(Boolean)

  const currentPreviewPhoto = semuaFoto[previewActivePhotoIdx] || semuaFoto[0]

  return (
    <PageContainer className="space-y-6">
      {/* Header Halaman Tertata Rapi & Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Radio className="size-3.5" />
            <span>Manajemen Siaran &amp; Iklan Promosi</span>
            {idEdit && (
              <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                ID: {idEdit}
              </Badge>
            )}
          </div>
          <h1 className="text-heading-24 font-bold tracking-tight text-foreground">
            {idEdit ? 'Edit Materi Siaran & Banner Iklan' : 'Buat Konten Siaran / Iklan Baru'}
          </h1>
          <p className="text-copy-13 text-muted-foreground max-w-3xl">
            {idEdit
              ? `Memperbarui materi siaran "${judul || idEdit}". Perubahan langsung tersinkronkan ke landing page dan server.`
              : 'Isi formulir terstruktur di kolom kiri. Kelola multi-foto Cloudinary dan pratinjau langsung di kolom kanan.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="submit"
            form="broadcast-form"
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

      {/* Grid 2 Kolom dengan Proporsi Berbeda: Form Input Kiri (7 Bagian) & Pratinjau Kanan (5 Bagian) */}
      <form id="broadcast-form" onSubmit={simpanKonten} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================
            KOLOM KIRI (7 Bagian): FORM ISIAN OPERATOR DINAMIS
            ======================================================== */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          
          {/* Card 1: Kanal Penayangan & Status */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <CardTitle className="text-heading-15">1. Saluran Penayangan &amp; Status</CardTitle>
              </div>
              <CardDescription>
                Tentukan di mana konten promosi atau siaran ini akan ditayangkan kepada warga.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
                  <div className="space-y-0.5">
                    <Label className="text-copy-13 font-semibold text-foreground">
                      Status Aktif
                    </Label>
                    <p className="text-copy-11 text-muted-foreground">
                      Tayang dan dapat diakses warga
                    </p>
                  </div>
                  <Switch checked={aktif} onCheckedChange={setAktif} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
                  <div className="space-y-0.5">
                    <Label className="text-copy-13 font-semibold text-foreground">
                      Banner Spotlight
                    </Label>
                    <p className="text-copy-11 text-muted-foreground">
                      Slider animasi landing page
                    </p>
                  </div>
                  <Switch checked={tampilkanDiSpotlight} onCheckedChange={setTampilkanDiSpotlight} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="space-y-0.5">
                  <Label className="text-copy-13 font-semibold text-foreground">
                    Running Text Ticker Atas
                  </Label>
                  <p className="text-copy-11 text-muted-foreground">
                    Muncul di strip baris teks berjalan paling atas portal web
                  </p>
                </div>
                <Switch checked={tampilkanDiTicker} onCheckedChange={setTampilkanDiTicker} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-copy-12 font-medium">Kategori Siaran:</Label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriBroadcast)}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-copy-13 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="EVENT">EVENT &amp; PROMOSI (Gebyar / Diskon)</option>
                    <option value="DARURAT">GANGGUAN DARURAT (Pipa Bocor)</option>
                    <option value="PEMELIHARAAN">PEMELIHARAAN BERKALA</option>
                    <option value="INFORMASI">INFORMASI UMUM OPERASIONAL</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-copy-12 font-medium">Prioritas Penayangan:</Label>
                  <select
                    value={prioritas}
                    onChange={(e) => setPrioritas(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-copy-13 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="TINGGI">Tinggi (Mendesak / Unggulan)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Utama Siaran */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <CardTitle className="text-heading-15">2. Informasi Utama Konten</CardTitle>
              </div>
              <CardDescription>
                Judul dan penjelasan singkat yang menjadi teks utama materi di landing page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="judul" className="text-copy-12 font-semibold">
                  Judul Siaran / Program Promosi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="judul"
                  placeholder="Contoh: Promo Gebyar Sambungan Baru 2026"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="text-copy-14 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ringkasan" className="text-copy-12 font-semibold">
                  Ringkasan / Sub-Judul Penjelasan
                </Label>
                <Textarea
                  id="ringkasan"
                  rows={3}
                  placeholder="Jelaskan penawaran secara ringkas dan informatif kepada warga..."
                  value={ringkasan}
                  onChange={(e) => setRingkasan(e.target.value)}
                  className="text-copy-13 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kecamatan" className="text-copy-12">
                    Wilayah Cakupan (Kecamatan):
                  </Label>
                  <Input
                    id="kecamatan"
                    placeholder="Contoh: Seluruh Kota Bandung, Coblong, Regol"
                    value={kecamatanInput}
                    onChange={(e) => setKecamatanInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kontak" className="text-copy-12">
                    Nomor WhatsApp / Bantuan:
                  </Label>
                  <Input
                    id="kontak"
                    placeholder="Contoh: 0811-222-7771"
                    value={kontakNomor}
                    onChange={(e) => setKontakNomor(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Detail Khusus Promosi & Tombol Aksi */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                <CardTitle className="text-heading-15">3. Rincian Penawaran &amp; Tombol Aksi (CTA)</CardTitle>
              </div>
              <CardDescription>
                Parameter dinamis untuk highlight penawaran, butir keuntungan, dan tombol aksi warga.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="highlightDiskon" className="text-copy-12 font-medium">
                    Highlight Penawaran / Diskon:
                  </Label>
                  <Input
                    id="highlightDiskon"
                    placeholder="Contoh: Diskon Pasang Baru s.d. 35%"
                    value={highlightDiskon}
                    onChange={(e) => setHighlightDiskon(e.target.value)}
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
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="keunggulan" className="text-copy-12 font-medium">
                  Butir Keunggulan / Manfaat (1 butir per baris):
                </Label>
                <Textarea
                  id="keunggulan"
                  rows={4}
                  placeholder="Diskon Biaya Penyambungan s.d. 35%&#10;Bebas Biaya Balik Nama Rekening 100%&#10;Fasilitas Cicilan 0%"
                  value={keunggulanInput}
                  onChange={(e) => setKeunggulanInput(e.target.value)}
                  className="font-mono text-copy-12 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ctaText" className="text-copy-12 font-medium">
                    Teks Tombol Aksi:
                  </Label>
                  <Input
                    id="ctaText"
                    placeholder="Contoh: Daftar Pasang Baru Sekarang"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ctaLink" className="text-copy-12 font-medium">
                    Tautan Tujuan (Link CTA):
                  </Label>
                  <Input
                    id="ctaLink"
                    placeholder="Contoh: /pasang-baru atau /cek-tagihan"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="syarat" className="text-copy-12 font-medium">
                  Persyaratan Dokumen &amp; Ketentuan (1 butir per baris):
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
                  placeholder="Buka menu Pasang Baru pada portal web&#10;Isi identitas diri dan unggah KTP&#10;Survei lokasi teknisi 1-2 hari kerja"
                  value={langkahInput}
                  onChange={(e) => setLangkahInput(e.target.value)}
                  className="text-copy-12 resize-none"
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ========================================================
            KOLOM KANAN (5 Bagian): MULTI-FOTO CLOUDINARY & LIVE PREVIEW
            ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-6">
          
          {/* Card Uploader Media Utama (Foto Sampul) */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading-15">Foto Sampul Utama (Cloudinary)</CardTitle>
                <Badge variant="secondary" size="sm" className="text-[10px]">
                  Foto Utama
                </Badge>
              </div>
              <CardDescription>
                Foto atau flyer utama yang langsung tampil saat slide pertama terbuka.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-4">
              <CloudinaryImageUploader
                label="Unggah Foto Sampul Utama"
                keterangan="Format WebP/PNG/JPG/SVG, otomatis dikompres oleh Cloudinary CDN."
                value={gambarUtama}
                publicId={gambarUtamaPublicId}
                jenis={tipeGambarUtama === 'BROSUR' ? 'brosur' : 'banner'}
                identifier="broadcast-sampul"
                onChange={(url, pId) => {
                  setGambarUtama(url)
                  setGambarUtamaPublicId(pId)
                }}
              />
            </CardContent>
          </Card>

          {/* Card Multi-Foto Galeri (Bisa Lebih dari 1 Foto: 2-5+ Foto) */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Images className="size-4 text-primary" />
                  <CardTitle className="text-heading-15">Galeri Multi-Foto ({semuaFoto.length} Foto)</CardTitle>
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
                Tambahkan foto kegiatan, brosur kedua, atau peta jaringan pendukung iklan ini.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Form Tambah Foto Galeri (Cloudinary / URL) */}
              {bukaInputFotoGaleri && (
                <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label className="text-copy-12 font-medium">Unggah Berkas Baru via Cloudinary:</Label>
                    <CloudinaryImageUploader
                      label="Pilih Foto Galeri"
                      keterangan="Otomatis masuk ke daftar galeri iklan ini."
                      value={fotoTambahanUrl}
                      onChange={(url) => {
                        handleTambahFotoGaleri(url, fotoTambahanJudul)
                      }}
                      jenis="kegiatan"
                      identifier="broadcast-galeri"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">atau tempel URL:</span>
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

              {/* Daftar Foto Saat Ini */}
              <div className="space-y-2">
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
                            Jadikan Sampul
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

          {/* Card Live Interactive Preview (Pratinjau Nyata Sesuai Tampilan Landing) */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading-15 flex items-center gap-1.5">
                  <Eye className="size-4 text-primary" />
                  <span>Pratinjau Langsung Warga</span>
                </CardTitle>
                <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                  Real-Time Live
                </Badge>
              </div>
              <CardDescription>
                Simulasi tampilan multi-foto &amp; konten presisi sesuai isian operator.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 space-y-3.5">
                {/* Media Image dengan Ambient Backdrop & Support Portrait/Landscape */}
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
                      alt={judul || 'Pratinjau'}
                      className="relative z-10 max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="relative z-10 flex h-full w-full items-center justify-center text-copy-12 text-neutral-400">
                      Belum ada gambar
                    </div>
                  )}

                  {semuaFoto.length > 1 && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-medium text-white">
                      <Images className="size-2.5" />
                      <span>{previewActivePhotoIdx + 1}/{semuaFoto.length}</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip pada Preview jika multi-foto */}
                {semuaFoto.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {semuaFoto.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewActivePhotoIdx(idx)}
                        className={`relative h-10 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
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

                {/* Konten Teks Preview */}
                <div className="space-y-2">
                  {/* Tag Program dan Tanggal Periode Terpisah Bersih */}
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
                  <div className="space-y-1.5 text-copy-11 text-neutral-600">
                    {listKeunggulanPreview.map((k, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="size-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{k}</span>
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
            </CardContent>
          </Card>

        </div>

      </form>
    </PageContainer>
  )
}
