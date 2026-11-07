import * as React from "react"
import { cn } from "cn"

type InputProps = React.ComponentProps<"input"> & {
  density?: "default" | "compact"
}

function Input({
  className,
  type,
  density = "default",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={density}
      className={cn(
        "w-full min-w-0 rounded-md border border-border bg-card text-copy-14 shadow-none transition-[border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-button-12 file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        density === "default" ? "h-10 px-3 py-2" : "h-8 px-2.5 py-1 text-copy-13",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
