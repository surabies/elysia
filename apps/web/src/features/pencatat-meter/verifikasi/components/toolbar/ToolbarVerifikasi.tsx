"use client";

// components/tanstacktable/components/toolbar/ToolbarVerifikasi.tsx
// Toolbar Navbar Verifikasi Modern, Terpadu, Compact & Mewah.
// Kiri: Periode Kerja & REUI Filters (+ Filter di kiri, popover membuka ke kanan)
// Kanan: Kolom -> Kerapatan -> Collapse -> Engine (Icon) | Indicator Dot Permanen & PageSize

import * as React from "react";
import { CalendarDaysIcon } from "@/components/icons/ikon-lucide";
import { HugeiconsIcon } from "@/components/icons/IconRenderer";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeriode } from "@/features/public";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import {
  buatSkemaFilter,
  filterVerifikasiToQuery,
  queryToFilterVerifikasi,
} from "./skema-filter";
import {
  KontrolTampilanTabel,
  type KontrolTampilanTabelProps,
} from "./KontrolTampilanTabel";
import type { PenugasanFilter } from "../../lib/penyaringan-relasi";

export interface FilterVerifikasi {
  q: string;
  periode: number | null;
  statusVerif: string;
  pencatatId: string;
  ruteId: string;
  tanggalDari: string;
  tanggalSampai: string;
  hanyaAnomali: boolean | string;
  kondisi: string;
  jenisInput: string;
  pageSize: number;
}

export const FILTER_AWAL: FilterVerifikasi = {
  q: "",
  periode: null,
  statusVerif: "",
  pencatatId: "",
  ruteId: "",
  tanggalDari: "",
  tanggalSampai: "",
  hanyaAnomali: false,
  kondisi: "",
  jenisInput: "",
  pageSize: 100,
};

export const PILIHAN_UKURAN = [50, 100, 200, 500, 1000, 2000, 5000] as const;

export interface ToolbarVerifikasiProps {
  filter: FilterVerifikasi;
  onGanti: (f: FilterVerifikasi) => void;
  periodes: number[];
  pencatats: { id: string; namaLapangan: string }[];
  rutes: { id: string; kode: string }[];
  penugasanRute?: PenugasanFilter[];
  jumlahTampil: number;
  jumlahTotal: number;
  memuat: boolean;
  modeBelumDibaca?: boolean;
  anomali?: number;
  ambang?: number;

  // Kontrol Tampilan Terpadu (Atur Kolom, Kerapatan, Ringkasan, Engine)
  kontrolTampilan?: KontrolTampilanTabelProps;
  // Fallback aksiKanan jika diberikan custom
  aksiKanan?: React.ReactNode;
}

export function ToolbarVerifikasi({
  filter,
  onGanti,
  periodes,
  pencatats,
  rutes,
  jumlahTampil,
  jumlahTotal,
  memuat,
  modeBelumDibaca = false,
  ambang = 50,
  kontrolTampilan,
  aksiKanan,
}: ToolbarVerifikasiProps) {
  // 1. Skema Filter REUI terpadu (Petugas, Rute, Status, Anomali, Kondisi, Asal Laporan)
  const filterSchema = React.useMemo(
    () =>
      buatSkemaFilter({
        pencatats,
        rutes,
        ambangAnomali: ambang,
      }),
    [pencatats, rutes, ambang],
  );

  // 2. State FilterQuery REUI disinkronkan dengan FilterVerifikasi
  const [filterQuery, setFilterQuery] = React.useState<FilterQuery>(() =>
    filterVerifikasiToQuery(filter),
  );

  React.useEffect(() => {
    setFilterQuery(filterVerifikasiToQuery(filter));
  }, [
    filter.statusVerif,
    filter.pencatatId,
    filter.ruteId,
    filter.hanyaAnomali,
    filter.kondisi,
    filter.jenisInput,
  ]);

  return (
    <div className="flex items-center justify-between w-full min-w-0 overflow-visible py-1 gap-2">
      {/* Sisi Kiri: Filter Periode & REUI Filters (+ Filter di kiri, popover membuka ke kanan) */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-visible">
        {/* Periode Kerja (Smooth styling tanpa border luar aktif) */}
        <Select
          value={filter.periode === null ? "all" : String(filter.periode)}
          onValueChange={(v) =>
            onGanti({ ...filter, periode: v === "all" ? null : Number(v) })
          }
        >
          <SelectTrigger
            size="sm"
            aria-label="Pilih Periode Kerja"
            className="h-8 gap-1.5 px-2.5 text-xs font-normal border-border/60 bg-background hover:bg-muted/60 text-foreground transition-colors cursor-pointer shrink-0"
          >
            <HugeiconsIcon
              icon={CalendarDaysIcon}
              strokeWidth={2}
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
            <SelectValue placeholder="Pilih Periode">
              {filter.periode ? formatPeriode(filter.periode) : "Semua Periode"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="z-50">
            <SelectItem value="all">Semua Periode</SelectItem>
            {periodes.map((p) => (
              <SelectItem key={p} value={String(p)}>
                {formatPeriode(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* REUI Filters Bar (Petugas, Rute, Status, Anomali, Kondisi, Asal Laporan) */}
        {!modeBelumDibaca && (
          <div className="flex items-center">
            <Filters
              fields={filterSchema}
              query={filterQuery}
              onQueryChange={(nextQuery) => {
                setFilterQuery(nextQuery);
                const updated = queryToFilterVerifikasi(nextQuery, filter);
                onGanti(updated);
              }}
              showClear
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Sisi Kanan: Kontrol Tampilan & Paginasi Baris */}
      <div className="flex items-center gap-1.5 shrink-0">
        {kontrolTampilan && <KontrolTampilanTabel {...kontrolTampilan} />}
        {!kontrolTampilan && aksiKanan}

        {/* Separator Antar Kontrol Tampilan & Paginasi Baris */}
        <div
          className="h-4 w-px bg-border/60 shrink-0 mx-0.5"
          aria-hidden="true"
        />

        {/* Status Baris Premium dengan Indicator Dot Permanen */}
        <div
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md bg-muted/40 border border-border/50 text-[11px] font-mono tabular-nums text-muted-foreground shrink-0 select-none transition-colors"
          title={
            memuat
              ? "Sedang menyinkronkan data..."
              : `Data siap: ${jumlahTampil.toLocaleString("id-ID")} dari ${jumlahTotal.toLocaleString("id-ID")} baris`
          }
        >
          {/* Indicator Dot: Hijau saat idle/ready, Amber pulse saat memuat/sync */}
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0 transition-colors duration-300",
              memuat
                ? "bg-amber-500 animate-pulse ring-2 ring-amber-500/20"
                : "bg-emerald-500 ring-2 ring-emerald-500/20",
            )}
          />
          <span className="font-medium text-foreground">
            {jumlahTampil.toLocaleString("id-ID")}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span>{jumlahTotal.toLocaleString("id-ID")}</span>
        </div>

        {/* Pilihan Ukuran Baris per Halaman */}
        <Select
          value={String(filter.pageSize)}
          onValueChange={(v) => onGanti({ ...filter, pageSize: Number(v) })}
        >
          <SelectTrigger
            size="sm"
            aria-label="Baris per halaman"
            className="w-auto h-8 text-xs shrink-0 cursor-pointer border-border/60 bg-background hover:bg-muted/60 transition-colors"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="z-50">
            {PILIHAN_UKURAN.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n.toLocaleString("id-ID")} baris
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
