"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { SiteFooter } from "@/components/layout/SiteFooter"
import { SiteHeader } from "@/components/layout/SiteHeader"

const RUTE_PUBLIK: string[] = [
  "/cek-tagihan",
  "/lapor-meter",
  "/pengaduan-air",
  "/info-gangguan",
  "/tarif-air",
  "/cara-pembayaran",
  "/pasang-baru",
  "/faq",
  "/profil",
  "/berita",
  "/kontak",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
]

function halamanPublik(pathname: string) {
  return (
    pathname === "/" ||
    RUTE_PUBLIK.some((r) => pathname === r || pathname.startsWith(`${r}/`))
  )
}

export function LandingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/"

  if (!halamanPublik(pathname)) return <>{children}</>

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background text-foreground font-sans overflow-x-clip">
      {/* ====================================================================
          UNIFIED FULL-PAGE ARCHITECTURAL BACKDROP
          Garis kotak-kotak 64px, garis tiang struktural, & gradasi tipis
          Biru (#0070f3) + Hijau Emerald (#10b981) yang mengalir menyambung
          dari atas (Navbar & Hero) sampai ke bawah halaman.
          ==================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* 1. Continuous Subtle Blue & Emerald Water Gradient Field (Top to Bottom) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(65% 18% at 72% 4%, rgba(0, 112, 243, 0.065) 0%, rgba(16, 185, 129, 0.03) 48%, transparent 100%), " +
              "radial-gradient(50% 15% at 18% 8%, rgba(0, 112, 243, 0.04) 0%, rgba(16, 185, 129, 0.025) 55%, transparent 100%), " +
              "radial-gradient(55% 22% at 80% 34%, rgba(0, 112, 243, 0.045) 0%, rgba(16, 185, 129, 0.025) 50%, transparent 100%), " +
              "radial-gradient(55% 22% at 20% 62%, rgba(16, 185, 129, 0.035) 0%, rgba(0, 112, 243, 0.025) 55%, transparent 100%), " +
              "radial-gradient(60% 20% at 65% 88%, rgba(0, 112, 243, 0.04) 0%, rgba(16, 185, 129, 0.025) 50%, transparent 100%)",
          }}
        />

        {/* 2. Continuous 64px Swiss Architectural Grid (Top to Bottom) */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--ds-gray-alpha-100) 1px, transparent 1px), linear-gradient(to bottom, var(--ds-gray-alpha-100) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
          }}
        />

        {/* 3. Continuous Vertical Guide Rails (Menyambung utuh dari Navbar, Hero, sampai Footer) */}
        <div className="mx-auto h-full max-w-360 px-4 lg:px-12">
          <div className="h-full w-full border-x border-dashed border-border/55" />
        </div>
      </div>

      <SiteHeader />
      <main className="flex flex-1 flex-col [&_.section-white+.section-white]:pt-0">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
