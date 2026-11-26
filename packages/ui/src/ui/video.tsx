import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IVideoContract } from "../contracts/component-contracts";

export interface VideoProps
  extends React.HTMLAttributes<HTMLDivElement>, IVideoContract {}

/**
 * Geist Video Player Frame with Minimalist Overlay Controls
 * Reference: https://vercel.com/geist/video
 */
export function Video({
  src,
  poster,
  title,
  aspectRatio = "16/9",
  autoPlay = false,
  loop = false,
  className,
  ...props
}: VideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [isMuted, setIsMuted] = React.useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const ratioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-4/3",
    "1/1": "aspect-square",
  }[aspectRatio];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-black shadow-md",
        ratioClass,
        className,
      )}
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        className="h-full w-full object-cover cursor-pointer"
      />

      {/* Title Overlay */}
      {title && (
        <div className="absolute top-3 left-3 z-10 rounded-md bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white pointer-events-none">
          {title}
        </div>
      )}

      {/* Bottom Minimalist Controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded p-1 hover:bg-white/20"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded p-1 hover:bg-white/20"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleFullscreen}
          className="rounded p-1 hover:bg-white/20"
          aria-label="Fullscreen"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
