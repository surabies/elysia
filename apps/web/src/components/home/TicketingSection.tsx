'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { Receipt, Camera, MapPin } from 'lucide-react'
import { Container } from '@/components/shared/Container'
import { HaloBadge } from '@/components/ui/halo-badge'
import {
  OrganicCard,
  OrganicCardBand,
  OrganicCardBody,
  OrganicCardDescription,
  OrganicCardEyebrow,
  OrganicCardFooter,
  OrganicCardFooterIcon,
  OrganicCardFooterLabel,
  OrganicCardImage,
  OrganicCardTitle,
} from '@/components/ui/organic-card'
import { cn } from '@/lib/utils'
import type { TicketingContent } from '@/types/home'

interface TicketingSectionProps {
  content: TicketingContent
}

const DEFAULT_META = [
  {
    title: 'Cek Tagihan & Riwayat 12 Bulan',
    eyebrow: 'Layanan Keuangan · Langkah 01',
    badge: 'Langkah 01 · Instan',
    href: '/cek-tagihan',
    ctaLabel: 'Cek Tagihan Sekarang',
    icon: Receipt,
    accentIcon: 'text-sky-400',
    hoverIconBg: 'group-hover/organic-card:bg-[#0070f3] group-hover/organic-card:text-white',
    hoverTitle: 'group-hover/organic-card:text-[#0070f3] dark:group-hover/organic-card:text-sky-400',
    hoverLabel: 'group-hover/organic-card:text-[#0070f3] dark:group-hover/organic-card:text-sky-400',
    image: '/images/layanan/tagihan.png',
  },
  {
    title: 'Lapor Stand Meter Mandiri',
    eyebrow: 'Pencatatan Mandiri · Langkah 02',
    badge: 'Langkah 02 · Tgl 1–20',
    href: '/lapor-meter',
    ctaLabel: 'Kirim Foto Meter',
    icon: Camera,
    accentIcon: 'text-emerald-400',
    hoverIconBg: 'group-hover/organic-card:bg-emerald-600 group-hover/organic-card:text-white',
    hoverTitle: 'group-hover/organic-card:text-emerald-600 dark:group-hover/organic-card:text-emerald-400',
    hoverLabel: 'group-hover/organic-card:text-emerald-600 dark:group-hover/organic-card:text-emerald-400',
    image: '/images/layanan/lapor.png',
  },
  {
    title: 'Lapor & Lacak Pengaduan GIS',
    eyebrow: 'Bantuan & Darurat · Langkah 03',
    badge: 'Langkah 03 · Respon TRC',
    href: '/pengaduan-air',
    ctaLabel: 'Buat Tiket Pengaduan',
    icon: MapPin,
    accentIcon: 'text-amber-400',
    hoverIconBg: 'group-hover/organic-card:bg-amber-600 group-hover/organic-card:text-white',
    hoverTitle: 'group-hover/organic-card:text-amber-600 dark:group-hover/organic-card:text-amber-400',
    hoverLabel: 'group-hover/organic-card:text-amber-600 dark:group-hover/organic-card:text-amber-400',
    image: '/images/layanan/peta.png',
  },
] as const

