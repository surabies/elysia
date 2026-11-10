import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Layout bersama untuk halaman layanan pelanggan yang selaras dengan navbar & footer (bg-white text-black). */
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
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white text-black font-sans">
      {/* Header Banner - Warna putih bersih selaras dengan Navbar & Footer */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 lg:py-14">
          <p className="text-label-12-mono font-semibold tracking-wider uppercase text-blue-600">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-heading-32 sm:text-heading-40 font-semibold tracking-tight text-balance text-black">
            {judul}
          </h1>
          <p className="mt-4 max-w-2xl text-copy-14 sm:text-copy-16 text-neutral-600 leading-relaxed">
            {lede}
          </p>
        </div>
      </section>

      {/* Main Grid Content - Warna putih bersih selaras */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-10 md:px-8 lg:grid-cols-12 lg:gap-8 lg:py-14 bg-white">
        <div className="min-w-0 lg:col-span-7 lg:col-start-6">{children}</div>
        <aside className="lg:order-first lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col gap-8 lg:sticky lg:top-24">{aside}</div>
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
    <Card aria-label={label} className="bg-white border-neutral-200 text-black shadow-sm">
      <CardHeader>
        <CardTitle className="text-heading-14 font-semibold text-black">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-copy-13 leading-relaxed text-neutral-600">
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
          className="relative flex gap-4 pb-6 last:pb-0"
        >
          {i < langkah.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-7 left-2.75 h-full w-px bg-neutral-200"
            />
          )}
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white font-mono text-label-11-mono font-semibold text-black">
            {i + 1}
          </span>
          <span className="flex flex-col gap-0.5 pt-0.5">
            <span className="text-label-14 font-medium text-black">{langkahItem.judul}</span>
            <span className="text-copy-12 leading-relaxed text-neutral-600">
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
  children,
}: {
  label?: string
  chip?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn("bg-white border-neutral-200 text-black shadow-sm", className)}>
      {label && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-label-11-mono font-semibold text-neutral-500 uppercase tracking-wider">
            {label}
          </CardTitle>
          {chip && (
            <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-label-11-mono font-medium text-neutral-700">
              {chip}
            </span>
          )}
        </CardHeader>
      )}
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}
