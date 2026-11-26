"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button, type buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export interface CopyButtonProps {
  value: string;
  label?: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  onCopy?: () => void;
}

/**
 * Vercel Geist Copy Button Component
 * Reference: https://vercel.com/geist/copy-button
 */
export function CopyButton({
  value,
  label,
  variant = "outline",
  size,
  className,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const hasLabel = Boolean(label);

  // Jika ada label teks, jangan gunakan icon size yang membatasi width kotak (size-6 / size-8)!
  // Gunakan size 'xs' atau 'sm' fleksibel agar teks tidak menyembur keluar border.
  const resolvedSize = size ?? (hasLabel ? "xs" : "icon-xs");

  return (
    <Button
      type="button"
      variant={variant}
      size={resolvedSize}
      onClick={handleCopy}
      aria-label={copied ? "Tersalin ke clipboard" : "Salin"}
      className={cn(
        "cursor-pointer transition-all duration-150 shrink-0 select-none whitespace-nowrap",
        hasLabel && "w-auto px-2.5 py-1 h-7 text-xs gap-1.5",
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500 transition-transform scale-110 shrink-0" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground shrink-0" />
      )}
      {hasLabel && (
        <span className="text-xs font-medium leading-none whitespace-nowrap">
          {copied ? "Tersalin!" : label}
        </span>
      )}
    </Button>
  );
}
