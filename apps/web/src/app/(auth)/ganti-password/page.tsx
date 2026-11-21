import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import { FormulirGantiPasswordWajib } from "@/features/auth/components/FormulirGantiPasswordWajib"

export const metadata: Metadata = { title: "Ganti password wajib" }

export default async function GantiPasswordPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.wajibGantiPassword) redirect("/dashboard")
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Ganti password</h1>
      <FormulirGantiPasswordWajib />
    </div>
  )
}
