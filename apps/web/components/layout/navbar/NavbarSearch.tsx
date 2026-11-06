// components/layout/navbar/NavbarSearch.tsx
// Tugas: tombol pemicu + shortcut Ctrl/Cmd+K. Tampilan dialog diserahkan ke SearchDialog.
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { SearchDialog } from "../search/SearchDialog"
import { Search } from "lucide-react"

// Deteksi Mac tanpa setState di effect.
// - server: selalu false (supaya HTML server = HTML awal client, tanpa hydration error)
// - client: dibaca dari userAgent, React otomatis render ulang bila hasilnya beda
const subscribe = () => () => {}
const getIsMac = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
const getIsMacServer = () => false

export function NavbarSearch() {
  // Tahap 1: state buka/tutup
  const [open, setOpen] = React.useState(false)
  const isMac = React.useSyncExternalStore(subscribe, getIsMac, getIsMacServer)

  // Tahap 2: useCallback agar fungsi `close` tidak berubah tiap render
  const close = React.useCallback(() => setOpen(false), [])

  // Tahap 3: shortcut Ctrl/Cmd+K
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      {/* Tombol ikon: mobile */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Cari menu"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Search size={16} strokeWidth={1.5} className="size-4" />
      </Button>

      {/* Tombol desktop: Vercel Geist search trigger */}
      <button
        type="button"
        aria-label="Cari menu"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-[#F2F2F2] hover:text-foreground dark:hover:bg-[#1A1A1A] max-lg:hidden"
      >
        <Search
          size={16}
          strokeWidth={1.5}
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm">Cari...</span>
        <kbd className="inline-flex h-5.5 items-center rounded border border-border bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground">
          {isMac ? "⌘K" : "Ctrl\u00a0K"}
        </kbd>
      </button>

      <SearchDialog open={open} onClose={close} />
    </>
  )
}
