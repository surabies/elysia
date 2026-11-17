"use client";

// features/dashboard/verifikasi/components/tabel/KontrolKolomVerifikasi.tsx —
// popover untuk menampilkan/menyembunyikan dan mengurutkan kolom tabel.
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Columns3CogIcon,
  Drag01Icon,
} from "@/features/dashboard/shared/icons/ikon-lucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
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
import { DEFINISI_KOLOM } from "../../lib/definisi-kolom";
import type { KolomVerifikasi, PreferensiKolom } from "../../lib/preferensi-kolom";
import { TEMA_TOGGLE_ITEM } from "../../lib/tema-verifikasi";

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
          size="icon-sm"
          variant="ghost"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="size-6 text-muted-foreground hover:text-foreground"
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

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Atur kolom tabel"
              className="text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon
                icon={Columns3CogIcon}
                className="size-4"
                aria-hidden
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-copy-12">
          Atur Kolom
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-72 p-3 text-copy-13">
        <PopoverHeader className="flex flex-row items-center justify-between border-b pb-2">
          <PopoverTitle className="text-copy-13 font-semibold">
            Kolom Tabel
          </PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-auto p-1 text-copy-12 text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        </PopoverHeader>

        <div className="mt-2 max-h-80 space-y-1 overflow-y-auto pr-1">
          {urutan.map((id, index) => {
            const def = definisiMap.get(id);
            if (!def) return null;
            const tampil = preferensi.tampil[id] ?? true;
            const pertama = index === 0;
            const terakhir = index === urutan.length - 1;

            return (
              <div
                key={id}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${TEMA_TOGGLE_ITEM}`}
              >
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={tampil}
                    onCheckedChange={(v) => onVisibilitas(id, v === true)}
                  />
                  <span className="select-none font-medium text-foreground">
                    {def.label}
                  </span>
                  <span className="text-copy-11 text-muted-foreground">
                    ({def.title})
                  </span>
                </label>

                <div className="flex items-center gap-0.5">
                  <TombolGeser
                    label={`Pindah ${def.label} ke atas`}
                    arah="atas"
                    disabled={pertama}
                    onClick={() => onPindah(id, urutan[index - 1])}
                  />
                  <TombolGeser
                    label={`Pindah ${def.label} ke bawah`}
                    arah="bawah"
                    disabled={terakhir}
                    onClick={() => onPindah(id, urutan[index + 1])}
                  />
                  <span
                    className="cursor-grab text-muted-foreground/60 active:cursor-grabbing"
                    title="Seret kolom di header tabel untuk mengatur urutan"
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
