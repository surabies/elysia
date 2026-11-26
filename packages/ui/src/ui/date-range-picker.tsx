"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import type { GeistSize } from "../contracts/tokens";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  size?: GeistSize;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_PRESETS = [
  {
    label: "Hari Ini",
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: "7 Hari Terakhir",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "Bulan Ini",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Bulan Lalu",
    getValue: () => {
      const prev = subMonths(new Date(), 1);
      return {
        from: startOfMonth(prev),
        to: endOfMonth(prev),
      };
    },
  },
];

/**
 * Vercel Geist Date Range Picker with Quick Presets
 * Reference: https://vercel.com/geist/calendar
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal...",
  size = "sm",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatText = () => {
    if (!value?.from) return placeholder;
    if (!value.to) return format(value.from, "dd MMM yyyy", { locale: id });
    return `${format(value.from, "dd MMM yyyy", { locale: id })} - ${format(
      value.to,
      "dd MMM yyyy",
      { locale: id }
    )}`;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal border-border bg-card",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{formatText()}</span>
          {value?.from && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border"
      >
        {/* Presets Sidebar */}
        <div className="flex flex-col gap-1 p-3 min-w-36 bg-muted/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Preset Waktu
          </span>
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange?.(preset.getValue());
                setOpen(false);
              }}
              className="rounded px-2 py-1.5 text-left text-xs text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Calendar Picker */}
        <div className="p-2">
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
