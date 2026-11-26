import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, type buttonVariants } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export interface SplitButtonItem {
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export interface SplitButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  items: SplitButtonItem[];
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Vercel Geist Split Button
 * Reference: https://vercel.com/geist/split-button
 */
export function SplitButton({
  label,
  onClick,
  items,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  className,
}: SplitButtonProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md shadow-xs [&>*]:focus-visible:relative [&>*]:focus-visible:z-10",
        className
      )}
    >
      <Button
        variant={variant}
        size={size}
        disabled={disabled || loading}
        onClick={onClick}
        className="rounded-r-none border-r-0 focus-visible:z-10"
      >
        {label}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled || loading}
            aria-label="Additional actions"
            className="rounded-l-none border-l border-border/40 px-2 hover:bg-black/10 dark:hover:bg-white/15"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {items.map((item, idx) => (
            <DropdownMenuItem
              key={idx}
              disabled={item.disabled}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-2 text-xs",
                item.destructive && "text-destructive focus:text-destructive"
              )}
            >
              {item.icon && <span className="size-3.5 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
