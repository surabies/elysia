import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeistSize } from "../contracts/tokens";

export interface AddressInputProps
  extends Omit<React.ComponentProps<"input">, "size" | "prefix"> {
  prefix?: React.ReactNode;
  size?: GeistSize;
  copyable?: boolean;
  onCopy?: () => void;
}

/**
 * Vercel Geist Address Input
 * Reference: https://vercel.com/geist/address-input
 */
export const AddressInput = React.forwardRef<HTMLInputElement, AddressInputProps>(
  (
    {
      className,
      value,
      prefix = "https://",
      size = "md",
      copyable = true,
      onCopy,
      disabled,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
      const fullText = `${typeof prefix === "string" ? prefix : ""}${value ?? ""}`;
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    };

    const sizeStyles = {
      sm: { height: "h-8", text: "text-xs", prefixPx: "px-2.5", copySize: "size-3" },
      md: { height: "h-9", text: "text-sm", prefixPx: "px-3", copySize: "size-3.5" },
      lg: { height: "h-10", text: "text-base", prefixPx: "px-3.5", copySize: "size-4" },
    }[size];

    return (
      <div
        className={cn(
          "inline-flex items-center w-full rounded-md border border-border bg-card overflow-hidden transition-colors focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring/30",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        {prefix && (
          <div
            className={cn(
              "flex items-center select-none bg-muted/60 text-muted-foreground border-r border-border font-mono text-xs font-medium shrink-0",
              sizeStyles.height,
              sizeStyles.prefixPx
            )}
          >
            {prefix}
          </div>
        )}

        <input
          ref={ref}
          value={value}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-0 bg-transparent px-3 text-foreground placeholder:text-muted-foreground outline-none font-mono",
            sizeStyles.height,
            sizeStyles.text
          )}
          {...props}
        />

        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            disabled={disabled}
            aria-label={copied ? "Copied" : "Copy address"}
            className={cn(
              "flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2.5 shrink-0",
              sizeStyles.height
            )}
          >
            {copied ? (
              <Check className={cn("text-emerald-500", sizeStyles.copySize)} />
            ) : (
              <Copy className={sizeStyles.copySize} />
            )}
          </button>
        )}
      </div>
    );
  }
);

AddressInput.displayName = "AddressInput";
