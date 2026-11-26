"use client";

// components/tanstacktable/components/toolbar/KontrolTampilanTabel.tsx
// Kontrol Tampilan Terpadu untuk Grid/Tabel Verifikasi:
// Smooth Minimal Styling: Perubahan hanya pada background hover/active, tanpa border luar aktif yang mencolok.

import * as React from "react";
import { cn } from "@/lib/utils";
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

  // Toggle Collapse / Expand Ringkasan (dikelola via floating button pojok bawah kiri)
  ringkasanTerbuka?: boolean;
  onRingkasan?: (buka: boolean) => void;

  isCanvasActive?: boolean;
  onToggleEngine?: () => void;

  className?: string;
}

export function KontrolTampilanTabel({
  preferensiKolom,
  className,
}: KontrolTampilanTabelProps) {
  return (
    <div
      className={cn("flex items-center gap-1 shrink-0", className)}
      role="toolbar"
      aria-label="Kontrol Tampilan Kolom"
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
    </div>
  );
}

// Kompatibilitas mundur jika ada yang mengimpor KontrolTampilan
export const KontrolTampilan = KontrolTampilanTabel;
