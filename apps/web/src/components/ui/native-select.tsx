import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

export type NativeSelectSize = "xs" | "sm" | "md" | "default" | "lg"

function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: NativeSelectSize }) {
  return (
    <div
      className="group/native-select relative w-fit has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "w-full min-w-0 appearance-none rounded-md border border-border bg-card shadow-none transition-[border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer",
          // Sizing Scale
          "data-[size=xs]:h-6 data-[size=xs]:px-2 data-[size=xs]:py-0.5 data-[size=xs]:pr-7 data-[size=xs]:text-xs",
          "data-[size=sm]:h-8 data-[size=sm]:px-2.5 data-[size=sm]:py-1 data-[size=sm]:pr-8 data-[size=sm]:text-xs",
          "data-[size=md]:h-9 data-[size=md]:px-3 data-[size=md]:py-1.5 data-[size=md]:pr-8.5 data-[size=md]:text-sm",
          "data-[size=default]:h-10 data-[size=default]:px-3 data-[size=default]:py-2 data-[size=default]:pr-9 data-[size=default]:text-sm",
          "data-[size=lg]:h-11 data-[size=lg]:px-3.5 data-[size=lg]:py-2.5 data-[size=lg]:pr-9.5 data-[size=lg]:text-sm",
          "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none group-has-[select[data-size=sm]]:right-2.5 group-has-[select[data-size=sm]]:size-3.5 group-has-[select[data-size=xs]]:right-2 group-has-[select[data-size=xs]]:size-3"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
