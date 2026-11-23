"use client"

// components/layout/page/AreaTinggiLayar.tsx — kotak yang tingginya pas
// sisa layar (di bawah navbar/breadcrumb, di atas footer) sehingga halaman
// tidak ikut menggulir; isi di dalamnya yang menggulir.
import * as React from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { MAIN_CONTENT_ID } from "../shell/KonstantaDashboardShell"

const TINGGI_MIN = 360

export function AreaTinggiLayar({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const ref = useAreaTinggiLayar()

  return (
    <div ref={ref} className={cn("min-h-90", className)}>
      {children}
    </div>
  )
}

export function useAreaTinggiLayar() {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    function hitung() {
      if (!el) return
      const mainEl = document.getElementById(MAIN_CONTENT_ID)
      const viewportBottom = mainEl
        ? mainEl.getBoundingClientRect().bottom
        : window.innerHeight

      const rect = el.getBoundingClientRect()
      const parentEl = el.parentElement
      const grandParentEl = parentEl?.parentElement
      const pbParent = parentEl
        ? parseFloat(getComputedStyle(parentEl).paddingBottom) || 0
        : 0
      const pbGrandParent = grandParentEl
        ? parseFloat(getComputedStyle(grandParentEl).paddingBottom) || 0
        : 0
      const paddingBawah = Math.max(pbParent, pbGrandParent, 16)

      const tinggi = Math.max(
        TINGGI_MIN,
        Math.floor(viewportBottom - rect.top - paddingBawah)
      )
      el.style.height = `${tinggi}px`
    }

    hitung()
    const rAF = requestAnimationFrame(hitung)

    // Pantau perubahan ukuran saudara di atasnya (misal saat Panel Header atau Kartu KPI dilipat/dibuka)
    let ro: ResizeObserver | null = null
    const parentEl = el.parentElement
    if (parentEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(hitung)
      })
      for (const child of Array.from(parentEl.children)) {
        if (child !== el) {
          ro.observe(child)
        }
      }
    }

    window.addEventListener("resize", hitung)
    return () => {
      cancelAnimationFrame(rAF)
      ro?.disconnect()
      window.removeEventListener("resize", hitung)
    }
  }, [])

  return ref
}
