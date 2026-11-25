"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BookOpen, ExternalLink, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/PengalihTema"
import { UserMenu } from "@/components/layout/navbar/MenuPengguna"
import { useSession } from "@/lib/auth-client"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { docMetas, getAllDocSlugs } from "../config/docsRegistry"
import { cn } from "@/lib/utils"

export function DocsNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [openCommand, setOpenCommand] = React.useState(false)

  // Keyboard shortcut Ctrl+K atau ⌘K untuk membuka Command Palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCommand((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const allSlugs = React.useMemo(() => getAllDocSlugs(), [])

  const handleSelectDoc = (slug: string) => {
    setOpenCommand(false)
    router.push(`/docs/${slug}`)
  }

  const handleSelectPage = (href: string) => {
    setOpenCommand(false)
    router.push(href)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background">
        <div className="flex h-14 w-full items-center justify-between px-6 lg:px-8">
          {/* AREA KIRI: Menu Navigasi Eksklusif (Docs, Dashboard, Analytics, Peta Spasial, Info Pelanggan, KPI) */}
          <div className="flex items-center">
            <nav className="flex items-center gap-4 sm:gap-5 text-sm font-medium">
              <Link
                href="/docs/kpi"
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname.startsWith("/docs")
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Docs
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Analytics
              </Link>
              <Link
                href="/places"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Peta Spasial
              </Link>
              <Link
                href="/info-pelanggan"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Info Pelanggan
              </Link>
              <Link
                href="/kpi"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                KPI
              </Link>
            </nav>
          </div>

          {/* AREA KANAN: Box Search (Bg Grey, No Icon, No Border) | Notifikasi | Toggle Theme | Avatar */}
          <div className="flex items-center gap-3">
            {/* Box Search Mulus: Tanpa icon, placeholder Cari dokumen..., bg grey, no border */}
            <button
              type="button"
              onClick={() => setOpenCommand(true)}
              className="inline-flex h-8 items-center justify-between gap-3 rounded-md border-0 bg-muted/70 hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/60 px-3 text-xs text-muted-foreground w-44 sm:w-56 transition-colors cursor-pointer select-none focus:outline-none"
              title="Cari dokumen... (Tekan ⌘K / Ctrl+K)"
            >
              <span className="truncate font-normal text-muted-foreground/90">
                Cari dokumen...
              </span>
              <kbd className="pointer-events-none hidden h-4.5 select-none items-center gap-0.5 rounded bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </button>

            {/* Tombol Notifikasi */}
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="size-8 text-muted-foreground hover:text-foreground relative"
              title="Notifikasi Sistem"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
              <span className="sr-only">Notifikasi</span>
            </Button>

            {/* Pengalih Tema */}
            <ThemeToggle />

            {/* Avatar Pengguna */}
            <div className="flex items-center">
              <UserMenu
                nama={session?.user?.name ?? null}
                email={session?.user?.email ?? "user@tirtawening.co.id"}
                role={(session?.user as any)?.role ?? (session?.user as any)?.roles?.[0] ?? "STAFF"}
                image={session?.user?.image ?? null}
                variant="navbar"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Modal (Muncul saat Box Search diklik atau Ctrl+K) */}
      <CommandDialog
        open={openCommand}
        onOpenChange={setOpenCommand}
        title="Pusat Pencarian Dokumentasi & Modul"
        description="Ketik kata kunci untuk mencari topik panduan atau membuka halaman sistem."
      >
        <CommandInput placeholder="Ketik nama halaman atau topik panduan..." />
        <CommandList className="max-h-[360px] overflow-y-auto">
          <CommandEmpty>Tidak ada dokumen yang cocok.</CommandEmpty>

          <CommandGroup heading="Dokumentasi Modul Aplikasi">
            {allSlugs.map((slug) => {
              const meta = docMetas[slug]
              if (!meta) return null
              return (
                <CommandItem
                  key={slug}
                  value={`${meta.title} ${meta.categoryTitle} ${meta.description}`}
                  onSelect={() => handleSelectDoc(slug)}
                  className="flex items-center justify-between cursor-pointer py-2.5 px-3"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-3.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-xs text-foreground">
                        {meta.title}
                      </span>
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        {meta.categoryTitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    /docs/{slug}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Akses Cepat Halaman Aplikasi">
            <CommandItem
              onSelect={() => handleSelectPage("/dashboard")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Dashboard Eksekutif</span>
              <span className="text-muted-foreground text-[10px] font-mono">/dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectPage("/analytics")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Analytics &amp; Tren Kubikasi</span>
              <span className="text-muted-foreground text-[10px] font-mono">/analytics</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectPage("/kpi")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Kinerja &amp; Insentif Petugas</span>
              <span className="text-muted-foreground text-[10px] font-mono">/kpi</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectPage("/places")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Peta Spasial GIS</span>
              <span className="text-muted-foreground text-[10px] font-mono">/places</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectPage("/info-pelanggan")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Informasi Pelanggan</span>
              <span className="text-muted-foreground text-[10px] font-mono">/info-pelanggan</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectPage("/cater")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Monitoring Pembacaan (Cater)</span>
              <span className="text-muted-foreground text-[10px] font-mono">/cater</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectPage("/laporan/lap-drd")}
              className="flex items-center justify-between cursor-pointer py-2 px-3 text-xs"
            >
              <span>Laporan Rekening (DRD)</span>
              <span className="text-muted-foreground text-[10px] font-mono">/laporan/lap-drd</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
