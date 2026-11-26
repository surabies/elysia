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
  size = "icon-xs",
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

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? "Tersalin ke clipboard" : "Salin"}
      className={cn("transition-all duration-150 cursor-pointer", className)}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500 transition-transform scale-110" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
      {label && <span className="ml-1 text-xs">{copied ? "Tersalin!" : label}</span>}
    </Button>
  );
}
