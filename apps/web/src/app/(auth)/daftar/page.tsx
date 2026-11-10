import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import { DaftarCard } from "@/features/auth"

export const metadata: Metadata = {
  title: "Daftar Akun",
  description:
    "Buat akun warga PERUMDA Tirtawening untuk memantau laporan pengaduan Anda",
}

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  const session = await auth()
  if (session?.user) redirect(callbackUrl ?? "/dashboard")

  return <DaftarCard callbackUrl={callbackUrl ?? "/dashboard"} />
}
