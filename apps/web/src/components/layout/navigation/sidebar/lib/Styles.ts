// components/layout/navigation/sidebar/lib/Styles.ts
// Kelas Tailwind yang dipakai bersama untuk navigasi sidebar bergaya Vercel Geist.
import { cn } from "@/lib/utils"

/** Cincin fokus — hanya muncul untuk navigasi keyboard (bukan klik mouse). */
export const FOCUS_RING =
  "focus-visible:outline-2 outline-ring outline-offset-4"

/** Label seksi kecil huruf kapital (nama folder di dalam grup). */
export const SECTION_LABEL =
  "px-2.5 text-label-11 uppercase tracking-[0.06em] text-muted-foreground"

/** Bentuk satu baris menu: Vercel Geist styling (h-9, rounded-md, text-sm, icon size-9, stroke 1.5). */
export function navRowClass(active: boolean) {
  return cn(
    "group/row cursor-pointer flex flex-row items-center h-9 origin-left rounded-md w-full text-left transition-colors pl-0.5",
    FOCUS_RING,
    active
      ? "bg-(--ds-gray-200) font-medium text-foreground"
      : "text-muted-foreground hover:bg-(--ds-gray-100) hover:text-foreground"
  )
}
