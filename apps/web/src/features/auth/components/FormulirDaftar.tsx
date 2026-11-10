"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"
import { registerSchema, PANJANG_PASSWORD_MIN } from "../lib/auth-schema"

export function DaftarForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [pesanError, setPesanError] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setPesanError(null)
    setErrors({})

    const fd = new FormData(e.currentTarget)
    const parsed = registerSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      konfirmasi: fd.get("konfirmasi"),
    })

    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }

    setPending(true)
    const hasil = await signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: callbackUrl,
    })
    setPending(false)

    if (hasil?.error) {
      setPesanError(hasil.error.message || "Pendaftaran gagal. Coba lagi.")
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        {pesanError && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription>{pesanError}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ahmad Subagja"
            aria-invalid={!!errors.name}
            disabled={pending}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nama@email.com"
            aria-invalid={!!errors.email}
            disabled={pending}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            disabled={pending}
          />
          {errors.password ? (
            <FieldError>{errors.password}</FieldError>
          ) : (
            <FieldDescription>
              Minimal {PANJANG_PASSWORD_MIN} karakter.
            </FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.konfirmasi}>
          <FieldLabel htmlFor="konfirmasi">Konfirmasi password</FieldLabel>
          <Input
            id="konfirmasi"
            name="konfirmasi"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.konfirmasi}
            disabled={pending}
          />
          {errors.konfirmasi && <FieldError>{errors.konfirmasi}</FieldError>}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner className="size-4" />}
          {pending ? "Mendaftar…" : "Daftar akun"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Masuk
          </Link>
        </p>
      </FieldGroup>
    </form>
  )
}
