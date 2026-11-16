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
    <section className="mx-auto w-full max-w-360 px-4 lg:px-12 pt-4 md:pt-6 bg-white text-black">
      <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[1fr] md:gap-x-12 items-center">
        <div className="flex flex-col justify-center gap-5 max-md:order-2 md:gap-6 py-2">
          <div className="w-full max-w-full">
            <SwipeHeading text={content.title} />
          </div>

          <p className="max-w-xl text-copy-15 md:text-copy-17 text-neutral-600 leading-relaxed font-normal">
            {content.description}
          </p>

          {/* Interactive Fast Command Hub */}
          <div className="pt-1">
            <HeroCommandHub />
          </div>
        </div>

        <div className="flex justify-end overflow-hidden rounded-3xl max-md:order-1 max-md:mb-6 md:-mt-1 lg:-mt-2 shadow-2xl shadow-cyan-950/10">
          <div className="relative text-[0px] leading-0 w-full flex justify-end">
            <HlsVideo
              src={content.videoSrc}
              poster={content.poster ?? '/images/hero.jpg'}
              className="relative aspect-4/5 h-auto w-full rounded-3xl object-cover md:h-[calc(100vh-140px)] md:max-h-220 md:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
