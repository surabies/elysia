"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export function PillTabs({
  defaultValue,
  className,
  children,
}: {
  defaultValue: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      className={cn("flex w-full flex-col", className)}
    >
      {children}
    </TabsPrimitive.Root>
  )
}

export function PillTabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "grid w-full grid-flow-col auto-cols-fr gap-1 rounded-2xl bg-muted/90 p-1.5 border border-border select-none shadow-inner",
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export function PillTabsTrigger({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-all cursor-pointer outline-none",
        "hover:text-foreground hover:bg-background/50",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-xs",
        className
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function PillTabsContent({
  value,
  forceMount,
  className,
  children,
}: {
  value: string
  forceMount?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsPrimitive.Content
      value={value}
      forceMount={forceMount ? true : undefined}
      className={cn("mt-5 sm:mt-6 outline-none data-[state=inactive]:hidden", className)}
    >
      {children}
    </TabsPrimitive.Content>
  )
}
