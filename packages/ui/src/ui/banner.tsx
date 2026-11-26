import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const bannerVariants = cva(
  "relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm border transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-card text-foreground border-border",
        info:
          "bg-blue-50/70 text-blue-900 border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50",
        warning:
          "bg-amber-50/70 text-amber-900 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50",
        error:
          "bg-red-50/70 text-red-900 border-red-200/80 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50",
        success:
          "bg-emerald-50/70 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  action?: React.ReactNode;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

/**
 * Vercel Geist Banner Component
 * Reference: https://vercel.com/geist/banner
 */
export function Banner({
  children,
  action,
  onDismiss,
  icon,
  variant = "default",
  className,
  ...props
}: BannerProps) {
  return (
    <div
      role="region"
      aria-label="Announcement Banner"
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="truncate font-medium">{children}</div>
        {action && (
          <div className="shrink-0 text-xs font-semibold underline underline-offset-4 hover:opacity-80">
            {action}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss banner"
          className="shrink-0 cursor-pointer rounded p-1 text-muted-foreground transition-opacity hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
