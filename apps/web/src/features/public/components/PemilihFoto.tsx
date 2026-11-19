"use client"

import * as React from "react"
import { Camera, X, ZoomIn } from "@/components/ui/hugeicons-compat"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FotoZoom, type RasioFoto } from "@/components/BingkaiFoto"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { compressImage } from "../lib/kompresi-gambar"

const MAKS_FOTO_ASLI_BYTE = 15 * 1024 * 1024

const RASIO_MAP = {
  "16/9": 16 / 9,
  "4/3": 4 / 3,
  "1/1": 1 / 1,
  "3/4": 3 / 4,
} as const

export function PemilihFoto({
  previewUrl,
  onPilih,
  onHapus,
  onError,
  label,
  deskripsi,
  disabled = false,
  rasio = "16/9",
  mode = "isi",
}: {
  previewUrl: string | null
  onPilih: (file: File, previewUrl: string) => void
  onHapus: () => void
  onError: (pesan: string | null) => void
  label: string
  deskripsi?: string
  disabled?: boolean
  rasio?: RasioFoto
  mode?: "isi" | "utuh"
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/"))
      return onError("File harus berupa gambar (JPG, PNG, atau WEBP).")
    if (file.size > MAKS_FOTO_ASLI_BYTE)
      return onError("Ukuran foto maksimal 15 MB.")

    onError(null)
    try {
      const kompres = await compressImage(file)
      onPilih(kompres, URL.createObjectURL(kompres))
    } catch {
      onError("Gagal memproses foto. Coba foto lain.")
    }
  }

  const numericRatio = RASIO_MAP[rasio] || 16 / 9

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={pilih}
        disabled={disabled}
      />
      {previewUrl ? (
        <div className="group relative w-full overflow-hidden rounded-xl border border-border bg-neutral-950 shadow-md [isolation:isolate] [transform:translateZ(0)]">
          <Dialog>
            <DialogTrigger className="block w-full cursor-zoom-in text-left">
              {/* Aspect Ratio resmi Shadcn UI — mengisi frame penuh tanpa ruang kosong kiri/kanan */}
              <AspectRatio ratio={numericRatio} className="w-full bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={label}
                  className={`size-full rounded-[inherit] transition-transform duration-300 group-hover:scale-102 ${
                    mode === "utuh" ? "object-contain" : "object-cover"
                  }`}
                />

                {/* Petunjuk Ketuk untuk Perbesar — Adaptif Tema Terang & Gelap */}
                <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs backdrop-blur-xs transition-opacity duration-200 group-hover:bg-background/95 dark:border-white/20 dark:bg-black/75 dark:text-white">
                  <ZoomIn className="size-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Ketuk untuk perbesar</span>
                </div>
              </AspectRatio>
            </DialogTrigger>

            {/* Dialog Perbesar Foto (FotoZoom) yang Robust & Seamless (Support Tema Terang & Gelap) */}
            <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl p-0 gap-0 overflow-hidden border border-border bg-background text-foreground shadow-2xl rounded-2xl [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:bg-background/80 [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-border [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:hover:bg-muted [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:z-30 dark:border-white/15 dark:bg-neutral-950 dark:text-white dark:[&_[data-slot=dialog-close]]:text-white dark:[&_[data-slot=dialog-close]]:bg-black/60 dark:[&_[data-slot=dialog-close]]:border-white/20 dark:[&_[data-slot=dialog-close]]:hover:bg-white/20">
              <DialogTitle className="sr-only">{label}</DialogTitle>
              <DialogDescription className="sr-only">
                Penampil foto interaktif dengan zoom, geser, dan putar. Tekan Esc untuk menutup.
              </DialogDescription>
              <FotoZoom url={previewUrl} label={label} />
            </DialogContent>
          </Dialog>

          {/* Tombol Hapus Foto di Sudut Kanan Atas */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onHapus()
            }}
            className="absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full bg-black/75 text-white border border-white/20 shadow-md backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Hapus foto"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="group relative flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 sm:p-8 text-foreground transition-all hover:border-blue-500 hover:bg-blue-500/5 active:scale-[0.99] cursor-pointer"
          type="button"
          disabled={disabled}
        >
          {/* Viewfinder Target Corner Accents */}
          <div className="absolute top-2 left-2 size-3 border-t-2 border-l-2 border-border rounded-tl-sm group-hover:border-blue-500 transition-colors" />
          <div className="absolute top-2 right-2 size-3 border-t-2 border-r-2 border-border rounded-tr-sm group-hover:border-blue-500 transition-colors" />
          <div className="absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-border rounded-bl-sm group-hover:border-blue-500 transition-colors" />
          <div className="absolute bottom-2 right-2 size-3 border-b-2 border-r-2 border-border rounded-br-sm group-hover:border-blue-500 transition-colors" />

          {/* Camera Icon Pill */}
          <div className="flex size-13 items-center justify-center rounded-2xl bg-card shadow-xs ring-1 ring-border transition-transform group-hover:scale-105 group-hover:ring-blue-400">
            <Camera className="size-6 text-blue-600 dark:text-sky-400" />
          </div>

          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Ambil Foto / Pilih dari Galeri
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
              Ketuk untuk membuka kamera ponsel Anda
            </p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs">
            JPG, PNG, WEBP · Otomatis Teroptimasi
          </span>
        </button>
      )}
      {deskripsi && <FieldDescription>{deskripsi}</FieldDescription>}
    </Field>
  )
}
