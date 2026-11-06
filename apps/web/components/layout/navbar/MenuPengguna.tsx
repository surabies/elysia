"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Sun,
  Moon,
  Monitor,
  LayoutDashboard,
  Home,
  HelpCircle,
  LogOut,
  Settings,
  MoreHorizontal,
  Bell,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/Utilitas"

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
  onKeluar: () => Promise<void>
  variant?: "navbar" | "sidebar"
}) {
  const { theme, setTheme } = useTheme()
  const tema = theme ?? "system"

  // Dropdown content yang dipakai bersama
  const dropdownContent = (
    <DropdownMenuContent
      align={variant === "navbar" ? "end" : "start"}
      side={variant === "sidebar" ? "top" : "bottom"}
      sideOffset={8}
      className="w-68 min-w-68 rounded-lg border border-border bg-popover p-1.5 shadow-xl"
    >
      <DropdownMenuLabel className="flex min-h-16 items-center gap-3 rounded-md px-2.5 py-2 font-normal">
        <Avatar className="size-10 rounded-full ring-1 ring-border shrink-0">
          {image && <AvatarImage src={image} alt="" className="rounded-full" />}
          <AvatarFallback className="text-xs font-medium rounded-full">
            {inisial(nama, email)}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {nama?.trim() || email}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {role.replaceAll("_", " ")}
          </span>
        </span>
        {role === "SUPER_ADMIN" && (
          <DropdownMenuItem
            asChild
            className="size-8 shrink-0 justify-center rounded-md p-0 text-muted-foreground"
          >
            <Link
              href="/admin/pengaturan"
              aria-label="Pengaturan"
              title="Pengaturan"
            >
              <Settings
                size={16}
                strokeWidth={1.5}
                className="size-4"
              />
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="my-1.5" />
      <div className="flex h-10 items-center justify-between gap-2 px-2.5">
        <span className="text-sm text-foreground">Tema</span>
        <div
          role="radiogroup"
          aria-label="Pilih tema"
          className="flex h-8 items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5"
        >
          {[
            { value: "light", label: "Terang", Icon: Sun },
            { value: "system", label: "Sistem", Icon: Monitor },
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
              className={`inline-flex size-6.5 items-center justify-center rounded-sm transition-colors ${
                tema === value
                  ? "bg-background text-foreground shadow-xs ring-1 ring-border/70"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
            >
              <Icon
                size={14}
                strokeWidth={1.5}
                className="size-3.5"
              />
            </button>
          ))}
        </div>
      </div>
      <DropdownMenuSeparator className="my-1.5" />
      <DropdownMenuGroup className="space-y-0.5">
        <DropdownMenuItem
          asChild
          className="h-10 justify-between px-2.5 text-sm font-normal"
        >
          <Link href="/dashboard">
            <span>Dashboard</span>
            <LayoutDashboard
              size={16}
              strokeWidth={1.5}
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="h-10 justify-between px-2.5 text-sm font-normal"
        >
          <Link href="/">
            <span>Beranda publik</span>
            <Home
              size={16}
              strokeWidth={1.5}
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="h-10 justify-between px-2.5 text-sm font-normal"
        >
          <Link href="/bantuan">
            <span>Bantuan</span>
            <HelpCircle
              size={16}
              strokeWidth={1.5}
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator className="my-1.5" />
      <form action={onKeluar}>
        <DropdownMenuItem
          asChild
          className="h-10 justify-between px-2.5 text-sm font-normal text-destructive focus:text-destructive"
        >
          <button type="submit" className="w-full">
            <span>Keluar</span>
            <LogOut
              size={16}
              strokeWidth={1.5}
              className="size-4"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuItem>
      </form>
    </DropdownMenuContent>
  )

  // Tampilan versi Navbar (jika dipanggil di navbar)
  if (variant === "navbar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-9 rounded-full p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Menu akun"
          >
            <Avatar className="size-9 rounded-full ring-1 ring-border">
              {image && <AvatarImage src={image} alt="" className="rounded-full" />}
              <AvatarFallback className="text-xs font-medium rounded-full">
                {inisial(nama, email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    )
  }

  // Tampilan versi Footer Sidebar:
  // Kiri: Avatar + Nama (Link ke pengaturan akun)
  // Kanan: Tombol Notifikasi/Bell + Tombol Arrow Trigger Dropdown
  return (
    <div className="flex h-11 w-full items-center justify-between gap-1">
      {/* Kiri: Info Profil Akun Pengguna */}
      <Link
        href="/pengaturan"
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors",
          "hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
        title="Pengaturan Akun"
      >
        <Avatar className="size-7.5 rounded-full ring-1 ring-border shrink-0">
          {image && <AvatarImage src={image} alt="" className="rounded-full" />}
          <AvatarFallback className="text-[11px] font-medium rounded-full">
            {inisial(nama, email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-semibold text-foreground leading-none">
            {nama?.trim() || email}
          </span>
          <span className="truncate text-[10px] text-muted-foreground uppercase leading-tight mt-0.5">
            {role.replaceAll("_", " ")}
          </span>
        </div>
      </Link>

      {/* Trigger Dropdown khusus pada icon (...) di sebelah kiri Bell */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu akun"
            title="Buka menu akun"
            className={cn(
              "flex size-7.5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
              "hover:bg-[#F2F2F2] hover:text-foreground dark:hover:bg-[#1A1A1A]",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
          >
            <MoreHorizontal size={15} strokeWidth={1.5} className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>

      {/* Icon Notifikasi/Bell di sebelah paling kanan */}
      <Link
        href="/notifikasi"
        aria-label="Lihat notifikasi"
        title="Notifikasi"
        className={cn(
          "relative flex size-7.5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-[#F2F2F2] hover:text-foreground dark:hover:bg-[#1A1A1A]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        <Bell size={15} strokeWidth={1.5} className="size-3.5" />
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blue-500" />
      </Link>
    </div>
  )
}
