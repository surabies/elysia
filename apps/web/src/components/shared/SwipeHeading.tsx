import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

interface SwipeHeadingProps {
  text: string
  mobileText?: string
  as?: "h1" | "h2"
  className?: string
  mobileClassName?: string
}

/**
 * Judul yang kata-katanya naik satu per satu saat halaman dimuat.
 * Mendukung teks khusus mobile (misal: 2 baris proporsional) dan desktop.
 * Murni CSS (server component) — delay diatur lewat variabel `--index`.
 */
export function SwipeHeading({
  text,
  mobileText,
  as: Tag = "h1",
  className,
  mobileClassName,
}: SwipeHeadingProps) {
  const renderLines = (contentStr: string) => {
    const lines = contentStr.split("\n")
    let globalWordIndex = 0

    return lines.map((line, lineIndex) => {
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
    })
  }

  if (mobileText) {
    return (
      <>
        {/* Tampilan Mobile: 2 baris presisi, ukuran huruf proporsional */}
        <Tag
          className={cn(
            "m-0 text-foreground md:hidden",
            mobileClassName ??
              "text-[24px] min-[360px]:text-[26px] min-[400px]:text-[30px] font-extrabold tracking-tight uppercase leading-[1.08]"
          )}
        >
          {renderLines(mobileText)}
        </Tag>

        {/* Tampilan Desktop: Standar type-display */}
        <Tag
          className={cn(
            "m-0 type-display text-foreground hidden md:block",
            className
          )}
        >
          {renderLines(text)}
        </Tag>
      </>
    )
  }

  return (
    <Tag className={cn("m-0 type-display text-foreground", className)}>
      {renderLines(text)}
    </Tag>
  )
}
