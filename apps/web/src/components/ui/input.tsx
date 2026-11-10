import * as React from "react"
import { cn } from "@/lib/utils"

export type InputSize = "xs" | "sm" | "md" | "default" | "lg"

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: InputSize | number
  inputSize?: InputSize
  density?: "default" | "compact"
}

function Input({
  className,
  type,
  size,
  inputSize,
  density,
  ...props
}: InputProps) {
  // Resolve effective size: inputSize > density > string size > default
  let effectiveSize: InputSize = "default"
  let htmlSize: number | undefined = undefined

  if (typeof size === "number") {
    htmlSize = size
  } else if (size && ["xs", "sm", "md", "default", "lg"].includes(size)) {
    effectiveSize = size as InputSize
  }

  if (density === "compact") {
    effectiveSize = "sm"
  } else if (density === "default" && !inputSize && typeof size !== "string") {
    effectiveSize = "default"
  }

  if (inputSize) {
    effectiveSize = inputSize
  }

  const sizeClasses: Record<InputSize, string> = {
    xs: "h-6 px-2 py-0.5 text-copy-12",
    sm: "h-8 px-2.5 py-1 text-copy-13",
    md: "h-9 px-3 py-1.5 text-copy-14",
    default: "h-9 px-3 py-1.5 text-copy-14",
    lg: "h-10 px-3.5 py-2 text-copy-14",
  }

  return (
    <input
      type={type}
      size={htmlSize}
      data-slot="input"
      data-size={effectiveSize}
      className={cn(
        "w-full min-w-0 rounded-md border border-border bg-card shadow-none transition-[border-color,box-shadow,background-color] duration-150 outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-button-12 file:font-medium file:text-foreground placeholder:text-(--ds-gray-700) hover:border-(--ds-gray-500) disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:border-(--ds-gray-400)",
        sizeClasses[effectiveSize],
        "text-foreground",
        "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
