"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { CheckCircle2, Sparkles } from "lucide-react"

import { Container } from "@/components/shared/Container"
import { ImageFrame } from "@/components/shared/ImageFrame"
import { cn } from "@/lib/utils"
import type { BenefitsContent } from "@/types/home"

interface BenefitsSectionProps {
  content: BenefitsContent
}

const DEFAULT_DESCRIPTIONS = [
  "Setiap blok progresif pemakaian air (m³), beban tetap, dan pemeliharaan meter dirinci secara terbuka sesuai golongan tarif resmi.",
  "Setiap foto stand meter yang dikirim warga diperiksa secara berjenjang oleh verifikator sebelum disahkan menjadi dasar tagihan.",
  "Koordinat GPS laporan Anda diteruskan langsung ke regu teknisi terdekat lengkap dengan estimasi SLA dan bukti foto penyelesaian.",
]

const DEFAULT_METRICS = ["100% Transparan", "Verifikasi 3 Lapis", "Siaga < 6 Jam"]

export function BenefitsSection({ content: initialContent }: BenefitsSectionProps) {
  const [content, setContent] = React.useState<BenefitsContent>(initialContent)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)

  // Sinkronisasi dinamis dengan backend & dashboard (/broadcast)
  React.useEffect(() => {
    try {
      const cached = localStorage.getItem("elysia_landing_cms")
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.benefits) setContent(parsed.benefits)
      }
    } catch {}

    fetch("/api/broadcast/landing-sections")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.benefits) {
          setContent(json.data.benefits)
        }
      })
      .catch(() => {})

    function handleCmsUpdate() {
      try {
        const cached = localStorage.getItem("elysia_landing_cms")
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.benefits) setContent(parsed.benefits)
        }
      } catch {}
    }

    window.addEventListener("storage", handleCmsUpdate)
    window.addEventListener("elysia:landing-cms-updated", handleCmsUpdate)
    return () => {
      window.removeEventListener("storage", handleCmsUpdate)
      window.removeEventListener("elysia:landing-cms-updated", handleCmsUpdate)
    }
  }, [])

  // Auto-cycle halus setiap 4.5 detik jika tidak sedang di-hover
  React.useEffect(() => {
    if (isPaused || content.items.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % content.items.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, content.items.length])

  return (
    <section
      aria-labelledby="benefits-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="section-white relative bg-transparent py-14 text-foreground lg:py-22"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Seksi */}
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2
                id="benefits-title"
                className="text-heading-24 sm:text-heading-28 md:text-heading-32 font-bold tracking-tight text-foreground"
              >
                {content.title}
              </h2>
              {content.subtitle && (
                <p className="mt-1.5 text-copy-14 sm:text-copy-15 max-w-2xl text-muted-foreground leading-relaxed">
                  {content.subtitle}
                </p>
              )}
            </div>

            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-mono text-muted-foreground shadow-2xs shrink-0">
              <Sparkles className="size-3.5 text-emerald-500" />
              <span>Standar Pelayanan Terverifikasi</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Kolom Kiri: Visual Showcase Interaktif */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-lg">
                <div className="relative grid aspect-4/5 overflow-hidden rounded-2xl bg-neutral-950">
                  {content.items.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className={cn(
                        "col-start-1 row-start-1 h-full w-full transition-all duration-500 ease-out",
                        index === activeIndex
                          ? "opacity-100 scale-100 z-10"
                          : "opacity-0 scale-103 pointer-events-none z-0"
                      )}
                    >
                      <ImageFrame
                        image={item.image}
                        sizes="(min-width: 1280px) 480px, 100vw"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-300">
                          <CheckCircle2 className="size-3" />
                          {item.metric || DEFAULT_METRICS[index % DEFAULT_METRICS.length]}
                        </span>
                        <p className="mt-1.5 text-copy-13 font-semibold text-white line-clamp-2">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Interactive Feature Selector Cards */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              {content.items.map((item, index) => {
                const isActive = index === activeIndex
                const desc =
                  item.description || DEFAULT_DESCRIPTIONS[index % DEFAULT_DESCRIPTIONS.length]
                const metric =
                  item.metric || DEFAULT_METRICS[index % DEFAULT_METRICS.length]

                return (
                  <button
                    key={`${item.title}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "group relative w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer outline-none",
                      isActive
                        ? "border-[#0070f3]/50 bg-card shadow-md ring-1 ring-[#0070f3]/20"
                        : "border-border bg-card/60 hover:bg-card hover:border-foreground/25"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                          isActive
                            ? "border-[#0070f3]/30 bg-[#0070f3]/10"
                            : "border-border bg-muted/60"
                        )}
                      >
                        <Image
                          src={item.icon.src}
                          alt={item.icon.alt}
                          width={24}
                          height={24}
                          unoptimized
                          className="size-5.5 dark:invert"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Keunggulan 0{index + 1}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold border",
                              isActive
                                ? "bg-[#0070f3]/10 text-[#0070f3] dark:text-sky-400 border-[#0070f3]/30"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {metric}
                          </span>
                        </div>

                        <h3 className="text-heading-16 sm:text-heading-18 font-bold tracking-tight text-foreground leading-snug">
                          {item.title}
                        </h3>

                        <p className="mt-1.5 text-copy-13 text-muted-foreground leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
