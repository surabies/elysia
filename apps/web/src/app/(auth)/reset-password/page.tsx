import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import { tokenResetValid, ResetPasswordCard } from "@/features/auth"

export const metadata: Metadata = {
  title: "Atur ulang password",
  description: "Buat password baru untuk akun Anda",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect("/")

  const { token, email } = await searchParams

  if (!token || !email) redirect("/forgot-password")

  const valid = await tokenResetValid(email, token)

  return <ResetPasswordCard token={token} email={email} tokenValid={valid} />
}
