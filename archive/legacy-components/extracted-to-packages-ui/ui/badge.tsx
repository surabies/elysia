import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * Vercel Geist Badge Component (https://vercel.com/geist/badge)
 *
 * ATURAN PATEN PROYEK:
 * - Selalu gunakan varian resmi Geist (`gray`, `gray-subtle`, `blue`, `blue-subtle`,
 *   `purple`, `purple-subtle`, `amber`, `amber-subtle`, `red`, `red-subtle`,
 *   `pink`, `pink-subtle`, `green`, `green-subtle`, `teal`, `teal-subtle`,
 *   `inverted`, `pill`) yang berbasis token CSS `--ds-*`.
 * - DILARANG menimpa warna badge menggunakan palet Tailwind mentah seperti
 *   `bg-emerald-500/10 text-emerald-700` atau `bg-amber-500/10`.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap tabular-nums transition-colors focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        // === Varian Resmi Vercel Geist (https://vercel.com/geist/badge) ===
        gray: "bg-(--ds-gray-700) text-white",
        "gray-subtle": "bg-(--ds-gray-200) text-(--ds-gray-1000)",
        blue: "bg-(--ds-blue-700) text-white",
        "blue-subtle": "bg-(--ds-blue-200) text-(--ds-blue-900)",
        purple: "bg-(--ds-purple-700) text-white",
        "purple-subtle": "bg-(--ds-purple-200) text-(--ds-purple-900)",
        amber: "bg-(--ds-amber-700) text-[#0a0a0a]",
        "amber-subtle": "bg-(--ds-amber-200) text-(--ds-amber-900)",
        red: "bg-(--ds-red-700) text-white",
        "red-subtle": "bg-(--ds-red-200) text-(--ds-red-900)",
        pink: "bg-(--ds-pink-700) text-white",
        "pink-subtle": "bg-(--ds-pink-200) text-(--ds-pink-900)",
        green: "bg-(--ds-green-700) text-white",
        "green-subtle": "bg-(--ds-green-200) text-(--ds-green-900)",
        teal: "bg-(--ds-teal-700) text-white",
        "teal-subtle": "bg-(--ds-teal-200) text-(--ds-teal-900)",
        inverted: "bg-primary text-primary-foreground",
        pill: "border-border bg-card text-foreground [a&]:hover:bg-(--ds-gray-100) dark:[a&]:hover:bg-(--ds-gray-200)",

        // === Alias Kompatibilitas shadcn (dipetakan ke token Geist) ===
        default: "bg-primary text-primary-foreground [a&]:hover:bg-(--primary-hover)",
        secondary: "bg-(--ds-gray-200) text-(--ds-gray-1000)",
        subtle: "bg-(--ds-gray-200) text-(--ds-gray-900)",
        destructive: "bg-(--ds-red-200) text-(--ds-red-900)",
        outline:
          "border-border bg-card text-foreground [a&]:hover:bg-(--ds-gray-100) dark:[a&]:hover:bg-(--ds-gray-200)",
        ghost: "text-muted-foreground [a&]:hover:bg-(--ds-gray-100) [a&]:hover:text-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
      size: {
        sm: "h-5 px-2 text-label-11 leading-none [&>svg]:size-3",
        default: "h-6 px-2.5 text-label-12 leading-none [&>svg]:size-3.5",
        md: "h-6 px-2.5 text-label-12 leading-none [&>svg]:size-3.5",
        lg: "h-8 px-3 text-label-13 leading-none [&>svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "gray-subtle",
      size: "md",
    },
  }
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({
  className,
  variant = "gray-subtle",
  size = "md",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants, type BadgeProps }
