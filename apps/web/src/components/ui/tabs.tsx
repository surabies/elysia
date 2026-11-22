"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Tabs as TabsPrimitive } from "radix-ui"

type TabsVariant = "default" | "line"

const TabsListContext = React.createContext<{ variant: TabsVariant }>({
  variant: "default",
})

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "inline-flex w-fit items-center justify-center p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-8 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "rounded-lg border border-border bg-(--ds-gray-100) dark:bg-(--ds-gray-100)",
        line: "gap-1 border-b border-border bg-transparent p-0 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const currentVariant: TabsVariant = variant === "line" ? "line" : "default"

  return (
    <TabsListContext.Provider value={{ variant: currentVariant }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={currentVariant}
        className={cn(tabsListVariants({ variant: currentVariant }), className)}
        {...props}
      />
    </TabsListContext.Provider>
  )
}

function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { variant } = React.useContext(TabsListContext)
  const isLine = variant === "line"

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styling
        "relative inline-flex h-full items-center justify-center gap-1.5 px-3.5 py-1.5 text-label-13 font-medium whitespace-nowrap text-muted-foreground transition-all select-none cursor-pointer outline-none",
        // Efek Hover yang jelas & kontras di semua mode
        "hover:text-foreground hover:bg-muted/60",
        // Default box variant
        !isLine && [
          "rounded-md border border-transparent",
          "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
          "data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs",
        ],
        // Vercel Geist Line variant:
        isLine && [
          "rounded-t-md bg-transparent border-b-2 border-transparent",
          "hover:border-border hover:bg-muted/40 hover:text-foreground",
          "data-[state=active]:border-b-2 data-[state=active]:border-foreground dark:data-[state=active]:border-white",
          "data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:bg-muted/25",
        ],
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
