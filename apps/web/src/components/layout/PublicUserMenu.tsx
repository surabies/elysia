"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { GeistAvatar } from "./navigation/sidebar/lib/GeistAvatar"
import { signOut, useSession } from "@/lib/auth-client"

export interface PublicUserInfo {
  id: string
  name: string
  email: string
  image: string | null
  nolg: string | null
  role: string
  roles: string[]
  isInternal: boolean
}

export function usePublicUserSession() {
  const { data: sessionData, isPending } = useSession()
  const [userInfo, setUserInfo] = React.useState<PublicUserInfo | null>(null)
  const [loadedId, setLoadedId] = React.useState<string | null>(null)

  const sessionUser = sessionData?.user

  React.useEffect(() => {
    if (!sessionUser?.id) {
      setUserInfo(null)
      setLoadedId(null)
      return
    }
    if (loadedId === sessionUser.id) return

    let active = true
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active) return
        const u = json?.data?.user
        if (u) {
          setUserInfo({
            id: u.id,
            name: u.name ?? sessionUser.name ?? "Pengguna",
            email: u.email ?? sessionUser.email ?? "",
            image: u.image ?? sessionUser.image ?? null,
            nolg: u.nolg ?? null,
            role: u.role ?? "USER",
            roles: Array.isArray(u.roles) ? u.roles : ["USER"],
            isInternal: Boolean(u.isInternal),
          })
          setLoadedId(sessionUser.id)
        }
      })
      .catch(() => {
        if (!active) return
        setUserInfo({
          id: sessionUser.id,
          name: sessionUser.name ?? "Pengguna",
          email: sessionUser.email ?? "",
          image: sessionUser.image ?? null,
          nolg:
            (sessionUser as { nolg?: string | null }).nolg ?? null,
          role: "USER",
          roles: ["USER"],
          isInternal: false,
        })
        setLoadedId(sessionUser.id)
      })

    return () => {
      active = false
    }
  }, [sessionUser, loadedId])

  const isAuthenticated = Boolean(sessionUser?.id)

  const fallbackUser: PublicUserInfo | null = sessionUser?.id
    ? {
        id: sessionUser.id,
        name: sessionUser.name ?? "Pengguna",
        email: sessionUser.email ?? "",
        image: sessionUser.image ?? null,
        nolg: (sessionUser as { nolg?: string | null }).nolg ?? null,
        role: "USER",
        roles: ["USER"],
        isInternal: false,
      }
    : null

  return {
    isAuthenticated,
    isPending,
    user: userInfo ?? fallbackUser,
  }
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase()
}

export function PublicUserMenu({ user }: { user: PublicUserInfo }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = React.useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      router.push("/")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menu akun ${user.name}`}
          className="relative flex size-9 items-center justify-center rounded-full border border-border/80 bg-background transition-all hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        >
          <GeistAvatar
            src={user.image}
            alt={user.name}
            initials={getInitials(user.name, user.email)}
            size={32}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            {user.isInternal ? (
              <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                {user.role.replace(/_/g, " ")}
              </Badge>
            ) : user.nolg ? (
              <Badge variant="outline" className="mt-1 w-fit text-[10px] font-mono">
                No. Pelanggan: {user.nolg}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                Pelanggan
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {user.isInternal ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="size-4" />
              <span>Dashboard Operasional</span>
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/cek-tagihan" className="flex items-center gap-2 cursor-pointer">
                <FileText className="size-4" />
                <span>Cek Tagihan</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/lapor-meter" className="flex items-center gap-2 cursor-pointer">
                <Gauge className="size-4" />
                <span>Lapor Angka Meter</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pengaduan-air" className="flex items-center gap-2 cursor-pointer">
                <MessageSquareWarning className="size-4" />
                <span>Pengaduan Air</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/info-gangguan" className="flex items-center gap-2 cursor-pointer">
                <AlertTriangle className="size-4" />
                <span>Info Gangguan</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            void handleSignOut()
          }}
          disabled={signingOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>{signingOut ? "Keluar…" : "Keluar"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
