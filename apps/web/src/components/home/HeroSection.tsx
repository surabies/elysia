import Link from 'next/link'

import { HlsVideo } from '@/components/shared/HlsVideo'
import { SwipeHeading } from '@/components/shared/SwipeHeading'
import { HeroCommandHub } from '@/components/home/HeroCommandHub'
import type { HeroContent } from '@/types/home'

interface HeroSectionProps {
  content: HeroContent
}

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="section-white mx-auto w-full max-w-360 px-4 lg:px-12 pt-3 md:pt-4 bg-white text-black">
      <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[1fr] md:gap-x-12 items-center">
        {/* Kolom Teks & Fast Command Hub */}
        <div className="w-full flex flex-col justify-center gap-5 max-md:order-2 md:gap-6 py-2">
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
        </div>

        {/* Kolom Video: Tampil Penuh & Proporsional Tanpa Disempitkan */}
        <div className="relative w-full flex justify-center md:justify-end max-md:order-1 max-md:mb-6">
          <div className="relative w-full aspect-4/5 rounded-3xl overflow-hidden bg-neutral-950 shadow-2xl shadow-cyan-950/15 border border-neutral-200/80 md:h-[calc(100vh-140px)] md:max-h-220 md:w-auto">
            <HlsVideo
              src={content.videoSrc}
              poster={content.poster ?? '/images/hero.jpg'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
