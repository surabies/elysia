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

  // Pattern CSS: Garis Grid 32px dipadukan dengan Dot mikro di setiap persimpangan
  const gridAndDotPattern = `
    radial-gradient(circle at 0px 0px, currentColor 1px, transparent 1px),
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `

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
      {/* 1. Gradien Cahaya Air Alami Sangat Lembut */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 18% at 72% 5%, rgba(0, 112, 243, 0.05) 0%, rgba(16, 185, 129, 0.02) 48%, transparent 100%), " +
            "radial-gradient(50% 15% at 18% 8%, rgba(0, 112, 243, 0.03) 0%, rgba(16, 185, 129, 0.015) 55%, transparent 100%), " +
            "radial-gradient(55% 20% at 80% 34%, rgba(0, 112, 243, 0.03) 0%, rgba(16, 185, 129, 0.015) 50%, transparent 100%), " +
            "radial-gradient(55% 20% at 20% 62%, rgba(16, 185, 129, 0.025) 0%, rgba(0, 112, 243, 0.015) 55%, transparent 100%), " +
            "radial-gradient(60% 18% at 65% 88%, rgba(0, 112, 243, 0.03) 0%, rgba(16, 185, 129, 0.015) 50%, transparent 100%)",
        }}
      />

      {/* 2. LAYER UTAMA: Garis Grid & Dot Ultra-Soft (Super Faint ~1.8% Alpha) */}
      <div
        className="absolute inset-0 text-foreground/[0.018] dark:text-foreground/[0.016]"
        style={{
          backgroundImage: gridAndDotPattern,
          backgroundSize: "32px 32px",
          backgroundPosition: "0 0, 0 0, 0 0",
          maskImage:
            "radial-gradient(ellipse 75% 55% at 50% 18%, #000 20%, transparent 90%), linear-gradient(to bottom, #000 0%, #000 65%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 55% at 50% 18%, #000 20%, transparent 90%), linear-gradient(to bottom, #000 0%, #000 65%, transparent 100%)",
        }}
      />

      {/* 3. LAYER DINAMIS KURSOR: Pendaran Halus Tanpa Garis Tebal (Hanya ~7% Biru Air Lembut) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          mouseActive ? "opacity-100" : "opacity-0"
        } text-[#0070f3]/[0.07] dark:text-sky-400/[0.07]`}
        style={{
          backgroundImage: gridAndDotPattern,
          backgroundSize: "32px 32px",
          backgroundPosition: "0 0, 0 0, 0 0",
          maskImage:
            "radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), #000 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), #000 0%, transparent 100%)",
        }}
      />

      {/* 4. Tiang Pemandu Vertikal Ekstra Halus */}
      <div className="mx-auto h-full max-w-360 px-4 lg:px-12">
        <div className="h-full w-full border-x border-dashed border-border/12" />
      </div>
    </div>
  )
}
