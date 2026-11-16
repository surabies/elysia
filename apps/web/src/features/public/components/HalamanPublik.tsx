import * as React from "react"
import { Sparkles } from "@/components/ui/hugeicons-compat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Layout bersama untuk halaman layanan pelanggan yang ramah layar mobile & desktop */
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
    <div className="w-full bg-white text-black font-sans">
      {/* Header Banner - Mobile-First dengan Ambient Glow Mewah */}
      <section className="relative overflow-hidden border-b border-neutral-200/80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(14,165,233,0.12),rgba(255,255,255,0))] bg-white">
        {/* Subtle Decorative Grid Pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9 md:px-8 lg:py-12">
          {/* Live Telemetry Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/95 px-3 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider text-neutral-800 uppercase">
              {eyebrow}
            </span>
            <span className="h-3 w-px bg-neutral-200" />
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-neutral-500">
              <Sparkles className="size-3 text-amber-500" />
              Pelayanan Mandiri 24 Jam
            </span>
          </div>

          {/* Heading & Lede */}
          <h1 className="mt-4 sm:mt-5 max-w-3xl text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance text-black">
            {judul}
          </h1>
          <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed">
            {lede}
          </p>
        </div>
      </section>

      {/* Main Grid Content - Mobile optimized layout */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:grid-cols-12 lg:gap-8 lg:py-12 bg-white">
        <div className="min-w-0 lg:col-span-7 lg:col-start-6">{children}</div>
        <aside className="lg:order-first lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-24">{aside}</div>
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
    <Card
      aria-label={label}
      className="overflow-hidden rounded-2xl border border-neutral-200/85 bg-white text-black shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] transition-all hover:border-neutral-300 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)]"
    >
      <CardHeader className="pb-2 pt-3.5 px-4 sm:px-5">
        <CardTitle className="text-xs sm:text-heading-14 font-semibold text-neutral-900 tracking-tight">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="text-xs sm:text-copy-13 leading-relaxed text-neutral-600">
          {children}
        </div>
      </CardContent>
    </Card>
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
          className="relative flex gap-3 pb-4.5 last:pb-0"
        >
          {i < langkah.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-6 left-2.75 h-[calc(100%-1.1rem)] w-px bg-neutral-200"
            />
          )}
          <span className="flex size-5.5 sm:size-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 font-mono text-[10px] sm:text-[11px] font-semibold text-neutral-800 shadow-2xs">
            {i + 1}
          </span>
          <span className="flex flex-col gap-0.5 pt-0.5">
            <span className="text-xs sm:text-label-14 font-semibold text-black tracking-tight">
              {langkahItem.judul}
            </span>
            <span className="text-[11px] sm:text-copy-12 leading-relaxed text-neutral-600">
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
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-black shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]",
        className
      )}
    >
      {label && (
        <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-3 sm:px-6 sm:py-3.5 space-y-0">
          <CardTitle className="text-[10px] sm:text-label-11-mono font-semibold text-neutral-600 uppercase tracking-widest">
            {label}
          </CardTitle>
          {chip && (
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 font-mono text-[10px] sm:text-label-11-mono font-medium text-neutral-700 shadow-2xs">
              {chip}
            </span>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("p-4 sm:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
