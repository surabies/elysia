import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";
import { Button } from "./button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IMultiSelectContract } from "../contracts/component-contracts";

export interface MultiSelectProps extends IMultiSelectContract {
  className?: string;
}

/**
 * Geist MultiSelect Component
 * Reference: https://vercel.com/geist/multi-select
 */
export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Pilih beberapa opsi...",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (optVal: string) => {
    if (value.includes(optVal)) {
      onChange(value.filter((v) => v !== optVal));
    } else {
      onChange([...value, optVal]);
    }
  };

  const removeOption = (e: React.MouseEvent, optVal: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optVal));
  };

  const selectedLabels = options.filter((o) => value.includes(o.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-2xs transition-colors cursor-pointer",
            "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedLabels.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedLabels.map((item) => (
                <Badge
                  key={item.value}
                  variant="gray-subtle"
                  size="sm"
                  className="gap-1 py-0 px-1.5 text-[11px]"
                >
                  <span>{item.label}</span>
                  {!disabled && (
                    <span
                      onClick={(e) => removeOption(e, item.value)}
                      className="cursor-pointer hover:text-foreground"
                    >
                      <X className="size-2.5" />
                    </span>
                  )}
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1 text-xs">
        <div className="max-h-60 overflow-y-auto space-y-0.5">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 transition-colors",
                  isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-muted"
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="size-3.5 text-foreground" />}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
