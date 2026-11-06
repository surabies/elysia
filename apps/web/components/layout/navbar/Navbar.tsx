// components/layout/navbar/Navbar.tsx
// Navbar dashboard sesuai inspeksi Vercel di docs/NAVBAR.md:
// - Tinggi h-14 (56px), 3-kolom grid: [1fr_2fr_1fr]
// - Kiri: Tombol trigger collapse sidebar (size-8, GeistPanelLeft 16x16)
//   * Perilaku Vercel: disembunyikan saat sidebar terbuka, muncul saat sidebar ditutup
//   * Tanpa separator garis vertikal
// - Tengah: Breadcrumb rapi di tengah navbar dengan GeistSlash
// - Kanan: Action bantuan / tools

"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { GeistPanelLeft } from "../navigation/sidebar/lib/GeistIcons";
import { NavbarBreadcrumb } from "./NavbarBreadcrumb";
import { useSidebar } from "../shell/SidebarContext";
import { cn } from "@/lib/Utilitas";

export function Navbar() {
  const { toggleSidebar, isOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-50 grid h-14 w-full grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      {/* Kolom 1 (Kiri): Tombol trigger collapse sidebar (tanpa separator, hanya muncul saat sidebar tertutup) */}
      <div className="z-10 flex min-w-0 items-center overflow-visible">
        {!isOpen && (
          <button
            type="button"
            data-testid="nav-sidebar/sidebar-button"
            aria-label="Buka sidebar"
            title="Buka sidebar (Ctrl+B)"
            onClick={toggleSidebar}
            className={cn(
              "outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none",
              "flex items-center justify-center rounded-md bg-transparent text-foreground",
              "hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors duration-150",
              "p-0 size-8 shrink-0"
            )}
          >
            <span className="truncate px-1.5 inline-flex items-center justify-center shrink-0">
              <GeistPanelLeft size={16} className="size-4 text-foreground" />
            </span>
          </button>
        )}
      </div>

      {/* Kolom 2 (Tengah): Breadcrumb navigasi presisi di tengah navbar */}
      <nav
        aria-label="Breadcrumb"
        className="flex w-full min-w-0 items-center justify-center max-w-full"
      >
        <NavbarBreadcrumb />
      </nav>

      {/* Kolom 3 (Kanan): Tombol Bantuan & Dokumentasi */}
      <div className="flex items-center justify-self-end gap-1.5">
        <Link
          href="/bantuan"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800"
          )}
          title="Pusat Bantuan & Dokumentasi"
        >
          <HelpCircle
            size={16}
            strokeWidth={1.5}
            className="size-4 text-muted-foreground"
          />
          <span>Bantuan</span>
        </Link>
      </div>
    </header>
  );
}
