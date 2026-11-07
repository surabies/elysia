// components/layout/navigation/sidebar/NavRow.tsx
// Isi sebuah baris (ikon + teks + aksesori kanan) dengan ikon Geist murni hasil inspeksi Vercel.
import * as React from "react"
import { GeistChevronRight } from "./lib/GeistIcons"
import { cn } from "@/lib/Utilitas"

export type SidebarIconComponent = React.ComponentType<any>

export function NavRowContent({
  icon: Icon,
  iconClassName,
  trailing,
  children,
}: {
  icon: SidebarIconComponent
  iconClassName?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex-none grid size-9 place-content-center">
        <Icon
          size={16}
          strokeWidth={1.5}
          className={cn("size-4 shrink-0", iconClassName)}
          aria-hidden="true"
        />
      </div>
      <span className="flex-1 min-w-0 text-sm font-medium flex items-center gap-1.5">
        <span className="flex-shrink min-w-0 truncate">{children}</span>
      </span>
      {trailing}
    </>
  )
}

/** Panah kanan penanda baris yang membuka grup (Vercel style: size-6 grid with 12x12 icon). */
export function RowChevron() {
  return (
    <span className="flex-none grid size-6 place-content-center rounded-sm mr-1.5">
      <GeistChevronRight
        size={12}
        className="size-3 text-muted-foreground/60 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-foreground motion-reduce:transition-none"
        aria-hidden="true"
      />
    </span>
  )
}

/** Garis pemisah horizontal antar bagian sidebar (Vercel style: my-1 h-px border-0 bg-border). */
export function RowSeparator() {
  return <hr className="mx-0 my-1 h-px w-full border-0 bg-border" role="separator" />
}
