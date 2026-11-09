import * as React from "react"
import { cn } from "cn"

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
    xs: "h-6 px-2 py-0.5 text-xs text-copy-12",
    sm: "h-8 px-2.5 py-1 text-xs text-copy-13",
    md: "h-9 px-3 py-1.5 text-sm text-copy-14",
    default: "h-10 px-3 py-2 text-sm text-copy-14",
    lg: "h-11 px-3.5 py-2.5 text-sm text-copy-14",
  }

  return (
    <input
      type={type}
      size={htmlSize}
      data-slot="input"
      data-size={effectiveSize}
      className={cn(
        "w-full min-w-0 rounded-md border border-border bg-card shadow-none transition-[border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-button-12 file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[effectiveSize],
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
