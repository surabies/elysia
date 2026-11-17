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
  ImageIcon,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageContainer } from '@/components/layout/index'
import { BroadcastDetailModal } from '@/components/home/BroadcastDetailModal'
import { DAFTAR_BROADCAST_AWAL } from '@/data/broadcast'
import type { BroadcastGangguanItem } from '@/types/broadcast'

export default function BroadcastDashboardPage() {
  const [daftar, setDaftar] = React.useState<BroadcastGangguanItem[]>(DAFTAR_BROADCAST_AWAL)
  const [isLoading, setIsLoading] = React.useState(false)

  // Preview Modal Warga State
  const [previewItem, setPreviewItem] = React.useState<BroadcastGangguanItem | null>(null)
  const [previewModalBuka, setPreviewModalBuka] = React.useState(false)

  // Dialog Konfirmasi Hapus State
  const [itemAkanDihapus, setItemAkanDihapus] = React.useState<BroadcastGangguanItem | null>(null)
  const [dialogHapusBuka, setDialogHapusBuka] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Dialog Konfirmasi Reset State
  const [dialogResetBuka, setDialogResetBuka] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)

  // Fetch dari backend API
  const muatDataDariBackend = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/broadcast')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setDaftar(json.data)
          if (typeof window !== 'undefined') {
            localStorage.setItem('elysia_broadcast_items', JSON.stringify(json.data))
            window.dispatchEvent(new Event('elysia:broadcast-updated'))
          }
        }
      }
    } catch (err) {
      console.warn('[BROADCAST_FETCH_BACKEND_WARN]', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // Sinkronkan cache lokal setelah mount (bebas hydration mismatch)
    try {
      const tersimpan = localStorage.getItem('elysia_broadcast_items')
      if (tersimpan) {
        const parsed = JSON.parse(tersimpan)
        if (Array.isArray(parsed)) {
          setDaftar(parsed)
        }
      }
    } catch {}

    muatDataDariBackend()

    function handleStorageChange() {
      try {
        const tersimpan = localStorage.getItem('elysia_broadcast_items')
        if (tersimpan) {
          const parsed = JSON.parse(tersimpan)
          if (Array.isArray(parsed)) {
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
  }, [muatDataDariBackend])

  const toggleAktif = async (id: string) => {
    const baru = daftar.map((item) =>
      item.id === id ? { ...item, aktif: !item.aktif } : item
    )
    setDaftar(baru)
    if (typeof window !== 'undefined') {
      localStorage.setItem('elysia_broadcast_items', JSON.stringify(baru))
      window.dispatchEvent(new Event('elysia:broadcast-updated'))
    }
    const target = baru.find((i) => i.id === id)

    try {
      const res = await fetch(`/api/broadcast/${id}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Gagal update ke backend')
      if (target?.aktif) {
        toast.success(`Siaran "${target.judul}" sekarang AKTIF di Landing Page`)
      } else {
        toast.info(`Siaran "${target?.judul}" dinonaktifkan`)
      }
    } catch {
      toast.warning('Penyimpanan lokal sukses (backend offline)')
    }
  }

  const bukaDialogHapus = (item: BroadcastGangguanItem) => {
    setItemAkanDihapus(item)
    setDialogHapusBuka(true)
  }

  const eksekusiHapus = async () => {
    if (!itemAkanDihapus) return
    const target = itemAkanDihapus
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/broadcast/${target.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success !== false) {
        const baru = daftar.filter((item) => item.id !== target.id)
        setDaftar(baru)
        if (typeof window !== 'undefined') {
          localStorage.setItem('elysia_broadcast_items', JSON.stringify(baru))
          window.dispatchEvent(new Event('elysia:broadcast-updated'))
        }
        toast.success(`Siaran "${target.judul}" berhasil dihapus`)
        setDialogHapusBuka(false)
        setItemAkanDihapus(null)
      } else {
        const errorMsg = json?.error || json?.message || 'Gagal menghapus siaran dari server'
        toast.error(errorMsg)
      }
    } catch (err) {
      console.warn('[BROADCAST_DELETE_CLIENT_ERR]', err)
      const baru = daftar.filter((item) => item.id !== target.id)
      setDaftar(baru)
      if (typeof window !== 'undefined') {
        localStorage.setItem('elysia_broadcast_items', JSON.stringify(baru))
        window.dispatchEvent(new Event('elysia:broadcast-updated'))
      }
      toast.warning('Siaran dihapus dari penyimpanan lokal (server offline)')
      setDialogHapusBuka(false)
      setItemAkanDihapus(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const eksekusiReset = async () => {
    setIsResetting(true)
    try {
      const res = await fetch('/api/broadcast/reset', { method: 'POST' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success && Array.isArray(json.data)) {
        setDaftar(json.data)
        if (typeof window !== 'undefined') {
          localStorage.setItem('elysia_broadcast_items', JSON.stringify(json.data))
          window.dispatchEvent(new Event('elysia:broadcast-updated'))
        }
        toast.success('Data siaran telah di-reset ke default Tirtawening.')
      } else {
        setDaftar(DAFTAR_BROADCAST_AWAL)
        if (typeof window !== 'undefined') {
          localStorage.setItem('elysia_broadcast_items', JSON.stringify(DAFTAR_BROADCAST_AWAL))
          window.dispatchEvent(new Event('elysia:broadcast-updated'))
        }
        toast.info('Data siaran telah di-reset ke default lokal.')
      }
    } catch {
      setDaftar(DAFTAR_BROADCAST_AWAL)
      if (typeof window !== 'undefined') {
        localStorage.setItem('elysia_broadcast_items', JSON.stringify(DAFTAR_BROADCAST_AWAL))
        window.dispatchEvent(new Event('elysia:broadcast-updated'))
      }
      toast.info('Data siaran telah di-reset ke default lokal.')
    } finally {
      setIsResetting(false)
      setDialogResetBuka(false)
    }
  }

  const bukaPratinjau = (item: BroadcastGangguanItem) => {
    setPreviewItem(item)
    setPreviewModalBuka(true)
    fetch(`/api/broadcast/${item.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setPreviewItem(json.data)
        }
      })
      .catch(() => {})
  }

  const totalAktif = daftar.filter((d) => d.aktif).length
  const totalSpotlight = daftar.filter((d) => d.aktif && d.kategori === 'EVENT' && d.tampilkanDiSpotlight !== false).length
  const totalDarurat = daftar.filter((d) => d.aktif && d.kategori === 'DARURAT').length

  return (
    <PageContainer className="space-y-6">
      {/* Header Halaman Tertata Rapi & Modern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Radio className="size-3.5 animate-pulse" />
            <span>Manajemen Siaran Publik &amp; Iklan</span>
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                <RefreshCw className="size-3 animate-spin" />
                Menyinkronkan...
              </span>
            )}
          </div>
          <h1 className="text-heading-24 font-bold tracking-tight text-foreground">
            Siaran Gangguan &amp; Banner Iklan Promosi
          </h1>
          <p className="text-copy-13 text-muted-foreground max-w-3xl">
            Kelola materi promosi, pengumuman, dan siaran gangguan perpipaan. Konten promosi otomatis tayang di slider animasi landing page warga.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={muatDataDariBackend}
            title="Muat ulang dari server"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sinkron</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogResetBuka(true)}
            disabled={isResetting}
          >
            <RotateCcw className={`size-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/" target="_blank" className="gap-1.5">
              <Eye className="size-3.5" />
              <span>Landing Page</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="gap-1.5 font-semibold"
          >
            <Link href="/broadcast/tambah">
              <Plus className="size-4" />
              <span>Buat Konten Baru</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards dengan shadcn/ui Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-copy-12 font-medium text-muted-foreground">Siaran Aktif Keseluruhan</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-heading-24 font-bold font-mono text-foreground">
                {totalAktif}
              </span>
              <span className="text-copy-12 text-muted-foreground">aktif di sistem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-copy-12 font-medium text-muted-foreground">Tayang di Slider Carousel</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-heading-24 font-bold font-mono text-(--ds-green-900) dark:text-(--ds-green-300)">
                {totalSpotlight}
              </span>
              <span className="text-copy-12 text-muted-foreground">bergerak animasi di web</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-copy-12 font-medium text-muted-foreground">Gangguan Darurat / Ticker</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-heading-24 font-bold font-mono text-(--ds-red-900) dark:text-(--ds-red-300)">
                {totalDarurat}
              </span>
              <span className="text-copy-12 text-muted-foreground">muncul di running text atas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daftar Siaran Card Menggunakan shadcn/ui */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-heading-16">
                Daftar Konten Siaran &amp; Media Promosi
              </CardTitle>
              <Badge variant="secondary" size="sm" className="font-mono">
                {daftar.length} Total
              </Badge>
            </div>
            <CardDescription className="hidden sm:inline">
              Klik &quot;Edit&quot; untuk membuka formulir lengkap halaman mandiri
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-3">
          {daftar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
              <Radio className="size-10 mb-3 opacity-30 animate-pulse text-primary" />
              <p className="text-copy-14 font-medium text-foreground">Belum ada konten siaran</p>
              <p className="text-copy-12 text-muted-foreground mt-1 max-w-sm">
                Tidak ada siaran atau banner promosi dalam sistem. Anda dapat membuat siaran baru atau mereset data ke default.
              </p>
              <div className="flex gap-2.5 mt-4">
                <Button size="sm" variant="outline" onClick={() => setDialogResetBuka(true)}>
                  <RotateCcw className="size-3.5 mr-1" />
                  <span>Reset Default</span>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/broadcast/tambah">
                    <Plus className="size-3.5 mr-1" />
                    <span>Buat Siaran Baru</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            daftar.map((item) => {
              const isDarurat = item.kategori === 'DARURAT'
              const isPemeliharaan = item.kategori === 'PEMELIHARAAN'
              const isEvent = item.kategori === 'EVENT'
              const hasCloudinary = item.gambarUtama?.includes('cloudinary.com')

              return (
                <div
                  key={item.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border p-4 transition-colors ${
                    item.aktif
                      ? 'border-border bg-card hover:bg-muted/30'
                      : 'border-border/50 bg-muted/20 opacity-60'
                  }`}
                >
                  {/* Sisi Kiri: Thumbnail Media & Info Utama */}
                  <div className="flex items-start gap-4">
                    {item.gambarUtama ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        <img
                          src={item.gambarUtama}
                          alt={item.judul}
                          className="h-full w-full object-cover object-center"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-background/90 text-[8px] font-bold text-center text-foreground py-0.5 uppercase tracking-wider border-t border-border">
                          {item.tipeGambarUtama || 'MEDIA'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
                        <ImageIcon className="size-5" />
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            isDarurat
                              ? 'red-subtle'
                              : isPemeliharaan
                                ? 'amber-subtle'
                                : isEvent
                                  ? 'green-subtle'
                                  : 'blue-subtle'
                          }
                          size="sm"
                        >
                          {isEvent && <Sparkles className="size-2.5" />}
                          {isDarurat && <AlertTriangle className="size-2.5" />}
                          {isPemeliharaan && <Wrench className="size-2.5" />}
                          <span>{item.kategori}</span>
                        </Badge>

                        <Badge variant="outline" size="sm" className="font-mono">
                          {item.status.replace('_', ' ')}
                        </Badge>

                        {item.tampilkanDiSpotlight && isEvent && (
                          <Badge variant="blue-subtle" size="sm">
                            Spotlight Carousel
                          </Badge>
                        )}

                        {hasCloudinary && (
                          <Badge variant="green-subtle" size="sm">
                            <CheckCircle2 className="size-2.5" />
                            <span>Cloudinary</span>
                          </Badge>
                        )}

                        <span className="text-[11px] text-muted-foreground ml-auto sm:ml-0 font-mono">
                          {item.promoDetails?.periode || `Target: ${item.estimasiSelesai}`}
                        </span>
                      </div>

                      <h3 className="text-copy-14 font-semibold text-foreground leading-snug">
                        {item.judul}
                      </h3>

                      <p className="text-copy-12 text-muted-foreground line-clamp-1">
                        {item.ringkasan}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-copy-11 text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-primary" />
                          <span>
                            {item.wilayahTerdampak.map((w) => w.kecamatan).join(', ')}
                          </span>
                        </span>
                        {isEvent && item.promoDetails?.highlightDiskon ? (
                          <span className="font-semibold text-(--ds-green-900) dark:text-(--ds-green-300)">
                            ★ {item.promoDetails.highlightDiskon}
                          </span>
                        ) : (
                          <span className="font-mono">
                            Progres: {item.progresPersen}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Kontrol & Aksi */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t border-border md:border-t-0 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-copy-12 font-medium text-muted-foreground">
                        {item.aktif ? 'Tayang' : 'Nonaktif'}
                      </span>
                      <Switch
                        checked={item.aktif}
                        onCheckedChange={() => toggleAktif(item.id)}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => bukaPratinjau(item)}
                        title="Pratinjau modal warga"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden sm:inline">Pratinjau</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        asChild
                      >
                        <Link href={`/broadcast/${item.id}`} className="gap-1">
                          <Edit className="size-3.5" />
                          <span>Edit</span>
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => bukaDialogHapus(item)}
                        title="Hapus siaran"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* MODAL PRATINJAU WARGA */}
      <BroadcastDetailModal
        broadcast={previewItem}
        open={previewModalBuka}
        onOpenChange={setPreviewModalBuka}
      />

      {/* DIALOG KONFIRMASI HAPUS SIARAN */}
      <AlertDialog open={dialogHapusBuka} onOpenChange={setDialogHapusBuka}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <span>Konfirmasi Hapus Siaran</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <span className="text-copy-13 text-muted-foreground block">
                  Apakah Anda yakin ingin menghapus siaran informasi ini secara permanen?
                </span>

                {itemAkanDihapus && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-foreground space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">
                        {itemAkanDihapus.kategori}
                      </Badge>
                      <span className="text-copy-11 font-mono text-muted-foreground">
                        ID: {itemAkanDihapus.id}
                      </span>
                    </div>
                    <div className="font-semibold text-copy-14 text-foreground leading-snug">
                      {itemAkanDihapus.judul}
                    </div>
                    <div className="text-copy-12 text-muted-foreground line-clamp-2">
                      {itemAkanDihapus.ringkasan}
                    </div>
                  </div>
                )}

                <span className="text-xs text-muted-foreground block">
                  Data yang telah dihapus akan hilang dari database dan tidak lagi ditampilkan di portal warga publik maupun carousel.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={eksekusiHapus}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Ya, Hapus Siaran</span>
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG KONFIRMASI RESET DEFAULT */}
      <AlertDialog open={dialogResetBuka} onOpenChange={setDialogResetBuka}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              <RotateCcw className="size-5" />
              <span>Reset Data Siaran ke Default?</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <span className="text-copy-13 text-muted-foreground block">
                  Tindakan ini akan mengembalikan daftar siaran ke data sampel awal PDAM Tirtawening lengkap (Brosur Promo, Foto Kegiatan Lapangan, Peta Zona Aliran, dan Running Text Ticker).
                </span>
                <span className="text-xs text-muted-foreground block">
                  Semua perubahan manual atau penambahan baru yang belum disimpan terpisah akan ditimpa.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Batal</AlertDialogCancel>
            <Button
              variant="default"
              disabled={isResetting}
              onClick={eksekusiReset}
              className="gap-1.5"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Mereset Data...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" />
                  <span>Ya, Reset Sekarang</span>
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
