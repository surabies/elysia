"use client"

import { useActionState } from "react"
import { CheckCircle2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "../actions/lupa-sandi"

const AWAL: ForgotPasswordState = { status: "idle" }

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, AWAL)

  if (state.status === "sukses") {
    return (
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertDescription>{state.pesan}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        {state.status === "error" && state.pesan && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription>{state.pesan}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!state.errors?.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nama@tirtawening.co.id"
            aria-invalid={!!state.errors?.email}
            disabled={pending}
          />
          {state.errors?.email && <FieldError>{state.errors.email}</FieldError>}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner className="size-4" />}
          {pending ? "Mengirim…" : "Kirim tautan reset"}
        </Button>
      </FieldGroup>
    </form>
  )
}
