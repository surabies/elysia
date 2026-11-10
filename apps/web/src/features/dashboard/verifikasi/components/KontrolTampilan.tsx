"use client"

// features/dashboard/verifikasi/components/KontrolTampilan.tsx — kelompok
// tombol ikon untuk mengatur TAMPILAN halaman: lipat/buka kartu
// ringkasan dan, bila ada, kerapatan baris. Tiap tombol berikon saja dan
// dijelaskan Tooltip — ruang toolbar dihemat, maknanya tidak hilang.
//
// Dipakai halaman petugas (ringkasan + kerapatan) dan pelanggan (ringkasan).
import type { ReactNode } from "react"
import { DashboardSquare01Icon, Menu01Icon } from "@/features/dashboard/shared/icons/ikon-lucide"
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer"
import { TombolIkonVerifikasi } from "./BilahVerifikasi"

export function KontrolTampilan({
  ringkasanTerbuka,
  onRingkasan,
  padat,
  onPadat,
  aksiTambahan,
}: {
  ringkasanTerbuka: boolean
  onRingkasan: (buka: boolean) => void
  /** Hanya diisi halaman yang punya tabel berkerapatan (petugas). */
  padat?: boolean
  onPadat?: (padat: boolean) => void
  aksiTambahan?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1" role="toolbar" aria-label="Tampilan halaman">
      <TombolIkonVerifikasi
        label={ringkasanTerbuka ? "Sembunyikan ringkasan" : "Tampilkan ringkasan"}
        onClick={() => onRingkasan(!ringkasanTerbuka)}
        aktif={ringkasanTerbuka}
        ikon={
          <HugeiconsIcon
            icon={DashboardSquare01Icon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />
        }
      />

      {onPadat && (
        <TombolIkonVerifikasi
          label={padat ? "Kerapatan normal" : "Kerapatan padat"}
          onClick={() => onPadat(!padat)}
          aktif={padat}
          ikon={
            <HugeiconsIcon
              icon={Menu01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
          }
        />
      )}

      {aksiTambahan}
    </div>
  )
}
