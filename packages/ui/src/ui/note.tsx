import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const noteVariants = cva(
  "flex w-full items-center justify-between gap-3 rounded-md border text-left transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-foreground",
        info:
          "border-blue-200 bg-blue-50/60 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-300",
        warning:
          "border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300",
        error:
          "border-red-200 bg-red-50/60 text-red-900 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-300",
        success:
          "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        md: "px-4 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface NoteProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof noteVariants> {
  label?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Vercel Geist Note Component
 * Reference: https://vercel.com/geist/note
 */
export function Note({
  children,
  label,
  action,
  variant = "default",
  size = "sm",
  className,
  ...props
}: NoteProps) {
  return (
    <div
      role="note"
      className={cn(noteVariants({ variant, size }), className)}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        {label && (
          <span className="font-semibold uppercase tracking-wider shrink-0 text-[11px] opacity-80">
            {label}
          </span>
        )}
        <div className="flex-1 leading-normal">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
