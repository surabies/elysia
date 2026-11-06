"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Gauge,
  Ticket,
  Receipt,
  ChevronsUpDown,
  Check,
  Settings,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
    subtitle: "Pencatatan Meter (Cater)",
    href: "/cater",
    icon: Gauge,
  },
  {
    id: "pelayanan",
    name: "Direktorat Pelayanan",
    subtitle: "Pengaduan & Pelanggan",
    href: "/pengaduan",
    icon: Ticket,
  },
  {
    id: "umum",
    name: "Direktorat Umum",
    subtitle: "Laporan DRD & Master",
    href: "/laporan",
    icon: Receipt,
  },
]

export function WorkSwitcher() {
  const pathname = usePathname()

  // Cari workspace yang sesuai dengan URL aktif
  const activeWorkspace =
    WORKSPACES.find((ws) => ws.href === pathname || (ws.href !== "/dashboard" && pathname.startsWith(ws.href))) ??
    WORKSPACES[0]

  const ActiveIcon = activeWorkspace.icon

  return (
    <div className="flex h-8 w-full items-center justify-between gap-1">
      {/* Kiri: Identitas Halaman Kerja (Link ke dashboard/workspace) */}
      <Link
        href={activeWorkspace.href}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors",
          "hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        <div className="flex size-5.5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-2xs">
          <ActiveIcon className="size-3" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium tracking-tight text-foreground leading-none">
            {activeWorkspace.name}
          </span>
          <span className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
            Tirtawening
          </span>
        </div>
      </Link>

      {/* Kanan: Trigger Dropdown khusus pada icon arrow */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Buka menu halaman kerja"
            title="Pilih Halaman Kerja"
            className={cn(
              "flex size-6.5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
              "hover:bg-[#F2F2F2] hover:text-foreground dark:hover:bg-[#1A1A1A]",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
          >
            <ChevronsUpDown className="size-3.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-56 min-w-56 rounded-lg border border-border bg-popover p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Pindah Halaman Kerja
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />

          {WORKSPACES.map((ws) => {
            const Icon = ws.icon
            const isActive = ws.id === activeWorkspace.id

            return (
              <DropdownMenuItem key={ws.id} asChild className="h-9 cursor-pointer px-2 rounded-md">
                <Link href={ws.href} className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "flex size-5.5 shrink-0 items-center justify-center rounded-sm border",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/60 text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-medium text-foreground">{ws.name}</span>
                    </div>
                  </div>

                  {isActive && <Check className="size-3.5 shrink-0 text-foreground" />}
                </Link>
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem asChild className="h-8 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/master/organisasi" className="flex items-center gap-2">
              <Settings className="size-3.5" />
              <span>Kelola Struktur Organisasi</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
