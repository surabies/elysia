"use client"

import * as React from "react"
import { Camera, X } from "@/components/ui/hugeicons-compat"
import { BingkaiFoto, type RasioFoto } from "@/components/BingkaiFoto"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { compressImage } from "../lib/kompresi-gambar"

const MAKS_FOTO_ASLI_BYTE = 15 * 1024 * 1024

export function PemilihFoto({
  previewUrl,
  onPilih,
  onHapus,
  onError,
  label,
  deskripsi,
  disabled = false,
  rasio = "16/9",
  mode = "utuh",
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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-md">
          <BingkaiFoto
            src={previewUrl}
            alt="Pratinjau foto bukti"
            rasio={rasio}
            mode={mode}
            tanpaDialog
          />
          <button
            onClick={onHapus}
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-neutral-950/80 text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
            aria-label="Hapus foto"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="group relative flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 sm:p-8 text-foreground transition-all hover:border-blue-500 hover:bg-blue-500/5 active:scale-[0.99]"
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
