// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman dashboard dengan panel sidebar penuh di kiri dan workspace di kanan.
import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { auth, signOut } from "@/lib/auth/index"
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

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={100}>
        <DashboardShell
          user={{
            name: user.name ?? null,
            email: user.email ?? "",
            image: user.image ?? null,
            role: user.role,
          }}
          onKeluar={keluar}
        >
          {children}
        </DashboardShell>
      </TooltipProvider>
    </SidebarProvider>
  )
}
