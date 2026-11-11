// components/layout/page/PageContainer.tsx
// Tugas: pembungkus isi tiap halaman: aksi (jika ada), lalu konten.
// Breadcrumb telah dialihkan ke Navbar utama agar tidak terjadi duplikasi.

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

export function PageContainer({
  breadcrumbs, // Dipertahankan di tipe agar backward-compatible tapi tidak dirender
  actions,
  className,
  penuh = false,
  tanpaHeader = false,
  children,
}: {
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  className?: string
  /** Konten menyatu dengan layout: tanpa padding di sekitar children. */
  penuh?: boolean
  /** Lewati baris header; halaman membuat kepala halamannya sendiri. */
  tanpaHeader?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0",
        !penuh && "px-4 pt-4 pb-8 sm:px-6 sm:pt-5 sm:pb-12 lg:px-8 lg:pt-6 lg:pb-16",
        className
      )}
    >
      {!tanpaHeader && actions && (
        <header
          className={cn(
            "mb-2 flex min-h-7 shrink-0 items-center justify-end gap-3 sm:mb-2.5",
            penuh && "mb-0 px-4 pt-4 pb-3 sm:mb-0 sm:pt-5"
          )}
        >
          <div className="flex shrink-0 items-center gap-2 ml-auto">{actions}</div>
        </header>
      )}

      {children}
    </div>
  )
}
