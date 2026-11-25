// components/layout/navbar/Navbar.tsx
// Navbar workspace: centered breadcrumb on regular pages; DRD controls share
// the breadcrumb row.

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HelpCircle, BookOpen } from "lucide-react";
import { GeistPanelLeft } from "../navigation/sidebar/lib/GeistIcons";
import { NavbarBreadcrumb } from "./NavbarBreadcrumb";
import { useSidebar } from "../shell/SidebarContext";
import { WorkSwitcher } from "../navigation/sidebar/WorkSwitcher";
import { cn } from "@/lib/utils";

const drdTabs = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "kelurahan", label: "Kelurahan" },
  { id: "domestik", label: "Domestik" },
  { id: "tarif", label: "Tarif" },
  { id: "taa-kelurahan", label: "TAA" },
  { id: "taa", label: "Detail TAA" },
  { id: "cakupan", label: "Cakupan Layanan" },
  { id: "tagihan", label: "Tagihan" },
  { id: "pelanggan", label: "Pelanggan" },
] as const;

export function Navbar() {
  const { toggleSidebar, isOpen } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDrdPage = pathname === "/laporan/lap-drd";
  const isPengaduanPage = pathname === "/pengaduan";
  const isVerifikasiPage =
    pathname === "/verifikasi/baca-petugas" ||
    pathname.startsWith("/verifikasi");
  const activeTab = searchParams.get("tab") ?? "ringkasan";
  const period = searchParams.get("periode");

  return (
    <header className="shrink-0 sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      {isVerifikasiPage ? (
        <div className="flex h-14 items-center justify-between px-4 gap-3 overflow-visible">
          <div className="flex items-center min-w-0 shrink-0">
            <WorkSwitcher className="h-9 w-auto max-w-72" />
          </div>
          <div
            id="verifikasi-navbar-controls"
            className="flex items-center justify-end gap-1.5 min-w-0 flex-1 overflow-visible"
          />
        </div>
      ) : isPengaduanPage ? (
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 gap-2 overflow-visible">
          {!isOpen && (
            <button
              type="button"
              data-testid="nav-sidebar/sidebar-button"
              aria-label="Buka sidebar"
              title="Buka sidebar (Ctrl+B)"
              onClick={toggleSidebar}
              className={cn(
                "outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none",
                "hidden lg:flex items-center justify-center rounded-md bg-transparent text-foreground",
                "hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200) transition-colors duration-150",
                "p-0 size-8 shrink-0"
              )}
            >
              <span className="truncate px-1.5 inline-flex items-center justify-center shrink-0">
                <GeistPanelLeft size={16} className="size-4 text-foreground" />
              </span>
            </button>
          )}
          <div
            id="pengaduan-navbar-controls"
            className="flex items-center justify-between gap-2 min-w-0 flex-1 overflow-visible"
          />
        </div>
      ) : (
        <div
          className={cn(
            "grid h-14 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center px-4",
            isDrdPage &&
              "min-h-14 h-auto grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 py-2"
          )}
        >
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
                  "hidden lg:flex items-center justify-center rounded-md bg-transparent text-foreground",
                  "hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200) transition-colors duration-150",
                  "p-0 size-8 shrink-0"
                )}
              >
                <span className="truncate px-1.5 inline-flex items-center justify-center shrink-0">
                  <GeistPanelLeft size={16} className="size-4 text-foreground" />
                </span>
              </button>
            )}
          </div>

          <nav
            aria-label="Breadcrumb"
            className={cn(
              "flex w-full min-w-0 items-center max-w-full",
              isDrdPage
                ? "justify-between gap-x-3"
                : "justify-center"
            )}
          >
            <NavbarBreadcrumb />
            {isDrdPage && (
              <div
                id="drd-navbar-controls"
                className="min-w-0 flex-1 flex items-center justify-end"
              />
            )}
          </nav>

          {!isDrdPage && (
            <div className="flex min-w-0 items-center justify-self-end gap-1.5">
              <Link
                href="/docs"
                className={cn(
                  "group relative inline-flex h-7 items-center gap-1.5 rounded-full border border-border/80 bg-gradient-to-b from-card to-muted/20 px-2.5 text-xs text-foreground/90 shadow-2xs backdrop-blur-md transition-all duration-200",
                  "hover:border-foreground/30 hover:bg-muted/60 hover:text-foreground hover:shadow-xs",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
                title="Pusat Dokumentasi & Panduan Aplikasi (Docs)"
              >
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                </span>
                <BookOpen
                  size={13}
                  strokeWidth={1.75}
                  className="text-muted-foreground transition-colors group-hover:text-foreground"
                />
                <span className="font-medium text-[11px] tracking-tight">
                  Dokumentasi
                </span>
                <span className="hidden sm:inline-flex items-center rounded border border-border/70 bg-muted/50 px-1 text-[9px] font-mono text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
                  Docs
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      {isDrdPage && (
        <>
          <nav
            aria-label="Bagian laporan DRD"
            className="overflow-x-auto px-3 sm:px-4"
          >
            <ul className="flex h-10 min-w-max items-stretch gap-1">
              {drdTabs.map(({ id, label }) => {
                const params = new URLSearchParams({ tab: id });
                if (period) params.set("periode", period);
                const isActive = id === activeTab;

                return (
                  <li key={id} className="flex">
                    <Link
                      href={`/laporan/lap-drd?${params.toString()}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center border-b-2 px-3 text-xs font-medium transition-colors sm:text-sm",
                        isActive
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
