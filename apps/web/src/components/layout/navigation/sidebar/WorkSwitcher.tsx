// components/layout/navigation/sidebar/WorkSwitcher.tsx
// Ruang Kerja (Workspace) Quick Switcher Vercel Geist Style:
// - Tinggi h-10 (40px)
// - Avatar 20px (GeistAvatar) dengan icon ruang kerja aktif
// - Teks nama ruang kerja aktif + badge "Tirtawening"
// - Dropdown menu elegan menampilkan 7 Ruang Kerja Operasional PDAM Tirtawening:
//   1. Pusat Komando (/dashboard)
//   2. Catat Meter Lapangan (/cater)
//   3. Verifikasi Petugas (/verifikasi/baca-petugas)
//   4. Verifikasi Mandiri (/verifikasi/baca-pelanggan)
//   5. Billing & Rekening DRD (/laporan/lap-drd)
//   6. Pengaduan & GWM (/pengaduan)
//   7. Master Pelanggan & GIS (/pelanggan)
// - Keyboard shortcuts (⌥1 s/d ⌥7 / Alt+1 s/d Alt+7) untuk beralih instan
// - Checkmark penanda ruang kerja aktif

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  Gauge,
  ShieldCheck,
  UserCheck,
  Receipt,
  LifeBuoy,
  MapPin,
  Check,
  Settings,
  BarChart3,
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
import { cn } from "@/lib/utils"

export type OperationalWorkspace = {
  id: string
  name: string
  subtitle: string
  href: string
  shortcut: string
  keyNumber: string
  tag: string
  icon: React.ComponentType<{ className?: string }>
}

export const OPERATIONAL_WORKSPACES: OperationalWorkspace[] = [
  {
    id: "pusat-komando",
    name: "Pusat Komando",
    subtitle: "Ringkasan 3 Pilar & Telemetri",
    href: "/dashboard",
    shortcut: "⌥1",
    keyNumber: "1",
    tag: "Eksekutif",
    icon: Building2,
  },
  {
    id: "catat-meter",
    name: "Catat Meter Lapangan",
    subtitle: "22.549 Rute & Progres Bacaan",
    href: "/cater",
    shortcut: "⌥2",
    keyNumber: "2",
    tag: "Cater",
    icon: Gauge,
  },
  {
    id: "verifikasi-petugas",
    name: "Verifikasi Petugas",
    subtitle: "Audit Stand Lapangan Cater",
    href: "/verifikasi/baca-petugas",
    shortcut: "⌥3",
    keyNumber: "3",
    tag: "V-Petugas",
    icon: ShieldCheck,
  },
  {
    id: "verifikasi-mandiri",
    name: "Verifikasi Mandiri",
    subtitle: "Audit Bacaan Stand Pelanggan",
    href: "/verifikasi/baca-pelanggan",
    shortcut: "⌥4",
    keyNumber: "4",
    tag: "V-Mandiri",
    icon: UserCheck,
  },
  {
    id: "billing",
    name: "Billing & Rekening DRD",
    subtitle: "Daftar Rekening & Piutang Tagihan",
    href: "/laporan/lap-drd",
    shortcut: "⌥5",
    keyNumber: "5",
    tag: "DRD",
    icon: Receipt,
  },
  {
    id: "pengaduan",
    name: "Pengaduan & GWM",
    subtitle: "Tiket Aduan & Ganti Water Meter",
    href: "/pengaduan",
    shortcut: "⌥6",
    keyNumber: "6",
    tag: "Layanan",
    icon: LifeBuoy,
  },
  {
    id: "spasial-pelanggan",
    name: "Master Pelanggan & GIS",
    subtitle: "Basis Data SL & Peta Wilayah",
    href: "/pelanggan",
    shortcut: "⌥7",
    keyNumber: "7",
    tag: "Spasial",
    icon: MapPin,
  },
]

