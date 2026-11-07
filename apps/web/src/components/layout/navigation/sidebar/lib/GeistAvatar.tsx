// components/layout/navigation/sidebar/lib/GeistAvatar.tsx
// Komponen avatar Geist 1:1 sesuai inspeksi Vercel dashboard di docs/SIDEBAR.md:
// - Ukuran default 20px (--size: 20px)
// - Pembungkus inline-block rounded-full overflow-hidden
// - Pseudo-ring overlay: after:inset-0 after:rounded-full after:border after:border-[var(--ds-gray-alpha-400)]
// - Fallback inisial / icon yang proporsional

import * as React from "react"
import { cn } from "@/lib/Utilitas"

export interface GeistAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  src?: string | null
  alt?: string
  initials?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function GeistAvatar({
  size = 20,
  src,
  alt = "",
  initials,
  icon: Icon,
  className,
  style,
  ...props
}: GeistAvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  const showImage = Boolean(src && !imageError)

  return (
    <div
      className={cn("relative shrink-0 select-none", className)}
      style={{
        width: size,
        height: size,
        "--size": `${size}px`,
        ...style,
      } as React.CSSProperties}
      {...props}
    >
      <span
        role="img"
        aria-label={alt}
        data-geist-avatar=""
        data-size={size}
        className={cn(
          "relative inline-block size-full shrink-0 overflow-hidden rounded-full align-top leading-none transition-[background] duration-200 ease-in-out",
          // Ring halus Vercel di atas avatar:
          "after:pointer-events-none after:absolute after:inset-0 after:size-full after:rounded-full after:border after:border-black/10 dark:after:border-white/15",
          // Background fallback
          !showImage && "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src!}
            alt={alt}
            width={size}
            height={size}
            loading="eager"
            decoding="sync"
            onError={() => setImageError(true)}
            className="size-full object-cover"
          />
        ) : Icon ? (
          <span className="flex size-full items-center justify-center">
            <Icon className="size-3 text-foreground" />
          </span>
        ) : (
          <span
            className="flex size-full items-center justify-center font-medium uppercase tracking-tight"
            style={{ fontSize: Math.max(9, Math.floor(size * 0.45)) }}
          >
            {initials ?? "?"}
          </span>
        )}
      </span>
    </div>
  )
}
