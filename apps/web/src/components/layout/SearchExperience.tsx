"use client"

import { Search, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import type { TicketEvent } from "@/types/home"

interface SearchExperienceProps {
  events: TicketEvent[]
  mode?: "all" | "desktop" | "mobile"
  isMenuOpen?: boolean
  onOpen?: () => void
}

const URL_LAYANAN: Record<string, string> = {
  "1": "/cek-tagihan",
  "2": "/lapor-meter",
  "3": "/pengaduan-air",
  "4": "/peta-pengaduan",
  "5": "/pasang-baru",
  "6": "/info-gangguan",
}

export function SearchExperience({
  events,
  mode = "all",
  isMenuOpen = false,
  onOpen,
}: SearchExperienceProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const activeTriggerRef = useRef<HTMLButtonElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()

  const results = useMemo(() => {
    if (!normalizedQuery) return []

    return events.filter((event) =>
      [event.title, event.venue, event.city, event.date, event.price]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    )
  }, [events, normalizedQuery])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    inputRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setQuery("")
        activeTriggerRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    setQuery("")
    activeTriggerRef.current?.focus()
  }

  return (
    <>
      {/* Desktop Search Trigger (xl+) */}
      {(mode === "all" || mode === "desktop") && (
        <button
          type="button"
          onClick={(event) => {
            activeTriggerRef.current = event.currentTarget
            onOpen?.()
            setOpen(true)
          }}
          aria-label="Cari layanan"
          className="mx-4 hidden w-60 lg:w-72 shrink items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 px-3.5 py-2 text-left whitespace-nowrap text-neutral-500 xl:flex transition-colors cursor-pointer"
        >
          <Search size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          <span className="text-label-13 text-muted-foreground truncate">Cari layanan, tagihan...</span>
        </button>
      )}

      {/* Mobile / Tablet Search Trigger (< xl) - Berdampingan dengan Hamburger */}
      {(mode === "all" || mode === "mobile") && (
        <button
          type="button"
          aria-label="Cari layanan"
          onClick={(event) => {
            activeTriggerRef.current = event.currentTarget
            onOpen?.()
            setOpen(true)
          }}
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-all duration-200 outline-none md:size-8 xl:hidden cursor-pointer",
            isMenuOpen
              ? "border-2 border-white bg-white text-black shadow-md"
              : "border-2 border-transparent bg-black text-white hover:opacity-80"
          )}
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      )}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 pt-14 backdrop-blur-[4px]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close()
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Cari layanan Tirtawening"
                className="mx-auto w-full max-w-[600px]"
              >
                <div className="flex h-11 items-center gap-3 rounded-full bg-white px-4 text-black shadow-lg">
                  <Search size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ketik nama layanan, tagihan, meter, gangguan..."
                    aria-label="Cari layanan"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
                  />
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Tutup pencarian"
                    className="shrink-0 text-muted-foreground hover:text-black"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                {normalizedQuery ? (
                  <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl bg-white p-3 text-black shadow-2xl">
                    <h2 className="mb-2 text-label-11-mono font-mono text-muted-foreground uppercase tracking-wider">
                      Hasil Pencarian
                    </h2>
                    {results.length > 0 ? (
                      <ul className="space-y-1">
                        {results.map((event) => {
                          const href = URL_LAYANAN[event.id] ?? "/cek-tagihan"
                          return (
                            <li key={event.id}>
                              <Link
                                href={href}
                                onClick={close}
                                className="flex min-h-14 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-100"
                              >
                                <div
                                  aria-hidden="true"
                                  className="size-11 shrink-0 rounded-md"
                                  style={{ backgroundColor: event.accentColor }}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-heading-14 font-semibold text-black">
                                    {event.title}
                                  </p>
                                  <p className="truncate text-copy-13 text-neutral-600">
                                    {event.date} · {event.price}
                                  </p>
                                  <p className="truncate text-xs text-neutral-500">
                                    {event.venue}, {event.city}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Tidak ada layanan yang cocok dengan kata kunci tersebut.
                      </p>
                    )}
                  </div>
                ) : null}
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