export function WorkSwitcher({ className }: { className?: string } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  // Deteksi ruang kerja aktif berdasarkan URL rute saat ini
  const activeWorkspace = React.useMemo(() => {
    if (pathname.startsWith("/verifikasi/baca-petugas")) {
      return OPERATIONAL_WORKSPACES[2] // Verifikasi Petugas
    }
    if (pathname.startsWith("/verifikasi/baca-pelanggan") || pathname.startsWith("/stand-konsumen")) {
      return OPERATIONAL_WORKSPACES[3] // Verifikasi Mandiri
    }
    if (pathname.startsWith("/verifikasi")) {
      return OPERATIONAL_WORKSPACES[2] // Verifikasi Petugas fallback
    }
    if (pathname.startsWith("/cater") || pathname.startsWith("/progres/cater")) {
      return OPERATIONAL_WORKSPACES[1] // Catat Meter Lapangan
    }
    if (
      pathname.startsWith("/progres/ekstrim") ||
      pathname.startsWith("/progres/koreksi") ||
      pathname.startsWith("/progres/nol") ||
      pathname.startsWith("/progres/turun") ||
      pathname.startsWith("/meter")
    ) {
      return OPERATIONAL_WORKSPACES[2] // Verifikasi Petugas (Anomali & Stand)
    }
    if (pathname.startsWith("/laporan/lap-drd") || pathname.startsWith("/tools-tutup")) {
      return OPERATIONAL_WORKSPACES[4] // Billing & Rekening DRD
    }
    if (pathname.startsWith("/pengaduan") || pathname.startsWith("/cater/ganti-meter")) {
      return OPERATIONAL_WORKSPACES[5] // Pengaduan & GWM
    }
    if (pathname.startsWith("/pelanggan") || pathname.startsWith("/peta-wilayah") || pathname.startsWith("/master")) {
      return OPERATIONAL_WORKSPACES[6] // Master Pelanggan & GIS
    }
    // Default Pusat Komando
    return OPERATIONAL_WORKSPACES[0]
  }, [pathname])

  // Keyboard shortcut listener: Alt+1 s/d Alt+7 (atau Option+1..7 di macOS)
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const found = OPERATIONAL_WORKSPACES.find((ws) => ws.keyNumber === event.key)
        if (found) {
          event.preventDefault()
          setOpen(false)
          router.push(found.href)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  const ActiveIcon = activeWorkspace.icon

  return (
    <div className={cn("flex h-10 w-full flex-row items-center", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Pilih Ruang Kerja Operasional"
            title="Pilih Ruang Kerja Operasional (Pintasan: ⌥1 - ⌥7)"
            className={cn(
              "group/scope relative flex h-full w-full items-center select-none min-w-0 text-sm rounded-md bg-transparent cursor-pointer pl-2.5 pr-1 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            )}
          >
            {/* Avatar 20px Geist dengan Icon Ruang Kerja Aktif */}
            <GeistAvatar size={20} icon={ActiveIcon} alt={activeWorkspace.name} />

            {/* Nama Ruang Kerja + Badge Tag */}
            <span className="flex-1 flex flex-row items-center gap-1.5 min-w-0 text-left ml-2">
              <span
                data-label-text="true"
                className="block min-w-0 truncate text-sm font-medium text-foreground tracking-tight"
              >
                {activeWorkspace.name}
              </span>
              <div
                data-testid="scope-switcher/scope-badge"
                className="inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap py-0.5 font-medium tabular-nums text-[10px]/[18px] tracking-[0.2px] h-4.5 px-1.5 bg-muted/70 text-muted-foreground border border-border/60"
              >
                <span>{activeWorkspace.tag}</span>
              </div>
            </span>

            {/* Tombol icon chevron arrow di pojok kanan: HOVER ACTIVE HANYA DI ICON INI */}
            <span className="grid shrink-0 place-content-center size-7 rounded-md transition-colors text-muted-foreground group-hover/scope:bg-(--ds-gray-200) group-hover/scope:text-foreground">
              <GeistChevronsUpDown size={16} className="size-4" />
            </span>
          </button>
        </DropdownMenuTrigger>

        {/* Dropdown Menu Popup: Lebar 290px elegan dengan Vercel styling */}
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-[290px] min-w-[290px] max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-sm"
        >
          {/* Header Panel Info: Nama Ruang Kerja & Setting */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-border/50 pb-2 mb-1">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-foreground tracking-tight">
                  Ruang Kerja Operasional
                </span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-primary/10 text-primary font-mono font-medium">
                  7 Modul
                </span>
              </div>
              <span className="truncate text-[11px] text-muted-foreground mt-0.5">
                Perumda Air Minum Tirtawening
              </span>
            </div>
            <Link
              href="/pengaturan"
              onClick={() => setOpen(false)}
              aria-label="Pengaturan Modul"
              title="Pengaturan Modul"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-(--ds-gray-100) hover:text-foreground dark:hover:bg-(--ds-gray-200) transition-colors"
            >
              <Settings className="size-3.5" />
            </Link>
          </div>

          {/* Daftar 7 Ruang Kerja Operasional */}
          <div className="flex flex-col gap-0.5">
            {OPERATIONAL_WORKSPACES.map((ws) => {
              const Icon = ws.icon
              const isActive = ws.id === activeWorkspace.id

              return (
                <DropdownMenuItem
                  key={ws.id}
                  asChild
                  onSelect={() => setOpen(false)}
                  className={cn(
                    "cursor-pointer px-2 py-1.5 rounded-lg transition-colors group/item",
                    isActive
                      ? "bg-(--ds-gray-200) text-foreground font-medium"
                      : "hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200) text-foreground"
                  )}
                >
                  <Link
                    href={ws.href}
                    className="flex w-full items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "size-7 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                          isActive
                            ? "bg-foreground text-background border-foreground shadow-xs"
                            : "bg-muted/60 text-muted-foreground border-border/80 group-hover/item:border-foreground/30 group-hover/item:text-foreground"
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs text-foreground leading-tight">
                          {ws.name}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {ws.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      {isActive && (
                        <Check className="size-3.5 text-foreground shrink-0" />
                      )}
                      <kbd className="inline-flex items-center justify-center h-4.5 px-1.5 rounded border border-border/70 bg-background/80 font-mono text-[10px] text-muted-foreground/90 tabular-nums">
                        {ws.shortcut}
                      </kbd>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5" />

          {/* Pintasan Tambahan: Panel Analitik & Kinerja */}
          <div className="flex flex-col gap-0.5">
            <DropdownMenuItem
              asChild
              onSelect={() => setOpen(false)}
              className="h-8 cursor-pointer px-2 text-xs text-muted-foreground hover:bg-(--ds-gray-100) hover:text-foreground dark:hover:bg-(--ds-gray-200) rounded-md transition-colors"
            >
              <Link
                href="/analytics"
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-3.5 text-primary" />
                  <span>Panel Analitik & Kinerja</span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 font-mono">Buka →</span>
              </Link>
            </DropdownMenuItem>
          </div>

          {/* Footer Petunjuk Cepat */}
          <div className="mt-1 px-2.5 py-1 rounded bg-muted/40 border border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Pintasan Cepat:</span>
            <span className="font-mono text-foreground font-medium">Alt + [1 - 7]</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
