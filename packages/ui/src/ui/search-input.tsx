import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeistSize } from "../contracts/tokens";

export interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "size"> {
  size?: GeistSize;
  loading?: boolean;
  onClear?: () => void;
  shortcut?: string;
}

/**
 * Vercel Geist Search Input
 * Reference: https://vercel.com/geist/search-input
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onChange,
      onClear,
      size = "md",
      loading = false,
      shortcut = "⌘K",
      placeholder = "Search...",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (inputRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(inputRef.current, "");
          const ev = new Event("input", { bubbles: true });
          inputRef.current.dispatchEvent(ev);
        }
      }
      inputRef.current?.focus();
    };

    const sizeStyles = {
      sm: {
        container: "h-8 text-xs",
        icon: "size-3.5 left-2.5",
        padding: "pl-8 pr-12",
        badge: "text-[10px] right-2",
        clear: "right-2",
      },
      md: {
        container: "h-9 text-sm",
        icon: "size-4 left-3",
        padding: "pl-9 pr-14",
        badge: "text-xs right-2.5",
        clear: "right-2.5",
      },
      lg: {
        container: "h-10 text-base",
        icon: "size-4.5 left-3.5",
        padding: "pl-10 pr-16",
        badge: "text-xs right-3",
        clear: "right-3",
      },
    }[size];

    return (
      <div
        className={cn(
          "relative flex items-center w-full min-w-44 select-none",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute text-muted-foreground flex items-center justify-center",
            sizeStyles.icon
          )}
        >
          {loading ? (
            <Loader2 className="animate-spin text-muted-foreground" />
          ) : (
            <Search />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          data-slot="search-input"
          className={cn(
            "w-full rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground",
            "transition-colors duration-150 outline-none",
            "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
            sizeStyles.container,
            sizeStyles.padding,
            className
          )}
          {...props}
        />

        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className={cn(
              "absolute flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer",
              sizeStyles.clear
            )}
          >
            <X className="size-3.5" />
          </button>
        ) : shortcut ? (
          <kbd
            className={cn(
              "pointer-events-none absolute font-mono font-medium text-muted-foreground bg-muted/60 border border-border/80 rounded px-1.5 py-0.5",
              sizeStyles.badge
            )}
          >
            {shortcut}
          </kbd>
        ) : null}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
