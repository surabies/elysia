// components/layout/navbar/Navbar.tsx
// Navbar workspace: centered breadcrumb on regular pages; DRD controls share
// the breadcrumb row.

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { GeistPanelLeft } from "../navigation/sidebar/lib/GeistIcons";
import { NavbarBreadcrumb } from "./NavbarBreadcrumb";
import { useSidebar } from "../shell/SidebarContext";
import { WorkSwitcher } from "../navigation/sidebar/WorkSwitcher";
import { cn } from "@/lib/Utilitas";

const drdTabs = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "kelurahan", label: "Kelurahan" },
  { id: "domestik", label: "Domestik" },
  { id: "tarif", label: "Tarif" },
  { id: "taa-kelurahan", label: "TAA per kelurahan" },
  { id: "cakupan", label: "Cakupan layanan" },
  { id: "taa", label: "TAA" },
  { id: "tagihan", label: "Tagihan" },
  { id: "pelanggan", label: "Pelanggan" },
] as const;

export function Navbar() {
  const { toggleSidebar, isOpen } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDrdPage = pathname === "/laporan/lap-drd";
  const isVerifikasiPage =
    pathname === "/verifikasi/baca-petugas" ||
    pathname.startsWith("/verifikasi");
  const activeTab = searchParams.get("tab") ?? "ringkasan";
  const period = searchParams.get("periode");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
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

          <nav
            aria-label="Breadcrumb"
            className={cn(
              "flex w-full min-w-0 items-center max-w-full",
              isDrdPage
                ? "flex-wrap justify-between gap-x-3 gap-y-2"
                : "justify-center"
            )}
          >
            <NavbarBreadcrumb />
            {isDrdPage && (
              <div
                id="drd-navbar-controls"
                className="min-w-0 basis-full sm:basis-0 sm:flex-1"
              />
            )}
          </nav>

          {!isDrdPage && (
            <div className="flex min-w-0 items-center justify-self-end gap-1.5">
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
