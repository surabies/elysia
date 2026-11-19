// app/(auth)/login/page.tsx — halaman masuk (/login).
//
// POLA RUJUKAN untuk semua page berikutnya. Page bertanggung jawab HANYA
// pada urusan route:
//   1. metadata
//   2. membaca params/searchParams
//   3. guard sesi + redirect
//   4. merakit komponen dari features/
// Tampilan & aturan tampilnya ada di features/auth/. Jangan menaruh JSX
// panjang atau logika domain di file ini.
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import {
  getPostAuthRedirect,
  sanitizeCallbackUrl,
} from "@/lib/auth/access-control"
import { LoginCard } from "@/features/auth"

export const metadata: Metadata = {
  // Judul lengkap dirangkai template di app/layout.tsx -> "Masuk — PERUMDA Tirtawening"
  title: "Masuk",
  description:
    "Masuk ke portal PERUMDA Tirtawening Kota Bandung",
}

// searchParams adalah Promise di Next.js 15+ (async request APIs) — WAJIB
// di-await, bukan diakses langsung.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const { error, callbackUrl } = await searchParams
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl, "/dashboard")

  const session = await auth()
  if (session?.user) {
    redirect(getPostAuthRedirect(session.user.roles, safeCallbackUrl))
  }

  return <LoginCard error={error} callbackUrl={safeCallbackUrl} />
}
