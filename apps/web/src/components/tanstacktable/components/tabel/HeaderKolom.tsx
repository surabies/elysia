"use client";

// features/dashboard/verifikasi/components/tabel/HeaderKolom.tsx — satu <th>
// tabel verifikasi: tombol sortir, drag untuk memindah kolom, dan handle
// resize (mouse/sentuh lewat TanStack, panah kiri/kanan lewat papan ketik).
import { flexRender, type Header } from "@tanstack/react-table";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
} from "@/features/dashboard/shared/icons/ikon-lucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
import { cn } from "@/lib/utils";
import {
  DEFINISI_KOLOM_PER_ID,
  jepitLebarKolom,
} from "../../lib/definisi-kolom";
import type { KolomVerifikasi } from "../../lib/preferensi-kolom";
import { propsSeretKolom } from "../../lib/seret-kolom";
import type { BarisTurunan } from "../../lib/turunan-baris";
import { TEMA_GRID_TH } from "../../lib/tema-verifikasi";
import type { VerifikasiFeatures } from "./tipe-tabel";

const LANGKAH_PAPAN_KETIK = 10;

export function HeaderKolom({
  header,
  onLebarKolom,
  onPindahKolom,
}: {
  header: Header<VerifikasiFeatures, BarisTurunan, unknown>;
  onLebarKolom: (kolom: KolomVerifikasi, lebar: number) => void;
  onPindahKolom: (dari: KolomVerifikasi, ke: KolomVerifikasi) => void;
}) {
  const { column } = header;
  const id = column.id as KolomVerifikasi;
  const meta = column.columnDef.meta;
  const { label } = DEFINISI_KOLOM_PER_ID[id];

  const arah = column.getIsSorted();
  const ikonSortir =
    arah === "asc"
      ? ArrowUp01Icon
      : arah === "desc"
        ? ArrowDown01Icon
        : ArrowUpDownIcon;
  const resize = header.getResizeHandler();

  function ubahLebarDenganPapanKetik(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? LANGKAH_PAPAN_KETIK : -LANGKAH_PAPAN_KETIK;
    onLebarKolom(id, jepitLebarKolom(id, column.getSize() + delta));
  }

  return (
    <th
      {...propsSeretKolom(id, onPindahKolom)}
      aria-sort={
        arah === "asc" ? "ascending" : arah === "desc" ? "descending" : "none"
      }
      title={meta?.judul}
      className={cn(
        "relative select-none",
        TEMA_GRID_TH,
        meta?.tengah && "text-center",
      )}
      style={{ width: header.getSize(), minWidth: column.columnDef.minSize }}
    >
      <button
        type="button"
        onClick={column.getToggleSortingHandler()}
        title={`Urutkan ${label} menaik atau menurun`}
        className={cn(
          "flex w-full items-center gap-1",
          meta?.tengah
            ? "justify-center"
            : meta?.angka
              ? "justify-end"
              : "justify-start",
        )}
      >
        {flexRender(column.columnDef.header, header.getContext())}
        <HugeiconsIcon
          icon={ikonSortir}
          strokeWidth={2}
          className="size-3 shrink-0 opacity-60"
          aria-hidden
        />
      </button>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Ubah lebar kolom ${label}`}
        aria-valuenow={column.getSize()}
        aria-valuemin={column.columnDef.minSize}
        aria-valuemax={column.columnDef.maxSize}
        tabIndex={0}
        draggable={false}
        // preventDefault pada mousedown mencegah <th> yang draggable ikut ter-drag.
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          resize(e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          resize(e);
        }}
        onKeyDown={ubahLebarDenganPapanKetik}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none hover:bg-primary/60 focus-visible:bg-primary/60",
          column.getIsResizing() && "bg-primary",
        )}
      />
    </th>
  );
}
