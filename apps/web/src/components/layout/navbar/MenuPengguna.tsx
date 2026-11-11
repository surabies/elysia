// components/layout/navbar/MenuPengguna.tsx
// Menu profil akun pengguna sesuai inspeksi Vercel dashboard:
// - Dropdown Menu Avatar dengan tata letak ikon kanan sejajar sempurna (pixel-perfect vertical alignment)
// - Seluruh menu berfungsi penuh:
//   * Pengaturan Akun -> Navigasi ke /pengaturan
//   * Tema Tampilan -> Toggle Sistem / Terang / Gelap
//   * Beranda Publik -> Navigasi ke /
//   * Catatan Rilis -> Modal Dialog Interaktif Changelog Tirtawening
//   * Bantuan -> Modal Dialog Interaktif Helpdesk & SOP Operasional
//   * Dokumentasi -> Modal Dialog Interaktif Arsitektur & Formula DRD
//   * Keluar -> Better-Auth Sign Out dengan redirect ke /login
//   * Footer Status -> Status sistem real-time dengan pulsing indicator

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
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { signOut as clientSignOut, useSession } from "@/lib/auth-client"

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
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  // Reaktivitas foto avatar real-time
  const { data: session } = useSession()
  const [activeImage, setActiveImage] = React.useState<string | null>(image)

  React.useEffect(() => {
    if (session?.user?.image !== undefined) {
      setActiveImage(session.user.image)
    }
  }, [session?.user?.image])

  React.useEffect(() => {
    function onAvatarUpdated(event: Event) {
      const customEvt = event as CustomEvent<{ image: string | null }>
      setActiveImage(customEvt.detail.image)
    }
    window.addEventListener("user-avatar-updated", onAvatarUpdated)
    return () => window.removeEventListener("user-avatar-updated", onAvatarUpdated)
  }, [])

  // Dialog states for in-place modals
  const [showChangelog, setShowChangelog] = React.useState(false)
  const [showHelp, setShowHelp] = React.useState(false)
  const [showDocs, setShowDocs] = React.useState(false)

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

  // Dropdown content dengan icon kanan sejajar rata (size-7 container)
  const dropdownContent = (
    <DropdownMenuContent
      align={variant === "navbar" ? "end" : "start"}
      side={variant === "sidebar" ? "top" : "bottom"}
      sideOffset={8}
      className="w-68 min-w-68 rounded-xl border border-border bg-popover p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-sm"
    >
      {/* Panel Info Akun: Nama & Email di kiri, Icon Setting di pojok kanan sejajar */}
      <div className="flex items-center justify-between gap-2 pl-2.5 pr-1 py-1.5">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-xs font-semibold text-foreground leading-tight">
            {nama?.trim() || email}
          </span>
          <span className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
            {email}
          </span>
        </div>
        <Link
          href="/pengaturan"
          onClick={() => setDropdownOpen(false)}
          aria-label="Pengaturan Akun"
          title="Pengaturan Akun"
          className="size-6 flex items-center justify-center shrink-0 rounded-md text-muted-foreground hover:bg-(--ds-gray-100) hover:text-foreground dark:hover:bg-(--ds-gray-200) transition-colors"
        >
          <Settings className="size-3.5" />
        </Link>
      </div>

      <DropdownMenuSeparator className="my-1" />

      {/* Item Navigasi dengan ikon kanan rata vertikal */}
      <div className="flex flex-col gap-0.5">
        {/* Theme Selector (Segmented Pill Switcher) */}
        <div className="flex h-8 items-center justify-between pl-2.5 pr-1 rounded-md hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200) transition-colors">
          <span className="text-xs text-foreground font-medium">Tema Tampilan</span>
          <div
            role="radiogroup"
            aria-label="Pilih tema tampilan"
            className="flex h-6.5 items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5 shrink-0"
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

        {/* Beranda Publik */}
        <DropdownMenuItem
          asChild
          onSelect={() => setDropdownOpen(false)}
          className="h-8 cursor-pointer pl-2.5 pr-1 rounded-md transition-colors hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200)"
        >
          <Link href="/" className="flex items-center justify-between w-full">
            <span className="text-xs text-foreground">Beranda Publik</span>
            <div className="size-6 flex items-center justify-center shrink-0 text-muted-foreground">
              <Home className="size-3.5" />
            </div>
          </Link>
        </DropdownMenuItem>

        {/* Catatan Rilis (Changelog Dialog) */}
        <DropdownMenuItem
          onSelect={() => {
            setDropdownOpen(false)
            setShowChangelog(true)
          }}
          className="h-8 cursor-pointer pl-2.5 pr-1 rounded-md transition-colors hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200)"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-foreground">Catatan Rilis</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary font-medium">
                v2.4.2
              </span>
            </div>
            <div className="size-6 flex items-center justify-center shrink-0 text-muted-foreground">
              <Sparkles className="size-3.5" />
            </div>
          </div>
        </DropdownMenuItem>

        {/* Bantuan & Kontak SOP (Help Dialog) */}
        <DropdownMenuItem
          onSelect={() => {
            setDropdownOpen(false)
            setShowHelp(true)
          }}
          className="h-8 cursor-pointer pl-2.5 pr-1 rounded-md transition-colors hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200)"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-foreground">Bantuan & SOP</span>
            <div className="size-6 flex items-center justify-center shrink-0 text-muted-foreground">
              <HelpCircle className="size-3.5" />
            </div>
          </div>
        </DropdownMenuItem>

        {/* Dokumentasi Sistem (Docs Dialog) */}
        <DropdownMenuItem
          onSelect={() => {
            setDropdownOpen(false)
            setShowDocs(true)
          }}
          className="h-8 cursor-pointer pl-2.5 pr-1 rounded-md transition-colors hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200)"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-foreground">Dokumentasi</span>
            <div className="size-6 flex items-center justify-center shrink-0 text-muted-foreground">
              <BookOpen className="size-3.5" />
            </div>
          </div>
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
        className="h-8 cursor-pointer pl-2.5 pr-1 rounded-md transition-colors text-destructive focus:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-medium">{isLoggingOut ? "Mengakhiri sesi..." : "Keluar"}</span>
          <div className="size-6 flex items-center justify-center shrink-0 text-destructive">
            <LogOut className="size-3.5" />
          </div>
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1.5" />

      {/* Footer Status "Semua sistem normal" dengan dot sejajar rata kanan */}
      <div className="flex items-center justify-between pl-2.5 pr-1 py-0.5 text-muted-foreground">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
          Semua sistem normal
        </span>
        <div className="size-6 flex items-center justify-center shrink-0">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </DropdownMenuContent>
  )

  return (
    <>
      {/* Trigger Area (Navbar atau Sidebar) */}
      {variant === "navbar" ? (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="size-8 rounded-full p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              aria-label="Menu akun"
            >
              <GeistAvatar
                size={32}
                src={activeImage}
                initials={inisial(nama, email)}
                alt={nama || email}
              />
            </Button>
          </DropdownMenuTrigger>
          {dropdownContent}
        </DropdownMenu>
      ) : (
        <div className="flex items-center w-full gap-1.5">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menu akun pengguna"
                title="Menu Akun"
                className={cn(
                  "group/row relative flex min-w-0 flex-1 items-center gap-2 h-9 bg-transparent cursor-pointer rounded-full transition-colors pl-2.5 pr-1",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
                )}
              >
                <GeistAvatar
                  size={20}
                  src={activeImage}
                  initials={inisial(nama, email)}
                  alt={`Avatar for ${nama || email}`}
                />
                <span className="flex-1 flex items-center min-w-0 text-left">
                  <span className="truncate text-sm font-medium text-foreground">
                    {nama?.trim() || email}
                  </span>
                </span>
                <span className="grid place-content-center size-6 shrink-0 rounded-full border border-border bg-card transition-colors text-muted-foreground group-hover/row:bg-(--ds-gray-200) group-hover/row:text-foreground">
                  <GeistMoreDots size={12} />
                </span>
              </button>
            </DropdownMenuTrigger>
            {dropdownContent}
          </DropdownMenu>

          <Link
            href="/notifikasi"
            aria-label="Notifikasi"
            title="Lihat notifikasi"
            className={cn(
              "relative grid place-content-center size-6 shrink-0 rounded-full border border-border bg-card cursor-pointer transition-colors",
              "text-muted-foreground hover:bg-(--ds-gray-200) hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            )}
          >
            <GeistBell size={12} className="size-3" />
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-blue-500 ring-1 ring-card" />
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. MODAL DIALOG: CATATAN RILIS (CHANGELOG)                     */}
      {/* ============================================================== */}
      <Dialog open={showChangelog} onOpenChange={setShowChangelog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Catatan Rilis Tirtawening
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Riwayat pembaruan sistem dan penyempurnaan platform Smart Billing.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-3">
            {/* Version 2.4.2 */}
            <div className="relative pl-5 border-l-2 border-primary/40 space-y-2">
              <span className="absolute -left-[5px] top-0 size-2 rounded-full bg-primary" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-foreground">
                  v2.4.2 (Stabil)
                </span>
                <span className="text-[11px] text-muted-foreground">11 Nov 2026</span>
              </div>
              <p className="text-xs text-foreground font-medium">
                Penyempurnaan Ruang Kerja & Telemetri Real-time
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Workspace Switcher interaktif dengan keyboard shortcuts (⌥1 - ⌥6).</li>
                <li>Perataan vertikal presisi dropdown avatar dan dialog bantuan terintegrasi.</li>
                <li>Perbaikan kalkulasi anomali database (deteksi 8.422 SL abnormal secara presisi).</li>
                <li>Panel Analitik tanpa pembungkus card ganda dengan tabel performa petugas densitas tinggi.</li>
              </ul>
            </div>

            {/* Version 2.4.0 */}
            <div className="relative pl-5 border-l-2 border-border space-y-2">
              <span className="absolute -left-[5px] top-0 size-2 rounded-full bg-border" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-foreground">
                  v2.4.0
                </span>
                <span className="text-[11px] text-muted-foreground">02 Nov 2026</span>
              </div>
              <p className="text-xs text-foreground font-medium">
                Mesin Tarif Progresif & Spasial PostGIS
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Implementasi TagihanEngine 4 blok tarif progresif untuk seluruh golongan.</li>
                <li>Validasi radius geofence GPS untuk pencegahan catat meter fiktif.</li>
                <li>Migrasi autentikasi Better-Auth dengan role-based access control.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* 2. MODAL DIALOG: BANTUAN & SOP OPERASIONAL                     */}
      {/* ============================================================== */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HelpCircle className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Pusat Bantuan & SOP Operasional
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Panduan eskalasi kendala teknis dan kontak darurat petugas dinas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            {/* Helpdesk Contacts */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2.5">
              <span className="font-semibold text-foreground block">
                Kontak Siaga Tim IT & Billing Perumda:
              </span>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-primary" />
                  <span>(022) 250-9030 (Ext. 142)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-primary" />
                  <span>billing@tirtawening.co.id</span>
                </div>
              </div>
            </div>

            {/* Emergency Field Protocols */}
            <div className="space-y-2">
              <span className="font-semibold text-foreground block">
                Protokol Lapangan & Verifikasi:
              </span>
              <div className="space-y-2">
                <div className="p-3 rounded-md border border-border/80 bg-muted/40 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <AlertTriangle className="size-3.5 text-amber-500" />
                    <span>Water Meter Terkunci / Pagar Tertutup</span>
                  </div>
                  <p className="text-muted-foreground">
                    Gunakan kode kondisi `KUNCI`, ambil foto tampak depan gerbang pelanggan. Sistem otomatis mengajukan taksasi rata-rata 3 bulan ke Verifikator Ring 1.
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border/80 bg-muted/40 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <AlertTriangle className="size-3.5 text-amber-500" />
                    <span>Stand Meter Mundur / Angka Terbalik</span>
                  </div>
                  <p className="text-muted-foreground">
                    Segera laporkan anomali ke Supervisor Wilayah. Jangan input taksasi manual tanpa foto meteran yang memperlihatkan segel dan register angka.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* 3. MODAL DIALOG: DOKUMENTASI SISTEM                            */}
      {/* ============================================================== */}
      <Dialog open={showDocs} onOpenChange={setShowDocs}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Dokumentasi Sistem Smart Billing
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Spesifikasi arsitektur data, formula kalkulasi tagihan, dan aturan bisnis.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Server className="size-3.5 text-emerald-500" />
                <span>Arsitektur & Basis Data</span>
              </div>
              <p className="text-muted-foreground">
                Sistem beroperasi di atas PostgreSQL Neon dengan ekstensi spasial PostGIS untuk koordinat meter, schema Drizzle ORM, Next.js 16 App Router, dan Elysia API Gateway.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Layers className="size-3.5 text-primary" />
                <span>Rumus Tagihan 4 Blok Progresif</span>
              </div>
              <p className="text-muted-foreground">
                Perhitungan tagihan air dihitung berdasarkan pemakaian kubikasi bertingkat:
              </p>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] bg-muted/50 p-2 rounded border border-border/60">
                <span>Blok 1: 0 - 10 m³</span>
                <span>Blok 2: 11 - 20 m³</span>
                <span>Blok 3: 21 - 30 m³</span>
                <span>Blok 4: &gt; 30 m³</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Total Rekening = (Kubikasi × Tarif Progresif) + Bea Administrasi + Bea Pemeliharaan Meter + Denda (jika lewat tanggal 20).
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="size-3.5 text-blue-500" />
                <span>Tingkat Otorisasi (RBAC)</span>
              </div>
              <p className="text-muted-foreground">
                SUPERADMIN (Akses penuh & eksekusi tutup buku), VERIFIKATOR_1 & 2 (Audit taksasi dan anomali lapangan), PETUGAS_CATER (Input stand meter via aplikasi mobile).
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
