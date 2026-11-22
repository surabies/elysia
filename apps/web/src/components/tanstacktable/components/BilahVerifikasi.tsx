"use client";

// components/tanstacktable/components/BilahVerifikasi.tsx
// Re-export modular toolbar verifikasi untuk backward compatibility.
// Mengarahkan ke arsitektur modular baru di ./toolbar/

export {
  ToolbarVerifikasi,
  FILTER_AWAL,
  PILIHAN_UKURAN,
  type FilterVerifikasi,
  type ToolbarVerifikasiProps,
} from "./toolbar/ToolbarVerifikasi";

export {
  KontrolTampilanTabel,
  KontrolTampilan,
  type KontrolTampilanTabelProps,
} from "./toolbar/KontrolTampilanTabel";

export {
  buatSkemaFilter,
  filterVerifikasiToQuery,
  queryToFilterVerifikasi,
  STATUS_TONES,
  ANOMALI_TONES,
  KONDISI_TONES,
  ASAL_TONES,
  ALL_TONES,
  Swatch,
  BadgesOrStack,
  StackedDots,
  type Tone,
} from "./toolbar/skema-filter";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TombolIkonVerifikasi({
  label,
  ikon,
  onClick,
  aktif = false,
  jumlah,
  warnaBadge,
  ditekan,
  diperluas,
  hasPopup,
  controls,
}: {
  label: string;
  ikon: React.ReactNode;
  onClick: () => void;
  aktif?: boolean;
  jumlah?: number;
  warnaBadge?: string;
  ditekan?: boolean;
  diperluas?: boolean;
  hasPopup?: "dialog";
  controls?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={label}
          aria-pressed={ditekan}
          aria-expanded={diperluas}
          aria-haspopup={hasPopup}
          aria-controls={controls}
          onClick={onClick}
          className={cn(
            "relative shrink-0 overflow-visible h-8 w-8 cursor-pointer",
            aktif && "border-primary/50 bg-primary/10 text-primary",
          )}
        >
          {ikon}
          {jumlah !== undefined && jumlah > 0 && (
            <span
              className={cn(
                "absolute -top-1.5 -right-1.5 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-background tabular-nums shadow-xs pointer-events-none",
                warnaBadge ?? "bg-foreground",
              )}
            >
              {jumlah}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
