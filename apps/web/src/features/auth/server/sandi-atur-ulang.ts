import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { db, verification, user, account } from "@cater/db"
import { eq, and } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"

export { hashPassword }

const MASA_BERLAKU_MENIT = 60
const PREFIX = "reset:"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function identifierUntuk(email: string): string {
  return `${PREFIX}${email.toLowerCase()}`
}

/**
 * Membuat token baru untuk reset password.
 * Mengembalikan token ASLI (untuk dikirim via email), database hanya menyimpan SHA-256 hash-nya.
 */
export async function buatTokenReset(
  email: string
): Promise<{ token: string; kedaluwarsa: Date }> {
  const identifier = identifierUntuk(email)
  const token = randomBytes(32).toString("hex")
  const kedaluwarsa = new Date(Date.now() + MASA_BERLAKU_MENIT * 60 * 1000)

  // Hanya tautan terakhir yang berlaku — hapus token reset sebelumnya
  await db.delete(verification).where(eq(verification.identifier, identifier))

  await db.insert(verification).values({
    id: `verif-${randomBytes(16).toString("hex")}`,
    identifier,
    value: hashToken(token),
    expiresAt: kedaluwarsa,
  })

  return { token, kedaluwarsa }
}

/**
 * Memeriksa apakah token cocok, belum kedaluwarsa, dan aman dari timing attacks.
 */
export async function tokenResetValid(
  email: string,
  token: string
): Promise<boolean> {
  const identifier = identifierUntuk(email)
  const rows = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1)

  const baris = rows[0]
  if (!baris) return false
  if (baris.expiresAt.getTime() < Date.now()) return false

  const a = Buffer.from(baris.value, "utf8")
  const b = Buffer.from(hashToken(token), "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Menukar token dengan password baru secara atomik di dalam database transaction.
 */
export async function pakaiTokenReset(
  email: string,
  token: string,
  passwordBaru: string
): Promise<boolean> {
  if (!(await tokenResetValid(email, token))) return false

  const identifier = identifierUntuk(email)
  const userRows = await db
    .select()
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1)

  const targetUser = userRows[0]
  if (!targetUser) return false

  const hashedPassword = await hashPassword(passwordBaru)

  await db.transaction(async (tx) => {
    // 1. Update password pada account credential
    await tx
      .update(account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(
        and(
          eq(account.userId, targetUser.id),
          eq(account.providerId, "credential")
        )
      )

    // 2. Hapus token dari tabel verification
    await tx.delete(verification).where(eq(verification.identifier, identifier))
  })

  return true
}
