"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "motion/react"

import { Container } from "@/components/shared/Container"
import { ImageFrame } from "@/components/shared/ImageFrame"
import { HaloBadge } from "@/components/ui/halo-badge"
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
  const touchStartXRef = React.useRef<number | null>(null)

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

  // Auto-cycle bergerak otomatis setiap 4 detik seperti iklan jika tidak sedang di-hover/di-touch
  React.useEffect(() => {
    if (isPaused || content.items.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % content.items.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused, content.items.length])

  return (
    <section
      aria-labelledby="benefits-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="section-white relative bg-transparent py-12 text-foreground lg:py-20"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Seksi (Tanpa Badge) */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <h2
              id="benefits-title"
              className="text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight text-foreground leading-tight"
            >
              {content.title}
            </h2>
            {content.subtitle && (
              <p className="mt-2 text-sm sm:text-base max-w-2xl text-muted-foreground leading-relaxed font-normal">
                {content.subtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Visual Showcase Interaktif (Style Gambar Penuh, Bergerak Otomatis) */}
            <div className="lg:col-span-5">
              <div
                onTouchStart={(e) => {
                  setIsPaused(true)
                  touchStartXRef.current = e.touches[0].clientX
                }}
                onTouchEnd={(e) => {
                  setIsPaused(false)
                  if (touchStartXRef.current === null) return
                  const diff = touchStartXRef.current - e.changedTouches[0].clientX
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) {
                      setActiveIndex((prev) => (prev + 1) % content.items.length)
                    } else {
                      setActiveIndex((prev) => (prev > 0 ? prev - 1 : content.items.length - 1))
                    }
                  }
                  touchStartXRef.current = null
                }}
                className="relative overflow-hidden rounded-lg border border-border/80 bg-card p-2 shadow-none select-none"
              >
                <div className="relative grid aspect-4/5 overflow-hidden rounded-md bg-neutral-950">
                  {content.items.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className={cn(
                        "col-start-1 row-start-1 h-full w-full transition-all duration-700 ease-out",
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
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-5 text-white">
                        <HaloBadge
                          variant="outline"
                          className="text-[11px] font-mono font-semibold text-emerald-300 border-emerald-400/40"
                        >
                          {item.metric || DEFAULT_METRICS[index % DEFAULT_METRICS.length]}
                        </HaloBadge>
                        <p className="mt-1.5 text-base sm:text-lg font-semibold text-white/95 leading-snug line-clamp-2">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indikator Titik Navigasi Khusus Mobile */}
              {content.items.length > 1 && (
                <div className="flex lg:hidden items-center justify-center gap-1.5 pt-3">
                  {content.items.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveIndex(dotIdx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                        dotIdx === activeIndex
                          ? "w-5 bg-foreground"
                          : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                      )}
                      aria-label={`Lihat keunggulan ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Kolom Kanan: Interactive Feature Selector Cards (Khusus Desktop lg:, disembunyikan di Mobile) */}
            <div className="hidden lg:flex lg:col-span-7 flex-col gap-3">
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
                      "group relative w-full text-left rounded-lg border p-4 sm:p-5 transition-all duration-200 cursor-pointer outline-none shadow-none",
                      isActive
                        ? "border-foreground/30 bg-card ring-1 ring-foreground/15 shadow-xs"
                        : "border-border/80 bg-card/60 hover:bg-card hover:border-foreground/20 hover:shadow-xs"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-md border transition-colors",
                          isActive
                            ? "border-foreground/20 bg-muted/80"
                            : "border-border/80 bg-muted/40"
                        )}
                      >
                        <Image
                          src={item.icon.src}
                          alt={item.icon.alt}
                          width={24}
                          height={24}
                          unoptimized
                          className="size-5 dark:invert"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                            Keunggulan 0{index + 1}
                          </span>
                          <HaloBadge
                            variant={isActive ? "default" : "secondary"}
                            className="px-2.5 py-0.5 text-[10px] font-mono font-semibold"
                          >
                            {metric}
                          </HaloBadge>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 font-normal">
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
