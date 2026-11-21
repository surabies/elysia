"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db, user as userTable } from "@cater/db"
import { auth } from "@/lib/auth"
import { auth as resolveSession } from "@/lib/auth/index"
import { PANJANG_PASSWORD_MIN } from "../lib/auth-schema"

export interface GantiPasswordState {
  status: "idle" | "error"
  pesan?: string
}

/**
 * Ganti password wajib (akun seed). Memakai Better Auth changePassword (memverifikasi password lama),
 * lalu mencabut flag wajib_ganti_password HANYA jika penggantian benar-benar berhasil.
 */
export async function gantiPasswordWajibAction(
  _prev: GantiPasswordState,
  formData: FormData
): Promise<GantiPasswordState> {
  const session = await resolveSession()
  if (!session?.user) redirect("/login")

  const lama = String(formData.get("passwordLama") ?? "")
  const baru = String(formData.get("passwordBaru") ?? "")
  const konfirmasi = String(formData.get("konfirmasi") ?? "")

  if (!lama) return { status: "error", pesan: "Password saat ini wajib diisi." }
  if (baru.length < PANJANG_PASSWORD_MIN) {
    return { status: "error", pesan: `Password baru minimal ${PANJANG_PASSWORD_MIN} karakter.` }
  }
  if (baru !== konfirmasi) return { status: "error", pesan: "Konfirmasi password tidak sama." }
  if (baru === lama) return { status: "error", pesan: "Password baru harus berbeda dari password saat ini." }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword: lama, newPassword: baru, revokeOtherSessions: true },
    })
  } catch {
    return { status: "error", pesan: "Password saat ini salah atau penggantian gagal." }
  }

  await db
    .update(userTable)
    .set({ wajibGantiPassword: false, updatedAt: new Date() })
    .where(eq(userTable.id, session.user.id))

  redirect("/dashboard")
}
