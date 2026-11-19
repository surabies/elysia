"use client"

// components/BingkaiFoto.tsx — bingkai foto BERUKURAN TETAP untuk seluruh
// web (dashboard + halaman publik).
//
// KEPUTUSAN DESAIN (2026-07-19): ukuran frame ditentukan FRONTEND lewat
// rasio aspek, BUKAN oleh dimensi file foto. Foto lapangan datang dari
// puluhan ponsel berbeda — potret/lanskap/persegi, 200px sampai 4000px —
// dan <img> telanjang membuat tinggi halaman berubah-ubah mengikuti file.
// Semua foto konten WAJIB lewat komponen ini; jangan menulis <img> telanjang
// di halaman.
//
// Dua mode isian:
//   - "isi"  (default): object-cover — frame penuh, tepi foto terpotong.
//     Untuk foto suasana/bukti umum.
//   - "utuh": object-contain di atas latar muted — foto tidak terpotong
//     (letterbox). Untuk foto yang angkanya harus terbaca (stand meter).
// Apa pun modenya, klik membuka dialog zoom (FotoZoom) — cover yang
// memotong tepi selalu punya jalan untuk dilihat utuh.
import * as React from "react"
import {
  ImageOff,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
} from "@/components/ui/hugeicons-compat"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const SKALA_MIN = 0.5
const SKALA_MAKS = 6
const LANGKAH = 0.25
const batas = (n: number) =>
  Math.min(SKALA_MAKS, Math.max(SKALA_MIN, Math.round(n * 100) / 100))

