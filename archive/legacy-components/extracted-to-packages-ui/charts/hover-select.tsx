"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHoverMenu } from "@/hooks/use-hover-menu";

export interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface HoverSelectProps<V extends string> {
  /** Label aksesibilitas, mis. "Pilih metrik". */
  label: string;
  value: V;
  options: readonly SelectOption<V>[];
  onValueChange: (value: V) => void;
}

export function HoverSelect<V extends string>({
  label,
  value,
  options,
  onValueChange,
}: HoverSelectProps<V>) {
  const { open, setOpen, show, scheduleHide } = useHoverMenu();
  const current = options.find((option) => option.value === value);

  const handleChange = (next: string) => {
    const match = options.find((option) => option.value === next);
    if (match) onValueChange(match.value);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label}, saat ini ${current?.label ?? "-"}`}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") show();
          }}
          onPointerLeave={scheduleHide}
          className="group inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border bg-(--ds-gray-100) px-2 text-label-12 text-foreground outline-none transition-colors hover:border-(--ds-gray-500) hover:bg-(--ds-gray-200) focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-(--ds-gray-200) dark:hover:bg-(--ds-gray-300)"
        >
          <span>{current?.label}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-36"
        onPointerEnter={show}
        onPointerLeave={scheduleHide}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={handleChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
