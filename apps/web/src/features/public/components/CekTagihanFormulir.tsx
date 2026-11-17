"use client"

import * as React from "react"
import { Search, TriangleAlert, CheckCircle2, CreditCard, Sparkles } from "@/components/ui/hugeicons-compat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cekTagihan, ApiError, type HasilCekTagihan } from "../lib/api"
import { HasilTagihan } from "./hasil-tagihan/index"
import { TombolUtama } from "./TombolUtama"
import { cn } from "@/lib/utils"

export function CekTagihanForm({ nomorAwal }: { nomorAwal?: string }) {
  const [nomorLangganan, setNomorLangganan] = React.useState(nomorAwal ?? "")
  const [pending, setPending] = React.useState(false)
  const [pesanError, setPesanError] = React.useState<string | null>(null)
  const [hasil, setHasil] = React.useState<HasilCekTagihan | null>(null)

  const isLengkap = nomorLangganan.length === 11

  async function cari(targetNomor?: string) {
    const nomor = (targetNomor ?? nomorLangganan).trim()
    if (nomor.length !== 11) {
      setPesanError("Nomor langganan harus 11 digit.")
      return
    }

    setPesanError(null)
    setHasil(null)
    setPending(true)
    try {
      setHasil(await cekTagihan({ nomorLangganan: nomor }))
    } catch (err) {
      setPesanError(
        err instanceof ApiError ? err.message : "Terjadi kesalahan. Coba lagi."
      )
    } finally {
      setPending(false)
    }
  }

  React.useEffect(() => {
    if (nomorAwal && nomorAwal.trim().length === 11) {
      void cari(nomorAwal.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomorAwal])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-border bg-card text-card-foreground p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <label
            htmlFor="nomorLangganan"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-foreground"
          >
            <CreditCard className="size-4 text-blue-600 dark:text-sky-400" />
            Nomor Langganan
          </label>
          <span
            className={cn(
              "font-mono text-[11px] sm:text-xs transition-colors",
              isLengkap
                ? "font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                : "text-muted-foreground"
            )}
          >
            {isLengkap ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-500" /> 11 / 11 Digit Siap
              </>
            ) : (
              `${nomorLangganan.length} / 11 Digit`
            )}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Input
              id="nomorLangganan"
              value={nomorLangganan}
              onChange={(e) =>
                setNomorLangganan(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              onKeyDown={(e) => e.key === "Enter" && cari()}
              inputMode="numeric"
              autoComplete="off"
              placeholder="00401700010"
              maxLength={11}
              disabled={pending}
              size="lg"
              className="w-full font-mono text-base tracking-wider rounded-xl border-border focus-visible:ring-blue-500/20 focus-visible:border-blue-600 pr-9"
            />
            {nomorLangganan.length > 0 && !pending && (
              <button
                type="button"
                onClick={() => setNomorLangganan("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                title="Hapus"
              >
                ✕
              </button>
            )}
          </div>
          <TombolUtama
            onClick={() => void cari()}
            disabled={pending || !isLengkap}
            size="lg"
            className="w-full sm:w-auto px-6 rounded-xl font-medium shadow-sm transition-all"
          >
            {pending ? <Spinner className="size-4" /> : <Search className="size-4" />}
            {pending ? "Mencari Data…" : "Cek Tagihan"}
          </TombolUtama>
        </div>

        {/* Demo Helper Pill */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="text-[11px] sm:text-xs">Tertera pada kwitansi atau struk pembayaran Anda.</p>
          <button
            type="button"
            onClick={() => setNomorLangganan("00401700010")}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 hover:bg-muted transition-colors"
          >
            <Sparkles className="size-3 text-amber-500" />
            Contoh: 00401700010
          </button>
        </div>

        {pesanError && (
          <Alert variant="destructive" className="mt-4 rounded-xl">
            <TriangleAlert />
            <AlertDescription>{pesanError}</AlertDescription>
          </Alert>
        )}
      </div>

      {hasil && (
        <div className="rounded-3xl border border-border bg-card text-card-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <HasilTagihan hasil={hasil} />
        </div>
      )}
    </div>
  )
}
