"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useAnimationFrame, useMotionValue } from "motion/react"

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
    if (isHovered.current) return
    const singleWidth = singleSetWidthRef.current
    if (singleWidth <= 0) return

    // Clamp delta agar tidak melompat/berkedip setelah tab-switch atau jeda scroll mobile
    const safeDelta = Math.min(delta, 50)
    // Kecepatan 34 pixel per detik (halus dan nyaman dibaca)
    const speed = 34
    xPos.current -= (speed * safeDelta) / 1000

    // Wrap mulus saat mencapai ujung satu set kartu
    if (xPos.current <= -singleWidth) {
      xPos.current += singleWidth
    }
    x.set(xPos.current)
  })

  return (
    <section
      aria-labelledby="top-events-title"
      className="section-white relative overflow-hidden bg-transparent py-10 sm:py-14 md:py-18 text-foreground"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Seksi Layanan Unggulan */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2
                id="top-events-title"
                className="text-heading-24 sm:text-heading-28 md:text-heading-32 font-bold tracking-tight text-foreground"
              >
                {content.title}
              </h2>
              <p className="text-copy-13 sm:text-copy-15 max-w-2xl text-muted-foreground leading-relaxed mt-1.5">
                {content.description}
              </p>
            </div>

            <div className="shrink-0 self-start sm:self-end">
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
            className="flex gap-4 shrink-0 m-0 p-0 list-none pe-4 md:pe-8"
          >
            {content.events.map((event) => (
              <EventCard key={`set2-${event.id}`} event={event} />
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
