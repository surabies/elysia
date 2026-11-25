import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import { isInternalUser } from "@/lib/auth/access-control"
import { DocsNavbar } from "@/features/docs"

export const dynamic = "force-dynamic"

export default async function DocsLayoutGroup({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!isInternalUser(session.user.roles)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DocsNavbar />
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  )
}
