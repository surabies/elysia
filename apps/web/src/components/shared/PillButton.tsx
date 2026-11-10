import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Tombol pill khas landing page di atas `Button` shadcn.
 * Pakai `asChild` untuk membungkus `<Link>` / `<a>`.
 */
export function PillButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-9.5 rounded-full px-5 text-label-13 sm:text-label-14 font-medium normal-case tracking-normal bg-black text-white transition-all duration-150 hover:bg-neutral-800 active:scale-[0.98] shadow-xs cursor-pointer",
        className
      )}
      {...props}
    />
  )
}
