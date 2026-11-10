"use client"

import { useActionState } from "react"
import Link from "next/link"
import { CheckCircle2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "../actions/atur-ulang-sandi"
import { PANJANG_PASSWORD_MIN } from "../lib/auth-schema"

const AWAL: ResetPasswordState = { status: "idle" }

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const [state, action, pending] = useActionState(resetPasswordAction, AWAL)

  if (state.status === "sukses") {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>{state.pesan}</AlertDescription>
        </Alert>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Masuk sekarang</Link>
        </Button>
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      <FieldGroup className="gap-4">
        {state.status === "error" && state.pesan && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription>{state.pesan}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!state.errors?.password}>
          <FieldLabel htmlFor="password">Password baru</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state.errors?.password}
            disabled={pending}
          />
          <FieldDescription>
            Minimal {PANJANG_PASSWORD_MIN} karakter.
          </FieldDescription>
          {state.errors?.password && (
            <FieldError>{state.errors.password}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!state.errors?.konfirmasi}>
          <FieldLabel htmlFor="konfirmasi">Ulangi password baru</FieldLabel>
          <Input
            id="konfirmasi"
            name="konfirmasi"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state.errors?.konfirmasi}
            disabled={pending}
          />
          {state.errors?.konfirmasi && (
            <FieldError>{state.errors.konfirmasi}</FieldError>
          )}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner className="size-4" />}
          {pending ? "Menyimpan…" : "Simpan password baru"}
        </Button>
      </FieldGroup>
    </form>
  )
}
