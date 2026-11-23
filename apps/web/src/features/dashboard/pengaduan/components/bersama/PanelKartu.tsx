// features/dashboard/pengaduan/components/bersama/PanelKartu.tsx —
// Seksi datar (flat section) di dalam Panel Kanan tanpa container card pembungkus ganda,
// karena Panel Kanan (<aside>) sudah menjadi container utama.
import type * as React from "react"
import { cn } from "@/lib/utils"

export function PanelKartu({
  judul,
  ikon: Ikon,
  nada = "biasa",
  className,
  aksi,
  children,
}: {
  judul: string
  ikon?: React.ElementType
  /** "sukses" = ikon header berwarna --success (mis. blok penyelesaian). */
  nada?: "biasa" | "sukses"
  className?: string
  aksi?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-3 px-3.5 py-3.5", className)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Ikon && (
            <Ikon
              className={cn(
                "size-4",
                nada === "sukses" ? "text-success" : "text-muted-foreground"
              )}
            />
          )}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {judul}
          </h3>
        </div>
        {aksi && <div className="flex items-center">{aksi}</div>}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
