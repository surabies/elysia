import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-copy-14 text-foreground shadow-none transition-[border-color,box-shadow,background-color] duration-150 outline-none placeholder:text-(--ds-gray-700) hover:border-(--ds-gray-500) focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:border-(--ds-gray-400) aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
