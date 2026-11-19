"use client"

import * as React from "react"
import Link from "next/link"

import { AutoHideHeader } from "@/components/layout/AutoHideHeader"
import { Logo } from "@/components/layout/Logo"
import { MobileMenu } from "@/components/layout/MobileMenu"
import {
  PublicUserMenu,
  usePublicUserSession,
} from "@/components/layout/PublicUserMenu"
import { SearchExperience } from "@/components/layout/SearchExperience"
import { PillButton } from "@/components/shared/PillButton"
import { BroadcastGangguanBanner } from "@/components/home/BroadcastGangguanBanner"
import { usePwa } from "@/components/pwa/PwaProvider"
import { downloadAppLink, mainNavLinks } from "@/config/site"
import { topEventsContent } from "@/data/home"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { promptInstall, isInstalled } = usePwa()
  const { isAuthenticated, user } = usePublicUserSession()

  const visibleNavLinks = React.useMemo(
    () =>
      isAuthenticated
        ? mainNavLinks.filter(
            (link) => link.href !== "/login" && link.href !== "/daftar"
          )
        : mainNavLinks,
    [isAuthenticated]
  )

  return (
    <AutoHideHeader>
      {/* 1. Ambient Live Disruption / Outage Broadcast Banner on Very Top */}
      <BroadcastGangguanBanner />

      {/* 2. Main Navigation Bar (Structural Grid Rails menyatu dengan Hero) */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0070f3]/25 to-transparent"
        />
        <nav
          aria-label="Navigasi Utama"
          className="mx-auto flex max-w-360 items-center justify-between px-4 py-3.5 flex-nowrap lg:px-12 lg:py-4 border-x border-dashed border-border/60"
        >
          <Logo className="shrink-0" />

          {/* Search Bar Desktop (xl+) di samping Logo */}
          <SearchExperience
            events={topEventsContent.events}
            mode="desktop"
          />

          {/* Grup Elemen Kanan */}
          <div className="ml-auto flex items-center shrink-0 gap-2">
            {/* Menu Link Desktop (md+) */}
            <ul className="hidden items-center md:flex shrink-0">
              {visibleNavLinks.map((link) => (
                <li key={link.href} className="mx-2 lg:mx-3 xl:mx-4 shrink-0">
                  <Link
                    href={link.href}
                    className="relative block text-label-14 leading-none outline-none font-medium text-foreground/80 transition-colors hover:text-foreground whitespace-nowrap before:absolute before:inset-x-0 before:-top-2 before:h-0.5 before:w-0 before:bg-current before:transition-[width] before:duration-150 before:ease-in-out hover:before:w-full focus-visible:before:w-full"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Icon Search Mobile (< xl) - Berdampingan langsung dengan Icon Hamburger */}
            <SearchExperience
              events={topEventsContent.events}
              mode="mobile"
              isMenuOpen={mobileMenuOpen}
              onOpen={() => setMobileMenuOpen(false)}
            />

            {/* Avatar Dropdown User khusus desktop (md+) saat sudah login */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center">
                <PublicUserMenu user={user} />
              </div>
            ) : null}

            {/* Icon Hamburger Menu (< md) — profil akun ditampilkan di dalam menu ini */}
            <MobileMenu
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              isAuthenticated={isAuthenticated}
              user={user}
            />

            {/* Tombol Unduh App (md+) */}
            <PillButton
              type="button"
              onClick={promptInstall}
              className="ml-2 hidden last:mr-0 md:inline-flex shrink-0 whitespace-nowrap cursor-pointer"
            >
              {isInstalled ? "BUKA APP" : downloadAppLink.label}
            </PillButton>
        </div>
        </nav>
      </div>
    </AutoHideHeader>
  )
}
