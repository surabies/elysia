import * as React from "react";
import { X } from "lucide-react";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";

export interface ClearableInputProps extends InputProps {
  onClear?: () => void;
}

/**
 * Vercel Geist Clearable Input
 * Reference: https://vercel.com/geist/clearable-input
 */
export const ClearableInput = React.forwardRef<
  HTMLInputElement,
  ClearableInputProps
>(({ className, value, onChange, onClear, disabled, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  const hasValue =
    value !== undefined && value !== null && String(value).length > 0;

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

  return (
    <div className="relative flex items-center w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(hasValue && "pr-8", className)}
        {...props}
      />
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear input"
          className="absolute right-2.5 flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
});

ClearableInput.displayName = "ClearableInput";
