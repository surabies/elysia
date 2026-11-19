'use client'

import * as React from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

import { HlsVideo } from '@/components/shared/HlsVideo'
import { SwipeHeading } from '@/components/shared/SwipeHeading'
import { HeroCommandHub } from '@/components/home/HeroCommandHub'
import type { HeroContent } from '@/types/home'

interface HeroSectionProps {
  content: HeroContent
}

export function HeroSection({ content }: HeroSectionProps) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Subtle scroll parallax & scale effect on the video column
  const videoY = useTransform(scrollYProgress, [0, 1], [0, 36])
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 0.97])

  return (
    <section
      ref={sectionRef}
      className="section-white relative isolate w-full overflow-hidden bg-transparent text-foreground"
    >
      {/* ====================================================================
          HERO AMBIENT BLUE + EMERALD GLOW & CROSSHAIR ANCHORS
          Menyatu langsung dengan garis kisi 64px global di LandingShell
          ==================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* 1. Ambient Diffused Radial Light Field (Biru Vercel #0070f3 + Hijau Emerald #10b981 seimbang di mobile & desktop) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(62% 55% at 74% 40%, rgba(0, 112, 243, 0.07) 0%, rgba(16, 185, 129, 0.035) 48%, transparent 100%), radial-gradient(48% 42% at 24% 25%, rgba(0, 112, 243, 0.045) 0%, rgba(16, 185, 129, 0.03) 55%, transparent 100%)',
          }}
        />

        {/* 2. Overhead Macro Architectural Grid (Kotak-kotak 62px x 62px memudar ke bawah dan memudar ke kiri & kanan, hanya tampak tipis di tengah) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:62px_62px] text-foreground/[0.05] dark:text-foreground/[0.06] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_15%,#000_15%,transparent_80%)] [-webkit-mask-image:radial-gradient(ellipse_65%_55%_at_50%_15%,#000_15%,transparent_80%)]"
        />

        {/* 3. Corner Crosshair Markers (+) menempel pada tiang garis vertikal */}
        <div className="mx-auto h-full max-w-360 px-4 lg:px-12 relative">
          <div className="h-full w-full relative">
            {/* Top-left crosshair */}
            <svg
              className="absolute -left-[4.5px] top-3 size-[9px] text-muted-foreground/40"
              viewBox="0 0 9 9"
              fill="none"
            >
              <path
                d="M4.5 0V9M0 4.5H9"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            {/* Top-right crosshair */}
            <svg
              className="absolute -right-[4.5px] top-3 size-[9px] text-muted-foreground/40"
              viewBox="0 0 9 9"
              fill="none"
            >
              <path
                d="M4.5 0V9M0 4.5H9"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto w-full max-w-360 px-4 lg:px-12 pt-2 md:pt-6 pb-8 md:pb-16 lg:pb-20">
        <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[1fr] md:gap-x-12 items-center">
          {/* Kolom Teks & Fast Command Hub */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col justify-center gap-3 sm:gap-4 md:gap-6 max-md:order-2 py-1 md:py-2"
          >
            <div className="w-full max-w-full">
              <SwipeHeading
                text={content.title}
                mobileText={"URUSAN AIR DALAM\nGENGGAMAN"}
              />
            </div>

            <p className="w-full max-w-xl text-xs sm:text-copy-15 md:text-copy-17 text-muted-foreground leading-relaxed font-normal">
              {content.description}
            </p>

            {/* Interactive Fast Command Hub */}
            <div className="w-full pt-1">
              <HeroCommandHub />
            </div>
          </motion.div>

          {/* Kolom Video: Tampil Penuh & Proporsional Tanpa Disempitkan */}
          <motion.div
            style={{ y: videoY, scale: videoScale }}
            className="relative w-full flex justify-center md:justify-end max-md:order-1 max-md:mb-2.5"
          >
            {/* Soft Ambient Blue & Emerald Halo Behind Video Frame */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-4xl bg-linear-to-tr from-[#0070f3]/12 via-emerald-500/8 to-transparent blur-2xl"
            />
            <div className="relative w-full aspect-4/5 max-md:max-h-[300px] sm:max-md:max-h-[360px] rounded-2xl md:rounded-3xl overflow-hidden bg-neutral-950 shadow-2xl shadow-neutral-950/15 ring-1 ring-neutral-900/10 md:h-[calc(100vh-140px)] md:max-h-220 md:w-auto">
              <HlsVideo
                src={content.videoSrc}
                poster="/images/hero-poster.webp"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
