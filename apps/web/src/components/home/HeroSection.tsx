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
      className="section-white mx-auto w-full max-w-360 px-4 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-18 lg:pb-24 bg-white text-black"
    >
      <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[1fr] md:gap-x-12 items-center">
        {/* Kolom Teks & Fast Command Hub */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col justify-center gap-5 max-md:order-2 md:gap-6 py-2"
        >
          <div className="w-full max-w-full">
            <SwipeHeading text={content.title} />
          </div>

          <p className="w-full max-w-xl text-copy-15 md:text-copy-17 text-neutral-600 leading-relaxed font-normal">
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
          className="relative w-full flex justify-center md:justify-end max-md:order-1 max-md:mb-6"
        >
          <div className="relative w-full aspect-4/5 rounded-3xl overflow-hidden bg-neutral-950 shadow-2xl shadow-cyan-950/15 border border-neutral-200/80 md:h-[calc(100vh-140px)] md:max-h-220 md:w-auto">
            <HlsVideo
              src={content.videoSrc}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
