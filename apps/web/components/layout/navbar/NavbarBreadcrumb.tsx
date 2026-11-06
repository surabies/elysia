"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { findActiveNav, type NavItem } from "@/config/Navigasi"

export function NavbarBreadcrumb() {
  const pathname = usePathname()
  const active = findActiveNav(pathname)

  // Default jika di root dashboard
  if (pathname === "/dashboard" || !active) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-muted-foreground">Direktorat Utama</span>
        <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
        <span className="font-semibold text-foreground">Ringkasan Operasional</span>
      </nav>
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
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      <Link
        href={groupHref}
        className="font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {active.group.title}
      </Link>

      <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />

      {active.trail && active.trail.length > 0 && (
        <>
          <span className="text-muted-foreground">{active.trail[0].title}</span>
          <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
        </>
      )}

      <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
        {active.item.title}
      </span>
    </nav>
  )
}
