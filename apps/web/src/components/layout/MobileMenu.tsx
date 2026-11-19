"use client"

import { LayoutDashboard, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { PillButton } from "@/components/shared/PillButton"
import { usePwa } from "@/components/pwa/PwaProvider"
import { Badge } from "@/components/ui/badge"
import { GeistAvatar } from "@/components/layout/navigation/sidebar/lib/GeistAvatar"
import type { PublicUserInfo } from "@/components/layout/PublicUserMenu"
import { downloadAppLink, mainNavLinks } from "@/config/site"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isAuthenticated?: boolean
  user?: PublicUserInfo | null
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase()
}

/**
 * Menu layar kecil (< md): panel putih jatuh dari header dengan latar gelap.
 * Dirender di dalam <header> (fixed), sehingga panel & overlay mengikuti header.
 */
export function MobileMenu({
  open: controlledOpen,
  onOpenChange,
  isAuthenticated = false,
  user = null,
}: MobileMenuProps = {}) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const visibleLinks = isAuthenticated
    ? mainNavLinks.filter(
        (link) => link.href !== "/login" && link.href !== "/daftar"
      )
    : mainNavLinks
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const { promptInstall, isInstalled } = usePwa()

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
            ? "border-2 border-background bg-background text-foreground shadow-md"
            : "border-2 border-transparent bg-foreground text-background hover:opacity-80"
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
            className="absolute inset-x-3 top-full rounded-md border border-border bg-card p-3 text-foreground shadow-xl md:hidden"
          >
            {isAuthenticated && user ? (
              <div className="mb-2 flex items-center gap-3 border-b border-border pb-3">
                <GeistAvatar
                  src={user.image}
                  alt={user.name}
                  initials={getInitials(user.name, user.email)}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  {user.isInternal ? (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  ) : user.nolg ? (
                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px] font-mono"
                    >
                      No. Pelanggan: {user.nolg}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      Pelanggan
                    </Badge>
                  )}
                </div>
              </div>
            ) : null}

            <ul>
              {isAuthenticated && user?.isInternal ? (
                <li className="border-b border-border">
                  <Link
                    href="/dashboard"
                    onClick={close}
                    className="flex items-center gap-2 py-3 text-label-14 font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard Operasional</span>
                  </Link>
                </li>
              ) : null}

              {visibleLinks.map((link) => (
                <li
                  key={link.href}
                  className="border-b border-border last:border-b-0"
                >
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-3 text-label-14 font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {isAuthenticated && user ? (
                <li className="border-t border-border">
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={async () => {
                      if (signingOut) return
                      setSigningOut(true)
                      try {
                        await signOut()
                        close()
                        router.push("/")
                        router.refresh()
                      } finally {
                        setSigningOut(false)
                      }
                    }}
                    className="flex w-full items-center gap-2 py-3 text-left text-label-14 font-medium text-destructive hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>{signingOut ? "Keluar…" : "Keluar"}</span>
                  </button>
                </li>
              ) : null}
            </ul>

            <PillButton
              type="button"
              onClick={() => {
                close()
                promptInstall()
              }}
              className="mt-3 h-9 w-full cursor-pointer"
            >
              {isInstalled ? "BUKA APP" : downloadAppLink.label}
            </PillButton>
          </div>
        </>
      ) : null}
    </>
  )
}
