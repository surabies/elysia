// components/layout/navbar/MenuPengguna.tsx
// Menu profil akun pengguna sesuai inspeksi Vercel dashboard di docs/SIDEBAR.md:
// - Footer Sidebar:
//   * Baris akun pengguna (Avatar 20px + Nama + '...') sebagai trigger dropdown.
//   * Tidak ada hover background pada baris avatar/nama pengguna.
//   * Hover aktif HANYA pada ikon '...' di ujung kanan.
//   * Posisi dropdown muncul di atas baris footer (side="top", align="start").
//   * Tombol Notifikasi Bell di samping kanan berbentuk lingkaran size-6 rounded-full border (identik dengan '...').
// - Dropdown Menu Avatar:
//   * Tanpa avatar di dalam dropdown.
//   * Panel info akun: Nama dan Email di kiri, icon Setting gear di pojok kanan (menuju /pengaturan).
//   * Item "Pengaturan Akun" di daftar menu dihapus karena sudah ada di pojok kanan panel info akun.
//   * Theme Selector (Segmented pill: Sistem, Terang, Gelap).
//   * Beranda Publik, Catatan Rilis, Bantuan, Dokumentasi, Keluar.
//   * Status indicator "Semua sistem normal" dengan dot hijau.

"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Sun,
  Moon,
  Monitor,
  Home,
  HelpCircle,
  LogOut,
  Settings,
  BookOpen,
  Sparkles,
} from "lucide-react"
import { GeistAvatar } from "../navigation/sidebar/lib/GeistAvatar"
import { GeistMoreDots, GeistBell } from "../navigation/sidebar/lib/GeistIcons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/Utilitas"
import { signOut as clientSignOut } from "@/lib/auth-client"

function inisial(nama: string | null, email: string): string {
  const sumber = nama?.trim() || email
  const kata = sumber.split(/[\s@.]+/).filter(Boolean)
  return (kata[0]?.[0] ?? "?").concat(kata[1]?.[0] ?? "").toUpperCase()
}

