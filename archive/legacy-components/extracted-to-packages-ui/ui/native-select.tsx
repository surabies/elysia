import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

export type NativeSelectSize = "xs" | "sm" | "md" | "default" | "lg"

function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: NativeSelectSize }) {
  return (
    <div
      className="group/native-select relative w-fit"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "w-full min-w-0 appearance-none rounded-md border border-border bg-card text-foreground shadow-none transition-[border-color,box-shadow,background-color] duration-150 outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-(--ds-gray-700) hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200) disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:border-(--ds-gray-400) cursor-pointer",
          // Sizing Scale
          "data-[size=xs]:h-6 data-[size=xs]:px-2 data-[size=xs]:py-0.5 data-[size=xs]:pr-7 data-[size=xs]:text-label-12",
          "data-[size=sm]:h-8 data-[size=sm]:px-2.5 data-[size=sm]:py-1 data-[size=sm]:pr-8 data-[size=sm]:text-label-13",
          "data-[size=md]:h-9 data-[size=md]:px-3 data-[size=md]:py-1.5 data-[size=md]:pr-8.5 data-[size=md]:text-label-14",
          "data-[size=default]:h-9 data-[size=default]:px-3 data-[size=default]:py-1.5 data-[size=default]:pr-9 data-[size=default]:text-label-14",
          "data-[size=lg]:h-10 data-[size=lg]:px-3.5 data-[size=lg]:py-2 data-[size=lg]:pr-9.5 data-[size=lg]:text-label-14",
          "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none group-has-[select[data-size=sm]]:right-2 group-has-[select[data-size=sm]]:size-3.5 group-has-[select[data-size=xs]]:right-1.5 group-has-[select[data-size=xs]]:size-3"
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
