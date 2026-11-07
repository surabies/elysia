"use client";

// features/dashboard/verifikasi/components/KerangkaModal.tsx — kerangka
// bersama modal-modal formulir (Koreksi, Kondisi Foto & Lapangan, Baca Manual,
// Pencarian Data): header TETAP, badan menggulir di ScrollArea shadcn, footer
// TETAP. Isian boleh bertambah sebanyak apa pun tanpa mendorong tombol keluar
// layar.
//
// Tinggi badan dibatasi lewat viewport ScrollArea (bukan root-nya): root tanpa
// tinggi pasti tidak membuat persentase tinggi viewport terselesaikan, jadi
// batasnya dipasang langsung pada viewport lewat selektor anak.
import * as React from "react";
import { cn } from "@/lib/Utilitas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

/// `sm:max-w-*` (bukan `max-w-*`): kelas dasar DialogContent memuat sm:max-w-sm,
/// override tanpa prefix sm: kalah spesifik di tailwind-merge.
const LEBAR = {
  sm: "sm:max-w-md",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
  xl: "sm:max-w-6xl",
} as const;
export type LebarModal = keyof typeof LEBAR;

export function KerangkaModal({
  buka,
  onBuka,
  judul,
  subjudul,
  lebar = "md",
  children,
  footer,
}: {
  buka: boolean;
  onBuka: (v: boolean) => void;
  judul: string;
  subjudul?: string;
  lebar?: LebarModal;
  /** Isi badan — menggulir bila melebihi tinggi layar. */
  children: React.ReactNode;
  /** Tombol aksi (rata kanan). Elemen pertama berkelas `mr-auto` jadi catatan kiri. */
  footer?: React.ReactNode;
}) {
  return (
    <Dialog open={buka} onOpenChange={onBuka}>
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0",
          LEBAR[lebar],
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <DialogTitle>{judul}</DialogTitle>
          <DialogDescription className={cn(!subjudul && "sr-only")}>
            {subjudul ?? judul}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 *:data-radix-scroll-area-viewport:max-h-[calc(100dvh-12rem)]">
          <div className="p-4">{children}</div>
        </ScrollArea>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/// Judul netral untuk kelompok isian.
export function JudulBagian({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-label-14 font-semibold text-foreground">{children}</h3>
  );
}

/// Baris label–isian mendatar (label kiri, kontrol kanan).
export function BarisForm({
  label,
  children,
  htmlFor,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
  tone?: "destruktif";
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
      <Label
        htmlFor={htmlFor}
        className={cn(
          "font-normal text-muted-foreground",
          tone === "destruktif" && "font-medium text-destructive",
        )}
      >
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/// Baris label di atas isian (formulir satu kolom).
export function BarisTumpuk({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

/// Nilai baca-saja, bukan kontrol input: tidak dapat difokuskan atau diedit.
export function KotakBaca({
  nilai,
}: {
  nilai: string | number | null | undefined;
}) {
  const teks =
    nilai === null || nilai === undefined || nilai === ""
      ? "—"
      : typeof nilai === "number"
        ? nilai.toLocaleString("id-ID")
        : nilai;
  return (
    <div
      aria-label={`Data baca-saja: ${teks}`}
      title={teks}
      className="flex h-8 w-full min-w-0 cursor-default select-none items-center overflow-hidden rounded-md border border-transparent bg-muted px-3 text-copy-13 text-muted-foreground"
    >
      <span className="truncate">{teks}</span>
    </div>
  );
}
