// features/auth/lib/auth-schema.ts — aturan validasi form auth.
import { z } from "zod"

export const PANJANG_PASSWORD_MIN = 8

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email atau username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid").trim().toLowerCase(),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid").trim().toLowerCase(),
    password: z
      .string()
      .min(
        PANJANG_PASSWORD_MIN,
        `Password minimal ${PANJANG_PASSWORD_MIN} karakter`
      )
      .max(100, "Password terlalu panjang"),
    konfirmasi: z.string(),
  })
  .refine((d) => d.password === d.konfirmasi, {
    message: "Konfirmasi password tidak sama",
    path: ["konfirmasi"],
  })

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    email: z.string().email("Format email tidak valid").trim().toLowerCase(),
    password: z
      .string()
      .min(
        PANJANG_PASSWORD_MIN,
        `Password minimal ${PANJANG_PASSWORD_MIN} karakter`
      )
      .max(100, "Password terlalu panjang"),
    konfirmasi: z.string(),
  })
  .refine((d) => d.password === d.konfirmasi, {
    message: "Konfirmasi password tidak sama",
    path: ["konfirmasi"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
