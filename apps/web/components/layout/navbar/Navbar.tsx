"use client"

import Link from "next/link"
import { PanelLeft, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavbarBreadcrumb } from "./NavbarBreadcrumb"
import { useSidebar } from "../shell/SidebarContext"

export function Navbar() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="relative flex h-20 w-full shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm z-20">
      {/* Kiri: Tombol sembunyikan/tampilkan sidebar */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Sembunyikan atau tampilkan sidebar"
          title="Toggle Sidebar (Ctrl+B)"
          className="size-8 rounded-md text-muted-foreground hover:bg-[#F2F2F2] hover:text-foreground dark:hover:bg-[#1A1A1A]"
        >
          <PanelLeft size={16} strokeWidth={1.5} className="size-4" />
        </Button>
      </div>

      {/* Tengah: Breadcrumb pas di tengah navbar */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
        <NavbarBreadcrumb />
      </div>

      {/* Kanan: Hanya menyisakan tombol Bantuan saja */}
      <div className="flex items-center gap-2">
        <Link
          href="/bantuan"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F]"
          title="Pusat Bantuan & Dokumentasi"
        >
          <HelpCircle size={15} strokeWidth={1.5} className="size-3.5 text-muted-foreground" />
          <span>Bantuan</span>
        </Link>
      </div>
    </header>
  )
}
