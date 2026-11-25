"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { DocCategory } from "../types"

interface DocsSidebarProps {
  categories: DocCategory[]
  activeSlug?: string
}

export function DocsSidebar({ categories, activeSlug }: DocsSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="relative w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden hidden md:block">
      {/* 1. Garis vertikal pembatas sticky (TETAP DIAM, TIDAK IKUT TERSCROLL) */}
      <div
        aria-hidden="true"
        className="absolute top-4 right-0 bottom-4 hidden w-px bg-[linear-gradient(to_bottom,transparent_0%,var(--border)_12%,var(--border)_88%,transparent_100%)] lg:flex pointer-events-none z-20"
      />

      {/* 2. Efek Memudar Tipis dan Mulus di Bagian Header Sidebar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-background via-background/60 to-transparent z-10"
      />

      {/* 3. Kontainer Menu dengan Posisi Awal (pt-8 pb-16) dan Scroll-Fade Halus */}
      <div className="h-full w-full overflow-y-auto pr-6 pt-8 pb-16 scrollbar-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)]">
        <div className="space-y-6 text-sm">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <h4 className="flex h-7 shrink-0 items-center px-2 text-xs font-medium text-muted-foreground">
                {cat.title}
              </h4>

              <div className="grid grid-flow-row auto-rows-max gap-0.5">
                {cat.items.map((item) => {
                  const itemHref = `/docs/${item.slug}`
                  const isActive =
                    activeSlug === item.slug || pathname === itemHref

                  return (
                    <Link
                      key={item.slug}
                      href={itemHref}
                      className={cn(
                        "flex h-8 w-full items-center justify-between rounded-md px-2 text-[0.875rem] transition-colors",
                        isActive
                          ? "font-medium text-foreground bg-accent/60"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-normal"
                      )}
                    >
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Efek Memudar Tipis dan Mulus di Bagian Footer Sidebar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background via-background/60 to-transparent z-10"
      />
    </aside>
  )
}
