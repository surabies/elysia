"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { DocHeading } from "../types"

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "0% 0% -80% 0%" }
    )

    for (const id of itemIds ?? []) {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    }

    return () => {
      for (const id of itemIds ?? []) {
        const element = document.getElementById(id)
        if (element) {
          observer.unobserve(element)
        }
      }
    }
  }, [itemIds])

  return activeId
}

export function DocsTableOfContents({
  headings,
  className,
}: {
  headings: DocHeading[]
  className?: string
}) {
  const itemIds = React.useMemo(() => headings.map((h) => h.id), [headings])
  const activeHeading = useActiveItem(itemIds)

  if (!headings?.length) {
    return null
  }

  return (
    <div className="sticky top-14 z-30 ml-auto hidden h-[calc(100vh-3.5rem)] w-60 flex-col pb-10 pt-8 xl:flex">
      <div className="h-full w-full overflow-y-auto scrollbar-none">
        <div className={cn("flex flex-col gap-2 p-4 pt-0 text-sm", className)}>
          <p className="h-6 text-xs font-medium text-muted-foreground">
            On this page
          </p>
          <div className="flex flex-col space-y-1">
            {headings.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "text-[0.8rem] no-underline transition-colors hover:text-foreground py-0.5 leading-snug",
                  item.level === 3 ? "pl-4 text-[0.78rem]" : "",
                  activeHeading === item.id
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