export function TicketingSection({ content: initialContent }: TicketingSectionProps) {
  const [content, setContent] = React.useState<TicketingContent>(initialContent)
  const [activeMobileIdx, setActiveMobileIdx] = React.useState(0)
  const [isMobilePaused, setIsMobilePaused] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const handleMobileScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const card = el.firstElementChild as HTMLElement | null
    const cardWidth = card ? card.offsetWidth : el.clientWidth
    const idx = Math.round(scrollLeft / (cardWidth + 16))
    setActiveMobileIdx(Math.max(0, Math.min(idx, content.items.length - 1)))
  }

  // Auto-cycle bergerak otomatis setiap 4 detik pada tampilan mobile (seperti iklan)
  React.useEffect(() => {
    if (isMobilePaused || content.items.length <= 1) return

    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return

      setActiveMobileIdx((prev) => {
        const nextIdx = (prev + 1) % content.items.length
        const el = scrollContainerRef.current
        if (el) {
          const card = el.firstElementChild as HTMLElement | null
          const cardWidth = card ? card.offsetWidth : el.clientWidth
          el.scrollTo({ left: nextIdx * (cardWidth + 16), behavior: 'smooth' })
        }
        return nextIdx
      })
    }, 4000)

    return () => clearInterval(timer)
  }, [isMobilePaused, content.items.length])

  // Sinkronisasi dinamis dengan backend & dashboard (/broadcast)
  React.useEffect(() => {
    try {
      const cached = localStorage.getItem('elysia_landing_cms')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.ticketing) setContent(parsed.ticketing)
      }
    } catch {}

    fetch('/api/broadcast/landing-sections')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.ticketing) {
          setContent(json.data.ticketing)
          try {
            localStorage.setItem('elysia_landing_cms', JSON.stringify(json.data))
          } catch {}
        }
      })
      .catch(() => {})

    function handleCmsUpdate() {
      try {
        const cached = localStorage.getItem('elysia_landing_cms')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.ticketing) setContent(parsed.ticketing)
        }
      } catch {}
    }

    window.addEventListener('storage', handleCmsUpdate)
    window.addEventListener('elysia:landing-cms-updated', handleCmsUpdate)
    return () => {
      window.removeEventListener('storage', handleCmsUpdate)
      window.removeEventListener('elysia:landing-cms-updated', handleCmsUpdate)
    }
  }, [])

  return (
    <section
      id="layanan-mandiri"
      aria-labelledby="ticketing-title"
      className="section-white relative bg-transparent py-12 md:py-20 text-foreground"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 md:mb-10"
        >
          <h2
            id="ticketing-title"
            className="text-heading-24 sm:text-heading-28 md:text-heading-32 font-bold tracking-tight text-foreground"
          >
            {content.title}
          </h2>
          {content.subtitle && (
            <p className="mt-2 text-copy-14 sm:text-copy-15 max-w-2xl text-muted-foreground leading-relaxed">
              {content.subtitle}
            </p>
          )}
        </motion.div>

        {/* Mobile Carousel (1 Konten Penuh Lebar Layar), Grid di Layar Desktop */}
        <div
          ref={scrollContainerRef}
          onScroll={handleMobileScroll}
          onMouseEnter={() => setIsMobilePaused(true)}
          onMouseLeave={() => setIsMobilePaused(false)}
          onTouchStart={() => setIsMobilePaused(true)}
          onTouchEnd={() => setIsMobilePaused(false)}
          className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-3 md:pb-0"
        >
          {content.items.map((item, idx) => {
            const fallback = DEFAULT_META[idx % DEFAULT_META.length]
            const title = item.title || fallback.title
            const badge = item.badge || fallback.badge
            const eyebrow = fallback.eyebrow
            const href = item.href || fallback.href
            const ctaLabel = item.ctaLabel || fallback.ctaLabel
            const imageSrc = item.image?.src || fallback.image
            const imageAlt = item.image?.alt || title

            return (
              <div
                key={`${title}-${idx}`}
                className="w-full shrink-0 snap-center md:w-auto md:shrink flex flex-col"
              >
                <OrganicCard
                  href={href}
                  className="w-full max-w-none h-full flex flex-col justify-between"
                >
                  <OrganicCardBody>
                    <div>
                      {/* Visual Image Preview with Floating Step Badge */}
                      <div className="relative mb-4 overflow-hidden rounded-xl bg-neutral-900/10 dark:bg-neutral-900/40">
                        <OrganicCardImage
                          src={imageSrc}
                          alt={imageAlt}
                          width={670}
                          height={280}
                          className="mb-0 h-[200px] w-full object-cover transition-transform duration-500 group-hover/calloutCard:scale-105 sm:h-[220px]"
                        />
                        <div className="absolute top-3 left-3 z-10">
                          <HaloBadge
                            variant="secondary"
                            className="text-[10px] font-mono font-semibold"
                          >
                            {badge}
                          </HaloBadge>
                        </div>
                      </div>

                      <OrganicCardEyebrow>
                        {eyebrow}
                      </OrganicCardEyebrow>

                      <OrganicCardTitle className={cn("line-clamp-2", fallback.hoverTitle)}>
                        {title}
                      </OrganicCardTitle>

                      <OrganicCardDescription className="line-clamp-3">
                        {item.description}
                      </OrganicCardDescription>
                    </div>
                  </OrganicCardBody>

                  <OrganicCardBand />

                  <OrganicCardFooter>
                    <OrganicCardFooterLabel className={fallback.hoverLabel}>
                      {ctaLabel}
                    </OrganicCardFooterLabel>
                    <OrganicCardFooterIcon className={fallback.hoverIconBg} />
                  </OrganicCardFooter>
                </OrganicCard>
              </div>
            )
          })}
        </div>

        {/* Indikator Titik Carousel Khusus Mobile */}
        {content.items.length > 1 && (
          <div className="flex md:hidden items-center justify-center gap-1.5 pt-3 pb-1">
            {content.items.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => {
                  const el = scrollContainerRef.current
                  if (!el) return
                  const card = el.firstElementChild as HTMLElement | null
                  const cardWidth = card ? card.offsetWidth : el.clientWidth
                  el.scrollTo({ left: dotIdx * (cardWidth + 16), behavior: 'smooth' })
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  dotIdx === activeMobileIdx
                    ? "w-5 bg-foreground"
                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                )}
                aria-label={`Lihat layanan ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
