"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChevronDown,
  CornerDownLeft,
  Monitor,
  Filter,
  LogOut,
  Moon,
  Plus,
  Search,
  SearchX,
  Settings,
  Sun,
  X,
  Gauge,
  MapPin,
  LifeBuoy,
  PenTool,
  Receipt,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut as clientSignOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useRbac } from "@/components/layout/shell/RbacContext";
import {
  isNavFolder,
  type NavGroup,
  type NavItem,
  type NavNode,
} from "@/config/navigasi";
import { getGroupIcon, getItemIcon } from "./sidebar/lib/Icons";
import { GeistAvatar } from "./sidebar/lib/GeistAvatar";

// ============================================================================
// KONSTANTA AKSI CEPAT & KATEGORI MODUL PDAM TIRTAWENING
// ============================================================================

export const QUICK_ACTIONS = [
  {
    id: "act-monitoring-baca",
    label: "Monitoring Baca Meter",
    href: "/cater",
    category: "Pencatatan",
    icon: Gauge,
  },
  {
    id: "act-titik-gps",
    label: "Plot Titik GPS & Geotag",
    href: "/pelanggan/titik-gps",
    category: "Spasial",
    icon: MapPin,
  },
  {
    id: "act-manual-add",
    label: "Input Manual ADD / Taksasi",
    href: "/pelanggan/manual-add",
    category: "Tagihan",
    icon: PenTool,
  },
  {
    id: "act-pengaduan",
    label: "Tiket Pengaduan Layanan",
    href: "/pengaduan",
    category: "Langganan",
    icon: LifeBuoy,
  },
  {
    id: "act-drd",
    label: "Laporan Rekening DRD",
    href: "/laporan/lap-drd",
    category: "Tagihan",
    icon: Receipt,
  },
];

export const NAV_CATEGORIES = [
  { id: "all", label: "Semua Modul" },
  { id: "ikhtisar", label: "Ikhtisar & GIS" },
  { id: "pencatatan-meter", label: "Pencatatan Meter" },
  { id: "tagihan", label: "Tagihan & DRD" },
  { id: "langganan", label: "Langganan & Pelanggan" },
  { id: "import-data", label: "Import & Pemulihan" },
  { id: "setting-landing", label: "Setting Landing" },
  { id: "pengaturan", label: "Pengaturan & RBAC" },
];

const DEFAULT_SEARCH_HREFS: string[] = [
  "/dashboard",
  "/cater",
  "/verifikasi/baca-petugas",
  "/pelanggan/titik-gps",
  "/info-pelanggan",
  "/laporan/lap-drd",
  "/pengaduan",
];

function inisial(nama: string | null, email: string): string {
  const sumber = nama?.trim() || email;
  const kata = sumber.split(/[\s@.]+/).filter(Boolean);
  return (kata[0]?.[0] ?? "?").concat(kata[1]?.[0] ?? "").toUpperCase();
}

function flattenGroupItems(nodes: NavNode[]): NavItem[] {
  const result: NavItem[] = [];
  for (const node of nodes) {
    if (isNavFolder(node)) {
      result.push(...flattenGroupItems(node.children));
    } else {
      result.push(node);
    }
  }
  return result;
}

// ============================================================================
// CONTEXT MOBILE NAV (TERPISAH DARI SIDEBAR DESKTOP)
// ============================================================================

export interface MobileNavUser {
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  roles?: string[];
}

interface MobileNavContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleMenu: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  isFloatingBarHidden: boolean;
  setIsFloatingBarHidden: (hidden: boolean) => void;
  user?: MobileNavUser;
  onKeluar?: () => Promise<void>;
}

const MobileNavContext = React.createContext<MobileNavContextValue | null>(
  null
);

export function useMobileNav() {
  const ctx = React.useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }
  return ctx;
}

export function useMobileNavOptional() {
  return React.useContext(MobileNavContext);
}

