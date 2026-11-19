"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { CheckCircle2, Sparkles } from "lucide-react"

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
  const [activeMobileIdx, setActiveMobileIdx] = React.useState(0)
  const [isMobilePaused, setIsMobilePaused] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const handleMobileScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const card = el.firstElementChild as HTMLElement | null
    const cardWidth = card ? card.offsetWidth : 300
    const idx = Math.round(scrollLeft / (cardWidth + 16))
    setActiveMobileIdx(Math.max(0, Math.min(idx, content.items.length - 1)))
  }

  // Auto-cycle mobile carousel setiap 4 detik (seperti iklan)
  React.useEffect(() => {
    if (isMobilePaused || content.items.length <= 1) return

    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) return

      setActiveMobileIdx((prev) => {
        const nextIdx = (prev + 1) % content.items.length
        const el = scrollContainerRef.current
        if (el) {
          const card = el.firstElementChild as HTMLElement | null
          const cardWidth = card ? card.offsetWidth : 300
          el.scrollTo({ left: nextIdx * (cardWidth + 16), behavior: "smooth" })
        }
        return nextIdx
      })
    }, 4000)

    return () => clearInterval(timer)
  }, [isMobilePaused, content.items.length])

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
          {/* Header Seksi (Tanpa Badge) */}
          <div className="mb-6 md:mb-10">
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

          {/* ========================================================
              TAMPILAN KHUSUS MOBILE: HORIZONTAL CAROUSEL AUTO-CYCLE
              ======================================================== */}
          <div className="block lg:hidden">
            <div
              ref={scrollContainerRef}
              onScroll={handleMobileScroll}
              onMouseEnter={() => setIsMobilePaused(true)}
              onMouseLeave={() => setIsMobilePaused(false)}
              onTouchStart={() => setIsMobilePaused(true)}
              onTouchEnd={() => setIsMobilePaused(false)}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-3"
            >
              {content.items.map((item, index) => {
                const desc =
                  item.description || DEFAULT_DESCRIPTIONS[index % DEFAULT_DESCRIPTIONS.length]
                const metric =
                  item.metric || DEFAULT_METRICS[index % DEFAULT_METRICS.length]

                return (
                  <div
                    key={`mob-${item.title}-${index}`}
                    className="w-[85vw] max-w-[340px] shrink-0 snap-center rounded-lg border border-border/80 bg-card p-4 shadow-none flex flex-col justify-between"
                  >
                    <div>
                      {/* Visual Foto Miniatur */}
                      <div className="relative aspect-16/10 w-full overflow-hidden rounded-md bg-neutral-950 mb-3 border border-border/80">
                        <ImageFrame
                          image={item.image}
                          sizes="(max-width: 768px) 340px, 480px"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 flex items-end justify-between">
                          <span className="font-mono text-[10px] font-semibold text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            {metric}
                          </span>
                          <span className="font-mono text-[10px] text-white/80">
                            0{index + 1}/0{content.items.length}
                          </span>
                        </div>
                      </div>

                      {/* Icon + Title + Description */}
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/50">
                          <Image
                            src={item.icon.src}
                            alt={item.icon.alt}
                            width={20}
                            height={20}
                            unoptimized
                            className="size-4.5 dark:invert"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Indikator Titik Carousel Khusus Mobile */}
            {content.items.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
                {content.items.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => {
                      const el = scrollContainerRef.current
                      if (!el) return
                      const card = el.firstElementChild as HTMLElement | null
                      const cardWidth = card ? card.offsetWidth : 300
                      el.scrollTo({ left: dotIdx * (cardWidth + 16), behavior: "smooth" })
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                      dotIdx === activeMobileIdx
                        ? "w-5 bg-foreground"
                        : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                    )}
                    aria-label={`Lihat keunggulan ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ========================================================
              TAMPILAN KHUSUS DESKTOP (>= 1024px): SHOWCASE & SELECTOR
              ======================================================== */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:items-center gap-8">
            {/* Kolom Kiri: Visual Showcase Interaktif */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card p-2 shadow-none">
                <div className="relative grid aspect-4/5 overflow-hidden rounded-md bg-neutral-950">
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
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                        <HaloBadge
                          variant="outline"
                          className="text-[11px] font-mono font-semibold text-emerald-300 border-emerald-400/40"
                        >
                          {item.metric || DEFAULT_METRICS[index % DEFAULT_METRICS.length]}
                        </HaloBadge>
                        <p className="mt-1.5 text-sm sm:text-base font-semibold text-white/95 leading-snug line-clamp-2">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Interactive Feature Selector Cards (Style Dashboard Card Konsisten) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
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
