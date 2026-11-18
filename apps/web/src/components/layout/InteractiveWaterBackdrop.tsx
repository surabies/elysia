"use client"

import * as React from "react"

/**
 * InteractiveWaterBackdrop
 * Ultra-Soft Architectural Grid & Dot Matrix:
 * - Garis & dot dibuat sangat tipis, samar-samar, dan lembut (alpha ~1.8%).
 * - Tidak ada garis tebal/tegas yang mendominasi mata.
 * - Saat kursor bergerak, pendaran air menyinari area kursor secara halus tanpa membuat garis kaku.
 */
export function InteractiveWaterBackdrop() {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [mouseActive, setMouseActive] = React.useState(false)

  // Tracking posisi kursor untuk CSS custom properties (--mouse-x, --mouse-y)
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId: number | null = null

    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        container.style.setProperty("--mouse-x", `${x}px`)
        container.style.setProperty("--mouse-y", `${y}px`)
        setMouseActive(true)
      })
    }

    const handlePointerLeave = () => {
      setMouseActive(false)
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    document.addEventListener("mouseleave", handlePointerLeave)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("mouseleave", handlePointerLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{
        ["--mouse-x" as any]: "-1000px",
        ["--mouse-y" as any]: "-1000px",
      }}
    >
      {/* 1. Gradien Cahaya Air Alami Sangat Lembut & Bersih (Tanpa Kotak-Kotak Grid) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 25% at 70% 8%, rgba(0, 112, 243, 0.06) 0%, rgba(16, 185, 129, 0.025) 45%, transparent 100%), " +
            "radial-gradient(50% 20% at 20% 12%, rgba(0, 112, 243, 0.04) 0%, rgba(16, 185, 129, 0.02) 50%, transparent 100%), " +
            "radial-gradient(55% 25% at 80% 40%, rgba(0, 112, 243, 0.035) 0%, rgba(16, 185, 129, 0.018) 50%, transparent 100%), " +
            "radial-gradient(55% 25% at 18% 68%, rgba(16, 185, 129, 0.03) 0%, rgba(0, 112, 243, 0.02) 55%, transparent 100%), " +
            "radial-gradient(60% 22% at 65% 92%, rgba(0, 112, 243, 0.035) 0%, rgba(16, 185, 129, 0.018) 50%, transparent 100%)",
        }}
      />

      {/* 2. Pendaran Cahaya Air Halus Mengikuti Kursor (Pure Soft Gradient Glow) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          mouseActive ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(450px circle at var(--mouse-x) var(--mouse-y), rgba(0, 112, 243, 0.045) 0%, rgba(16, 185, 129, 0.02) 40%, transparent 70%)",
        }}
      />
    </div>
  )
}
