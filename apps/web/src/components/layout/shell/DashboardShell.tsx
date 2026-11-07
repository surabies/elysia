"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/Utilitas";
import {
  useSidebar,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
} from "./SidebarContext";
import { WorkSwitcher } from "../navigation/sidebar/WorkSwitcher";
import { SidebarSearch } from "../navigation/sidebar/SidebarSearch";
import { SidebarNav } from "../navigation/SidebarNav";
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
    setIsOpen,
    toggleSidebar,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
  } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
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

  // Tutup sidebar otomatis di mobile setelah pengguna klik/pindah halaman
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  // Escape key untuk menutup sidebar mobile
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setIsOpen]);

  const userRoles = React.useMemo(() => {
    if (user?.roles && user.roles.length > 0) return user.roles;
    if (user?.role) return [user.role];
    return [];
  }, [user?.roles, user?.role]);

  return (
    <RbacProvider roles={userRoles}>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Lompat ke konten untuk navigasi aksesibilitas */}
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className={cn(
          "sr-only focus-visible:not-sr-only",
          "focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50",
          "focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2",
          "focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-xs",
          "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
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
          style={{
            width: isOpen ? "var(--sidebar-width, 256px)" : undefined,
            minWidth: isOpen ? "var(--sidebar-width, 256px)" : undefined,
          }}
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-border bg-sidebar lg:relative",
            isResizing || !mounted
              ? "transition-none select-none"
              : "transition-[width,transform,opacity] duration-200 ease-in-out",
            isOpen
              ? "shrink-0 translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none lg:w-0 lg:min-w-0 lg:translate-x-0 lg:overflow-hidden lg:border-none",
          )}
        >
          {/* Header Sidebar: Work-Switcher & Kotak Pencarian (sesuai inspeksi Vercel: header pt-1 px-2) */}
          <header className="relative flex shrink-0 flex-col gap-1 pt-1">
            <div className="flex flex-row py-1 px-2">
              <WorkSwitcher />
            </div>
            <div className="flex flex-row px-2">
              <SidebarSearch />
            </div>
          </header>

          {/* Body Sidebar: Hirarki Menu Navigasi (sesuai inspeksi Vercel: px-2 pt-2.5) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-2.5 pb-2 overscroll-contain">
            <SidebarNav />
          </div>

          {/* Footer Sidebar: Avatar akun pengguna & icon notifikasi (sesuai inspeksi Vercel: section gap-2 p-2) */}
          <section className="flex flex-col gap-2 shrink-0 mt-auto">
            <div className="p-2">
              <UserMenu
                nama={user?.name ?? "Wiska Prayoga"}
                email={user?.email ?? "wiska.prayoga@gmail.com"}
                image={user?.image ?? null}
                role={user?.role ?? "SUPER_ADMIN"}
                onKeluar={onKeluar}
                variant="sidebar"
              />
            </div>
          </section>

          {/* Resize Handle di Border Kanan Sidebar sesuai docs/SIDEBAR.md (rail disembunyikan sesuai permintaan) */}
          <div
            aria-hidden="true"
            onMouseDown={handleMouseDown}
            className="group/handle hidden lg:block absolute top-0 -right-2 h-full w-4 cursor-col-resize z-50 select-none"
          >
            {/* Tombol Collapse di tengah handle */}
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
              <GeistChevronLeft size={14} className="size-3.5 text-muted-foreground" />
            </button>
          </div>
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
    </RbacProvider>
  );
}
