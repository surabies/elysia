import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap cursor-pointer select-none transition-[background-color,color,border-color,box-shadow] duration-150 outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:border-(--ds-gray-400) aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-none hover:bg-(--primary-hover)",
        destructive:
          "border border-transparent bg-destructive text-white shadow-none hover:bg-(--ds-red-800) focus-visible:ring-destructive/20 dark:bg-(--ds-red-700) dark:hover:bg-(--ds-red-800) dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-card text-foreground shadow-none hover:bg-(--ds-gray-100) hover:text-foreground dark:bg-card dark:hover:bg-(--ds-gray-200)",
        secondary:
          "border border-border bg-(--ds-gray-100) text-foreground shadow-none hover:bg-(--ds-gray-200) dark:bg-(--ds-gray-200) dark:hover:bg-(--ds-gray-300)",
        ghost:
          "border border-transparent text-muted-foreground hover:bg-(--ds-gray-100) hover:text-foreground dark:hover:bg-(--ds-gray-200)",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 text-button-14 has-[>svg]:px-2.5",
        xs: "h-6 gap-1 rounded-md px-2 text-button-12 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-2.5 text-button-13 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-9 gap-1.5 rounded-md px-3.5 text-button-14 has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 gap-2 rounded-md px-4 text-button-14 has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-8",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-md": "size-9 rounded-md",
        "icon-lg": "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
