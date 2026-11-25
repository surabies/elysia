import * as React from "react"
import {
  Info,
  Lightbulb,
  AlertTriangle,
  Calculator,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DocsCalloutProps {
  type?: "info" | "tip" | "warning" | "formula" | "success"
  title?: string
  children: React.ReactNode
  className?: string
}

export function DocsCallout({
  type = "info",
  title,
  children,
  className,
}: DocsCalloutProps) {
  const configs = {
    info: {
      icon: Info,
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      iconColor: "text-blue-500",
      titleColor: "text-blue-600 dark:text-blue-400",
      defaultTitle: "Informasi",
    },
    tip: {
      icon: Lightbulb,
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      iconColor: "text-amber-500",
      titleColor: "text-amber-600 dark:text-amber-400",
      defaultTitle: "Tips Praktis",
    },
    warning: {
      icon: AlertTriangle,
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      iconColor: "text-red-500",
      titleColor: "text-red-600 dark:text-red-400",
      defaultTitle: "Perhatian Penting",
    },
    formula: {
      icon: Calculator,
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      iconColor: "text-emerald-500",
      titleColor: "text-emerald-600 dark:text-emerald-400",
      defaultTitle: "Formulasi Matematis",
    },
    success: {
      icon: CheckCircle2,
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      iconColor: "text-emerald-500",
      titleColor: "text-emerald-600 dark:text-emerald-400",
      defaultTitle: "Hasil Capaian",
    },
  }

  const cfg = configs[type]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        "my-4 rounded-lg border p-3.5 text-xs text-muted-foreground",
        cfg.border,
        cfg.bg,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("size-4 shrink-0", cfg.iconColor)} />
        <span className={cn("font-semibold text-xs", cfg.titleColor)}>
          {title || cfg.defaultTitle}
        </span>
      </div>
      <div className="leading-relaxed text-foreground/90 pl-6 space-y-1.5">
        {children}
      </div>
    </div>
  )
}
