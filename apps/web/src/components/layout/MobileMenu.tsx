"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { PillButton } from "@/components/shared/PillButton"
import { downloadAppLink, mainNavLinks } from "@/config/site"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Menu layar kecil (< md): panel putih jatuh dari header dengan latar gelap.
 * Dirender di dalam <header> (fixed), sehingga panel & overlay mengikuti header.
 */
export function MobileMenu({
  open: controlledOpen,
  onOpenChange,
}: MobileMenuProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof next === "function" ? next(open) : next
    if (isControlled) {
      onOpenChange?.(nextVal)
    } else {
      setUncontrolledOpen(nextVal)
    }
  }

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        data-open={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex size-8 items-center justify-center rounded-full transition-all duration-200 outline-none md:hidden",
          open
            ? "border-2 border-white bg-white text-black shadow-md"
            : "border-2 border-transparent bg-black text-white hover:opacity-80"
        )}
      >
        {open ? (
          <X className="size-4.5" aria-hidden="true" />
        ) : (
          <Menu className="size-4.5" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            className="fixed inset-0 -z-10 bg-black/70 md:hidden"
          />
          <div
            id="mobile-menu"
            className="absolute inset-x-3 top-full rounded-md bg-white p-3 text-black shadow-xl md:hidden"
          >
            <ul>
              {mainNavLinks.map((link) => (
                <li
                  key={link.href}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-3 text-[15px] leading-5 font-medium text-black hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <PillButton asChild className="mt-3 h-9 w-full">
              <Link href={downloadAppLink.href} onClick={close}>
                {downloadAppLink.label}
              </Link>
            </PillButton>
          </div>
        </>
      ) : null}
    </>
  )
}
