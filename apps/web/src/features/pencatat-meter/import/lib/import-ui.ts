// features/dashboard/import/lib/import-ui.ts
// Pemetaan nada (tone) -> token Geist Tailwind yang valid.
import type { ComponentProps } from "react";
import type { Badge } from "@cater/ui";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export type ImportTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "teal"
  | "purple";

interface ToneStyle {
  /** Warna ikon. */
  icon: string;
  /** Warna teks nilai / teks pada latar `soft`. */
  text: string;
  /** Titik indikator. */
  dot: string;
  /** Latar lembut. */
  soft: string;
  border: string;
  hoverBorder: string;
  /** Varian Badge Geist. */
  badge: BadgeVariant;
  badgeSolid: BadgeVariant;
}

export const TONE_STYLE: Record<ImportTone, ToneStyle> = {
  neutral: {
    icon: "text-foreground",
    text: "text-foreground",
    dot: "bg-foreground",
    soft: "bg-muted/50",
    border: "border-border",
    hoverBorder: "hover:border-foreground/30",
    badge: "secondary",
    badgeSolid: "default",
  },
  blue: {
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-600 dark:bg-blue-400",
    soft: "bg-blue-500/10",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/40",
    badge: "secondary",
    badgeSolid: "default",
  },
  green: {
    icon: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-600 dark:bg-emerald-400",
    soft: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    badge: "secondary",
    badgeSolid: "default",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    soft: "bg-amber-500/10",
    border: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    badge: "secondary",
    badgeSolid: "default",
  },
  red: {
    icon: "text-destructive",
    text: "text-destructive",
    dot: "bg-destructive",
    soft: "bg-destructive/10",
    border: "border-destructive/20",
    hoverBorder: "hover:border-destructive/40",
    badge: "destructive",
    badgeSolid: "destructive",
  },
  teal: {
    icon: "text-teal-600 dark:text-teal-400",
    text: "text-teal-700 dark:text-teal-400",
    dot: "bg-teal-600 dark:bg-teal-400",
    soft: "bg-teal-500/10",
    border: "border-teal-500/20",
    hoverBorder: "hover:border-teal-500/40",
    badge: "secondary",
    badgeSolid: "default",
  },
  purple: {
    icon: "text-purple-600 dark:text-purple-400",
    text: "text-purple-700 dark:text-purple-400",
    dot: "bg-purple-600 dark:bg-purple-400",
    soft: "bg-purple-500/10",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/40",
    badge: "secondary",
    badgeSolid: "default",
  },
};

export const formatAngka = (value: number) => value.toLocaleString("id-ID");

/** Kontainer tabel dengan scroll mandiri (pola TanStack). */
export const IMPORT_TABLE_CONTAINER_CLASS =
  "max-h-[calc(100vh-20rem)] overflow-auto";

/** Header tabel lengket dengan garis bawah tipis. */
export const IMPORT_TABLE_HEADER_CLASS =
  "sticky top-0 z-10 bg-muted/95 backdrop-blur-xs shadow-[0_1px_0_0_var(--border)] [&_th]:bg-muted/95";

/** Grid kartu statistik berdasarkan jumlah kolom pada layar lebar. */
export const IMPORT_STAT_GRID_CLASS = {
  3: "grid grid-cols-1 gap-3 sm:grid-cols-3",
  4: "grid grid-cols-2 gap-3 lg:grid-cols-4",
  5: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>:last-child]:col-span-2 sm:[&>:last-child]:col-span-1",
} as const;
