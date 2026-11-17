"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

interface AutoHideHeaderProps {
  children: ReactNode
}

export function AutoHideHeader({ children }: AutoHideHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hidden, setHidden] = useState(false)

  const [scrolled, setScrolled] = useState(false)

  const revealHeader = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setHidden(false)
  }, [])

  useEffect(() => {
    let previousScrollY = window.scrollY
    setScrolled(previousScrollY > 8)

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 8)
      const menuOpen = headerRef.current?.querySelector('[data-open="true"]')

      if (currentScrollY <= 0 || currentScrollY < previousScrollY || menuOpen) {
        revealHeader()
      } else if (
        currentScrollY > previousScrollY &&
        hideTimeoutRef.current === null
      ) {
        hideTimeoutRef.current = setTimeout(() => setHidden(true), 250)
      }

      previousScrollY = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [revealHeader])

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
      } ${hidden ? "pointer-events-none -translate-y-full" : ""}`}
    >
      {children}
    </header>
  )
}