/// Penampil foto zoom interaktif seamless berbasis CSS Transform (persis modal verifikasi petugas).
/// Tidak memakai scrollbar native sehingga tidak ada bilah abu-abu di bawah atau di samping.
export function FotoZoom({
  url,
  label,
  className,
}: {
  url: string
  label: string
  className?: string
}) {
  const wadahRef = React.useRef<HTMLDivElement>(null)
  const [skala, setSkala] = React.useState(1)
  const [putar, setPutar] = React.useState(0)
  const [geser, setGeser] = React.useState({ x: 0, y: 0 })
  const [menyeret, setMenyeret] = React.useState(false)
  const [gagal, setGagal] = React.useState(false)
  const awal = React.useRef<{
    x: number
    y: number
    gx: number
    gy: number
  } | null>(null)

  const ubahSkala = React.useCallback((delta: number) => {
    setSkala((s) => {
      const n = batas(s + delta)
      if (n <= 1) setGeser({ x: 0, y: 0 })
      return n
    })
  }, [])

  const reset = React.useCallback(() => {
    setSkala(1)
    setPutar(0)
    setGeser({ x: 0, y: 0 })
  }, [])

  React.useEffect(() => {
    const el = wadahRef.current
    if (!el) return
    function saatWheel(e: WheelEvent) {
      e.preventDefault()
      ubahSkala(e.deltaY < 0 ? LANGKAH : -LANGKAH)
    }
    el.addEventListener("wheel", saatWheel, { passive: false })
    return () => el.removeEventListener("wheel", saatWheel)
  }, [ubahSkala])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "+" || e.key === "=") ubahSkala(LANGKAH)
    else if (e.key === "-") ubahSkala(-LANGKAH)
    else if (e.key.toLowerCase() === "r")
      setPutar((p) => p + (e.shiftKey ? -90 : 90))
    else if (e.key === "0") reset()
    else return
    e.preventDefault()
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (skala <= 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    awal.current = { x: e.clientX, y: e.clientY, gx: geser.x, gy: geser.y }
    setMenyeret(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const a = awal.current
    if (a) {
      setGeser({ x: a.gx + e.clientX - a.x, y: a.gy + e.clientY - a.y })
    }
  }

  function onPointerUp() {
    awal.current = null
    setMenyeret(false)
  }

  function onDoubleClick() {
    if (skala > 1) {
      reset()
    } else {
      setSkala(2)
      setGeser({ x: 0, y: 0 })
    }
  }

  return (
    <div
      ref={wadahRef}
      tabIndex={0}
      role="group"
      aria-label={`Penampil foto: ${label}`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      className={cn(
        "relative flex h-[70vh] sm:h-[80vh] w-full touch-none items-center justify-center overflow-hidden bg-muted/20 dark:bg-neutral-950 outline-none select-none",
        skala > 1
          ? menyeret
            ? "cursor-grabbing"
            : "cursor-grab"
          : "cursor-zoom-in",
        className
      )}
    >
      {gagal ? (
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
          <ImageOff className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-xs">Foto gagal dimuat.</p>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={label}
          draggable={false}
          onError={() => setGagal(true)}
          className="max-h-full max-w-full object-contain select-none pointer-events-none"
          style={{
            transform: `translate(${geser.x}px, ${geser.y}px) rotate(${putar}deg) scale(${skala})`,
            transition: menyeret ? "none" : "transform 150ms ease-out",
          }}
        />
      )}

      {/* Floating Toolbar Controls — Mendukung Tema Terang & Gelap */}
      <div
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/80 bg-background/90 px-2.5 py-1.5 shadow-2xl backdrop-blur-md z-20 text-foreground dark:border-white/15 dark:bg-neutral-900/90 dark:text-neutral-100"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => ubahSkala(-LANGKAH)}
          disabled={skala <= SKALA_MIN}
          title="Perkecil (−)"
          aria-label="Perkecil (−)"
          className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 cursor-pointer transition-colors dark:text-white/80 dark:hover:text-white dark:hover:bg-white/15"
        >
          <Minus className="size-3.5" />
        </button>

        <span className="w-12 text-center font-mono text-xs font-semibold text-foreground dark:text-white tabular-nums select-none">
          {Math.round(skala * 100)}%
        </span>

        <button
          type="button"
          onClick={() => ubahSkala(LANGKAH)}
          disabled={skala >= SKALA_MAKS}
          title="Perbesar (+)"
          aria-label="Perbesar (+)"
          className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 cursor-pointer transition-colors dark:text-white/80 dark:hover:text-white dark:hover:bg-white/15"
        >
          <Plus className="size-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-border dark:bg-white/20" />

        <button
          type="button"
          onClick={() => setPutar((p) => p - 90)}
          title="Putar Kiri (Shift+R)"
          aria-label="Putar Kiri (Shift+R)"
          className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 cursor-pointer transition-colors dark:text-white/80 dark:hover:text-white dark:hover:bg-white/15"
        >
          <RotateCcw className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setPutar((p) => p + 90)}
          title="Putar Kanan (R)"
          aria-label="Putar Kanan (R)"
          className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 cursor-pointer transition-colors dark:text-white/80 dark:hover:text-white dark:hover:bg-white/15"
        >
          <RotateCw className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={reset}
          title="Atur Ulang (0)"
          aria-label="Atur Ulang (0)"
          className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 cursor-pointer transition-colors dark:text-white/80 dark:hover:text-white dark:hover:bg-white/15"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

const RASIO_MAP = {
  "16/9": 16 / 9,
  "4/3": 4 / 3,
  "1/1": 1 / 1,
  "3/4": 3 / 4,
} as const

export type RasioFoto = keyof typeof RASIO_MAP

export function BingkaiFoto({
  src,
  alt,
  rasio = "4/3",
  mode = "isi",
  className,
  tanpaDialog = false,
}: {
  src: string
  alt: string
  /** Rasio frame — INI yang menentukan tinggi, bukan file fotonya. */
  rasio?: RasioFoto
  /** "isi" = object-cover (tepi terpotong); "utuh" = object-contain
   *  (letterbox) untuk foto yang angkanya harus terbaca. */
  mode?: "isi" | "utuh"
  /** Lebar diatur pemanggil dari sini (mis. `max-w-[200px]`). */
  className?: string
  /** Matikan dialog zoom — untuk pratinjau berkas lokal (blob:) di form. */
  tanpaDialog?: boolean
}) {
  const [gagal, setGagal] = React.useState(false)

  const bingkai = (
    <AspectRatio
      ratio={RASIO_MAP[rasio] || 4 / 3}
      className={cn(
        "relative block w-full overflow-hidden rounded-lg border border-border bg-muted/40 [isolation:isolate] [transform:translateZ(0)]",
        className
      )}
    >
      {gagal ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <ImageOff className="size-5" />
          <span className="text-[11px]">Foto tidak dapat dimuat</span>
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- URL eksternal/blob, bukan aset Next/Image */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setGagal(true)}
            className={cn(
              "absolute inset-0 size-full rounded-[inherit]",
              mode === "utuh" ? "object-contain" : "object-cover"
            )}
          />
          {!tanpaDialog && (
            <span className="absolute right-2 bottom-2 rounded-md bg-black/60 p-1.5 text-white backdrop-blur-xs border border-white/20 shadow-xs">
              <ZoomIn className="size-3.5" />
            </span>
          )}
        </>
      )}
    </AspectRatio>
  )

  if (tanpaDialog || gagal) return bingkai

  return (
    <Dialog>
      <DialogTrigger className="block w-full cursor-zoom-in text-left">
        {bingkai}
      </DialogTrigger>
      {/* sm:max-w-4xl: dialog foto responsif penuh yang kokoh dan seamless (support tema terang & gelap) */}
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl p-0 gap-0 overflow-hidden border border-border bg-background text-foreground shadow-2xl rounded-2xl [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:bg-background/80 [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-border [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:hover:bg-muted [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:z-30 dark:border-white/15 dark:bg-neutral-950 dark:text-white dark:[&_[data-slot=dialog-close]]:text-white dark:[&_[data-slot=dialog-close]]:bg-black/60 dark:[&_[data-slot=dialog-close]]:border-white/20 dark:[&_[data-slot=dialog-close]]:hover:bg-white/20">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Penampil foto interaktif dengan zoom, geser, dan putar. Tekan Esc untuk menutup.
        </DialogDescription>
        <FotoZoom url={src} label={alt} />
      </DialogContent>
    </Dialog>
  )
}
