"use client"

import * as React from "react"
import { Loader2, Search, CheckCircle2, Sparkles } from "@/components/ui/hugeicons-compat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function InputNomorLangganan({
  id,
  nomor,
  onNomorChange,
  onCari,
  pending,
}: {
  id: string
  nomor: string
  onNomorChange: (digitBaru: string) => void
  onCari: (nomor: string) => void
  pending: boolean
}) {
  const isLengkap = nomor.length === 11

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs sm:text-sm font-semibold text-foreground">
          Nomor Langganan
        </Label>
        <span
          className={cn(
            "font-mono text-[11px] transition-colors",
            isLengkap
              ? "font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
              : "text-muted-foreground"
          )}
        >
          {isLengkap ? (
            <>
              <CheckCircle2 className="size-3 text-emerald-500" /> 11 / 11 Digit Siap
            </>
          ) : (
            `${nomor.length} / 11 Digit`
          )}
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={nomor}
            onChange={(e) =>
              onNomorChange(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            onKeyDown={(e) =>
              e.key === "Enter" && isLengkap && onCari(nomor)
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="00401700010"
            maxLength={11}
            disabled={pending}
            size="lg"
            className="w-full rounded-xl font-mono text-base tracking-wider pr-8 border-border focus-visible:ring-blue-500/20 focus-visible:border-blue-600"
          />
          {nomor.length > 0 && !pending && (
            <button
              type="button"
              onClick={() => onNomorChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              title="Hapus"
            >
              ✕
            </button>
          )}
        </div>

        <Button
          type="button"
          size="lg"
          className="shrink-0 rounded-xl px-4 sm:px-5 font-medium transition-all"
          onClick={() => onCari(nomor)}
          disabled={!isLengkap || pending}
          aria-label="Cari nomor pelanggan"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Cari</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-muted-foreground">
        <p className="text-[11px] sm:text-xs">
          {pending
            ? "Mencari data sambungan…"
            : "11 digit angka tertera pada rekening Anda."}
        </p>
        <button
          type="button"
          onClick={() => onNomorChange("00401700010")}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 hover:bg-muted transition-colors"
        >
          <Sparkles className="size-2.5 sm:size-3 text-amber-500" />
          Contoh: 00401700010
        </button>
      </div>
    </div>
  )
}

export const MasukanNomorLangganan = InputNomorLangganan
