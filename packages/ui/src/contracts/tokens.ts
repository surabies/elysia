/**
 * Geist Design System Tokens
 * Reference: https://vercel.com/geist/introduction
 * Monochromatic high-contrast precision with functional status accents.
 */

export const GEIST_SIZES = {
  sm: {
    height: "h-8",
    minHeight: "min-h-8",
    px: "px-2.5",
    py: "py-1",
    text: "text-xs",
    iconSize: "size-3.5",
    radius: "rounded-md",
  },
  md: {
    height: "h-9",
    minHeight: "min-h-9",
    px: "px-3",
    py: "py-1.5",
    text: "text-sm",
    iconSize: "size-4",
    radius: "rounded-md",
  },
  lg: {
    height: "h-10",
    minHeight: "min-h-10",
    px: "px-4",
    py: "py-2",
    text: "text-base",
    iconSize: "size-4.5",
    radius: "rounded-lg",
  },
} as const;

export type GeistSize = "sm" | "md" | "lg";

export const GEIST_STATUS_TONES = {
  neutral: {
    badge: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
    badgeSubtle: "bg-zinc-100/60 text-zinc-600 border-zinc-200/60 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800/60",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    border: "border-zinc-200 dark:border-zinc-800",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    badgeSubtle: "bg-emerald-50/50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400/80 dark:border-emerald-900/30",
    dot: "bg-emerald-500",
    border: "border-emerald-300 dark:border-emerald-800",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
    badgeSubtle: "bg-amber-50/50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400/80 dark:border-amber-900/30",
    dot: "bg-amber-500",
    border: "border-amber-300 dark:border-amber-800",
  },
  error: {
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50",
    badgeSubtle: "bg-red-50/50 text-red-600 border-red-200/50 dark:bg-red-950/20 dark:text-red-400/80 dark:border-red-900/30",
    dot: "bg-red-500",
    border: "border-red-300 dark:border-red-800",
  },
  info: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
    badgeSubtle: "bg-blue-50/50 text-blue-600 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400/80 dark:border-blue-900/30",
    dot: "bg-blue-500",
    border: "border-blue-300 dark:border-blue-800",
  },
  teal: {
    badge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/50",
    badgeSubtle: "bg-teal-50/50 text-teal-600 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400/80 dark:border-teal-900/30",
    dot: "bg-teal-500",
    border: "border-teal-300 dark:border-teal-800",
  },
  purple: {
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50",
    badgeSubtle: "bg-purple-50/50 text-purple-600 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400/80 dark:border-purple-900/30",
    dot: "bg-purple-500",
    border: "border-purple-300 dark:border-purple-800",
  },
} as const;

export type GeistTone = keyof typeof GEIST_STATUS_TONES;

export const GEIST_ELEVATION = {
  border: "border border-border dark:border-border/60",
  card: "bg-background text-foreground border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none",
  floating: "bg-background/95 backdrop-blur-md text-foreground border border-border shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]",
  popover: "bg-popover text-popover-foreground border border-border shadow-md",
} as const;
