// features/dashboard/import/lib/import-ui.ts
// Pemetaan nada (tone) -> token Geist di globals.css. Tidak ada warna mentah di sini.
import type { ComponentProps } from "react";
import type { Badge } from "@/components/ui/badge";

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
  /** Varian Badge Geist (subtle) dan solid. */
  badge: BadgeVariant;
  badgeSolid: BadgeVariant;
}

export const TONE_STYLE: Record<ImportTone, ToneStyle> = {
  neutral: {
    icon: "text-foreground",
    text: "text-foreground",
    dot: "bg-foreground",
    soft: "bg-muted",
    border: "border-border",
    hoverBorder: "hover:border-foreground/30",
    badge: "gray-subtle",
    badgeSolid: "gray",
  },
  blue: {
    icon: "text-ds-blue-700",
    text: "text-ds-blue-900",
    dot: "bg-ds-blue-700",
    soft: "bg-ds-blue-100",
    border: "border-ds-blue-400",
    hoverBorder: "hover:border-ds-blue-400",
    badge: "blue-subtle",
    badgeSolid: "blue",
  },
  green: {
    icon: "text-ds-green-700",
    text: "text-ds-green-900",
    dot: "bg-ds-green-700",
    soft: "bg-ds-green-100",
    border: "border-ds-green-400",
    hoverBorder: "hover:border-ds-green-400",
    badge: "green-subtle",
    badgeSolid: "green",
  },
  amber: {
    icon: "text-ds-amber-700",
    text: "text-ds-amber-900",
    dot: "bg-ds-amber-700",
    soft: "bg-ds-amber-100",
    border: "border-ds-amber-400",
    hoverBorder: "hover:border-ds-amber-400",
    badge: "amber-subtle",
    badgeSolid: "amber",
  },
  red: {
    icon: "text-ds-red-700",
    text: "text-ds-red-900",
    dot: "bg-ds-red-700",
    soft: "bg-ds-red-100",
    border: "border-ds-red-400",
    hoverBorder: "hover:border-ds-red-400",
    badge: "red-subtle",
    badgeSolid: "red",
  },
  teal: {
    icon: "text-ds-teal-700",
    text: "text-ds-teal-900",
    dot: "bg-ds-teal-700",
    soft: "bg-ds-teal-100",
    border: "border-ds-teal-400",
    hoverBorder: "hover:border-ds-teal-400",
    badge: "teal-subtle",
    badgeSolid: "teal",
  },
  purple: {
    icon: "text-ds-purple-700",
    text: "text-ds-purple-900",
    dot: "bg-ds-purple-700",
    soft: "bg-ds-purple-100",
    border: "border-ds-purple-400",
    hoverBorder: "hover:border-ds-purple-400",
    badge: "purple-subtle",
    badgeSolid: "purple",
  },
};

export const formatAngka = (value: number) => value.toLocaleString("id-ID");

/** Kontainer tabel dengan scroll mandiri (pola TanStack). */
export const IMPORT_TABLE_CONTAINER_CLASS =
  "max-h-[calc(100vh-20rem)] overflow-auto";

/** Header tabel lengket dengan garis bawah tipis. */
export const IMPORT_TABLE_HEADER_CLASS =
  "sticky top-0 z-10 bg-table-head shadow-[0_1px_0_0_var(--border)] [&_th]:bg-table-head";

/** Grid kartu statistik berdasarkan jumlah kolom pada layar lebar. */
export const IMPORT_STAT_GRID_CLASS = {
  3: "grid grid-cols-1 gap-3 sm:grid-cols-3",
  4: "grid grid-cols-2 gap-3 lg:grid-cols-4",
  5: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>:last-child]:col-span-2 sm:[&>:last-child]:col-span-1",
} as const;
