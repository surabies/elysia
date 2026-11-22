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

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { GeistChevronsUpDown } from "./lib/GeistIcons";
import { IconTile } from "@/components/reui/icon-tile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type OperationalWorkspace = {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  shortcut: string;
  keyNumber: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const OPERATIONAL_WORKSPACES: OperationalWorkspace[] = [
  {
    id: "pusat-komando",
    name: "Ringkasan",
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
];

export function WorkSwitcher({ className }: { className?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  // Deteksi ruang kerja aktif berdasarkan URL rute saat ini
  const activeWorkspace = React.useMemo(() => {
    if (pathname.startsWith("/verifikasi/baca-petugas")) {
      return OPERATIONAL_WORKSPACES[2]; // Verifikasi Petugas
    }
    if (
      pathname.startsWith("/verifikasi/baca-pelanggan") ||
      pathname.startsWith("/stand-konsumen")
    ) {
      return OPERATIONAL_WORKSPACES[3]; // Verifikasi Mandiri
    }
    if (pathname.startsWith("/verifikasi")) {
      return OPERATIONAL_WORKSPACES[2]; // Verifikasi Petugas fallback
    }
    if (
      pathname.startsWith("/cater") ||
      pathname.startsWith("/progres/cater")
    ) {
      return OPERATIONAL_WORKSPACES[1]; // Catat Meter Lapangan
    }
    if (
      pathname.startsWith("/progres/ekstrim") ||
      pathname.startsWith("/progres/koreksi") ||
      pathname.startsWith("/progres/nol") ||
      pathname.startsWith("/progres/turun") ||
      pathname.startsWith("/meter")
    ) {
      return OPERATIONAL_WORKSPACES[2]; // Verifikasi Petugas (Anomali & Stand)
    }
    if (
      pathname.startsWith("/laporan/lap-drd") ||
      pathname.startsWith("/tools-tutup")
    ) {
      return OPERATIONAL_WORKSPACES[4]; // Billing & Rekening DRD
    }
    if (
      pathname.startsWith("/pengaduan") ||
      pathname.startsWith("/cater/ganti-meter")
    ) {
      return OPERATIONAL_WORKSPACES[5]; // Pengaduan & GWM
    }
    if (
      pathname.startsWith("/pelanggan") ||
      pathname.startsWith("/peta-wilayah") ||
      pathname.startsWith("/master")
    ) {
      return OPERATIONAL_WORKSPACES[6]; // Master Pelanggan & GIS
    }
    // Default Ringkasan: Pusat Komando
    return OPERATIONAL_WORKSPACES[0];
  }, [pathname]);

  // Keyboard shortcut listener: Alt+1 s/d Alt+7 (atau Option+1..7 di macOS)
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const found = OPERATIONAL_WORKSPACES.find(
          (ws) => ws.keyNumber === event.key,
        );
        if (found) {
          event.preventDefault();
          setOpen(false);
          router.push(found.href);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const ActiveIcon = activeWorkspace.icon;

  return (
    <div className={cn("flex h-10 w-full flex-row items-center", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Pilih Ruang Kerja Operasional"
            title="Pilih Ruang Kerja Operasional (Pintasan: ⌥1 - ⌥7)"
            className={cn(
              "group/scope relative flex h-full w-full items-center select-none min-w-0 text-sm rounded-md bg-transparent cursor-pointer pl-2 pr-1 transition-colors hover:bg-sidebar-accent/50",
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
            )}
          >
            {/* Avatar IconTile Geist dengan Icon Ruang Kerja Aktif */}
            <IconTile
              size="xs"
              variant="outline"
              className="border-border bg-background text-foreground shrink-0"
            >
              <ActiveIcon className="size-3.5 text-foreground" />
            </IconTile>

            {/* Nama Ruang Kerja + Badge Tag */}
            <span className="flex-1 flex flex-row items-center gap-1.5 min-w-0 text-left ml-2">
              <span
                data-label-text="true"
                className="block min-w-0 truncate text-sm font-medium text-foreground tracking-tight"
              >
                {activeWorkspace.name}
              </span>
              <span
                data-testid="scope-switcher/scope-badge"
                className="inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap py-0.5 font-medium tabular-nums text-[10px] tracking-[0.2px] h-4 px-1.5 bg-muted text-muted-foreground border border-border"
              >
                {activeWorkspace.tag}
              </span>
            </span>

            {/* Tombol icon chevron arrow di pojok kanan */}
            <span className="grid shrink-0 place-content-center size-7 rounded-md transition-colors text-muted-foreground group-hover/scope:bg-accent group-hover/scope:text-accent-foreground">
              <GeistChevronsUpDown size={16} className="size-4" />
            </span>
          </button>
        </DropdownMenuTrigger>

        {/* Dropdown Menu Popup: Lebar 300px elegan dengan Geist tokens */}
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-80 min-w-80 max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl text-sm"
        >
          {/* Header Panel Info: Nama Ruang Kerja & Setting */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-b border-border pb-2 mb-1.5">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-foreground tracking-tight">
                  Ruang Kerja Operasional
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium border border-primary/20">
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
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="size-3.5" />
            </Link>
          </div>

          {/* Daftar 7 Ruang Kerja Operasional */}
          <div className="flex flex-col gap-1">
            {OPERATIONAL_WORKSPACES.map((ws) => {
              const Icon = ws.icon;
              const isActive = ws.id === activeWorkspace.id;

              return (
                <DropdownMenuItem
                  key={ws.id}
                  asChild
                  onSelect={() => setOpen(false)}
                  className={cn(
                    "cursor-pointer p-2 rounded-lg transition-colors group/item focus:bg-accent focus:text-accent-foreground",
                    isActive
                      ? "bg-accent/80 text-accent-foreground font-medium"
                      : "hover:bg-accent/50 text-foreground",
                  )}
                >
                  <Link
                    href={ws.href}
                    className="flex w-full items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <IconTile
                        size="sm"
                        variant={isActive ? "solid" : "frame"}
                        className={cn(
                          "transition-colors shrink-0",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs [&_svg]:text-primary-foreground!"
                            : "text-muted-foreground group-hover/item:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary-foreground!"
                              : "text-muted-foreground group-hover/item:text-foreground",
                          )}
                        />
                      </IconTile>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-medium text-foreground leading-snug">
                          {ws.name}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground leading-snug">
                          {ws.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      {isActive && (
                        <Check className="size-3.5 text-primary shrink-0" />
                      )}
                      <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded border border-border bg-muted/50 font-mono text-[10px] text-muted-foreground tabular-nums">
                        {ws.shortcut}
                      </kbd>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-border" />

          {/* Pintasan Tambahan: Panel Analitik & Kinerja */}
          <div className="flex flex-col gap-0.5">
            <DropdownMenuItem
              asChild
              onSelect={() => setOpen(false)}
              className="cursor-pointer p-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-colors"
            >
              <Link
                href="/analytics"
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2.5">
                  <IconTile size="xs" variant="soft" className="text-primary">
                    <BarChart3 className="text-primary" />
                  </IconTile>
                  <span className="text-xs font-medium text-foreground">
                    Panel Analitik & Kinerja
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 font-mono">
                  Buka →
                </span>
              </Link>
            </DropdownMenuItem>
          </div>

          {/* Footer Petunjuk Cepat */}
          <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Pintasan Cepat:</span>
            <span className="font-mono text-foreground font-medium">
              Alt + [1 - 7]
            </span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
