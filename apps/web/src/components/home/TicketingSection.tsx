'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { Receipt, Camera, MapPin, Sparkles } from 'lucide-react'
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
      aria-labelledby="ticketing-title"
      className="section-white relative bg-transparent py-14 md:py-20 text-foreground"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
          <div>
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
          </div>

          <HaloBadge
            live
            variant="outline"
            className="hidden sm:inline-flex text-xs font-mono text-muted-foreground shrink-0"
          >
            Akses Langsung Tanpa Antre
          </HaloBadge>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {content.items.map((item, idx) => {
            const fallback = DEFAULT_META[idx % DEFAULT_META.length]
            const Icon = fallback.icon
            const title = item.title || fallback.title
            const badge = item.badge || fallback.badge
            const eyebrow = fallback.eyebrow
            const href = item.href || fallback.href
            const ctaLabel = item.ctaLabel || fallback.ctaLabel
            const imageSrc = item.image?.src || fallback.image
            const imageAlt = item.image?.alt || title

            return (
              <motion.div
                key={`${title}-${idx}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex"
              >
                <OrganicCard
                  href={href}
                  className="w-full max-w-none"
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
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
