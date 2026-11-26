import * as React from "react";
import { cn } from "@/lib/utils";
import type { IBookContract } from "../contracts/component-contracts";

export interface BookProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    IBookContract {}

/**
 * Geist 3D Book Mockup Card
 * Reference: https://vercel.com/geist/book
 */
export function Book({
  title,
  author,
  coverUrl,
  color = "#000",
  className,
  ...props
}: BookProps) {
  return (
    <div
      className={cn(
        "group relative flex h-48 w-36 flex-col justify-between overflow-hidden rounded-r-md rounded-l-xs border border-border/80 p-3.5 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl",
        className
      )}
      style={{
        backgroundColor: color,
      }}
      {...props}
    >
      {/* Spine Shadow Effect */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />

      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="relative z-10 space-y-1 pl-1">
            <h3 className="line-clamp-3 text-xs font-bold leading-tight text-white drop-shadow-xs">
              {title}
            </h3>
          </div>
          {author && (
            <div className="relative z-10 pl-1">
              <p className="line-clamp-1 text-[10px] font-medium text-white/80">
                {author}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
