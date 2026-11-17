"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"

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
      <Image
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        unoptimized
        sizes="(min-width: 1280px) 516px, (min-width: 768px) 50vw, 100vw"
        className="h-auto w-full rounded-4 object-cover"
      />
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
        className="aspect-4/5 h-auto w-full rounded-4 object-cover"
      />
    )
  }

  return null
}

/** Blok gambar/video + teks. Posisi media bergantian lewat `mediaPosition`. */
export function FeatureSection({ section }: FeatureSectionProps) {
  const { id, title, description, media, mediaPosition, cta } = section
  const titleId = `${id}-title`

  return (
    <section
      aria-labelledby={titleId}
      className="section-white relative bg-background py-16 text-foreground lg:py-24"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "flex flex-col md:gap-21.75",
            mediaPosition === "right" ? "md:flex-row-reverse" : "md:flex-row"
          )}
        >
          <div className="mb-4 flex flex-1 overflow-hidden rounded-4 md:mb-0">
            <SwipeRevealMedia>
              <FeatureMediaView media={media} />
            </SwipeRevealMedia>
          </div>

          {/* Mobile: elemen melebur agar judul bisa tampil di atas media. */}
          <div className="contents md:flex md:flex-1 md:flex-col md:justify-center md:gap-6.25">
            <h2
              id={titleId}
              className="text-heading-28 sm:text-heading-32 md:text-heading-40 max-md:order-first max-md:mb-4 font-semibold tracking-tight text-foreground"
            >
              {title}
            </h2>

            <p className="max-w-xl text-copy-15 md:text-copy-16 whitespace-pre-line text-muted-foreground leading-relaxed">
              {description}
            </p>

            {cta ? (
              <div className="flex justify-end max-md:mt-4.5 md:block">
                <PillButton asChild className="inline-flex">
                  <Link href={cta.href}>{cta.label}</Link>
                </PillButton>
              </div>
            ) : null}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
