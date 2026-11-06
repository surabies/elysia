// components/layout/navigation/sidebar/NavRow.tsx
// Isi sebuah baris (ikon + teks + aksesori kanan) dengan ikon Geist/Octicons/Lucide.
import * as React from "react"
import { ChevronRight } from "lucide-react"
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
      <Icon
        size={15}
        className={cn("shrink-0", iconClassName)}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </>
  )
}

/** Panah kanan penanda baris yang membuka grup. */
export function RowChevron() {
  return (
    <ChevronRight
      size={14}
      strokeWidth={1.5}
      className="shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-foreground motion-reduce:transition-none"
      aria-hidden="true"
    />
  )
}

/** Garis pemisah antar bagian sidebar. */
export function RowSeparator() {
  return <div className="mx-2 my-1.5 h-px bg-border" role="separator" />
}
