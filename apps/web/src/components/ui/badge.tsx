import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-colors focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-(--primary-hover)",
        secondary:
          "border-border bg-(--ds-gray-100) text-foreground [a&]:hover:bg-(--ds-gray-200) dark:bg-(--ds-gray-200) dark:[a&]:hover:bg-(--ds-gray-300)",
        subtle:
          "border-border bg-(--ds-gray-100) text-muted-foreground [a&]:hover:bg-(--ds-gray-200) dark:bg-(--ds-gray-200) dark:[a&]:hover:bg-(--ds-gray-300)",
        "blue-subtle":
          "border-(--ds-blue-300) bg-(--ds-blue-100) text-(--ds-blue-900) dark:border-(--ds-blue-400) dark:bg-(--ds-blue-200) dark:text-(--ds-blue-900)",
        "green-subtle":
          "border-(--ds-green-300) bg-(--ds-green-100) text-(--ds-green-900) dark:border-(--ds-green-400) dark:bg-(--ds-green-200) dark:text-(--ds-green-900)",
        "amber-subtle":
          "border-(--ds-amber-300) bg-(--ds-amber-100) text-(--ds-amber-900) dark:border-(--ds-amber-400) dark:bg-(--ds-amber-200) dark:text-(--ds-amber-900)",
        "red-subtle":
          "border-(--ds-red-300) bg-(--ds-red-100) text-(--ds-red-900) dark:border-(--ds-red-400) dark:bg-(--ds-red-200) dark:text-(--ds-red-900)",
        destructive:
          "border-(--ds-red-300) bg-(--ds-red-100) text-(--ds-red-900) focus-visible:ring-destructive/20 dark:border-(--ds-red-400) dark:bg-(--ds-red-200) dark:text-(--ds-red-900)",
        outline:
          "border-border bg-card text-foreground [a&]:hover:bg-(--ds-gray-100) dark:[a&]:hover:bg-(--ds-gray-200)",
        ghost: "text-muted-foreground [a&]:hover:bg-(--ds-gray-100) [a&]:hover:text-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
      size: {
        sm: "h-5 px-2 text-label-11 [&>svg]:size-2.5",
        default: "h-5 px-2 text-label-12 [&>svg]:size-3",
        md: "h-6 px-2.5 text-label-12 [&>svg]:size-3",
        lg: "h-7 px-3 text-label-13 [&>svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({
  className,
  variant = "default",
  size = "default",
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
