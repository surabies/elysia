"use client";

// features/dashboard/verifikasi/components/tabel/KontrolKolomVerifikasi.tsx —
// popover untuk menampilkan/menyembunyikan dan mengurutkan kolom tabel.
import * as React from "react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Columns3CogIcon,
  Drag01Icon,
} from "@/components/icons/ikon-lucide";
import { HugeiconsIcon } from "@/components/icons/IconRenderer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DEFINISI_KOLOM } from "../../lib/definisi-kolom";
import type { KolomVerifikasi, PreferensiKolom } from "../../lib/preferensi-kolom";

function TombolGeser({
  label,
  arah,
  disabled,
  onClick,
}: {
  label: string;
  arah: "atas" | "bawah";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="size-6 p-0 shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none disabled:bg-transparent cursor-pointer"
        >
          <HugeiconsIcon
            icon={arah === "atas" ? ArrowUp01Icon : ArrowDown01Icon}
            className="size-3.5"
            aria-hidden
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-copy-12">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const NAMA_KOLOM_RINGKAS: Record<string, string> = {
  ring: "Tahap Verifikasi",
  nomor: "Nomor Pelanggan",
  nama: "Nama Pelanggan",
  alamat: "Alamat",
  standAwal: "Stand Awal",
  standAkhir: "Stand Akhir",
  standRevisi: "Stand Revisi",
  standResmi: "Stand Resmi",
  pakai: "Pemakaian Air",
  lalu: "Pemakaian Lalu",
  tagihan: "Pemakaian Tagihan",
  deviasi: "Deviasi",
  rute: "Rute",
  kondisi: "Kondisi Meter",
  petugas: "Petugas Pencatat",
  tanggal: "Tanggal Catat",
  status: "Status Verifikasi",
};

export function KontrolKolomVerifikasi({
  preferensi,
  onVisibilitas,
  onPindah,
  onReset,
}: {
  preferensi: PreferensiKolom;
  onVisibilitas: (kolom: KolomVerifikasi, tampil: boolean) => void;
  onPindah: (dari: KolomVerifikasi, ke: KolomVerifikasi) => void;
  onReset: () => void;
}) {
  const urutan = preferensi.urutan;
  const definisiMap = new Map(DEFINISI_KOLOM.map((d) => [d.id, d]));

  const draggedRef = React.useRef<KolomVerifikasi | null>(null);
  const [draggedId, setDraggedId] = React.useState<KolomVerifikasi | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<KolomVerifikasi | null>(null);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Atur kolom tabel"
              className="h-8 w-8 shrink-0 border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            >
              <HugeiconsIcon
                icon={Columns3CogIcon}
                className="size-3.5"
                aria-hidden
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-copy-12">
          Atur Kolom
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-3 text-copy-13">
        <PopoverHeader className="flex flex-row items-center justify-between border-b pb-2">
          <PopoverTitle className="text-copy-13 font-semibold">
            Kolom Tabel
          </PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-auto p-1 text-copy-12 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Reset
          </Button>
        </PopoverHeader>

        <div className="mt-2 max-h-80 space-y-1 overflow-y-auto pr-1">
          {urutan.map((id, index) => {
            const def = definisiMap.get(id);
            if (!def) return null;
            const namaKolom = NAMA_KOLOM_RINGKAS[id] ?? def.label;
            const tampil = preferensi.tampil[id] ?? true;
            const pertama = index === 0;
            const terakhir = index === urutan.length - 1;

            const isDragging = draggedId === id;
            const isDropTarget = dropTargetId === id && draggedId !== id;

            return (
              <div
                key={id}
                draggable
                onDragStart={(event) => {
                  draggedRef.current = id;
                  setDraggedId(id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", id);
                  event.dataTransfer.setData("application/x-kolom-verifikasi", id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dropTargetId !== id) {
                    setDropTargetId(id);
                  }
                }}
                onDragLeave={() => {
                  if (dropTargetId === id) {
                    setDropTargetId(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const dari =
                    draggedRef.current ??
                    (event.dataTransfer.getData("text/plain") as KolomVerifikasi);
                  if (dari && dari !== id) {
                    onPindah(dari, id);
                  }
                  draggedRef.current = null;
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                onDragEnd={() => {
                  draggedRef.current = null;
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 transition-colors border",
                  isDragging
                    ? "opacity-40 bg-muted/30 border-dashed border-border"
                    : isDropTarget
                      ? "bg-accent/60 border-primary/50 shadow-xs"
                      : "border-transparent hover:bg-muted/50"
                )}
              >
                <label
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={tampil}
                    onCheckedChange={(v) => onVisibilitas(id, v === true)}
                    className="shrink-0"
                  />
                  <span
                    className="text-xs font-medium text-foreground truncate"
                    title={namaKolom}
                  >
                    {namaKolom}
                  </span>
                </label>

                <div className="flex items-center gap-1 shrink-0">
                  <TombolGeser
                    label={`Pindah ${namaKolom} ke atas`}
                    arah="atas"
                    disabled={pertama}
                    onClick={() => onPindah(id, urutan[index - 1])}
                  />
                  <TombolGeser
                    label={`Pindah ${namaKolom} ke bawah`}
                    arah="bawah"
                    disabled={terakhir}
                    onClick={() => onPindah(id, urutan[index + 1])}
                  />
                  <span
                    className="flex items-center justify-center size-6 shrink-0 text-muted-foreground/60 cursor-grab active:cursor-grabbing hover:text-foreground transition-colors"
                    title="Seret untuk mengatur urutan kolom"
                  >
                    <HugeiconsIcon
                      icon={Drag01Icon}
                      className="size-3.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
