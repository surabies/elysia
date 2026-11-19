import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import { getPostAuthRedirect } from "@/lib/auth/access-control"
import { DaftarCard } from "@/features/auth"

export const metadata: Metadata = {
  title: "Daftar Akun",
  description:
    "Buat akun pelanggan PERUMDA Tirtawening dengan Nomor Pelanggan terdaftar untuk layanan publik",
}

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  const session = await auth()
  if (session?.user) {
    redirect(getPostAuthRedirect(session.user.roles, callbackUrl))
  }

  return <DaftarCard callbackUrl="/" />
}
