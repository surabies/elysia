"use client";

// features/dashboard/verifikasi/components/tabel/BarisTabel.tsx — satu <tr>
// tabel verifikasi: latar per tahap, penanda koreksi, kotak centang beku,
// lalu sel-sel yang dirender generik dari definisi kolom.
import { flexRender, type Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LEBAR_CEKLIS } from "../../lib/definisi-kolom";
import { tentukanLatarBaris } from "../../lib/tema-verifikasi";
import type { BarisTurunan } from "../../lib/turunan-baris";
import { GAYA_BELUM_DIBACA, GAYA_TAHAP } from "../../lib/warna-tahap";
import type { BarisVerifikasi } from "../../types";
import type { VerifikasiFeatures } from "./tipe-tabel";

const PENANDA_KOREKSI =
  "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-(--verif-correction)";

type GayaBaris = React.CSSProperties & {
  "--latar-baris": string;
  "--latar-baris-hover": string;
};

export function BarisTabel({
  baris,
  dipilih,
  aktif,
  modeBelumDibaca,
  tinggiBaris,
  onKlikBaris,
  onKlikKanan,
  onToggle,
}: {
  baris: Row<VerifikasiFeatures, BarisTurunan>;
  dipilih: boolean;
  aktif: boolean;
  modeBelumDibaca: boolean;
  /** Nilai containIntrinsicSize — tinggi perkiraan baris yang belum dirender. */
  tinggiBaris: string;
  onKlikBaris: (row: BarisVerifikasi) => void;
  onKlikKanan: (row: BarisVerifikasi, posisi: { x: number; y: number }) => void;
  onToggle: (id: string, rentang: boolean, indeks: number) => void;
}) {
  const b = baris.original;
  const gaya = modeBelumDibaca ? GAYA_BELUM_DIBACA : GAYA_TAHAP[b.tahap];
  const koreksi = b.dikoreksi && !modeBelumDibaca;
  const latar = tentukanLatarBaris({ aktif, dipilih, tahap: b.tahap, koreksi });

  const style: GayaBaris = {
    contentVisibility: "auto",
    containIntrinsicSize: tinggiBaris,
    "--latar-baris": latar.normal,
    "--latar-baris-hover": latar.hover,
  };

  return (
    <tr
      data-id={b.id}
      data-koreksi={koreksi ? "true" : undefined}
      data-dipilih={dipilih ? "true" : undefined}
      aria-selected={aktif}
      onClick={() => onKlikBaris(b.row)}
      onContextMenu={(e) => {
        e.preventDefault();
        onKlikKanan(b.row, { x: e.clientX, y: e.clientY });
      }}
      style={style}
      className="group cursor-pointer text-foreground [&>td]:border-r [&>td]:border-b [&>td]:border-border [&>td]:px-3 [&>td]:whitespace-nowrap [&>td:last-child]:border-r-0"
    >
      <td
        className={cn(
          "sticky left-0 z-10 border-r border-b border-border/60",
          b.tahap !== "MENUNGGU"
            ? gaya.garis
            : koreksi
              ? PENANDA_KOREKSI
              : gaya.garis,
        )}
        style={{ width: LEBAR_CEKLIS }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Satu handler untuk klik & Space; Shift+klik = pilih rentang. */}
        <Checkbox
          checked={dipilih}
          onClick={(e) => onToggle(b.id, e.shiftKey, baris.index)}
          aria-label={`Pilih ${b.nomor ?? "—"}`}
        />
      </td>

      {baris.getVisibleCells().map((sel) => {
        const meta = sel.column.columnDef.meta;
        return (
          <td
            key={sel.id}
            title={meta?.judulSel?.(b)}
            className={cn(
              meta?.angka && "text-right tabular-nums",
              meta?.tengah && "text-center",
              meta?.kelasSel,
            )}
          >
            {flexRender(sel.column.columnDef.cell, sel.getContext())}
          </td>
        );
      })}
    </tr>
  );
}
