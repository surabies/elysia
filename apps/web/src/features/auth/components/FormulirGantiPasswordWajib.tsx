"use client"

import { useActionState } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { gantiPasswordWajibAction, type GantiPasswordState } from "../actions/ganti-password"

const AWAL: GantiPasswordState = { status: "idle" }

export function FormulirGantiPasswordWajib() {
  const [state, action, pending] = useActionState(gantiPasswordWajibAction, AWAL)
  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <Alert>
          <AlertDescription>
            Demi keamanan, Anda wajib mengganti password awal sebelum menggunakan sistem.
          </AlertDescription>
        </Alert>
        {state.status === "error" && state.pesan && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription>{state.pesan}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="passwordLama">Password saat ini</FieldLabel>
          <Input id="passwordLama" name="passwordLama" type="password" autoComplete="current-password" disabled={pending} />
        </Field>
        <Field>
          <FieldLabel htmlFor="passwordBaru">Password baru</FieldLabel>
          <Input id="passwordBaru" name="passwordBaru" type="password" autoComplete="new-password" disabled={pending} />
        </Field>
        <Field>
          <FieldLabel htmlFor="konfirmasi">Konfirmasi password baru</FieldLabel>
          <Input id="konfirmasi" name="konfirmasi" type="password" autoComplete="new-password" disabled={pending} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : "Simpan password baru"}
        </Button>
      </FieldGroup>
    </form>
  )
}
