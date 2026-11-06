// components/layout/navigation/sidebar/SidebarSearch.tsx
// Kotak "Cari menu" di puncak sidebar (pengganti NavbarSearch).
// Tugas: tombol pemicu + shortcut Ctrl/Cmd+K. Dialog-nya tetap SearchDialog.

"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Search } from "lucide-react"
import { SearchDialog } from "@/components/layout/search/SearchDialog"
import { FOCUS_RING } from "./lib/Styles"
import { useIsClient } from "./hooks/UseIsClient"
import { useIsMac } from "./hooks/UseIsMac"
import { cn } from "@/lib/Utilitas"

export function SidebarSearch() {
  // Tahap 1: state buka/tutup + ref tombol (untuk cek sidebar ini terlihat atau tidak)
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const isMac = useIsMac()
  const isClient = useIsClient()

  // Tahap 2: useCallback agar `close` tidak berubah tiap render
  const close = React.useCallback(() => setOpen(false), [])

  // Tahap 3: shortcut Ctrl/Cmd+K
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return

      // Sidebar tersembunyi (display:none, mis. di layar kecil) -> abaikan,
      // supaya sidebar kedua yang terlihat tidak ikut membuka dialog ganda.
      if (!triggerRef.current?.getClientRects().length) return

      e.preventDefault()
      setOpen((prev) => !prev)
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
          "flex h-8 w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 text-left text-xs text-muted-foreground transition-colors hover:bg-[#F2F2F2] hover:text-foreground dark:hover:bg-[#1A1A1A]",
          FOCUS_RING
        )}
      >
        <Search
          size={14}
          strokeWidth={1.5}
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-xs">Cari menu...</span>
        <kbd className="inline-flex h-5 shrink-0 items-center rounded border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {isMac ? "⌘K" : "Ctrl\u00a0K"}
        </kbd>
      </button>

      {/* Dialog dipindah ke <body> lewat portal. Tanpa ini ia ikut terkunci di
          lapisan z-index sidebar dan tertimpa konten halaman. Pembungkus z-[100]
          menjamin dialog selalu di atas navbar (z-10) dan isi halaman. */}
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
