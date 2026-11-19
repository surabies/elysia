"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

interface AutoHideHeaderProps {
  children: ReactNode
}

/**
 * Header navigasi responsif:
 * - Di mobile (< 768px): tetap sticky di atas agar tidak pernah hilang sendiri akibat
 *   momentum scroll / jitter sentuhan / address bar browser HP.
 * - Di desktop (>= 768px): auto-hide dengan deadzone scroll yang tegas (sembunyi hanya
 *   jika sengaja scroll turun >= 60px & sudah melewati 120px; langsung muncul saat scroll naik >= 12px).
 */
export function AutoHideHeader({ children }: AutoHideHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const revealHeader = useCallback(() => {
    setHidden(false)
  }, [])

  useEffect(() => {
    let previousScrollY = window.scrollY
    let accumulatedDelta = 0

    const syncInitial = () => setScrolled(window.scrollY > 8)
    const frameId = window.requestAnimationFrame(syncInitial)

    const handleScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY)
      setScrolled(currentScrollY > 8)

      const isMobile = window.innerWidth < 768
      const menuOpen = headerRef.current?.querySelector('[data-open="true"]')

      // Di mobile atau saat menu terbuka / dekat puncak halaman: selalu tampilkan header
      if (isMobile || menuOpen || currentScrollY <= 80) {
        accumulatedDelta = 0
        setHidden(false)
        previousScrollY = currentScrollY
        return
      }

      const delta = currentScrollY - previousScrollY

      // Reset akumulasi jika arah scroll berubah
      if ((delta > 0 && accumulatedDelta < 0) || (delta < 0 && accumulatedDelta > 0)) {
        accumulatedDelta = 0
      }
      accumulatedDelta += delta

      if (accumulatedDelta >= 60 && currentScrollY > 120) {
        setHidden(true)
        accumulatedDelta = 0
      } else if (accumulatedDelta <= -12) {
        setHidden(false)
        accumulatedDelta = 0
      }

      previousScrollY = currentScrollY
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setHidden(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <header
      ref={headerRef}
      onFocusCapture={revealHeader}
      data-scrolled={scrolled ? "true" : "false"}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0, 112, 243, 0.04) 0%, rgba(16, 185, 129, 0.03) 50%, rgba(0, 112, 243, 0.035) 100%)",
      }}
      className={`group/header sticky inset-x-0 top-0 z-40 bg-background/82 text-foreground backdrop-blur-xl border-b border-border/80 transition-transform duration-300 ease-in-out motion-reduce:transition-none has-data-[open=true]:max-md:bg-transparent has-data-[open=true]:max-md:backdrop-blur-none ${
        scrolled
          ? "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,112,243,0.06)] bg-background/90"
          : "shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
      } ${hidden ? "md:pointer-events-none md:-translate-y-full" : ""}`}
    >
      {children}
    </header>
  )
}
