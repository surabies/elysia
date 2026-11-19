"use client"

import * as React from "react"

interface HlsVideoProps {
  /** URL stream HLS (.m3u8) atau file video (.mp4, .webm). */
  src: string
  className?: string
}

/** Video latar autoplay yang responsif, murni video tanpa fallback gambar lawas. */
export function HlsVideo({ src, className }: HlsVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay terblokir kebijakan browser
      })
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      className={className}
    />
  )
}
