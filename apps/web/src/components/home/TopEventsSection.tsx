"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useAnimationFrame, useMotionValue } from "motion/react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"

import { EventCard } from "@/components/home/EventCard"
import { Container } from "@/components/shared/Container"
import { PillButton } from "@/components/shared/PillButton"
import type { TopEventsContent } from "@/types/home"

interface TopEventsSectionProps {
  content: TopEventsContent
}

export function TopEventsSection({ content }: TopEventsSectionProps) {
  const x = useMotionValue(0)
  const xPos = React.useRef(0)
  const isHovered = React.useRef(false)
  const isManuallyPaused = React.useRef(false)
  const [isPlaying, setIsPlaying] = React.useState(true)
  const singleSetRef = React.useRef<HTMLUListElement>(null)
  const singleSetWidthRef = React.useRef(0)

  // Ukur lebar satu set kartu layanan setelah mount dan saat resize window
  React.useEffect(() => {
    function ukur() {
      if (singleSetRef.current) {
        const width = singleSetRef.current.offsetWidth
        singleSetWidthRef.current = width > 0 ? width + 16 : 0
      }
    }
    ukur()
    window.addEventListener("resize", ukur)
    return () => window.removeEventListener("resize", ukur)
  }, [content.events])

  // Animasi bergerak horizontal berkelanjutan menggunakan useAnimationFrame (60/120fps)
  useAnimationFrame((_, delta) => {
    if (!isPlaying || isHovered.current || isManuallyPaused.current) return
    const singleWidth = singleSetWidthRef.current
    if (singleWidth <= 0) return

    // Kecepatan 34 pixel per detik (halus dan nyaman dibaca)
    const speed = 34
    xPos.current -= (speed * delta) / 1000

    // Wrap mulus saat mencapai ujung satu set kartu
    if (xPos.current <= -singleWidth) {
      xPos.current += singleWidth
    }
    x.set(xPos.current)
  })

  // Tombol navigasi manual geser maju/mundur
  const handleGeser = (arah: "kiri" | "kanan") => {
    const singleWidth = singleSetWidthRef.current
    const step = 326 // Lebar kartu HoloCard (310px) + gap (16px)
    if (arah === "kiri") {
      xPos.current += step
      if (xPos.current > 0 && singleWidth > 0) {
        xPos.current -= singleWidth
      }
    } else {
      xPos.current -= step
      if (singleWidth > 0 && xPos.current <= -singleWidth) {
        xPos.current += singleWidth
      }
    }
    x.set(xPos.current)
  }

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev
      isManuallyPaused.current = !next
      return next
    })
  }

  return (
    <section
      aria-labelledby="top-events-title"
      className="section-white relative overflow-hidden bg-background py-12 md:py-16 text-foreground"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Seksi Layanan Unggulan */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h2
                id="top-events-title"
                className="text-heading-24 sm:text-heading-28 md:text-heading-32 font-bold tracking-tight text-foreground"
              >
                {content.title}
              </h2>
              <span className="hidden sm:inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-label-12 font-mono font-medium text-muted-foreground">
                {content.events.length} Layanan Aktif
              </span>
            </div>

            {/* Kontrol Navigasi & Motion Tracker */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Jeda animasi kartu" : "Putar animasi kartu"}
                title={isPlaying ? "Jeda animasi" : "Putar animasi"}
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-2xs transition hover:bg-muted active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleGeser("kiri")}
                aria-label="Geser ke kiri"
                title="Geser sebelumnya"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-2xs transition hover:bg-muted active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleGeser("kanan")}
                aria-label="Geser ke kanan"
                title="Geser berikutnya"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-2xs transition hover:bg-muted active:scale-95 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <p className="text-copy-14 sm:text-copy-15 max-w-2xl text-muted-foreground leading-relaxed">
              {content.description}
            </p>
            <div className="shrink-0">
              <PillButton asChild>
                <Link href={content.cta.href}>{content.cta.label}</Link>
              </PillButton>
            </div>
          </div>
        </motion.div>
      </Container>

      {/* Rel marquee dinamis bergerak menggunakan motion */}
      <div
        className="relative overflow-hidden py-2 select-none"
        onMouseEnter={() => {
          isHovered.current = true
        }}
        onMouseLeave={() => {
          isHovered.current = false
        }}
        onTouchStart={() => {
          isHovered.current = true
        }}
        onTouchEnd={() => {
          isHovered.current = false
        }}
      >
        <motion.div
          style={{ x }}
          className="flex gap-4 will-change-transform"
        >
          {/* Set 1: Kartu Utama (diukur lebarnya) */}
          <ul
            ref={singleSetRef}
            className="flex gap-4 shrink-0 m-0 p-0 list-none ps-4 md:ps-8"
          >
            {content.events.map((event) => (
              <EventCard key={`set1-${event.id}`} event={event} />
            ))}
          </ul>

          {/* Set 2: Duplikasi Seamless Loop */}
          <ul
            aria-hidden="true"
            className="flex gap-4 shrink-0 m-0 p-0 list-none"
          >
            {content.events.map((event) => (
              <EventCard key={`set2-${event.id}`} event={event} />
            ))}
          </ul>

          {/* Set 3: Duplikasi untuk Monitor Lebar */}
          <ul
            aria-hidden="true"
            className="flex gap-4 shrink-0 m-0 p-0 list-none pe-4 md:pe-8"
          >
            {content.events.map((event) => (
              <EventCard key={`set3-${event.id}`} event={event} />
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