export function UserMenu({
  nama,
  email,
  role,
  image,
  onKeluar,
  variant = "sidebar",
}: {
  nama: string | null
  email: string
  role: string
  image: string | null
  onKeluar?: () => Promise<void>
  variant?: "navbar" | "sidebar"
}) {
  const { theme, setTheme } = useTheme()
  const tema = theme ?? "system"
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = React.useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await clientSignOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login"
          },
        },
      })
      if (onKeluar) {
        await onKeluar()
      }
      window.location.href = "/login"
    } catch {
      if (onKeluar) {
        await onKeluar()
      }
      window.location.href = "/login"
    }
  }, [isLoggingOut, onKeluar])

  // Dropdown content sesuai docs/SIDEBAR.md:
  // - Tanpa avatar di dalam dropdown
  // - Panel info akun: Nama + Email di kiri, icon Setting di pojok kanan
  // - Menu "Pengaturan Akun" di daftar item dihapus karena sudah ada di panel info
  const dropdownContent = (
    <DropdownMenuContent
      align={variant === "navbar" ? "end" : "start"}
      side={variant === "sidebar" ? "top" : "bottom"}
      sideOffset={8}
      className="w-64 min-w-64 rounded-xl border border-border bg-popover p-1.5 shadow-2xl text-sm"
    >
      {/* Panel Info Akun: Nama & Email di kiri, Icon Setting di pojok kanan (tanpa avatar) */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-sm font-medium text-foreground leading-tight">
            {nama?.trim() || email}
          </span>
          <span className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
            {email}
          </span>
        </div>
        <Link
          href="/pengaturan"
          aria-label="Pengaturan Akun"
          title="Pengaturan Akun"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 transition-colors"
        >
          <Settings className="size-4" />
        </Link>
      </div>

      <DropdownMenuSeparator className="my-1.5" />

      {/* Item Navigasi Sesuai docs/SIDEBAR.md */}
      <div className="flex flex-col gap-0.5">
        {/* Theme Selector (Segmented Pill Switcher) */}
        <div className="flex h-8 items-center justify-between px-2 rounded-md">
          <span className="text-sm text-foreground">Tema</span>
          <div
            role="radiogroup"
            aria-label="Pilih tema tampilan"
            className="flex h-6.5 items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
          >
            {[
              { value: "system", label: "Sistem", Icon: Monitor },
              { value: "light", label: "Terang", Icon: Sun },
              { value: "dark", label: "Gelap", Icon: Moon },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                aria-label={`Tema ${label.toLowerCase()}`}
                role="radio"
                aria-checked={tema === value}
                title={label}
                onClick={() => setTheme(value)}
                className={cn(
                  "inline-flex size-5.5 items-center justify-center rounded-full transition-colors cursor-pointer",
                  tema === value
                    ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Home Page */}
        <DropdownMenuItem asChild className="h-8 justify-between px-2 rounded-md cursor-pointer">
          <Link href="/" className="flex items-center justify-between w-full">
            <span className="text-sm text-foreground">Beranda Publik</span>
            <Home className="size-3.5 text-muted-foreground" />
          </Link>
        </DropdownMenuItem>

        {/* Changelog / Pembaruan */}
        <DropdownMenuItem asChild className="h-8 justify-between px-2 rounded-md cursor-pointer">
          <Link href="/changelog" className="flex items-center justify-between w-full">
            <span className="text-sm text-foreground">Catatan Rilis</span>
            <Sparkles className="size-3.5 text-muted-foreground" />
          </Link>
        </DropdownMenuItem>

        {/* Help & Support */}
        <DropdownMenuItem asChild className="h-8 justify-between px-2 rounded-md cursor-pointer">
          <Link href="/bantuan" className="flex items-center justify-between w-full">
            <span className="text-sm text-foreground">Bantuan</span>
            <HelpCircle className="size-3.5 text-muted-foreground" />
          </Link>
        </DropdownMenuItem>

        {/* Docs */}
        <DropdownMenuItem asChild className="h-8 justify-between px-2 rounded-md cursor-pointer">
          <Link href="/docs" className="flex items-center justify-between w-full">
            <span className="text-sm text-foreground">Dokumentasi</span>
            <BookOpen className="size-3.5 text-muted-foreground" />
          </Link>
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator className="my-1.5" />

      {/* Log Out */}
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          handleLogout()
        }}
        disabled={isLoggingOut}
        className="h-8 justify-between px-2 rounded-md text-sm text-destructive focus:text-destructive cursor-pointer"
      >
        <span className="flex items-center justify-between w-full">
          <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
          <LogOut className="size-3.5" />
        </span>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1.5" />

      {/* Footer Status "Semua sistem normal" dengan dot hijau sesuai Vercel */}
      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          Semua sistem normal
        </span>
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </DropdownMenuContent>
  )

  // Tampilan versi Navbar (jika dipanggil di navbar)
  if (variant === "navbar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-8 rounded-full p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Menu akun"
          >
            <GeistAvatar
              size={32}
              src={image}
              initials={inisial(nama, email)}
              alt={nama || email}
            />
          </Button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    )
  }

  // Tampilan versi Footer Sidebar 1:1:
  // 1. Trigger adalah seluruh baris flex-1 sehingga posisi dropdown tepat membuka di atas footer sidebar (side="top", align="start").
  // 2. Baris ini bg-transparent TANPA hover background saat kursor diarahkan ke avatar / nama pengguna.
  // 3. Hover active HANYA pada icon '...' di pojok kanan baris (group-hover/row).
  // 4. Tombol Bell notifikasi di sebelah kanan berbentuk lingkaran size-6 rounded-full border (gaya identik dengan '...').
  return (
    <div className="flex items-center w-full gap-1.5">
      {/* Trigger Dropdown: Seluruh baris akun pengguna, posisi dropdown keluar pas di atas baris (side="top", align="start") */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu akun pengguna"
            title="Menu Akun"
            className={cn(
              "group/row relative flex min-w-0 flex-1 items-center gap-2 h-9 bg-transparent cursor-pointer rounded-full transition-colors pl-2.5 pr-1",
              // PENTING: Baris ini TIDAK ADA hover background (avatar & teks tidak ada hover)
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
            )}
          >
            {/* Avatar 20px Geist */}
            <GeistAvatar
              size={20}
              src={image}
              initials={inisial(nama, email)}
              alt={`Avatar for ${nama || email}`}
            />

            {/* Nama Pengguna (tanpa hover bg) */}
            <span className="flex-1 flex items-center min-w-0 text-left">
              <span className="truncate text-sm font-medium text-foreground">
                {nama?.trim() || email}
              </span>
            </span>

            {/* Ikon 3 Titik Lingkaran More: HOVER HANYA AKTIF DI SINI! */}
            <span className="grid place-content-center size-6 shrink-0 rounded-full border border-border bg-card transition-colors text-muted-foreground group-hover/row:bg-neutral-200 dark:group-hover/row:bg-neutral-700 group-hover/row:text-foreground">
              <GeistMoreDots size={12} />
            </span>
          </button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>

      {/* Tombol Bell Notifikasi: Lingkaran size-6 rounded-full border (GAYA IDENTIK DENGAN '...') */}
      <Link
        href="/notifikasi"
        aria-label="Notifikasi"
        title="Lihat notifikasi"
        className={cn(
          "relative grid place-content-center size-6 shrink-0 rounded-full border border-border bg-card cursor-pointer transition-colors",
          "text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        )}
      >
        <GeistBell size={12} className="size-3" />
        <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-blue-500 ring-1 ring-card" />
      </Link>
    </div>
  )
}
