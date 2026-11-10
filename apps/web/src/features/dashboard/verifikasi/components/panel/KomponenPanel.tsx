"use client";

// features/dashboard/verifikasi/components/KomponenPanel.tsx — potongan kecil
// yang dipakai panel verifikasi (lapangan & mandiri) dan modalnya: judul
// bagian (modal), seksi lipat (panel), kartu informasi pelanggan, grid stand
// tabel stand/histori dan empty state panel.
//
// SEKSI LIPAT memakai Collapsible, bukan Accordion: tanpa animasi tinggi yang
// diukur lewat JS, dan isi seksi yang tertutup TIDAK dirender — histori dan
// foto pembanding baru mengambil data setelah seksinya dibuka.
import * as React from "react";
import { ArrowDown01Icon } from "@/features/dashboard/shared/icons/ikon-lucide";
import {
  HugeiconsIcon,
  type IconSvgElement,
} from "@/features/dashboard/shared/icons/IconRenderer";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KELAS_JUDUL_PANEL,
  KELAS_TEKS_BANTUAN,
  KELAS_TEKS_META,
} from "../../lib/tema-verifikasi";
import { HistoriPemakaian } from "../HistoriPemakaian";
import type { PembacaanPanelRingkas } from "../../types";

/// Judul bagian untuk modal (bukan seksi lipat).
export function Bagian({
  judul,
  children,
}: {
  judul: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={cn(
          "text-center text-muted-foreground",
          KELAS_JUDUL_PANEL,
        )}
      >
        {judul}
      </p>
      {children}
    </div>
  );
}

export function Seksi({
  judul,
  awalBuka = true,
  children,
}: {
  judul: string;
  /** Terbuka saat pertama kali, sebelum Anda mengubahnya. */
  awalBuka?: boolean;
  children: React.ReactNode;
}) {
  const [buka, setBuka] = React.useState(awalBuka);

  return (
    <Collapsible
      open={buka}
      onOpenChange={setBuka}
      className="min-w-0 border-b border-border/60 last:border-b-0"
    >
      <CollapsibleTrigger
        className={cn(
          "group flex w-full items-center justify-between gap-2 py-2.5 text-left text-foreground transition-colors hover:text-muted-foreground",
          KELAS_JUDUL_PANEL,
        )}
      >
        {judul}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="min-w-0 pb-2.5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/// Informasi pelanggan: nama + badge status di satu baris (seperti semula),
/// lalu baris label–nilai ala tabel. Baris tanpa nilai dilewati.
export function InfoPelanggan({
  nama,
  nomor,
  kondisi,
  alamat,
}: {
  nama: string;
  nomor: string;
  kondisi?: string | null;
  alamat?: string | null;
}) {
  const baris: {
    label: string;
    nilai: string | null | undefined;
    mono?: boolean;
  }[] = [
    { label: "No. Pel", nilai: nomor, mono: true },
    { label: "Kondisi", nilai: kondisi },
    { label: "Alamat", nilai: alamat },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="min-w-0 text-copy-14 leading-snug font-semibold wrap-break-word text-foreground">
        {nama}
      </p>
      <dl className="divide-y divide-border/60 border-t border-border/60 text-copy-13">
        {baris
          .filter((b) => b.nilai)
          .map((b) => (
            <div
              key={b.label}
              className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-2 py-1"
            >
              <dt className={KELAS_TEKS_META}>{b.label}</dt>
              <dd
                className={cn(
                  "min-w-0 wrap-break-word text-foreground",
                  b.mono && "font-mono",
                )}
              >
                {b.nilai}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

/// Kelas kolom ditulis utuh, bukan dirangkai — Tailwind memindai source secara statis.
const KOLOM_GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function RingkasanPelanggan({
  nama,
  nomor,
  kondisi,
  alamat,
  pembacaan,
  pelangganId,
  peringatan,
  catatanPembacaan,
}: {
  nama: string;
  nomor: string;
  kondisi?: string | null;
  alamat?: string | null;
  pembacaan: PembacaanPanelRingkas;
  pelangganId: string | null | undefined;
  peringatan?: React.ReactNode;
  catatanPembacaan?: string;
}) {
  return (
    <Seksi judul="Informasi pelanggan">
      <>
        <InfoPelanggan
          nama={nama}
          nomor={nomor}
          kondisi={kondisi}
          alamat={alamat}
        />
        {peringatan}
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2.5">
          <HistoriPemakaian
            pelangganId={pelangganId}
            terkini={pembacaan}
            catatan={catatanPembacaan}
          />
        </div>
      </>
    </Seksi>
  );
}

export function PanelKosong({
  icon,
  pesan,
}: {
  icon: IconSvgElement;
  pesan: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
      <HugeiconsIcon
        icon={icon}
        strokeWidth={2}
        className="size-5 text-muted-foreground"
        aria-hidden
      />
      <p className={KELAS_TEKS_BANTUAN}>{pesan}</p>
    </div>
  );
}

export function PanelMemuat() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-label="Memuat laporan pertama">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
