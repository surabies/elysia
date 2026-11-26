import * as React from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

/** Layout bersama untuk halaman layanan pelanggan yang ramah layar mobile & desktop (Mendukung Light & Dark Mode) */
export function HalamanPublik({
  eyebrow,
  judul,
  lede,
  aside,
  children,
}: {
  eyebrow: string
  judul: string
  lede: string
  aside: React.ReactNode
  activeService?: string
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-transparent text-foreground font-sans">
      {/* Header Banner - Mobile-First dengan Ambient Glow Biru + Hijau Emerald Tipis */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_75%_60%_at_50%_-15%,rgba(0,112,243,0.09),rgba(16,185,129,0.04)_45%,transparent)]">
        <div className="relative mx-auto w-full max-w-360 px-4 py-6 sm:px-6 sm:py-9 lg:px-12 lg:py-12">
          {/* Heading & Lede */}
          <h1 className="max-w-3xl text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance text-foreground">
            {judul}
          </h1>
          <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
            {lede}
          </p>
        </div>
      </section>

      {/* Main Grid Content - Mobile optimized layout (Selebar Navbar max-w-360 px-4 lg:px-12) */}
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-12 bg-transparent">
        {/* Kolom Formulir Utama (Tampil pertama di mobile, interaktif) */}
        <div className="min-w-0 lg:col-span-7 lg:col-start-6">{children}</div>

        {/* Kolom Panduan & Referensi (Panel visual terpisah yang tegas agar tidak tertukar dengan input) */}
        <aside className="lg:order-first lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <div className="rounded-2xl border border-border/70 bg-muted/25 dark:bg-muted/10 p-4 sm:p-5 backdrop-blur-xs lg:sticky lg:top-24 space-y-4">
            {/* Header Blok Panduan yang tegas membedakan dengan Formulir Input */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Info className="size-3.5" />
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                    Panduan &amp; Bantuan
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-normal">
                    Referensi informasi pengisian
                  </p>
                </div>
              </div>
            </div>

            {/* Kumpulan Card Panduan */}
            <div className="flex flex-col gap-3.5">{aside}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function AsideBlok({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      aria-label={label}
      className="rounded-xl border border-border/70 bg-card/85 dark:bg-card/60 p-3.5 sm:p-4 shadow-none transition-colors hover:border-foreground/20 hover:bg-card"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary/70 shrink-0" />
        <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
          {label}
        </h3>
      </div>
      <div className="text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

export function LangkahList({
  langkah,
}: {
  langkah: readonly { judul: string; detail: string }[]
}) {
  return (
    <ol className="space-y-0">
      {langkah.map((langkahItem, i) => (
        <li
          key={langkahItem.judul}
          className="relative flex gap-3 pb-3.5 last:pb-0"
        >
          {i < langkah.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-5 left-2.75 h-[calc(100%-0.9rem)] w-px bg-border/60"
            />
          )}
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted font-mono text-[10px] font-semibold text-foreground shadow-2xs">
            {i + 1}
          </span>
          <span className="flex flex-col gap-0.5 pt-0.5">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {langkahItem.judul}
            </span>
            <span className="text-[11px] leading-relaxed text-muted-foreground">
              {langkahItem.detail}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function KartuBerbingkai({
  label,
  chip,
  className,
  contentClassName,
  children,
}: {
  label?: string
  chip?: string
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs",
        className
      )}
    >
      {label && (
        <div className="flex flex-row items-center justify-between border-b border-border/80 bg-muted/30 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
              {label}
            </h2>
          </div>
          {chip && (
            <span className="inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-0.5 font-mono text-[10px] sm:text-xs font-semibold text-muted-foreground">
              {chip}
            </span>
          )}
        </div>
      )}
      <div className={cn("p-4 sm:p-6", contentClassName)}>
        {children}
      </div>
    </div>
  )
}
