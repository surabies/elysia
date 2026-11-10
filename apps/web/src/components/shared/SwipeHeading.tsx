import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

interface SwipeHeadingProps {
  text: string
  as?: "h1" | "h2"
  className?: string
}

/**
 * Judul yang kata-katanya naik satu per satu saat halaman dimuat.
 * Murni CSS (server component) — delay diatur lewat variabel `--index`.
 */
export function SwipeHeading({
  text,
  as: Tag = "h1",
  className,
}: SwipeHeadingProps) {
  const lines = text.split("\n")
  let globalWordIndex = 0

  return (
    <Tag className={cn("m-0 type-display text-black", className)}>
      {lines.map((line, lineIndex) => {
        const words = line.trim().split(/\s+/).filter(Boolean)
        return (
          <span key={`line-${lineIndex}`} className="block whitespace-nowrap">
            {words.map((word, wordIndex) => {
              globalWordIndex += 1
              const currentIndex = globalWordIndex
              return (
                <span
                  key={`${word}-${wordIndex}`}
                  style={{ "--index": currentIndex } as CSSProperties}
                  className="inline-block overflow-hidden"
                >
                  <span className="inline-block translate-y-full animate-swipe-up whitespace-pre motion-reduce:translate-y-0 motion-reduce:animate-none">
                    {wordIndex < words.length - 1 ? `${word} ` : word}
                  </span>
                </span>
              )
            })}
          </span>
        )
      })}
    </Tag>
  )
}
