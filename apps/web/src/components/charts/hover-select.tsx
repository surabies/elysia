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
          className="group inline-flex items-center gap-1 rounded-sm text-[11px] leading-none text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 group-hover:rotate-180 group-data-[state=open]:rotate-180"
          />
          {current?.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-32"
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
