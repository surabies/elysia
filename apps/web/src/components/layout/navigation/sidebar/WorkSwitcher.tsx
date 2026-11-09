// components/layout/navigation/sidebar/WorkSwitcher.tsx
// Scope Switcher sesuai inspeksi Vercel dashboard di docs/SIDEBAR.md:
// - Tinggi h-10 (40px)
// - Avatar 20px (GeistAvatar)
// - Teks nama workspace + badge "Tirtawening"
// - Seluruh baris adalah trigger DropdownMenu agar posisi popup pas keluar di bawah switcher (align="start", side="bottom")
// - TIDAK ADA hover background pada logo/teks baris; hover aktif HANYA pada icon chevron di kanan
// - Dropdown menu:
//   * Header info workspace dengan icon Setting di pojok kanan
//   * Daftar workspace direktorat dengan avatar, nama, subtitle, dan checkmark aktif
//   * Action footer untuk menambah atau mengelola ruang kerja

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Gauge,
  Ticket,
  Receipt,
  Check,
  Settings,
  Plus,
} from "lucide-react"
import { GeistChevronsUpDown } from "./lib/GeistIcons"
import { GeistAvatar } from "./lib/GeistAvatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/Utilitas"

type Workspace = {
  id: string
  name: string
  subtitle: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const WORKSPACES: Workspace[] = [
  {
    id: "utama",
    name: "Direktorat Utama",
    subtitle: "Pusat Komando & Ringkasan",
    href: "/dashboard",
    icon: Building2,
  },
  {
    id: "teknik",
    name: "Direktorat Teknik",
    subtitle: "Pencatatan Meter & Distribusi",
    href: "/progres/cater",
    icon: Gauge,
  },
  {
    id: "pelayanan",
    name: "Direktorat Pelayanan",
    subtitle: "Pengaduan & Layanan Pelanggan",
    href: "/pengaduan",
    icon: Ticket,
  },
  {
    id: "umum",
    name: "Direktorat Umum",
    subtitle: "Laporan DRD & Master Data",
    href: "/laporan/lap-drd",
    icon: Receipt,
  },
]

export function WorkSwitcher({ className }: { className?: string } = {}) {
  const pathname = usePathname()

  // Cari workspace yang sesuai dengan URL aktif
  const isVerifikasi = pathname.startsWith("/verifikasi")
  const isPengaduan = pathname.startsWith("/pengaduan")
  const isLaporan = pathname.startsWith("/laporan")

  const activeWorkspace =
    WORKSPACES.find(
      (ws) =>
        ws.href === pathname ||
        (ws.href !== "/dashboard" && pathname.startsWith(ws.href))
    ) ??
    (isVerifikasi
      ? WORKSPACES[1]
      : isPengaduan
      ? WORKSPACES[2]
      : isLaporan
      ? WORKSPACES[3]
      : WORKSPACES[0])

  const ActiveIcon = activeWorkspace.icon

  return (
    <div className={cn("flex h-10 w-full flex-row items-center", className)}>
      <DropdownMenu>
        {/* Seluruh baris adalah Trigger Dropdown agar posisi popup tepat keluar di bawah baris (align="start", side="bottom") */}
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Pilih Halaman Kerja"
            title="Pilih Halaman Kerja"
            className={cn(
              "group/scope relative flex h-full w-full items-center select-none min-w-0 text-sm rounded-md bg-transparent cursor-pointer pl-2.5 pr-1 transition-colors",
              // PENTING: Sesuai Vercel dashboard, TIDAK ADA hover background pada baris logo & teks ini
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            )}
          >
            {/* Avatar 20px Geist */}
            <GeistAvatar size={20} icon={ActiveIcon} alt={activeWorkspace.name} />

            {/* Nama Workspace + Badge Tirtawening */}
            <span className="flex-1 flex flex-row items-center gap-2 min-w-0 text-left ml-2">
              <span
                data-label-text="true"
                className="block min-w-0 truncate text-sm font-medium text-foreground"
              >
                {activeWorkspace.name}
              </span>
              <div
                data-testid="scope-switcher/scope-badge"
                className="inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap py-0.5 font-medium capitalize tabular-nums text-[11px]/[20px] tracking-[0.2px] h-5 px-2 bg-muted/60 text-muted-foreground"
              >
                <span>Tirtawening</span>
              </div>
            </span>

            {/* Tombol icon chevron arrow di pojok kanan: HOVER ACTIVE HANYA DI ICON INI! */}
            <span className="grid shrink-0 place-content-center size-7 rounded-md transition-colors text-muted-foreground group-hover/scope:bg-neutral-200 dark:group-hover/scope:bg-neutral-700 group-hover/scope:text-foreground">
              <GeistChevronsUpDown size={16} className="size-4" />
            </span>
          </button>
        </DropdownMenuTrigger>

        {/* Dropdown Menu Popup: Lebar 224px pas dengan lebar area sidebar (side="bottom", align="start") */}
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-[224px] min-w-[224px] rounded-xl border border-border bg-popover p-1.5 shadow-2xl text-sm"
        >
          {/* Header Panel Info: Nama Tim / Organisasi di kiri, Icon Setting di pojok kanan */}
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-semibold text-foreground tracking-tight">
                Perumda Tirtawening
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                Pilih Halaman Kerja
              </span>
            </div>
            <Link
              href="/master/otorisasi"
              aria-label="Otorisasi Menu"
              title="Otorisasi Menu"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 transition-colors"
            >
              <Settings className="size-3.5" />
            </Link>
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Daftar Workspace */}
          <div className="flex flex-col gap-0.5">
            {WORKSPACES.map((ws) => {
              const Icon = ws.icon
              const isActive = ws.id === activeWorkspace.id

              return (
                <DropdownMenuItem
                  key={ws.id}
                  asChild
                  className={cn(
                    "cursor-pointer px-2 py-1.5 rounded-md transition-colors",
                    isActive
                      ? "bg-neutral-100 dark:bg-neutral-800/80 text-foreground"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-foreground"
                  )}
                >
                  <Link
                    href={ws.href}
                    className="flex w-full items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GeistAvatar size={20} icon={Icon} alt={ws.name} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-medium text-foreground leading-tight">
                          {ws.name}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {ws.subtitle}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <Check className="size-4 shrink-0 text-foreground" />
                    )}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5" />

          {/* Action Footer */}
          <div className="flex flex-col gap-0.5">
            <DropdownMenuItem
              asChild
              className="h-8 cursor-pointer px-2 text-xs text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 rounded-md"
            >
              <Link
                href="/master/petugas"
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Plus className="size-3.5" />
                  <span>Kelola Petugas & Rute</span>
                </div>
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
