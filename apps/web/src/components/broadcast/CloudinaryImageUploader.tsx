'use client'

import * as React from 'react'
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  RefreshCw,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface CloudinaryImageUploaderProps {
  label: string
  keterangan?: string
  value: string
  publicId?: string
  onChange: (url: string, publicId?: string) => void
  jenis?: 'banner' | 'brosur' | 'kegiatan' | 'peta'
  identifier?: string
  rasio?: '16/9' | '4/3' | '1/1' | 'auto'
}

export function CloudinaryImageUploader({
  label,
  keterangan,
  value,
  publicId,
  onChange,
  jenis = 'banner',
  identifier = 'broadcast-banner',
}: CloudinaryImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [modeUrlManual, setModeUrlManual] = React.useState(false)
  const [manualUrlInput, setManualUrlInput] = React.useState(value || '')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setManualUrlInput(value || '')
  }, [value])

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file harus berupa gambar (JPG, PNG, WEBP, atau SVG).')
      toast.error('Format berkas tidak didukung')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 10 MB.')
      toast.error('Ukuran berkas terlalu besar (>10 MB)')
      return
    }

    setErrorMsg(null)
    setIsUploading(true)

    try {
      // 1. Baca sebagai Base64 Data URL
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (err) => reject(err)
        reader.readAsDataURL(file)
      })

      // 2. Kirim ke Endpoint Cloudinary Media Router
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64Data,
          modul: 'broadcast',
          jenis,
          identifier: `${identifier}-${Date.now().toString().slice(-4)}`,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah foto ke Cloudinary.')
      }

      const uploadedUrl = json.data?.secureUrl || json.data?.url
      const uploadedPublicId = json.data?.publicId

      onChange(uploadedUrl, uploadedPublicId)
      toast.success('Foto berhasil diunggah ke Cloudinary CDN!', {
        description: `Tersimpan otomatis dengan resolusi ${json.data?.width || 0}x${json.data?.height || 0}px`,
      })
    } catch (err: any) {
      console.error('[CLOUDINARY_UPLOAD_COMPONENT_ERR]', err)
      setErrorMsg(err.message || 'Gagal mengunggah berkas ke Cloudinary.')
      toast.error('Gagal mengunggah ke Cloudinary CDN', {
        description: err.message || 'Periksa koneksi atau kredensial Cloudinary',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processAndUploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processAndUploadFile(file)
    }
  }

  const handleHapusFoto = () => {
    onChange('', undefined)
    setManualUrlInput('')
    setErrorMsg(null)
    toast.info('Foto dihapus')
  }

  const isCloudinary = value?.includes('cloudinary.com')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-medium text-foreground">
            {label}
          </label>
          {keterangan && (
            <p className="text-[11px] text-muted-foreground">
              {keterangan}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="link"
          size="xs"
          onClick={() => setModeUrlManual(!modeUrlManual)}
          className="text-primary h-auto p-0"
        >
          {modeUrlManual ? 'Unggah via File Cloudinary' : 'Input URL Manual'}
        </Button>
      </div>

      {modeUrlManual ? (
        <div className="flex gap-2">
          <Input
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="https://res.cloudinary.com/... atau /images/..."
            className="flex-1 font-mono text-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onChange(manualUrlInput.trim())
              toast.success('URL foto diterapkan!')
            }}
          >
            Terapkan
          </Button>
        </div>
      ) : value ? (
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-40 h-28 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={value}
                  alt="Pratinjau Foto"
                  className="h-full w-full object-cover object-center"
                />
                <span className="absolute top-1.5 left-1.5 rounded-sm bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground uppercase border border-border">
                  {jenis}
                </span>
              </div>

              <div className="flex-1 min-w-0 w-full space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isCloudinary ? (
                    <Badge variant="green-subtle" size="sm">
                      <CheckCircle2 className="size-2.5" />
                      Cloudinary CDN
                    </Badge>
                  ) : (
                    <Badge variant="secondary" size="sm">
                      <ImageIcon className="size-2.5" />
                      Aset Lokal
                    </Badge>
                  )}
                  {publicId && (
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-44">
                      ID: {publicId}
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-mono text-muted-foreground truncate" title={value}>
                  {value}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <RefreshCw className="size-3" />
                    Ganti
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    asChild
                  >
                    <a href={value} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3" />
                      Buka Asli
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={handleHapusFoto}
                    disabled={isUploading}
                    className="ml-auto"
                  >
                    <Trash2 className="size-3" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-accent'
              : 'border-border hover:border-primary/60 hover:bg-muted/50'
          } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {isUploading ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <UploadCloud className="size-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                {isUploading ? (
                  <span className="text-primary font-medium">
                    Mengunggah &amp; Mengoptimasi di Cloudinary CDN...
                  </span>
                ) : (
                  <>
                    <span className="text-primary hover:underline font-semibold">
                      Klik untuk pilih berkas
                    </span>{' '}
                    atau drag &amp; drop ke sini
                  </>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Mendukung JPG, PNG, WebP, SVG s.d. 10 MB. Otomatis dikompres &amp; di-cache CDN Cloudinary.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
