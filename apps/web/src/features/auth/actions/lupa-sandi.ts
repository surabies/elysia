"use server"

import { headers } from "next/headers"
import { db, user } from "@cater/db"
import { eq } from "drizzle-orm"
import { forgotPasswordSchema } from "../lib/auth-schema"
import { buatTokenReset } from "../server/sandi-atur-ulang"
import { kirimEmail } from "../server/pengirim-email"
import { emailResetPassword } from "../server/templat-email"

export interface ForgotPasswordState {
  status: "idle" | "sukses" | "error"
  pesan?: string
  errors?: Record<string, string>
}

const percobaan = new Map<string, { jumlah: number; reset: number }>()
const MAKS = 3
const JENDELA_MS = 15 * 60 * 1000

function lewatBatas(kunci: string): boolean {
  const now = Date.now()
  const catatan = percobaan.get(kunci)
  if (!catatan || catatan.reset < now) {
    percobaan.set(kunci, { jumlah: 1, reset: now + JENDELA_MS })
    return false
  }
  catatan.jumlah += 1
  return catatan.jumlah > MAKS
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      errors: { email: parsed.error.issues[0]?.message ?? "Email tidak valid" },
    }
  }
  const { email } = parsed.data

  const jawabanNetral: ForgotPasswordState = {
    status: "sukses",
    pesan:
      "Jika email tersebut terdaftar, kami telah mengirim tautan untuk mengatur ulang password. Periksa kotak masuk Anda.",
  }

  const headerList = await headers()
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal"
  if (lewatBatas(`${email}|${ip}`)) {
    return {
      status: "error",
      pesan: "Terlalu banyak permintaan. Coba lagi dalam beberapa menit.",
    }
  }

  const userRows = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  const targetUser = userRows[0]
  if (!targetUser) return jawabanNetral

  try {
    const { token } = await buatTokenReset(email)
    const baseUrl =
      process.env.BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    const url = new URL(
      `/reset-password?token=${token}&email=${encodeURIComponent(email)}`,
      baseUrl
    ).toString()

    await kirimEmail({
      to: email,
      subject: "Atur ulang password — PERUMDA Tirtawening",
      ...emailResetPassword({ nama: targetUser.name ?? email, url }),
    })
  } catch (err) {
    console.error("[forgot-password] gagal mengirim email:", err)
  }

  return jawabanNetral
}
