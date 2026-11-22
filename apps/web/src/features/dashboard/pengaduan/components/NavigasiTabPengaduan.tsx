"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Ticket,
  MapPin,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavigasiTabPengaduanProps {
  className?: string
  extraAction?: React.ReactNode
}

export function NavigasiTabPengaduan({
  className,
  extraAction,
}: NavigasiTabPengaduanProps) {
  const pathname = usePathname()

  const tabs = [
    {
      title: "Daftar Antrean Tiket",
      href: "/pengaduan",
      aktif: pathname === "/pengaduan",
      ikon: Ticket,
      deskripsi: "Tabel antrean keluhan, delegasi petugas & SLA",
    },
    {
      title: "Peta Kendali GIS",
      href: "/peta-pengaduan",
      aktif: pathname === "/peta-pengaduan",
      ikon: MapPin,
      deskripsi: "Visualisasi spasial sebaran titik pengaduan",
    },
    {
      title: "Kebijakan & Regulasi SOP",
      href: "/pengaturan/pengaduan",
      aktif: pathname === "/pengaturan/pengaduan",
      ikon: SlidersHorizontal,
      deskripsi: "Konfigurasi matriks bobot, durasi SLA & aturan rilis",
    },
  ]

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3",
        className
      )}
    >
      {/* Tab Switcher Enterprise */}
      <nav
        aria-label="Navigasi Pengaduan"
        className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/60 shadow-2xs"
      >
        {tabs.map((tab) => {
          const Ikon = tab.ikon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all select-none",
                tab.aktif
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
              title={tab.deskripsi}
            >
              <Ikon
                className={cn(
                  "size-3.5 transition-colors",
                  tab.aktif
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{tab.title}</span>
              {tab.aktif && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Aksi Tambahan (Misal Link Form Warga Publik) */}
      <div className="flex items-center gap-2">
        {extraAction}
        <Link
          href="/pengaduan-air"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 hover:bg-accent px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
          title="Buka form laporan warga masyarakat"
        >
          <span>Portal Warga</span>
          <ExternalLink className="size-3 opacity-70" />
        </Link>
      </div>
    </div>
  )
}
