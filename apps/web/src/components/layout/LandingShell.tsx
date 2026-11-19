"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { SplashIntro } from "@/components/home/SplashIntro"
import { SiteFooter } from "@/components/layout/SiteFooter"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { InteractiveWaterBackdrop } from "@/components/layout/InteractiveWaterBackdrop"

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
  const isHome = pathname === "/"
  const [splashActive, setSplashActive] = React.useState(false)

  if (!halamanPublik(pathname)) return <>{children}</>

  const isLocked = isHome && splashActive

  return (
    <>
      {isHome ? <SplashIntro onActiveChange={setSplashActive} /> : null}
      <div
        inert={isLocked}
        aria-hidden={isLocked || undefined}
        className="relative isolate flex min-h-screen flex-col bg-background text-foreground font-sans overflow-x-clip"
      >
        {/* Dynamic Water & Dot Matrix Backdrop with Interactive Riak Air */}
        <InteractiveWaterBackdrop />

        <SiteHeader />
        <main className="flex flex-1 flex-col [&_.section-white+.section-white]:pt-0">
          {children}
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
