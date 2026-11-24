"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  useSidebar,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
} from "./SidebarContext";
import { WorkSwitcher } from "../navigation/sidebar/WorkSwitcher";
import { SidebarSearch } from "../navigation/sidebar/SidebarSearch";
import { SidebarNav } from "../navigation/SidebarNav";
import { MobileNav, MobileNavProvider } from "../navigation/MobileNav";
import { GeistChevronLeft } from "../navigation/sidebar/lib/GeistIcons";
import { UserMenu } from "../navbar/MenuPengguna";
import { Navbar } from "../navbar/Navbar";
import { MAIN_CONTENT_ID } from "./KonstantaDashboardShell";
import { RbacProvider } from "./RbacContext";

export { MAIN_CONTENT_ID } from "./KonstantaDashboardShell";

export type DashboardShellProps = {
  children: ReactNode;
  tanpaSidebar?: boolean;
  tanpaCard?: boolean;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    roles?: string[];
  };
  onKeluar?: () => Promise<void>;
};

export function DashboardShell({
  children,
  tanpaSidebar = false,
  user,
  onKeluar = async () => {},
}: DashboardShellProps) {
  const {
    isOpen,
    toggleSidebar,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
  } = useSidebar();
  const [transitionsReady, setTransitionsReady] = React.useState(false);

  React.useEffect(() => {
    // Tunda pengaktifan transisi CSS 150ms setelah mount agar initial render / reload
    // sama sekali tidak memicu kedipan / animasi membuka-menutup (Zero Flash)
    const timer = setTimeout(() => {
      setTransitionsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle dragging untuk resize sidebar (desktop only)
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Hanya klik kiri
      e.preventDefault();

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(MAX_SIDEBAR_WIDTH, moveEvent.clientX)
        );
        setSidebarWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [setIsResizing, setSidebarWidth]
  );

  // Cegah window terangkat ke atas jika terjadi auto-scroll fokus browser
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userRoles = React.useMemo(() => {
    if (user?.roles && user.roles.length > 0) return user.roles;
    if (user?.role) return [user.role];
    return [];
  }, [user?.roles, user?.role]);

  return (
    <RbacProvider roles={userRoles}>
      <MobileNavProvider user={user} onKeluar={onKeluar}>
        <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-background overscroll-none">
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

          {/* PANEL KIRI DESKTOP (hidden di mobile < lg, sehingga saat Ctrl+Shift+I ke mobile tidak pernah auto-terbuka & state desktop tetap utuh!) */}
          {!tanpaSidebar && (
            <aside
              aria-label="Navigasi modul desktop"
              style={{
                width: isOpen ? `${sidebarWidth}px` : undefined,
                minWidth: isOpen ? `${sidebarWidth}px` : undefined,
              }}
              className={cn(
                "hidden lg:flex lg:relative lg:h-full lg:shrink-0 flex-col border-r border-border bg-sidebar",
                isResizing || !transitionsReady
                  ? "transition-none select-none"
                  : "transition-[width,opacity] duration-200 ease-in-out",
                isOpen
                  ? "shrink-0 opacity-100"
                  : "lg:w-0 lg:min-w-0 lg:overflow-hidden lg:border-none opacity-0 pointer-events-none"
              )}
            >
              {/* Header Sidebar: Work-Switcher & Kotak Pencarian */}
              <header className="relative flex shrink-0 flex-col gap-1 pt-1">
                <div className="flex flex-row py-1 px-2">
                  <WorkSwitcher />
                </div>
                <div className="flex flex-row px-2">
                  <SidebarSearch />
                </div>
              </header>

              {/* Body Sidebar: Hirarki Menu Navigasi */}
              <div className="sidebar-scroll relative flex-1 min-h-0 overflow-y-auto px-2 pt-2.5 pb-8 overscroll-contain">
                <SidebarNav />
              </div>

              {/* Footer Sidebar: Avatar akun pengguna & icon notifikasi */}
              <section className="relative z-20 flex flex-col shrink-0 mt-auto bg-sidebar/85 backdrop-blur-md border-t border-border/40">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-sidebar via-sidebar/75 to-transparent"
                />
                <div className="p-2">
                  <UserMenu
                    nama={user?.name ?? "Wiska Prayoga"}
                    email={user?.email ?? "wiska.prayoga@gmail.com"}
                    image={user?.image ?? null}
                    role={user?.role ?? "SUPERADMIN"}
                    onKeluar={onKeluar}
                    variant="sidebar"
                  />
                </div>
              </section>

              {/* Resize Handle di Border Kanan Sidebar */}
              <div
                aria-hidden="true"
                onMouseDown={handleMouseDown}
                className="group/handle hidden lg:block absolute top-0 -right-2 h-full w-4 cursor-col-resize z-50 select-none"
              >
                <button
                  type="button"
                  aria-label="Tutup sidebar"
                  title="Tutup sidebar (Ctrl+B)"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSidebar();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    "size-6 rounded-full border border-border bg-card",
                    "grid place-content-center cursor-pointer transition-opacity duration-150",
                    "opacity-0 group-hover/handle:opacity-100 shadow-xs",
                    "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800",
                    isResizing && "!opacity-0 pointer-events-none"
                  )}
                >
                  <GeistChevronLeft
                    size={14}
                    className="size-3.5 text-muted-foreground"
                  />
                </button>
              </div>
            </aside>
          )}

          {/* PANEL KANAN: Navbar di atas dan Konten Utama di bawah */}
          <div className="flex flex-1 min-w-0 flex-col h-full overflow-hidden">
            <Navbar />

            <main
              id={MAIN_CONTENT_ID}
              tabIndex={-1}
              className="flex flex-1 min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain focus:outline-none bg-background"
            >
              {children}
            </main>
          </div>

          {/* NAVIGASI KHUSUS MOBILE (Floating Pill Find + Hamburger, Menu Sheet, & Find Panel) */}
          {!tanpaSidebar && <MobileNav />}
        </div>
      </MobileNavProvider>
    </RbacProvider>
  );
}
