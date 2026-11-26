// features/dashboard/import/components/shared/ImportFileButton.tsx
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImportFileButtonProps {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: LucideIcon;
  iconClassName?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  children: React.ReactNode;
}

/** Tombol Geist yang membuka pemilih berkas (label + input tersembunyi). */
export function ImportFileButton({
  accept,
  multiple,
  disabled,
  onChange,
  icon: Icon,
  iconClassName,
  variant = "outline",
  children,
}: ImportFileButtonProps) {
  return (
    <Button asChild variant={variant} aria-disabled={disabled}>
      <label
        className={cn(
          "cursor-pointer focus-within:ring-2 focus-within:ring-ring",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={onChange}
        />
        <Icon className={iconClassName} aria-hidden />
        {children}
      </label>
    </Button>
  );
}
