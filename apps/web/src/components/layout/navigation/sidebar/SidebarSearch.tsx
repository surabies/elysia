// components/layout/navigation/sidebar/SidebarSearch.tsx
// Kotak "Cari menu" di puncak sidebar sesuai inspeksi Vercel dashboard di docs/SIDEBAR.md.
// - Tinggi h-9 (36px)
// - Icon 16x16 dalam grid size-9 pl-1
// - Teks placeholder text-sm flex-1 truncate pl-0.5
// - KBD shortcut 'F' h-5 min-w-5 px-1 rounded-sm text-xs di dalam grid size-9 (tidak overflow)

"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { GeistSearch } from "./lib/GeistIcons"
import { SearchDialog } from "@/components/layout/search/SearchDialog"
import { FOCUS_RING } from "./lib/Styles"
import { useIsClient } from "./hooks/UseIsClient"
import { cn } from "@/lib/Utilitas"

export function SidebarSearch() {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const isClient = useIsClient()

  const close = React.useCallback(() => setOpen(false), [])

  // Shortcut keyboard: Ctrl/Cmd + K ATAU tombol 'F' saat tidak sedang mengetik di input
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika sidebar tidak terlihat
      if (!triggerRef.current?.getClientRects().length) return

      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)

      // 1. Shortcut Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
        return
      }

      // 2. Shortcut 'F' ala Vercel dashboard (hanya saat tidak sedang mengetik di form)
      if (
        !isInput &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (e.key === "f" || e.key === "F")
      ) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Cari menu"
        onClick={() => setOpen(true)}
        className={cn(
          "relative flex h-9 w-full items-center rounded-md border border-border bg-card p-0 text-left transition-colors cursor-pointer select-none overflow-hidden",
          "hover:border-neutral-400 dark:hover:border-neutral-600",
          FOCUS_RING
        )}
      >
        {/* Icon pencarian (16x16 dalam grid size-9 dengan pl-1 sesuai inspeksi Vercel) */}
        <span
          className="grid size-9 shrink-0 place-content-center text-muted-foreground pl-1"
          data-search-icon="true"
        >
          <GeistSearch
            size={16}
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </span>

        {/* Placeholder teks (text-sm pl-0.5 min-w-0 truncate) */}
        <span
          className="hidden flex-1 min-w-0 truncate text-left text-sm text-muted-foreground md:flex pl-0.5"
          data-placeholder="true"
        >
          Cari menu...
        </span>

        {/* KBD shortcut 'F' sesuai Vercel dashboard (h-5 min-w-5 px-1 rounded-sm text-xs dalam grid size-9) */}
        <span className="hidden place-content-center md:grid size-9 shrink-0">
          <kbd
            data-geist-kbd=""
            className="inline-flex h-5 min-w-5 min-h-5 shrink-0 items-center justify-center rounded-sm border border-border bg-background px-1 font-sans text-xs font-medium text-muted-foreground shadow-2xs leading-none select-none"
          >
            <span>F</span>
          </kbd>
        </span>
      </button>

      {/* Dialog dipindah ke <body> via portal */}
      {isClient &&
        createPortal(
          <div className="relative z-100">
            <SearchDialog open={open} onClose={close} />
          </div>,
          document.body
        )}
    </>
  )
}
