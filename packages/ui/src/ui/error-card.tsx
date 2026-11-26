import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  message: React.ReactNode;
  code?: string | number;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
}

/**
 * Vercel Geist Error Card Component
 * Reference: https://vercel.com/geist/error-card
 */
export function ErrorCard({
  title = "Terjadi Kesalahan",
  message,
  code,
  onRetry,
  retryLabel = "Coba Lagi",
  action,
  className,
  ...props
}: ErrorCardProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50/60 p-4 text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300 select-none shadow-xs",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full p-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
          <AlertCircle className="size-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
            {code && (
              <span className="font-mono text-[10px] bg-red-200/60 dark:bg-red-900/60 px-1.5 py-0.5 rounded">
                {code}
              </span>
            )}
          </div>
          <p className="text-xs text-red-800/80 dark:text-red-300/80 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {onRetry && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs"
          >
            {retryLabel}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
