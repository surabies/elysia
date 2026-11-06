"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { cn } from "@/lib/Utilitas"
import { useSidebar } from "./SidebarContext"
import { WorkSwitcher } from "../navigation/sidebar/WorkSwitcher"
import { SidebarSearch } from "../navigation/sidebar/SidebarSearch"
import { SidebarNav } from "../navigation/SidebarNav"
import { UserMenu } from "../navbar/MenuPengguna"
import { Navbar } from "../navbar/Navbar"
import { MAIN_CONTENT_ID } from "./KonstantaDashboardShell"

export { MAIN_CONTENT_ID } from "./KonstantaDashboardShell"

export type DashboardShellProps = {
  children: ReactNode
  tanpaSidebar?: boolean
  tanpaCard?: boolean
  user?: {
    name: string | null
    email: string
    image: string | null
    role: string
  }
  onKeluar?: () => Promise<void>
}

export function DashboardShell({
  children,
  tanpaSidebar = false,
  user,
  onKeluar = async () => {},
}: DashboardShellProps) {
  const { isOpen, setIsOpen } = useSidebar()
  const pathname = usePathname()

  // Tutup sidebar otomatis di mobile setelah pengguna klik/pindah halaman
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }, [pathname, setIsOpen])

  // Escape key untuk menutup sidebar mobile
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && window.innerWidth < 1024) {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, setIsOpen])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Lompat ke konten untuk navigasi aksesibilitas */}
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className={cn(
          "sr-only focus-visible:not-sr-only",
          "focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50",
          "focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2",
          "focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-xs",
          "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        )}
      >
        Lewati ke konten utama
      </a>

      {/* Backdrop mobile saat sidebar terbuka di layar kecil */}
      {!tanpaSidebar && isOpen && (
        <div
          role="presentation"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* PANEL KIRI: Sidebar penuh (atas ke bawah layar) */}
      {!tanpaSidebar && (
        <aside
          aria-label="Navigasi modul"
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-200 ease-in-out lg:relative",
            isOpen
              ? "w-64 min-w-64 translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none lg:w-0 lg:min-w-0 lg:translate-x-0 lg:overflow-hidden lg:border-none"
          )}
        >
          {/* Header Sidebar: Work-Switcher & Kotak Pencarian sejajar garis border-b navbar (tanpa border-b di header) */}
          <div className="flex h-20 shrink-0 flex-col justify-between px-3 pt-2.5 pb-0">
            <WorkSwitcher />
            <SidebarSearch />
          </div>

          {/* Body Sidebar: Hirarki Menu Navigasi (terangkat naik menyeimbangkan box search) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-2 overscroll-contain">
            <SidebarNav />
          </div>

          {/* Footer Sidebar: Avatar akun pengguna & icon notifikasi (tanpa border footer) */}
          {user && (
            <div className="p-3 pt-1 shrink-0 mt-auto">
              <UserMenu
                nama={user.name}
                email={user.email}
                image={user.image}
                role={user.role}
                onKeluar={onKeluar}
                variant="sidebar"
              />
            </div>
          )}
        </aside>
      )}

      {/* PANEL KANAN: Navbar di atas dan Konten Utama di bawah */}
      <div className="flex flex-1 min-w-0 flex-col h-full overflow-hidden">
        {/* Navbar: tombol toggle sidebar di kiri, breadcrumb pas di tengah, bantuan di kanan */}
        <Navbar />

        {/* Area scroll konten utama */}
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex-1 min-h-0 min-w-0 overflow-y-auto focus:outline-none bg-background"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
