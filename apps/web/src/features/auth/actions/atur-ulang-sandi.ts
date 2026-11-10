"use server"

import { resetPasswordSchema } from "../lib/auth-schema"
import { pakaiTokenReset } from "../server/sandi-atur-ulang"

export interface ResetPasswordState {
  status: "idle" | "sukses" | "error"
  pesan?: string
  errors?: Record<string, string>
}

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    email: formData.get("email"),
    password: formData.get("password"),
    konfirmasi: formData.get("konfirmasi"),
  })

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { status: "error", errors }
  }

  const { token, email, password } = parsed.data

  const berhasil = await pakaiTokenReset(email, token, password)

  if (!berhasil) {
    return {
      status: "error",
      pesan:
        "Tautan ini tidak berlaku lagi. Tautan reset hanya bisa dipakai sekali dan kedaluwarsa dalam 1 jam. Silakan minta tautan baru.",
    }
  }

  return {
    status: "sukses",
    pesan:
      "Password berhasil diperbarui. Silakan masuk dengan password baru Anda.",
  }
}
