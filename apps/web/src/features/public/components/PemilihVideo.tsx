"use client"

// features/public/components/PemilihVideo.tsx — pemilih + pratinjau SATU klip
// video bukti (opsional) untuk pengaduan.
import * as React from "react"
import { Video, X } from "@/components/ui/hugeicons-compat"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const MAKS_VIDEO_BYTE = 50 * 1024 * 1024
const MAKS_DURASI_DETIK = 60

function bacaDurasi(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement("video")
    v.preload = "metadata"
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(v.duration) ? v.duration : null)
    }
    v.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    v.src = url
  })
}

export function PemilihVideo({
  previewUrl,
  onPilih,
  onHapus,
  onError,
  label,
  deskripsi,
  disabled = false,
}: {
  previewUrl: string | null
  onPilih: (file: File, previewUrl: string) => void
  onHapus: () => void
  onError: (pesan: string | null) => void
  label: string
  deskripsi?: string
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [memeriksa, setMemeriksa] = React.useState(false)

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("video/"))
      return onError("File harus berupa video (MP4 atau WebM).")
    if (file.size > MAKS_VIDEO_BYTE)
      return onError("Ukuran video maksimal 50 MB.")

    onError(null)
    setMemeriksa(true)
    try {
      const durasi = await bacaDurasi(file)
      if (durasi === null)
        return onError("Video tidak bisa dibaca. Coba format lain (MP4/WebM).")
      if (durasi > MAKS_DURASI_DETIK + 1) {
        return onError(
          `Durasi video maksimal ${MAKS_DURASI_DETIK} detik. Klip Anda ${Math.round(durasi)} detik.`
        )
      }
      onPilih(file, URL.createObjectURL(file))
    } finally {
      setMemeriksa(false)
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={pilih}
        disabled={disabled || memeriksa}
      />
      {previewUrl ? (
        <div className="group relative w-full overflow-hidden rounded-xl border border-border bg-neutral-950 shadow-md [isolation:isolate] [transform:translateZ(0)]">
          {/* AspectRatio resmi Shadcn UI — mengisi frame penuh tanpa ruang kosong kiri/kanan */}
          <AspectRatio ratio={16 / 9} className="w-full bg-black">
            <video
              src={previewUrl}
              controls
              playsInline
              className="size-full object-cover rounded-[inherit]"
            />
          </AspectRatio>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onHapus()
            }}
            className="absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full bg-black/75 text-white border border-white/20 shadow-md backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Hapus video"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-6 hover:bg-muted/50 disabled:opacity-60 cursor-pointer transition-colors"
          type="button"
          disabled={disabled || memeriksa}
        >
          {memeriksa ? (
            <Spinner className="size-6" />
          ) : (
            <Video className="size-7 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {memeriksa ? "Memeriksa video…" : "Ambil / pilih video"}
          </p>
        </button>
      )}
      {deskripsi && <FieldDescription>{deskripsi}</FieldDescription>}
    </Field>
  )
}
