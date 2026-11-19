"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface HlsVideoProps {
  /** URL stream HLS (.m3u8) atau file video (.mp4, .webm). */
  src: string
  className?: string
  poster?: string
}

/** Video latar autoplay yang responsif, instan tanpa latensi, dan hemat daya. */
export function HlsVideo({ src, className, poster }: HlsVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true

    const markPlaying = () => setIsPlaying(true)
    video.addEventListener("playing", markPlaying)
    video.addEventListener("timeupdate", markPlaying, { once: true })

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay terblokir kebijakan browser, poster tetap tampil mulus
      })
    }

    return () => {
      video.removeEventListener("playing", markPlaying)
      video.removeEventListener("timeupdate", markPlaying)
    }
  }, [src])

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950">
      {/* Poster instan agar tidak terjadi blank/latensi saat video pertama kali dimuat */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none",
            isPlaying ? "opacity-0" : "opacity-100"
          )}
        />
      )}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={cn(
          className,
          "transition-opacity duration-700",
          isPlaying || !poster ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}
