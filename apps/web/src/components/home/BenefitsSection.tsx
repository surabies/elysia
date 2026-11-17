"use client"

import Image from "next/image"
import { useState } from "react"
import { motion } from "motion/react"

import { Container } from "@/components/shared/Container"
import { ImageFrame } from "@/components/shared/ImageFrame"
import { MobileSlider } from "@/components/shared/MobileSlider"
import { cn } from "@/lib/utils"
import type { BenefitsContent } from "@/types/home"

interface BenefitsSectionProps {
  content: BenefitsContent
}

/**
 * Daftar keunggulan. Di ≥ md, item yang di-hover/fokus menjadi aktif dan
 * gambar di sebelahnya ikut berganti. Di mobile tampil sebagai slider.
 */
export function BenefitsSection({ content }: BenefitsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section
      aria-labelledby="benefits-title"
      className="section-white relative bg-background py-16 text-foreground lg:py-24"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:flex lg:flex-row-reverse lg:items-center lg:gap-21.75"
        >
          <div className="lg:w-full">
            <h2 id="benefits-title" className="mb-6 text-heading-28 sm:text-heading-32 md:text-heading-40 font-semibold tracking-tight text-foreground md:mb-8">
              {content.title}
            </h2>

            <MobileSlider>
              {content.items.map((item, index) => (
                <div
                  key={item.title}
                  tabIndex={0}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  className={cn(
                    "mb-7.5 last:mb-0 md:mb-0 md:cursor-pointer md:opacity-40 md:transition-opacity md:duration-150 md:ease-in",
                    index === activeIndex && "md:opacity-100"
                  )}
                >
                  <ImageFrame
                    image={item.image}
                    sizes="100vw"
                    className="mb-4 aspect-4/5 bg-muted md:hidden"
                  />

                  <div className="md:relative md:pl-10.5">
                    <h3 className="mb-5 block w-full text-center text-heading-18 leading-snug font-semibold text-foreground md:mb-2.5 md:flex md:text-left md:text-heading-24 lg:text-heading-28 tracking-tight">
                      <Image
                        src={item.icon.src}
                        alt={item.icon.alt}
                        width={32}
                        height={32}
                        unoptimized
                        className="hidden md:absolute md:top-0.5 md:left-0 md:block md:size-7 dark:invert"
                      />
                      <span className="whitespace-pre-line">{item.title}</span>
                    </h3>
                  </div>
                </div>
              ))}
            </MobileSlider>
          </div>

          {/* Gambar pendamping — hanya ≥ md; ditumpuk lalu cross-fade. */}
          <div className="hidden w-full md:grid">
            {content.items.map((item, index) => (
              <ImageFrame
                key={item.title}
                image={item.image}
                sizes="(min-width: 1280px) 516px, 50vw"
                className={cn(
                  "col-start-1 row-start-1 aspect-4/5 bg-muted transition-opacity duration-150 ease-in",
                  index === activeIndex ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
