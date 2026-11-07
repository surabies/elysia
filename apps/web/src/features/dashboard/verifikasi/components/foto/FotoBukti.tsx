"use client"

// features/dashboard/verifikasi/components/fotoBukti.tsx — lampiran foto
// meter di panel verifikasi.
//
// Frame SELALU potret 3:4 (BingkaiPotret) dan empty state memakai bentuk yang
// sama, jadi panel tidak berubah tinggi ketika sebuah laporan tidak berfoto.
// Klik foto membuka lightbox: zoom, putar, geser, Esc.
import { ImageNotFound01Icon } from "@/features/dashboard/shared/icons/IkonLucide"
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer"
import { BingkaiPotret, FotoZoom } from "./PenampilFoto"

// Pemakai lama (TabFoto.tsx, DialogVerifikasi.tsx) tetap mengimpor dari sini.
export { FotoZoom }

/// Empty state yang menjelaskan diri. Laporan petugas dari sistem lama memang
/// tidak menyertakan foto, jadi ini jalur normal, bukan kegagalan.
/// Panel memakai mock dalam rasio bingkai yang sama dengan foto asli dan
/// membuka lightbox yang sama; `penuh` mempertahankan empty state modal.
export function FotoKosong({
  label,
  keterangan,
  penuh = false,
}: {
  label: string
  keterangan?: string
  penuh?: boolean
}) {
  if (penuh) {
    return (
      <div className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
        <HugeiconsIcon
          icon={ImageNotFound01Icon}
          strokeWidth={2}
          className="size-5 text-muted-foreground"
          aria-hidden
        />
        <p className="text-label-12 font-medium text-foreground">{label}</p>
        <p className="text-copy-13 text-muted-foreground">
          {keterangan ?? "Belum ada foto yang diunggah."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <BingkaiPotret
        url="/images/meter/mock.png"
        alt={`${label}. ${keterangan ?? "Belum ada foto yang diunggah."}`}
      />
      <p className="text-center text-copy-13 text-muted-foreground">
        Contoh tampilan foto — belum ada foto aktual.
      </p>
    </div>
  )
}

export function FotoBukti({
  url,
  label,
  keterangan,
}: {
  url: string | null | undefined
  label: string
  /** Teks empty state bila foto tidak ada. */
  keterangan?: string
}) {
  if (!url) return <FotoKosong label={label} keterangan={keterangan} />

  return (
    <div className="flex flex-col gap-1">
      <BingkaiPotret url={url} alt={label} />
      <p className="text-center text-copy-13 text-muted-foreground">
        Klik foto untuk perbesar, putar & zoom
      </p>
    </div>
  )
}