export function MobileNavProvider({
  children,
  user,
  onKeluar,
}: {
  children: React.ReactNode;
  user?: MobileNavUser;
  onKeluar?: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [menuState, setMenuState] = React.useState({ pathname, open: false });
  const isOpen = menuState.pathname === pathname && menuState.open;

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      setMenuState({ pathname, open });
    },
    [pathname]
  );

  const toggleMenu = React.useCallback(() => {
    setMenuState((prev) => ({
      pathname,
      open: prev.pathname === pathname ? !prev.open : true,
    }));
  }, [pathname]);

  const [searchState, setSearchState] = React.useState({
    pathname,
    open: false,
  });
  const isSearchOpen = searchState.pathname === pathname && searchState.open;

  const setIsSearchOpen = React.useCallback(
    (open: boolean) => {
      setSearchState({ pathname, open });
    },
    [pathname]
  );

  const openSearch = React.useCallback(() => {
    setIsOpen(false);
    setIsSearchOpen(true);
  }, [setIsOpen, setIsSearchOpen]);

  const closeSearch = React.useCallback(() => {
    setIsSearchOpen(false);
  }, [setIsSearchOpen]);

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [isFloatingBarHidden, setIsFloatingBarHidden] = React.useState(false);

  // Otomatis reset visibilitas floating bar saat pindah rute
  React.useEffect(() => {
    setIsFloatingBarHidden(false);
  }, [pathname]);

  // Tutup dengan tombol Esc
  React.useEffect(() => {
    if (!isOpen && !isSearchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSearchOpen, setIsOpen, setIsSearchOpen]);

  return (
    <MobileNavContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleMenu,
        selectedCategory,
        setSelectedCategory,
        isSearchOpen,
        setIsSearchOpen,
        openSearch,
        closeSearch,
        isFloatingBarHidden,
        setIsFloatingBarHidden,
        user,
        onKeluar,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

// ============================================================================
// FLOATING PILL BAR (Bawah Layar - Persis docs/mobile-nav.tsx)
// ============================================================================

function MobileFloatingBar() {
  const { isOpen, toggleMenu, openSearch, isFloatingBarHidden } = useMobileNav();

  if (isFloatingBarHidden) return null;

  return (
    <div
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 -translate-x-1/2 lg:hidden"
      role="region"
      aria-label="Navigasi mengambang"
    >
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-lg backdrop-blur-md transition-all active:scale-[0.99]">
        {/* Tombol Pencarian: ikon + teks Find */}
        <button
          type="button"
          onClick={openSearch}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-(--ds-gray-100) hover:text-foreground active:scale-95 cursor-pointer"
          aria-label="Cari menu atau halaman (Find)"
        >
          <Search className="size-3.5 shrink-0 stroke-[2]" />
          <span className="text-xs font-semibold tracking-tight">Find</span>
        </button>

        {/* Garis pemisah vertikal tipis */}
        <span aria-hidden className="h-4 w-px bg-border" />

        {/* Tombol Hamburger (dua garis) / X saat terbuka */}
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          className="flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-(--ds-gray-100) active:scale-95 cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <X className="size-4.5 stroke-[2.25]" />
              </motion.div>
            ) : (
              <motion.div
                key="hamburger-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center justify-center gap-1.5"
              >
                <span className="h-[1.75px] w-4.5 rounded-full bg-foreground" />
                <span className="h-[1.75px] w-4.5 rounded-full bg-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MENU PANEL DRAWER (Persis docs/mobile-nav.tsx)
// ============================================================================

function MobileMenuPanel() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { filteredNavGroups } = useRbac();
  const {
    isOpen,
    setIsOpen,
    selectedCategory,
    setSelectedCategory,
    user,
    onKeluar,
  } = useMobileNav();

  const [signingOut, setSigningOut] = React.useState(false);

  const userName = user?.name?.trim() || "Wiska Prayoga";
  const userEmail = user?.email || "wiska.prayoga@gmail.com";
  const userRole = user?.role || "SUPERADMIN";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await clientSignOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
      if (onKeluar) {
        await onKeluar();
      }
      window.location.href = "/login";
    } catch {
      if (onKeluar) {
        await onKeluar();
      }
      window.location.href = "/login";
    } finally {
      setSigningOut(false);
    }
  };

  // Filter grup menu berdasarkan kategori terpilih
  const filteredSections = React.useMemo(() => {
    if (selectedCategory === "all") return filteredNavGroups;
    return filteredNavGroups.filter((sec) => sec.id === selectedCategory);
  }, [filteredNavGroups, selectedCategory]);

  const activeCategoryLabel =
    NAV_CATEGORIES.find((c) => c.id === selectedCategory)?.label ||
    "Semua Modul";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay latar belakang frosted glass (klik untuk menutup) */}
      <motion.div
        key="mobile-nav-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-35 bg-background/55 backdrop-blur-md lg:hidden"
        aria-hidden
      />

      {/* Area Celah Kosong Transparan di Atas: Mengetuk area celah ini akan menutup menu drawer */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-x-0 top-14 h-[20vh] sm:h-[22vh] z-36 cursor-pointer lg:hidden"
        aria-hidden
      />

      {/* Panel Kontainer Drawer: Dimulai tepat di bawah celah kosong */}
      <motion.div
        key="mobile-nav-panel-wrapper"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-x-0 top-[calc(3.5rem+20vh)] sm:top-[calc(3.5rem+22vh)] bottom-0 z-40 flex flex-col lg:hidden overflow-hidden"
      >
        {/* HEADER PEMBATAS TETAP (STATIONARY / DIAM): Pintasan Cepat & Filter Modul */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-transparent z-20">
          {/* Dropdown Pintasan Cepat Operasional */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8.5 flex-1 items-center justify-between rounded-lg border border-border/70 bg-background/85 backdrop-blur-md px-3 text-xs font-medium text-foreground transition-colors hover:bg-(--ds-gray-100) cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">Aksi Cepat</span>
                </div>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 rounded-xl p-1.5 shadow-xl"
            >
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pintasan Operasional PDAM
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {QUICK_ACTIONS.map((act) => (
                <DropdownMenuItem
                  key={act.id}
                  asChild
                  className="cursor-pointer"
                >
                  <Link
                    href={act.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <act.icon className="size-3.5 text-primary shrink-0" />
                      <span className="truncate text-foreground">
                        {act.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal shrink-0">
                      {act.category}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown Filter Modul */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8.5 flex-1 items-center justify-between rounded-lg border border-border/70 bg-background/85 backdrop-blur-md px-3 text-xs font-medium text-foreground transition-colors hover:bg-(--ds-gray-100) cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Filter className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{activeCategoryLabel}</span>
                </div>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl p-1.5 shadow-xl"
            >
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Filter Modul
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NAV_CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs",
                    cat.id === selectedCategory
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="truncate">{cat.label}</span>
                  {cat.id === selectedCategory && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* DAFTAR KONTEN YANG BISA DI-SCROLL (Seamless Frosted Glass Tanpa Border & Invisible Scrollbar) */}
        <div className="no-scrollbar scrollbar-hidden flex-1 overflow-y-auto rounded-t-2xl bg-background/80 backdrop-blur-xl px-4 pt-3 pb-32 overscroll-contain">
          {/* Daftar Navigasi Vertikal */}
          <div className="space-y-3">
            {filteredSections.map((section: NavGroup) => {
              const items = flattenGroupItems(section.items);
              if (items.length === 0) return null;
              const fallbackIcon = getGroupIcon(section.id);

              return (
                <div key={section.id} className="space-y-1">
                  <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <span>{section.title}</span>
                    <span className="h-px flex-1 ml-2 bg-border/40" />
                  </div>

                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(`${item.href}/`));
                      const IconComp = getItemIcon(item.title, fallbackIcon);

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex h-10 w-full items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors",
                              active
                                ? "bg-muted/70 text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                            )}
                          >
                            <IconComp
                              size={18}
                              className="size-4.5 shrink-0"
                            />
                            <span className="truncate flex-1">
                              {item.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Pemisah Bagian Akun Pengguna */}
          <div className="my-3 border-t border-border/80" />

          {/* Blok User: avatar bulat, nama tebal, email, dan badge role */}
          <div className="flex items-center gap-3 px-2 py-1">
            <GeistAvatar
              size={40}
              src={user?.image ?? null}
              initials={inisial(userName, userEmail)}
              alt={userName}
            />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold text-foreground leading-tight">
                {userName}
              </span>
              <span className="truncate text-xs text-muted-foreground leading-tight">
                {userEmail}
              </span>
              <span className="mt-1 inline-flex w-fit items-center rounded-full border border-border bg-(--ds-gray-100) px-2 py-0.5 text-[10px] font-mono font-semibold text-foreground">
                {userRole}
              </span>
            </div>
          </div>

          {/* Garis pemisah */}
          <div className="my-2 border-t border-border/80" />

          {/* Daftar Aksi Akun: LABEL DI KIRI, IKON DI KANAN */}
          <div className="space-y-1">
            {/* Baris 1: Notifikasi */}
            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <span>Notifikasi</span>
              <div className="relative flex items-center justify-center text-muted-foreground">
                <Bell className="size-4.5" />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-(--ds-blue-700) ring-2 ring-background" />
              </div>
            </Link>

            {/* Baris 2: Pengaturan Akun */}
            <Link
              href="/pengaturan/profil"
              onClick={() => setIsOpen(false)}
              className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <span>Pengaturan Akun</span>
              <Settings className="size-4.5 text-muted-foreground" />
            </Link>

            {/* Baris 3: Toggle Tema 3 Segmen (Sistem / Terang / Gelap) */}
            <div className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-foreground">
              <span>Tema Tampilan</span>
              <div
                className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5"
                role="radiogroup"
                aria-label="Pilih tema tampilan"
              >
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  role="radio"
                  aria-checked={theme === "system"}
                  title="Ikuti Sistem"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    theme === "system"
                      ? "bg-background text-foreground shadow-2xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  role="radio"
                  aria-checked={theme === "light"}
                  title="Tema Terang"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    theme === "light"
                      ? "bg-background text-foreground shadow-2xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sun className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  role="radio"
                  aria-checked={theme === "dark"}
                  title="Tema Gelap"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    theme === "dark"
                      ? "bg-background text-foreground shadow-2xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Moon className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Baris 4: Log Out */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex h-10 w-full items-center justify-between rounded-lg px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
            >
              <span>{signingOut ? "Mengeluarkan..." : "Keluar (Log Out)"}</span>
              <LogOut className="size-4.5 shrink-0" />
            </button>
          </div>

          {/* Tombol Aksi Utama Lapangan */}
          <div className="mt-4 px-1">
            <Link
              href="/pelanggan/titik-gps"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-background font-medium text-xs sm:text-sm shadow-xs transition-transform hover:opacity-95 active:scale-[0.99] cursor-pointer"
            >
              Plot Titik GPS &amp; Geotag Pelanggan
            </Link>
          </div>

          {/* Paling bawah: Teks status biru di kiri dan titik biru di kanan */}
          <div className="mt-4 mb-1 flex items-center justify-between px-2 text-xs font-medium text-(--ds-blue-700)">
            <span>Tirtawening Smart Billing • Terhubung</span>
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--ds-blue-500) opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-(--ds-blue-700)" />
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================================
// PANEL PENCARIAN PENUH LAYAR (FIND PANEL - VERCEL MOBILE STYLE)
// ============================================================================

interface MobileSearchItem {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  groupId: string;
  isUser?: boolean;
}

function MobileSearchPanel() {
  const { isSearchOpen, closeSearch, user } = useMobileNav();
  const { filteredNavGroups } = useRbac();
  const router = useRouter();

  const userName = user?.name?.trim() || "Wiska Prayoga";
  const userEmail = user?.email || "wiska.prayoga@gmail.com";

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isSearchOpen]);

  // Siapkan seluruh data rute navigasi yang dapat dicari
  const allItems: MobileSearchItem[] = React.useMemo(() => {
    const list: MobileSearchItem[] = [];
    for (const group of filteredNavGroups) {
      const items = flattenGroupItems(group.items);
      for (const item of items) {
        list.push({
          id: `${group.id}-${item.href}`,
          label: item.title,
          subtitle: `${group.title} • ${item.description}`,
          href: item.href,
          groupId: group.id,
        });
      }
    }

    list.push({
      id: "search-user-profile",
      label: userName,
      subtitle: "Akun Pengguna • Pengaturan Profil",
      href: "/pengaturan/profil",
      groupId: "pengaturan",
      isUser: true,
    });

    return list;
  }, [filteredNavGroups, userName]);

  // Filter hasil pencarian secara real-time
  const results = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return allItems
        .filter(
          (item) => item.isUser || DEFAULT_SEARCH_HREFS.includes(item.href)
        )
        .slice(0, 8);
    }
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        (item.isUser &&
          (userEmail.toLowerCase().includes(q) ||
            "profil".includes(q) ||
            "pengaturan".includes(q)))
    );
  }, [allItems, searchQuery, userEmail]);

  const safeIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));

  const handleSelect = React.useCallback(
    (href: string) => {
      closeSearch();
      router.push(href);
    },
    [closeSearch, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 >= 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[safeIndex]) {
        handleSelect(results[safeIndex].href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    }
  };

  if (!isSearchOpen) return null;

  return (
    <motion.div
      key="mobile-search-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col bg-background text-foreground lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Cepat Halaman"
    >
      {/* Baris Input di Paling Atas */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 px-4 bg-background">
        <Search className="size-4.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari halaman atau modul PDAM…"
          className="h-full flex-1 bg-transparent text-[16px] font-normal text-foreground placeholder:text-muted-foreground/60 outline-none border-none focus:outline-none focus:ring-0"
          autoFocus
        />
        <button
          type="button"
          onClick={closeSearch}
          aria-label="Tutup pencarian"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground active:scale-95 cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Daftar Hasil Vertikal */}
      <div className="no-scrollbar scrollbar-hidden flex-1 overflow-y-auto overscroll-contain p-2 space-y-1">
        {results.length > 0 ? (
          results.map((item, index) => {
            const isSelected = index === safeIndex;
            const fallbackIcon = getGroupIcon(item.groupId);
            const IconComp = getItemIcon(item.label, fallbackIcon);

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item.href)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex min-h-[54px] items-center gap-3 rounded-xl px-3 py-2 transition-colors cursor-pointer select-none",
                  isSelected
                    ? "bg-muted/70 text-foreground"
                    : "text-foreground hover:bg-muted/40"
                )}
              >
                {item.isUser ? (
                  <GeistAvatar
                    size={34}
                    src={user?.image ?? null}
                    initials={inisial(userName, userEmail)}
                    alt={userName}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex size-8.5 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <IconComp size={18} className="size-4.5" />
                  </div>
                )}

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-foreground leading-snug">
                    {item.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground leading-tight">
                    {item.subtitle}
                  </span>
                </div>

                {isSelected && (
                  <CornerDownLeft className="size-4 shrink-0 text-muted-foreground/60 mr-1" />
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground px-4">
            <SearchX className="size-9 mb-2.5 opacity-40 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Coba kata kunci lain atau periksa ejaan menu
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// KOMPONEN UTAMA MOBILE NAV
// ============================================================================

export function MobileNav() {
  const { isFloatingBarHidden } = useMobileNav();

  return (
    <>
      {!isFloatingBarHidden && <MobileFloatingBar />}
      {/* Gradasi Blur Memudar di Bagian Bawah */}
      {!isFloatingBarHidden && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-45 h-20 bg-gradient-to-t from-background via-background/70 to-transparent backdrop-blur-[6px] [mask-image:linear-gradient(to_top,black_30%,transparent)] lg:hidden"
        />
      )}
      <AnimatePresence>
        <MobileMenuPanel />
      </AnimatePresence>
      <AnimatePresence>
        <MobileSearchPanel />
      </AnimatePresence>
    </>
  );
}
