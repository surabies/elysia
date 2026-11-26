import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingDotsProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number; // diameter in px
}

/**
 * Vercel Geist Loading Dots Component
 * Reference: https://vercel.com/geist/loading-dots
 */
export function LoadingDots({
  size = 4,
  className,
  ...props
}: LoadingDotsProps) {
  const dotStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-flex items-center gap-1 align-middle select-none mx-1",
        className
      )}
      {...props}
    >
      <span
        style={dotStyle}
        className="rounded-full bg-current opacity-60 animate-bounce [animation-delay:-0.3s]"
      />
      <span
        style={dotStyle}
        className="rounded-full bg-current opacity-60 animate-bounce [animation-delay:-0.15s]"
      />
      <span
        style={dotStyle}
        className="rounded-full bg-current opacity-60 animate-bounce"
      />
    </span>
  );
}
