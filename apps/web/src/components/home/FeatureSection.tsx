"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { Check } from "lucide-react"

import { Container } from "@/components/shared/Container"
import { PillButton } from "@/components/shared/PillButton"
import { SwipeRevealMedia } from "@/components/shared/SwipeRevealMedia"
import { cn } from "@/lib/utils"
import type { FeatureMedia, FeatureSectionContent } from "@/types/home"
import { MockupLaporMeter } from "./MockupLaporMeter"
import { MockupPengaduan } from "./MockupPengaduan"

interface FeatureSectionProps {
  section: FeatureSectionContent
}

function FeatureMediaView({ media }: { media: FeatureMedia }) {
  if (media.type === "mockup") {
    if (media.name === "lapor-meter") {
      return <MockupLaporMeter />
    }
    return <MockupPengaduan />
  }

  if (media.type === "image") {
    return (
      <div className="group relative overflow-hidden rounded-md border border-border/80 bg-neutral-950 shadow-none">
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          unoptimized
          sizes="(min-width: 1280px) 516px, (min-width: 768px) 50vw, 100vw"
          className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-103"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold">Jaringan Distribusi Aktif</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-300">Kota Bandung</span>
        </div>
      </div>
    )
  }

  if (media.type === "video") {
    return (
      <video
        src={media.src}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="aspect-4/5 h-auto w-full rounded-md border border-border/80 object-cover shadow-none"
      />
    )
  }

  return null
}

export function FeatureSection({ section: initialSection }: FeatureSectionProps) {
  const [section, setSection] = React.useState<FeatureSectionContent>(initialSection)

  // Sinkronisasi dinamis dengan backend & dashboard (/broadcast)
  React.useEffect(() => {
    function applyFromData(featuresList?: FeatureSectionContent[]) {
      if (!Array.isArray(featuresList)) return
      const found = featuresList.find((f) => f.id === initialSection.id)
      if (found) setSection((prev) => ({ ...prev, ...found }))
    }

    try {
      const cached = localStorage.getItem("elysia_landing_cms")
      if (cached) {
        const parsed = JSON.parse(cached)
        applyFromData(parsed?.features)
      }
    } catch {}

    fetch("/api/broadcast/landing-sections")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.features) {
          applyFromData(json.data.features)
        }
      })
      .catch(() => {})

    function handleCmsUpdate() {
      try {
        const cached = localStorage.getItem("elysia_landing_cms")
        if (cached) {
          const parsed = JSON.parse(cached)
          applyFromData(parsed?.features)
        }
      } catch {}
    }

    window.addEventListener("storage", handleCmsUpdate)
    window.addEventListener("elysia:landing-cms-updated", handleCmsUpdate)
    return () => {
      window.removeEventListener("storage", handleCmsUpdate)
      window.removeEventListener("elysia:landing-cms-updated", handleCmsUpdate)
    }
  }, [initialSection.id])

  const { id, badge, title, description, highlights, stats, media, mediaPosition, cta } = section
  const titleId = `${id}-title`

  return (
    <section
      aria-labelledby={titleId}
      className="section-white relative bg-transparent py-12 text-foreground lg:py-18"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "flex flex-col gap-8 rounded-lg border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-none transition-all hover:border-foreground/20 hover:shadow-xs md:items-center lg:gap-12",
            mediaPosition === "right" ? "md:flex-row-reverse" : "md:flex-row"
          )}
        >
          {/* Kolom Media */}
          <div className="w-full md:w-5/12 lg:w-5/12 shrink-0 overflow-hidden rounded-md">
            <SwipeRevealMedia>
              <FeatureMediaView media={media} />
            </SwipeRevealMedia>
          </div>

          {/* Kolom Konten Interaktif */}
          <div className="flex flex-1 flex-col justify-center space-y-5">
            <h2
              id={titleId}
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight"
            >
              {title}
            </h2>

            <p className="text-sm sm:text-base whitespace-pre-line text-muted-foreground leading-relaxed">
              {description}
            </p>

            {/* Daftar Poin Keunggulan */}
            {highlights && highlights.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-2.5 stroke-[2.5]" />
                    </span>
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Baris Statistik Ringkas */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {stats.map((st, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-border/80 bg-muted/30 px-3 py-2.5 shadow-none text-center sm:text-left"
                  >
                    <p className="font-mono text-sm sm:text-base font-bold text-foreground">
                      {st.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {cta ? (
              <div className="pt-2">
                <PillButton asChild className="uppercase text-xs sm:text-xs font-semibold tracking-wider cursor-pointer">
                  <Link href={cta.href}>
                    {cta.label}
                  </Link>
                </PillButton>
              </div>
            ) : null}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
