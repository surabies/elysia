// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman dashboard dengan panel sidebar penuh di kiri dan workspace di kanan.
import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"

export const dynamic = "force-dynamic"

import { auth, signOut } from "@/lib/auth/index"
import {
  canAccessInternalRoute,
  isInternalUser,
} from "@/lib/auth/access-control"
import { DashboardShell } from "@/components/layout/index"
import { SidebarProvider } from "@/components/layout/shell/SidebarContext"
import { TooltipProvider } from "@/components/ui/tooltip"

async function keluar() {
  "use server"
  await signOut({ redirectTo: "/login" })
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { user } = session

  // Lapis 3 (Defense-in-Depth): Tolak mutlak pelanggan (USER) dari seluruh area dashboard
  if (!isInternalUser(user.roles)) {
    redirect("/")
  }

  // Verifikasi pemetaan Role-to-Route berdasarkan pathname aktual (Default Deny)
  const headerList = await headers()
  const currentPathname = headerList.get("x-pathname")
  if (
    currentPathname &&
    currentPathname !== "/dashboard" &&
    !canAccessInternalRoute(user.roles, currentPathname)
  ) {
    redirect("/dashboard?error=forbidden")
  }

  // Baca status & lebar sidebar dari cookie agar tidak ada flicker/berkedip saat reload
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState !== undefined ? sidebarState === "true" : true
  const rawWidth = cookieStore.get("sidebar_width")?.value
  const parsedWidth = rawWidth ? parseInt(rawWidth, 10) : 256
  const defaultWidth =
    !isNaN(parsedWidth) && parsedWidth >= 256 && parsedWidth <= 420
      ? parsedWidth
      : 256

  return (
    <SidebarProvider defaultOpen={defaultOpen} defaultWidth={defaultWidth}>
      <TooltipProvider delayDuration={100}>
        <DashboardShell
          user={{
            name: user.name ?? null,
            email: user.email ?? "",
            image: user.image ?? null,
            role: user.role,
            roles: user.roles,
          }}
          onKeluar={keluar}
        >
          {children}
        </DashboardShell>
      </TooltipProvider>
    </SidebarProvider>
  )
}
