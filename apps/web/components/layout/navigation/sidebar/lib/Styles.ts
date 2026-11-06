// components/layout/navigation/sidebar/lib/Styles.ts
// Kelas Tailwind yang dipakai bersama untuk navigasi sidebar bergaya Vercel Geist.
import { cn } from "@/lib/Utilitas"

/** Cincin fokus — hanya muncul untuk navigasi keyboard (bukan klik mouse). */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

/** Label seksi kecil huruf kapital (nama folder di dalam grup). */
export const SECTION_LABEL =
  "px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

/** Bentuk satu baris menu: Vercel Geist styling (h-9, rounded-md, text-sm, stroke 1.5). */
export function navRowClass(active: boolean) {
  return cn(
    "group/row flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors",
    FOCUS_RING,
    active
      ? "bg-[#EBEBEB] font-medium text-[#171717] dark:bg-[#1F1F1F] dark:text-[#EDEDED]"
      : "text-muted-foreground hover:bg-[#F2F2F2] hover:text-[#171717] dark:hover:bg-[#1A1A1A] dark:hover:text-[#EDEDED]"
  )
}
