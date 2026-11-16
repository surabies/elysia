"use client"

// features/public/components/LacakTiketFormulir.tsx — pantau status pengaduan
// lewat nomor tiket.
//
// TANPA verifikasi identitas, dan itu aman KARENA `nomorTiket` berformat
// TW-YYMM-XXXXXX dengan 6 karakter ACAK (≈1,07 miliar kemungkinan per
// bulan) — bukan nomor urut. Nomor tiket berperan sebagai kunci pembawa:
// yang memegangnya berhak melihat, menutup, dan membuka kembali tiketnya.
//
// KALAU FORMAT NOMOR TIKET SUATU SAAT DIBUAT BERURUTAN, form ini WAJIB
// dikasih faktor kedua (mis. nomor HP pelapor) lebih dulu — kalau tidak,
// halaman ini berubah jadi alat memanen aduan seluruh warga. Lihat
// server/modules/pengaduan/tiket.ts.
import * as React from "react"
import { Search, TriangleAlert, Ticket, Sparkles } from "@/components/ui/hugeicons-compat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { lacakTiket, ApiError, type StatusTiket } from "../lib/api"
import { KartuTiket } from "./pelacakan/KartuTiket"
import { TombolUtama } from "./TombolUtama"

export function LacakTiketForm({ nomorAwal }: { nomorAwal?: string } = {}) {
  const [pending, setPending] = React.useState(false)
  const [pesanError, setPesanError] = React.useState<string | null>(null)
  const [tiket, setTiket] = React.useState<StatusTiket | null>(null)
  const [nomor, setNomor] = React.useState(nomorAwal ?? "")

  React.useEffect(() => {
    if (nomorAwal?.trim()) void ambil(nomorAwal.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function ambil(nomorTiket: string) {
    setPesanError(null)
    setPending(true)
    try {
      setTiket(await lacakTiket(nomorTiket))
    } catch (err) {
      setTiket(null)
      setPesanError(
        err instanceof ApiError && err.status === 404
          ? "Nomor tiket tidak ditemukan. Periksa kembali nomor yang Anda terima saat melapor."
          : err instanceof ApiError
            ? err.message
            : "Terjadi kesalahan. Coba lagi."
      )
    } finally {
      setPending(false)
    }
  }

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = nomor.trim()
    if (input) await ambil(input)
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-3">
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel
                htmlFor="nomorTiket"
                className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-neutral-700 uppercase"
              >
                <Ticket className="size-3.5 text-blue-600" />
                Nomor Tiket Pengaduan
              </FieldLabel>
              <span className="font-mono text-[11px] text-neutral-400">
                Format: TW-YYMM-XXXXXX
              </span>
            </div>

            <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  id="nomorTiket"
                  name="nomorTiket"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="TW-2607-4F2A9K"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value.toUpperCase())}
                  disabled={pending}
                  required
                  size="lg"
                  className="font-mono text-base tracking-wider uppercase rounded-xl border-neutral-300 focus-visible:ring-blue-500/20 focus-visible:border-blue-600 pr-9"
                />
                {nomor.length > 0 && !pending && (
                  <button
                    type="button"
                    onClick={() => setNomor("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
                    title="Hapus"
                  >
                    ✕
                  </button>
                )}
              </div>
              <TombolUtama
                type="submit"
                size="lg"
                className="w-full sm:w-auto px-6 rounded-xl font-medium shadow-sm transition-all"
                disabled={pending || !nomor.trim()}
              >
                {pending ? <Spinner className="size-4" /> : <Search className="size-4" />}
                {pending ? "Melacak Tiket…" : "Lacak Tiket"}
              </TombolUtama>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
              <FieldDescription className="text-xs text-neutral-500">
                Kunci pelacakan yang terbit setelah pengaduan dikirimkan.
              </FieldDescription>
              <button
                type="button"
                onClick={() => setNomor("TW-2607-4F2A9K")}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200/90 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-blue-700 hover:bg-blue-50/80 transition-colors"
              >
                <Sparkles className="size-3 text-amber-500" />
                Contoh: TW-2607-4F2A9K
              </button>
            </div>
          </Field>

          {pesanError && (
            <Alert variant="destructive" className="rounded-xl">
              <TriangleAlert />
              <AlertDescription>{pesanError}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>

      {tiket && (
        <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] overflow-hidden">
          <KartuTiket tiket={tiket} onPerbarui={() => ambil(tiket.nomorTiket)} />
        </div>
      )}
    </div>
  )
}
