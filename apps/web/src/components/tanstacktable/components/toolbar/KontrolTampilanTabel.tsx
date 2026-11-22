"use client";

// components/tanstacktable/components/toolbar/KontrolTampilanTabel.tsx
// Kontrol Tampilan Terpadu untuk Grid/Tabel Verifikasi:
// Smooth Minimal Styling: Perubahan hanya pada background hover/active, tanpa border luar aktif yang mencolok.

import * as React from "react";
import { DashboardSquare01Icon } from "@/features/dashboard/shared/icons/ikon-lucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KolomVerifikasi, PreferensiKolom } from "../../lib/preferensi-kolom";
import { KontrolKolomVerifikasi } from "../tabel/KontrolKolomVerifikasi";

export interface KontrolTampilanTabelProps {
  preferensiKolom?: {
    preferensi: PreferensiKolom;
    onVisibilitas?: (kolom: KolomVerifikasi, tampil: boolean) => void;
    onPindah?: (dari: KolomVerifikasi, ke: KolomVerifikasi) => void;
    onReset?: () => void;
  };

  padat?: boolean;
  onPadat?: (padat: boolean) => void;

  // Toggle Collapse / Expand Ringkasan Drawer
  ringkasanTerbuka: boolean;
  onRingkasan: (buka: boolean) => void;

  isCanvasActive?: boolean;
  onToggleEngine?: () => void;

  className?: string;
}

export function KontrolTampilanTabel({
  preferensiKolom,
  ringkasanTerbuka,
  onRingkasan,
  className,
}: KontrolTampilanTabelProps) {
  return (
    <div
      className={cn("flex items-center gap-1 shrink-0", className)}
      role="toolbar"
      aria-label="Kontrol Tampilan & Ringkasan"
    >
      {/* Atur Kolom Tabel (Tampilkan/Sembunyikan, Urutan, dan Reset Kolom) */}
      {preferensiKolom && (
        <KontrolKolomVerifikasi
          preferensi={preferensiKolom.preferensi}
          onVisibilitas={preferensiKolom.onVisibilitas ?? (() => {})}
          onPindah={preferensiKolom.onPindah ?? (() => {})}
          onReset={preferensiKolom.onReset ?? (() => {})}
        />
      )}

      {/* Toggle Collapse / Expand Ringkasan */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={
              ringkasanTerbuka ? "Sembunyikan ringkasan" : "Tampilkan ringkasan"
            }
            aria-pressed={ringkasanTerbuka}
            onClick={() => onRingkasan(!ringkasanTerbuka)}
            className={cn(
              "h-8 w-8 relative shrink-0 transition-colors duration-150 cursor-pointer border-border/60",
              ringkasanTerbuka
                ? "bg-muted/80 text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <HugeiconsIcon
              icon={DashboardSquare01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {ringkasanTerbuka
            ? "Sembunyikan ringkasan (Lipat drawer)"
            : "Tampilkan ringkasan (Buka drawer)"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Kompatibilitas mundur jika ada yang mengimpor KontrolTampilan
export const KontrolTampilan = KontrolTampilanTabel;
