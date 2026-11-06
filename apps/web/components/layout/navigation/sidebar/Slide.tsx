// components/layout/navigation/sidebar/Slide.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/Utilitas"
import type { Direction } from "./types/Tipe"

/** Animasi geser tipis saat berganti tampilan (root <-> detail). */
export function Slide({
  direction,
  animate = true,
  children,
}: {
  direction: Direction
  animate?: boolean
  children: React.ReactNode
}) {
  const [entered, setEntered] = React.useState(!animate)

  React.useEffect(() => {
    if (!animate) return
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [animate])

  if (!animate) {
    return <div className="translate-x-0 opacity-100">{children}</div>
  }

  return (
    <div
      className={cn(
        "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
        entered
          ? "translate-x-0 opacity-100"
          : direction === "forward"
            ? "translate-x-4 opacity-0"
            : "-translate-x-4 opacity-0"
      )}
    >
      {children}
    </div>
  )
}
