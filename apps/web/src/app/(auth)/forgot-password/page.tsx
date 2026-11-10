import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/index"
import { ForgotPasswordCard } from "@/features/auth"

export const metadata: Metadata = {
  title: "Lupa password",
  description: "Minta tautan untuk mengatur ulang password akun Anda",
}

export default async function ForgotPasswordPage() {
  const session = await auth()
  if (session?.user) redirect("/")

  return <ForgotPasswordCard />
}
