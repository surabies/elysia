import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function HalamanInfo({
  judul,
  deskripsi,
  actions,
  children,
  className,
}: {
  judul: string
  deskripsi: string
  badge?: string // Tetap dipertahankan di interface tipe agar backward-compatible tapi tidak dirender
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-20 sm:pb-24", className)}>
      {/* Enterprise Header Banner dengan Motion Masuk yang Mulus */}
      <header className="border-b border-border/80 pb-6 sm:pb-8 animate-content-fade-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-tight">
              {judul}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base leading-relaxed">
              {deskripsi}
            </p>
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2 pt-2 md:pt-0">
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area dengan Staggered Entrance Motion */}
      <div className="mt-8 sm:mt-10 space-y-10 sm:space-y-12 animate-content-fade-up animation-delay-100">
        {children}
      </div>
    </div>
  )
}

export function Bagian({
  judul,
  subjudul,
  actions,
  className,
  children,
}: {
  judul: string
  subjudul?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-2.5">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            {judul}
          </h2>
          {subjudul && (
            <p className="text-xs text-muted-foreground mt-0.5">{subjudul}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="pt-1">{children}</div>
    </section>
  )
}

export function KontenContoh({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs sm:text-sm text-muted-foreground transition-colors hover:border-primary/50">
      {children}
    </div>
  )
}
