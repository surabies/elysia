'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowUpRight, Receipt, Camera, MapPin, Sparkles } from 'lucide-react'
import { Container } from '@/components/shared/Container'
import { ImageFrame } from '@/components/shared/ImageFrame'
import type { TicketingContent } from '@/types/home'

interface TicketingSectionProps {
  content: TicketingContent
}

const DEFAULT_META = [
  {
    title: 'Cek Tagihan & Riwayat 12 Bulan',
    badge: 'Langkah 01 · Instan',
    href: '/cek-tagihan',
    ctaLabel: 'Cek Tagihan Sekarang',
    icon: Receipt,
    accent: 'text-[#0070f3] dark:text-sky-400 bg-[#0070f3]/10 border-[#0070f3]/20',
  },
  {
    title: 'Lapor Stand Meter Mandiri',
    badge: 'Langkah 02 · Tgl 1–20',
    href: '/lapor-meter',
    ctaLabel: 'Kirim Foto Meter',
    icon: Camera,
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: 'Lapor & Lacak Pengaduan GIS',
    badge: 'Langkah 03 · Respon TRC',
    href: '/pengaduan-air',
    ctaLabel: 'Buat Tiket Pengaduan',
    icon: MapPin,
    accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
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
      className="section-white relative bg-transparent py-12 md:py-18 text-foreground"
    >
      <Container className="max-w-360 px-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <h2
              id="ticketing-title"
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
            <Sparkles className="size-3.5 text-[#0070f3]" />
            <span>Akses Langsung Tanpa Antre</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {content.items.map((item, idx) => {
            const fallback = DEFAULT_META[idx % DEFAULT_META.length]
            const Icon = fallback.icon
            const title = item.title || fallback.title
            const badge = item.badge || fallback.badge
            const href = item.href || fallback.href
            const ctaLabel = item.ctaLabel || fallback.ctaLabel

            return (
              <motion.div
                key={`${title}-${idx}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={href}
                  className="group relative flex h-full flex-col justify-between rounded-lg border border-border/80 bg-card p-4 sm:p-5 shadow-none transition-all duration-200 hover:border-foreground/20 hover:shadow-xs"
                >
                  <div>
                    {/* Visual Image Frame with Interactive Zoom */}
                    <div className="relative mb-4 overflow-hidden rounded-md border border-border/80 bg-neutral-950 aspect-16/10">
                      <ImageFrame
                        image={item.image}
                        sizes="(min-width: 1000px) 400px, 100vw"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 px-2.5 py-1 text-[10px] font-mono font-semibold text-white">
                          <Icon className="size-3 text-sky-400" />
                          <span>{badge}</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-heading-17 sm:text-heading-18 font-bold tracking-tight text-foreground group-hover:text-[#0070f3] dark:group-hover:text-sky-400 transition-colors">
                      {title}
                    </h3>

                    <p className="mt-1.5 text-copy-13 sm:text-copy-14 text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Interactive Bottom Action Bar */}
                  <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-3.5">
                    <span className="text-xs font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-sky-400 transition-colors">
                      {ctaLabel}
                    </span>
                    <span className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-muted/40 text-foreground transition-all group-hover:bg-foreground group-hover:border-foreground group-hover:text-background">
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
