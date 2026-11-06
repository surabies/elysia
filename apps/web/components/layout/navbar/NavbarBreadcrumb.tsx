// components/layout/navbar/NavbarBreadcrumb.tsx
// Breadcrumb pada navbar sesuai inspeksi Vercel dashboard di docs/NAVBAR.md:
// - Menggunakan diagonal slash khas Geist (GeistSlash) sebagai pemisah breadcrumb
// - Parent link: text-sm font-medium text-muted-foreground hover:text-foreground
// - Separator slash: GeistSlash 16x16 text-muted-foreground/40 shrink-0
// - Current page: text-sm font-medium text-foreground truncate

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GeistSlash } from "../navigation/sidebar/lib/GeistIcons"
import { findActiveNav, type NavItem } from "@/config/Navigasi"

export function NavbarBreadcrumb() {
  const pathname = usePathname()
  const active = findActiveNav(pathname)

  // Default jika berada di root dashboard
  if (pathname === "/dashboard" || !active) {
    return (
      <div className="flex items-center gap-2 text-sm min-w-0 select-none">
        <Link
          href="/dashboard"
          className="font-medium text-muted-foreground transition-colors hover:text-foreground shrink-0"
        >
          Direktorat Utama
        </Link>
        <GeistSlash
          size={16}
          className="size-4 text-muted-foreground/40 shrink-0"
          aria-hidden="true"
        />
        <span
          aria-current="page"
          className="font-medium text-foreground truncate"
        >
          Ringkasan Operasional
        </span>
      </div>
    )
  }

  // Tentukan link landing untuk grup/direktorat
  let groupHref = "/dashboard"
  if (active.group?.items) {
    const first = active.group.items[0]
    if (first && "href" in first) {
      groupHref = (first as NavItem).href
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm min-w-0 truncate select-none">
      <Link
        href={groupHref}
        className="font-medium text-muted-foreground transition-colors hover:text-foreground shrink-0"
      >
        {active.group.title}
      </Link>

      <GeistSlash
        size={16}
        className="size-4 text-muted-foreground/40 shrink-0"
        aria-hidden="true"
      />

      {active.trail && active.trail.length > 0 && (
        <>
          <span className="font-medium text-muted-foreground shrink-0">
            {active.trail[0].title}
          </span>
          <GeistSlash
            size={16}
            className="size-4 text-muted-foreground/40 shrink-0"
            aria-hidden="true"
          />
        </>
      )}

      <span
        aria-current="page"
        className="font-medium text-foreground truncate"
      >
        {active.item.title}
      </span>
    </div>
  )
}
