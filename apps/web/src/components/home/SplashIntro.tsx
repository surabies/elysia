"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "motion/react"

import { splashConfig } from "@/data/splash"

type SplashPhase = "slides" | "logo" | "fading" | "done"

interface SplashIntroProps {
  onActiveChange?: (active: boolean) => void
}

export function SplashIntro({ onActiveChange }: SplashIntroProps) {
  const { slides, initialHoldMs, stepIntervalMs, logoHoldMs, fadeOutMs, skipLabel, logo } =
    splashConfig

  const [phase, setPhase] = React.useState<SplashPhase>("slides")
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  const triggerSkip = React.useCallback(() => {
    setPhase((prev) => {
      if (prev === "done") return "done"
      return prefersReducedMotion ? "done" : "fading"
    })
  }, [prefersReducedMotion])

  // Cek prefers-reduced-motion: jika aktif, lewati pergantian kata cepat dan langsung tampilkan fade logo singkat
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const reduced = mediaQuery.matches

    const frameId = window.requestAnimationFrame(() => {
      setPrefersReducedMotion(reduced)
      if (reduced) {
        setPhase("logo")
      }
    })

    const onMotionChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }
    mediaQuery.addEventListener("change", onMotionChange)

    return () => {
      window.cancelAnimationFrame(frameId)
      mediaQuery.removeEventListener("change", onMotionChange)
    }
  }, [])

  // Sinkronkan status aktif ke parent (untuk inert / aria-hidden) & kunci scroll body
  const isBlocking = phase === "slides" || phase === "logo"

  React.useEffect(() => {
    onActiveChange?.(isBlocking)
  }, [isBlocking, onActiveChange])

  React.useEffect(() => {
    if (!isBlocking) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isBlocking])

  // Sequence 1: Tahan slide pertama (initialHoldMs), lalu geser cepat tiap stepIntervalMs
  React.useEffect(() => {
    if (phase !== "slides" || prefersReducedMotion) return

    let intervalId: number | null = null
    const startTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1
          if (next >= slides.length) {
            if (intervalId !== null) window.clearInterval(intervalId)
            setPhase("logo")
            return prev
          }
          return next
        })
      }, stepIntervalMs)
    }, initialHoldMs)

    return () => {
      window.clearTimeout(startTimer)
      if (intervalId !== null) window.clearInterval(intervalId)
    }
  }, [phase, prefersReducedMotion, slides.length, initialHoldMs, stepIntervalMs])

  // Sequence 2: Tahan logo zoom-in (logoHoldMs), lalu fade-out seluruh splash
  React.useEffect(() => {
    if (phase !== "logo") return

    const holdDuration = prefersReducedMotion ? 500 : logoHoldMs
    const timer = window.setTimeout(() => {
      setPhase("fading")
    }, holdDuration)

    return () => window.clearTimeout(timer)
  }, [phase, logoHoldMs, prefersReducedMotion])

  // Sequence 3: Setelah fade-out selesai, unmount splash
  React.useEffect(() => {
    if (phase !== "fading") return

    const duration = prefersReducedMotion ? 250 : fadeOutMs
    const timer = window.setTimeout(() => {
      setPhase("done")
    }, duration)

    return () => window.clearTimeout(timer)
  }, [phase, fadeOutMs, prefersReducedMotion])

  // Shortcut tombol Escape untuk melewati splash
  React.useEffect(() => {
    if (!isBlocking) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        triggerSkip()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isBlocking, triggerSkip])

  if (phase === "done") {
    return null
  }

  // Tumpukan slide tersisa (dibalik agar slide aktif berada di paling atas seperti pola PLN)
  const remainingSlides = phase === "slides" ? slides.slice(currentIndex) : []
  const activeSlide = remainingSlides[0]
  const effectiveFadeSec = (prefersReducedMotion ? 250 : fadeOutMs) / 1000

  return (
    <motion.div
      data-tirtawening-splash=""
      role="dialog"
      aria-modal="true"
      aria-label="Pembuka halaman PERUMDA Tirtawening Kota Bandung"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "fading" ? 0 : 1 }}
      transition={{ duration: effectiveFadeSec, ease: "easeInOut" }}
      className={`fixed inset-0 z-50 h-svh w-full overflow-hidden bg-white select-none ${
        phase === "fading" ? "pointer-events-none" : ""
      }`}
    >
      {/* Pengumuman ramah pembaca layar */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {phase === "slides" && activeSlide
          ? `Layanan PERUMDA Tirtawening: ${activeSlide.text}`
          : "Memasuki beranda PERUMDA Tirtawening Kota Bandung"}
      </div>

      {/* Tombol Lewati kecil & jelas di pojok kanan atas */}
      {isBlocking ? (
        <button
          type="button"
          onClick={triggerSkip}
          className="absolute top-5 right-5 z-30 cursor-pointer rounded-full border border-neutral-300 bg-white/85 px-4 py-1.5 text-xs font-semibold tracking-wide text-neutral-800 shadow-xs backdrop-blur-sm transition-colors hover:border-neutral-400 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070f3] sm:top-7 sm:right-8 sm:text-sm"
        >
          {skipLabel}
        </button>
      ) : null}

      {/* Layer 1: Tumpukan Slide Foto + Tipografi Raksasa bg-clip-text (pola WidgetsSplash PLN) */}
      {remainingSlides
        .slice()
        .reverse()
        .map((slide) => (
          <div
            key={slide.id}
            className="absolute inset-0 h-full w-full bg-white"
          >
            <div
              className="relative flex h-full w-full items-center justify-center bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.image}), linear-gradient(135deg, #041b33 0%, #0d5ea6 55%, #38bdf8 100%)`,
              }}
            >
              {/* Lapisan putih semi-transparan di atas foto latar */}
              <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-white/70 px-4">
                <p
                  className="flex h-full w-full items-center justify-center bg-cover bg-center bg-clip-text text-center text-[clamp(3.25rem,13vw,13.5rem)] leading-[1.02] font-extrabold tracking-tight text-black/30"
                  style={{
                    backgroundImage: `url(${slide.image}), linear-gradient(135deg, #041b33 0%, #0d5ea6 55%, #38bdf8 100%)`,
                    WebkitBackgroundClip: "text",
                  }}
                >
                  {slide.text}
                </p>
              </div>
            </div>
          </div>
        ))}

      {/* Layer 2: Reveal Logo Brand Zoom-In di tengah layar putih */}
      {phase === "logo" || phase === "fading" ? (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-white px-6">
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0, scale: 1 }
                : { opacity: 0, scale: 0.5 }
            }
            animate={
              phase === "fading"
                ? { opacity: 0, scale: 1 }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration:
                phase === "fading"
                  ? effectiveFadeSec
                  : prefersReducedMotion
                    ? 0.25
                    : 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center justify-center gap-4 text-center sm:gap-5"
          >
            <div className="relative size-24 sm:size-32 md:size-36">
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 144px"
                priority
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold tracking-tight text-[#07284a] sm:text-4xl md:text-5xl">
                {logo.title}
              </span>
              <span className="mt-1 text-xs font-semibold tracking-[0.2em] text-neutral-600 uppercase sm:text-sm">
                {logo.subtitle}
              </span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </motion.div>
  )
}
