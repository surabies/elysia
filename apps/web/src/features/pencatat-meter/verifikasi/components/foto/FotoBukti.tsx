"use client"

// features/dashboard/verifikasi/components/fotoBukti.tsx — lampiran foto
// meter di panel verifikasi.
//
// Frame SELALU potret 3:4 (BingkaiPotret) dan empty state memakai bentuk yang
// sama, jadi panel tidak berubah tinggi ketika sebuah laporan tidak berfoto.
// Klik foto membuka lightbox: zoom, putar, geser, Esc.
import { ImageNotFound01Icon } from "@/components/icons/ikon-lucide"
import { HugeiconsIcon } from "@/components/icons/IconRenderer"
import { BingkaiPotret, FotoZoom } from "./PenampilFoto"
import { resolveFotoUrl } from "@/lib/foto-resolver"

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
  nolg,
  jenis = "stand",
  stand,
  periode,
  nama,
}: {
  label: string
  keterangan?: string
  penuh?: boolean
  nolg?: string
  jenis?: "stand" | "segel" | "rumah"
  stand?: string | number | null
  periode?: string | null
  nama?: string | null
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

  const mockUrl = resolveFotoUrl({
    realUrl: null,
    nolg,
    jenis,
    stand,
    periode,
    nama,
  })

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <BingkaiPotret
        url={mockUrl}
        alt={`${label}. ${keterangan ?? "Foto on-demand dinamis."}`}
      />
      <p className="text-center text-copy-13 text-muted-foreground break-words px-1">
        Simulasi foto dinamis (on-demand) — belum ada foto lapangan.
      </p>
    </div>
  )
}

export function FotoBukti({
  url,
  label,
  keterangan,
  nolg,
  jenis = "stand",
  stand,
  periode,
  nama,
}: {
  url: string | null | undefined
  label: string
  /** Teks empty state bila foto tidak ada. */
  keterangan?: string
  nolg?: string
  jenis?: "stand" | "segel" | "rumah"
  stand?: string | number | null
  periode?: string | null
  nama?: string | null
}) {
  if (!url) {
    return (
      <FotoKosong
        label={label}
        keterangan={keterangan}
        nolg={nolg}
        jenis={jenis}
        stand={stand}
        periode={periode}
        nama={nama}
      />
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <BingkaiPotret url={url} alt={label} />
      <p className="text-center text-copy-13 text-muted-foreground break-words px-1">
        Klik foto untuk perbesar, putar & zoom
      </p>
    </div>
  )
}
