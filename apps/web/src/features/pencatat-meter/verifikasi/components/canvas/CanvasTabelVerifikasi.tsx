"use client";

// components/tanstacktable/components/canvas/CanvasTabelVerifikasi.tsx
// Tabel Verifikasi berbasis HTML5 Canvas GPU (@glideapps/glide-data-grid).
// Mengadopsi 100% gaya, token warna (Geist & Tailwind PDAM), indikator tahap baris,
// ikon sumber laporan, lencana status, anomali deviasi, tema gelap/terang,
// freeze kolom ring, multi-tier header group, sorting interaktif, dan menu kolom enterprise.

import * as React from "react";
import DataEditor, {
  type CellClickedEventArgs,
  type DrawCellCallback,
  type DrawHeaderCallback,
  type EditableGridCell,
  type GridCell,
  GridCellKind,
  type GridColumn,
  GridColumnIcon,
  GridColumnMenuIcon,
  type HeaderClickedEventArgs,
  type Item,
  type Rectangle,
  type Theme,
} from "@glideapps/glide-data-grid";
import { ArrowDown, ArrowUp, Check, EyeOff, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DEFINISI_KOLOM,
  KOLOM_TIDAK_BERLAKU_BELUM_DIBACA,
  type DefinisiKolom,
} from "../../lib/definisi-kolom";
import { formatAngka, formatTanggalWaktu } from "../../lib/format-tabel";
import { LABEL_KONDISI_CATAT } from "../../lib/label-pencatatan";
import {
  Task01Icon,
  ViewOffIcon,
} from "@/components/icons/ikon-lucide";
import { HugeiconsIcon } from "@/components/icons/IconRenderer";
import {
  PREFERENSI_KOLOM_AWAL,
  type KolomVerifikasi,
  type PreferensiKolom,
} from "../../lib/preferensi-kolom";
import { labelStatus } from "../../lib/status-verifikasi";
import { turunkanBaris, type BarisTurunan } from "../../lib/turunan-baris";
import type { Tahap } from "../../lib/warna-tahap";
import type { BarisVerifikasi, ModeRing } from "../../types";
import type { HasilKoreksiInline } from "../tabel/SelEditInline";

export interface PropsCanvasTabelVerifikasi {
  rows: BarisVerifikasi[];
  terpilih: Set<string>;
  onToggle: (id: string, rentangDariShift: boolean, indeks: number) => void;
  onToggleSemua: (pilih: boolean) => void;
  idTerpilih: string | null;
  onKlikBaris: (row: BarisVerifikasi) => void;
  onKlikKanan?: (row: BarisVerifikasi, posisi: { x: number; y: number }) => void;
  ambangAnomali: number;
  modeBelumDibaca?: boolean;
  modeRing?: ModeRing;
  memuat: boolean;
  pesanKosong?: React.ReactNode;
  preferensiKolom?: PreferensiKolom;
  onLebarKolom?: (kolom: KolomVerifikasi, lebar: number) => void;
  onPindahKolom?: (dari: KolomVerifikasi, ke: KolomVerifikasi) => void;
  onUbahVisibilitasKolom?: (kolom: KolomVerifikasi, tampil: boolean) => void;
  onResetKolom?: () => void;
  bolehEdit?: (row: BarisVerifikasi) => boolean;
  bolehEditTagihan?: (row: BarisVerifikasi) => boolean;
  onSimpanKoreksi?: (
    row: BarisVerifikasi,
    hasil: HasilKoreksiInline,
  ) => Promise<void>;
}

// Font families yang valid untuk HTML5 Canvas 2D API (tidak menggunakan CSS var() karena Canvas 2D tidak meresolusi var())
const FONT_SANS =
  '"Geist Sans", Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const FONT_MONO =
  '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

/**
 * Batas lebar kolom minimal adaptif agar teks header dan isi data tidak terhimpit secara default
 */
const LEBAR_KONTEN_MINIMAL: Record<string, number> = {
  ring: 76,
  nomor: 135,
  nama: 230,
  alamat: 280,
  standAwal: 125,
  standAkhir: 135,
  standRevisi: 130,
  standResmi: 130,
  pakai: 110,
  lalu: 105,
  tagihan: 125,
  deviasi: 110,
  rute: 105,
  kondisi: 175,
  petugas: 145,
  tanggal: 175,
  status: 125,
};

/**
 * Menghitung warna latar belakang baris berdasarkan tahap verifikasi,
 * status aktif (master-detail), centang (checkbox), dan koreksi.
 * Selaras dengan tema-verifikasi.ts & globals.css.
 */
function hitungLatarBaris(
  tahap: Tahap,
  isAktif: boolean,
  isDipilih: boolean,
  isKoreksi: boolean,
  isDark: boolean,
): string {
  if (isAktif) {
    return isDark ? "rgba(59, 130, 246, 0.22)" : "rgba(37, 99, 235, 0.11)";
  }
  if (isDipilih) {
    return isDark ? "rgba(59, 130, 246, 0.14)" : "rgba(37, 99, 235, 0.06)";
  }
  // PRIORITAS UP: Tahap Verifikasi (V1, V2, V3, DITOLAK) lebih tinggi dari koreksi
  if (tahap === "V3") {
    return isDark ? "rgba(62, 207, 142, 0.08)" : "rgba(30, 184, 112, 0.045)";
  }
  if (tahap === "V2" || tahap === "TERVERIFIKASI") {
    return isDark ? "rgba(50, 145, 255, 0.08)" : "rgba(0, 112, 243, 0.04)";
  }
  if (tahap === "V1") {
    return isDark ? "rgba(245, 166, 35, 0.08)" : "rgba(245, 166, 35, 0.045)";
  }
  if (tahap === "DITOLAK") {
    return isDark ? "rgba(255, 68, 68, 0.09)" : "rgba(224, 0, 0, 0.045)";
  }
  // Warna latar koreksi (ungu) hanya berlaku saat tahap masih MENUNGGU
  if (isKoreksi) {
    return isDark ? "rgba(168, 85, 247, 0.08)" : "rgba(121, 40, 202, 0.04)";
  }
  return isDark ? "#18181b" : "#ffffff";
}

/**
 * Memotong teks secara presisi dengan akhiran ellipsis ("...") saat lebar teks melebihi lebar sel.
 * Meniru secara sempurna perilaku CSS `truncate` (text-overflow: ellipsis) dari TanStack table.
 */
function potongTeksDenganEllipsis(
  ctx: CanvasRenderingContext2D,
  teks: string,
  lebarMaksimal: number,
): string {
  if (!teks || lebarMaksimal <= 0) return "";
  const lebarAsli = ctx.measureText(teks).width;
  if (lebarAsli <= lebarMaksimal) return teks;

  const ellipsis = "...";
  const lebarEllipsis = ctx.measureText(ellipsis).width;
  if (lebarEllipsis >= lebarMaksimal) return "...";

  const sisaLebar = lebarMaksimal - lebarEllipsis;
  let rendah = 0;
  let tinggi = teks.length;
  let hasil = "";

  while (rendah <= tinggi) {
    const tengah = Math.floor((rendah + tinggi) / 2);
    const potong = teks.slice(0, tengah);
    const lebarPotong = ctx.measureText(potong).width;

    if (lebarPotong <= sisaLebar) {
      hasil = potong;
      rendah = tengah + 1;
    } else {
      tinggi = tengah - 1;
    }
  }

  return hasil ? `${hasil}...` : "...";
}

/**
 * Mengelompokkan kolom ke dalam Multi-Level Header (Enterprise Hierarchy)
 */
function getGroupForColumn(colId: string): string | undefined {
  switch (colId) {
    case "ceklis":
    case "ring":
      return undefined; // Kolom Beku (Frozen) tanpa group
    case "nomor":
    case "nama":
    case "alamat":
    case "rute":
      return "PELANGGAN";
    case "standAwal":
    case "standAkhir":
    case "standRevisi":
    case "standResmi":
      return "STAND METER";
    case "pakai":
    case "lalu":
    case "tagihan":
    case "deviasi":
      return "PEMAKAIAN AIR";
    case "kondisi":
    case "petugas":
    case "tanggal":
    case "status":
      return "VERIFIKASI";
    default:
      return undefined;
  }
}

/**
 * Ikon Enterprise per-kolom dari Glide Data Grid
 */
function getIconForColumn(colId: string): GridColumnIcon | undefined {
  switch (colId) {
    case "nomor":
      return GridColumnIcon.HeaderRowID;
    case "nama":
      return GridColumnIcon.HeaderString;
    case "alamat":
      return GridColumnIcon.HeaderUri;
    case "standAwal":
    case "standAkhir":
    case "standRevisi":
    case "standResmi":
    case "pakai":
    case "lalu":
    case "tagihan":
    case "deviasi":
      return GridColumnIcon.HeaderNumber;
    case "rute":
    case "kondisi":
    case "petugas":
      return GridColumnIcon.HeaderString;
    case "tanggal":
      return GridColumnIcon.HeaderDate;
    case "status":
      return GridColumnIcon.HeaderBoolean;
    default:
      return undefined;
  }
}

export function CanvasTabelVerifikasi({
  rows,
  terpilih,
  onToggle,
  onToggleSemua,
  idTerpilih,
  onKlikBaris,
  onKlikKanan,
  ambangAnomali,
  modeBelumDibaca = false,
  modeRing = "berjenjang",
  memuat,
  pesanKosong,
  preferensiKolom,
  onLebarKolom,
  onPindahKolom,
  onUbahVisibilitasKolom,
  onResetKolom,
  bolehEdit,
  bolehEditTagihan,
  onSimpanKoreksi,
}: PropsCanvasTabelVerifikasi) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Pre-kalkulasi turunan baris (hasil bacaan, MB, anomali, status ring)
  const data = React.useMemo(() => rows.map(turunkanBaris), [rows]);

  // State Pengurutan Kolom (Enterprise Sorting: asc | desc | null)
  const [sortConfig, setSortConfig] = React.useState<{
    colId: KolomVerifikasi;
    dir: "asc" | "desc";
  } | null>(null);

  // Sorting data secara aman dan reaktif
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    const { colId, dir } = sortConfig;
    const mul = dir === "asc" ? 1 : -1;

    return [...data].sort((a, b) => {
      switch (colId) {
        case "nomor":
          return (
            mul *
            (a.nomor || "").localeCompare(b.nomor || "", undefined, {
              numeric: true,
            })
          );
        case "nama":
          return mul * (a.nama || "").localeCompare(b.nama || "");
        case "alamat":
          return mul * (a.alamat || "").localeCompare(b.alamat || "");
        case "standAwal":
          return mul * ((a.standAwal ?? 0) - (b.standAwal ?? 0));
        case "standAkhir":
          return mul * ((a.standAkhir ?? 0) - (b.standAkhir ?? 0));
        case "standRevisi":
          return mul * ((a.standAwalRevisi ?? 0) - (b.standAwalRevisi ?? 0));
        case "standResmi":
          return mul * ((a.standResmi ?? 0) - (b.standResmi ?? 0));
        case "pakai":
          return mul * ((a.pemakaian ?? 0) - (b.pemakaian ?? 0));
        case "lalu":
          return mul * ((a.pemakaianLalu ?? 0) - (b.pemakaianLalu ?? 0));
        case "tagihan":
          return mul * ((a.pemakaianTagih ?? 0) - (b.pemakaianTagih ?? 0));
        case "deviasi":
          return mul * ((a.persentase ?? 0) - (b.persentase ?? 0));
        case "rute":
          return mul * (a.rute || "").localeCompare(b.rute || "");
        case "kondisi":
          return (
            mul * (a.kondisiLabel || "").localeCompare(b.kondisiLabel || "")
          );
        case "petugas":
          return mul * (a.petugas || "").localeCompare(b.petugas || "");
        case "tanggal":
          return (
            mul *
            (new Date(a.tanggalCatat || 0).getTime() -
              new Date(b.tanggalCatat || 0).getTime())
          );
        case "status": {
          const sA = labelStatus(a.row, a.tahap, modeBelumDibaca, modeRing);
          const sB = labelStatus(b.row, b.tahap, modeBelumDibaca, modeRing);
          return mul * sA.localeCompare(sB);
        }
        default:
          return 0;
      }
    });
  }, [data, sortConfig, modeBelumDibaca, modeRing]);

  // State Popover Pilihan Kondisi (Ket. Catat)
  const [popoverKondisi, setPopoverKondisi] = React.useState<{
    item: BarisTurunan;
    posisi: { x: number; y: number; width?: number; height?: number };
  } | null>(null);

  // State Popover Meter Baru (MB) 2-Input
  const [popoverMB, setPopoverMB] = React.useState<{
    item: BarisTurunan;
    posisi: { x: number; y: number; width?: number; height?: number };
  } | null>(null);

  // State Popover Menu Kolom Header Enterprise
  const [menuKolom, setMenuKolom] = React.useState<{
    colIndex: number;
    colId: KolomVerifikasi;
    title: string;
    posisi: Rectangle;
  } | null>(null);

  // State untuk menyimpan lebar kolom yang diubah manual oleh pengguna via drag-resize
  const [manualColumnSizes, setManualColumnSizes] = React.useState<
    Record<string, number>
  >({});

  // Kalkulasi lebar kolom adaptif berdasarkan ukuran konten sel dan judul header
  const autoContentWidths = React.useMemo<Record<string, number>>(() => {
    const result: Record<string, number> = { ...LEBAR_KONTEN_MINIMAL };
    if (typeof window === "undefined" || !data.length) {
      return result;
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return result;

      // Sampel hingga 50 baris pertama untuk menghitung panjang konten nyata
      const sampleItems = data.slice(0, 50);

      for (const def of DEFINISI_KOLOM) {
        const colId = def.id;
        if (colId === "ring") {
          result.ring = 76;
          continue;
        }

        // 1. Ukur teks header (font semibold 13px)
        ctx.font = '600 13px "Geist Sans", sans-serif';
        const titleWidth = ctx.measureText(def.label).width;
        // Icon (18px) + gap (6px) + menu dots (24px) + sort arrow buffer (16px) + padding kiri-kanan (24px)
        const headerWidth = Math.ceil(titleWidth + 18 + 6 + 24 + 16 + 24);

        // 2. Ukur teks isi sel dari baris data
        const isMono = [
          "nomor",
          "standAwal",
          "standAkhir",
          "standRevisi",
          "standResmi",
          "pakai",
          "lalu",
          "tagihan",
          "deviasi",
          "rute",
        ].includes(colId);

        ctx.font = isMono
          ? '500 14px "Geist Mono", monospace'
          : '14px "Geist Sans", sans-serif';

        let maxCellWidth = 0;

        for (const item of sampleItems) {
          let text = "";
          switch (colId) {
            case "nomor":
              text = item.nomor || "";
              break;
            case "nama":
              text = item.nama || "";
              break;
            case "alamat":
              text = item.alamat || "";
              break;
            case "standAwal":
              text = item.standAwal != null ? formatAngka(item.standAwal) : "";
              break;
            case "standAkhir":
              text =
                item.standAkhir != null ? formatAngka(item.standAkhir) : "";
              break;
            case "standRevisi":
              text =
                item.standAwalRevisi != null
                  ? formatAngka(item.standAwalRevisi)
                  : "";
              break;
            case "standResmi":
              text =
                item.standResmi != null ? formatAngka(item.standResmi) : "";
              break;
            case "pakai":
              text = item.pemakaian != null ? formatAngka(item.pemakaian) : "";
              break;
            case "lalu":
              text =
                item.pemakaianLalu != null
                  ? formatAngka(item.pemakaianLalu)
                  : "";
              break;
            case "tagihan":
              text =
                item.pemakaianTagih != null
                  ? formatAngka(item.pemakaianTagih)
                  : "";
              break;
            case "deviasi":
              text =
                item.persentase != null
                  ? `${item.persentase > 0 ? "+" : ""}${item.persentase}%`
                  : "";
              break;
            case "rute":
              text = item.rute || "";
              break;
            case "kondisi":
              text = item.kondisiLabel || "";
              break;
            case "petugas":
              text = item.petugas || "";
              break;
            case "tanggal":
              text = item.tanggalCatat
                ? formatTanggalWaktu(item.tanggalCatat)
                : "";
              break;
            case "status":
              text = labelStatus(
                item.row,
                item.tahap,
                modeBelumDibaca,
                modeRing,
              );
              break;
          }

          if (text) {
            let w = ctx.measureText(text).width + 24; // 12px padding kiri & kanan
            if (colId === "standAkhir") {
              w += 32; // Mandiri/manual icon + indikator segitiga MB
            } else if (colId === "deviasi" || colId === "status") {
              w += 28; // Pill badge padding & border
            }
            if (w > maxCellWidth) {
              maxCellWidth = w;
            }
          }
        }

        const fallbackMin = LEBAR_KONTEN_MINIMAL[colId] ?? def.minWidth;
        const finalWidth = Math.min(
          600,
          Math.max(
            def.minWidth,
            fallbackMin,
            headerWidth,
            Math.ceil(maxCellWidth + 16),
          ),
        );
        result[colId] = finalWidth;
      }
    } catch {
      // Abaikan bila konteks 2D canvas belum tersedia
    }

    return result;
  }, [data, modeBelumDibaca, modeRing]);

  // Kolom-kolom aktif: diawali dengan kolom "ceklis" & "ring" agar dibekukan (freezeColumns={2})
  const columns = React.useMemo<GridColumn[]>(() => {
    const list: GridColumn[] = [
      {
        id: "ceklis",
        title: "",
        width: 48,
        hasMenu: false,
      },
    ];

    const dataCols: DefinisiKolom[] = [];
    if (preferensiKolom?.urutan) {
      for (const colId of preferensiKolom.urutan) {
        if (preferensiKolom.tampil[colId] === false) continue;
        if (modeBelumDibaca && KOLOM_TIDAK_BERLAKU_BELUM_DIBACA.has(colId)) continue;
        const def = DEFINISI_KOLOM.find((d) => d.id === colId);
        if (def) dataCols.push(def);
      }
    } else {
      for (const def of DEFINISI_KOLOM) {
        if (modeBelumDibaca && KOLOM_TIDAK_BERLAKU_BELUM_DIBACA.has(def.id)) continue;
        dataCols.push(def);
      }
    }

    // Pastikan "ring" selalu berada tepat setelah "ceklis" agar selalu masuk dalam freezeColumns={2}
    const indexRing = dataCols.findIndex((d) => d.id === "ring");
    if (indexRing > 0) {
      const [ringDef] = dataCols.splice(indexRing, 1);
      if (ringDef) dataCols.unshift(ringDef);
    }

    list.push(
      ...dataCols.map((def) => {
        const isRing = def.id === "ring";
        // Prioritas lebar:
        // 1. Perubahan manual user pada sesi ini via drag resize
        // 2. Preferensi tersimpan jika secara eksplisit berbeda dari default lama
        // 3. Menyesuaikan lebar konten secara adaptif (autoContentWidths)
        const customManual = manualColumnSizes[def.id];
        const prefSaved = preferensiKolom?.lebar[def.id];
        const isExplicitCustom =
          prefSaved != null &&
          prefSaved !== PREFERENSI_KOLOM_AWAL.lebar[def.id];

        const defaultWidth = isRing ? 76 : def.minWidth;
        const computedWidth =
          customManual ??
          (isExplicitCustom ? prefSaved : undefined) ??
          (isRing ? 76 : autoContentWidths[def.id] ?? defaultWidth);

        return {
          id: def.id,
          title: def.label,
          group: getGroupForColumn(def.id),
          icon: isRing ? undefined : getIconForColumn(def.id),
          hasMenu: true,
          menuIcon: GridColumnMenuIcon.Dots,
          width: computedWidth,
        };
      }),
    );

    return list;
  }, [preferensiKolom, autoContentWidths, manualColumnSizes, modeBelumDibaca]);

  // Tema warna Canvas selaras dengan tema sistem (Vercel Geist & Tailwind PDAM)
  const theme = React.useMemo<Partial<Theme>>(() => {
    return {
      accentColor: isDark ? "#3b82f6" : "#2563eb",
      accentLight: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.12)",
      textDark: isDark ? "#f4f4f5" : "#09090b",
      textMedium: isDark ? "#a1a1aa" : "#71717a",
      textLight: isDark ? "#71717a" : "#a1a1aa",
      textHeader: isDark ? "#f4f4f5" : "#09090b",
      textGroupHeader: isDark ? "#a1a1aa" : "#71717a",
      bgCell: isDark ? "#18181b" : "#ffffff",
      bgCellMedium: isDark ? "#1f1f23" : "#fafafa",
      bgHeader: isDark ? "#18181b" : "#f4f4f5",
      bgHeaderHasFocus: isDark ? "#27272a" : "#e4e4e7",
      bgHeaderHovered: isDark ? "#27272a" : "#e4e4e7",
      borderColor: isDark ? "#27272a" : "#e4e4e7",
      horizontalBorderColor: isDark
        ? "rgba(39, 39, 42, 0.85)"
        : "rgba(228, 228, 231, 0.85)",
      headerBottomBorderColor: isDark ? "#3f3f46" : "#d4d4d8",
      cellHorizontalPadding: 12,
      cellVerticalPadding: 6,
      fontFamily: FONT_SANS,
      baseFontStyle: "14px",
      headerFontStyle: "600 13px",
      editorFontSize: "14px",
      lineHeight: 1.4,
    };
  }, [isDark]);

  // Data provider GPU (dipanggil per-sel yang terlihat di viewport)
  const getCellContent = React.useCallback(
    ([col, row]: Item): GridCell => {
      const item = sortedData[row];
      const columnDef = columns[col];
      if (!item || !columnDef) {
        return {
          kind: GridCellKind.Text,
          data: "",
          displayData: "",
          allowOverlay: false,
        };
      }

      const colId = columnDef.id as KolomVerifikasi | "ceklis";

      // Hitung latar belakang baris berdasarkan status tahap & seleksi
      const isAktif = item.id === idTerpilih;
      const isDipilih = terpilih.has(item.id);
      const isKoreksi = Boolean(item.dikoreksi && !modeBelumDibaca);
      const rowBg = hitungLatarBaris(
        item.tahap,
        isAktif,
        isDipilih,
        isKoreksi,
        isDark,
      );
      const rowTheme: Partial<Theme> = {
        bgCell: rowBg,
        fontFamily: FONT_SANS,
        baseFontStyle: "14px",
      };
      const boldRowTheme: Partial<Theme> = {
        bgCell: rowBg,
        fontFamily: FONT_SANS,
        baseFontStyle: "600 14px",
      };
      const monoRowTheme: Partial<Theme> = {
        bgCell: rowBg,
        fontFamily: FONT_MONO,
        baseFontStyle: "500 14px",
      };
      const monoBoldRowTheme: Partial<Theme> = {
        bgCell: rowBg,
        fontFamily: FONT_MONO,
        baseFontStyle: "600 14px",
      };
      const mutedTheme: Partial<Theme> = {
        bgCell: rowBg,
        textDark: isDark ? "#a1a1aa" : "#71717a",
        fontFamily: FONT_SANS,
        baseFontStyle: "14px",
      };
      const monoMutedTheme: Partial<Theme> = {
        bgCell: rowBg,
        textDark: isDark ? "#a1a1aa" : "#71717a",
        fontFamily: FONT_MONO,
        baseFontStyle: "14px",
      };

      // Izin edit sel: jika bolehEdit tidak diberikan, default ke true
      const userBolehEdit = bolehEdit ? bolehEdit(item.row) : true;
      const userBolehTagihan = bolehEditTagihan ? bolehEditTagihan(item.row) : true;

      const isBarisMB =
        item.isMB ||
        item.row.kondisi === "MB" ||
        item.row.kondisiRevisi === "MB";

      switch (colId) {
        case "ceklis": {
          return {
            kind: GridCellKind.Text,
            data: "",
            displayData: "",
            allowOverlay: false,
            contentAlign: "center",
            themeOverride: rowTheme,
          };
        }

        case "ring": {
          return {
            kind: GridCellKind.Text,
            data: item.tahap,
            displayData: "", // Batang progress digambar via drawCell
            allowOverlay: false,
            contentAlign: "center",
            themeOverride: rowTheme,
          };
        }

        case "nomor":
          return {
            kind: GridCellKind.Text,
            data: item.nomor || "-",
            displayData: item.nomor || "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: monoRowTheme,
          };

        case "nama":
          return {
            kind: GridCellKind.Text,
            data: item.nama || "-",
            displayData: item.nama || "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: boldRowTheme,
          };

        case "alamat":
          return {
            kind: GridCellKind.Text,
            data: item.alamat || "-",
            displayData: item.alamat || "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: mutedTheme,
          };

        case "standAwal":
          return {
            kind: GridCellKind.Number,
            data: item.standAwal ?? 0,
            displayData:
              item.standAwal != null ? formatAngka(item.standAwal) : "-",
            allowOverlay: false,
            contentAlign: "right",
            themeOverride: monoRowTheme,
          };

        case "standAkhir": {
          const formatted =
            item.standAkhir != null ? formatAngka(item.standAkhir) : "-";
          return {
            kind: GridCellKind.Number,
            data: item.standAkhir ?? 0,
            displayData: formatted,
            // Jika baris MB: edit via Popover 2-Input (bukan single overlay)
            allowOverlay: userBolehEdit && !isBarisMB,
            contentAlign: "right",
            themeOverride: {
              ...monoBoldRowTheme,
              ...(item.standAkhirDikoreksi
                ? {
                    textDark: isDark ? "#c084fc" : "#9333ea",
                  }
                : {}),
            },
          };
        }

        case "standRevisi": {
          const isRevisi =
            item.row.standAwalRevisi != null &&
            item.row.standAwalRevisi !== item.row.standAwal;
          return {
            kind: GridCellKind.Number,
            data: item.standAwalRevisi ?? 0,
            displayData:
              item.standAwalRevisi != null
                ? formatAngka(item.standAwalRevisi)
                : "-",
            allowOverlay: userBolehEdit,
            contentAlign: "right",
            themeOverride: {
              ...monoRowTheme,
              ...(isRevisi
                ? {
                    ...monoBoldRowTheme,
                    textDark: isDark ? "#c084fc" : "#9333ea",
                  }
                : {}),
            },
          };
        }

        case "standResmi":
          return {
            kind: GridCellKind.Number,
            data: item.standResmi ?? 0,
            displayData:
              item.standResmi != null ? formatAngka(item.standResmi) : "-",
            allowOverlay: false,
            contentAlign: "right",
            themeOverride: monoRowTheme,
          };

        case "pakai":
          return {
            kind: GridCellKind.Number,
            data: item.pemakaian ?? 0,
            displayData:
              item.pemakaian != null ? formatAngka(item.pemakaian) : "-",
            allowOverlay: userBolehEdit,
            contentAlign: "right",
            themeOverride: {
              ...monoBoldRowTheme,
              ...(item.pemakaianDikoreksi
                ? {
                    textDark: isDark ? "#c084fc" : "#9333ea",
                  }
                : {}),
            },
          };

        case "lalu":
          return {
            kind: GridCellKind.Number,
            data: item.pemakaianLalu ?? 0,
            displayData:
              item.pemakaianLalu != null ? formatAngka(item.pemakaianLalu) : "-",
            allowOverlay: false,
            contentAlign: "right",
            themeOverride: monoMutedTheme,
          };

        case "tagihan":
          return {
            kind: GridCellKind.Number,
            data: item.pemakaianTagih ?? 0,
            displayData:
              item.pemakaianTagih != null
                ? formatAngka(item.pemakaianTagih)
                : "-",
            allowOverlay: userBolehTagihan,
            contentAlign: "right",
            themeOverride: {
              ...monoBoldRowTheme,
              ...(item.row.pemakaianTagihVerif != null
                ? {
                    textDark: isDark ? "#c084fc" : "#9333ea",
                  }
                : {}),
            },
          };

        case "deviasi": {
          const persen = item.persentase;
          const label =
            persen != null ? `${persen > 0 ? "+" : ""}${persen}%` : "-";
          const isAnomali = persen != null && Math.abs(persen) > ambangAnomali;
          return {
            kind: GridCellKind.Text,
            data: String(persen ?? 0),
            // Jika anomali, kosongkan teks default agar drawCell menggambar Lencana Pill
            displayData: isAnomali ? "" : label,
            allowOverlay: false,
            contentAlign: "right",
            themeOverride: monoRowTheme,
          };
        }

        case "rute":
          return {
            kind: GridCellKind.Text,
            data: item.rute || "-",
            displayData: item.rute || "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: monoMutedTheme,
          };

        case "kondisi":
          return {
            kind: GridCellKind.Text,
            data: item.kondisiLabel || "-",
            displayData: item.kondisiLabel || "-",
            // Edit via Popover Dropdown Pilihan Kondisi saat diklik
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: item.kondisiDikoreksi
              ? {
                  ...boldRowTheme,
                  textDark: isDark ? "#c084fc" : "#9333ea",
                }
              : mutedTheme,
          };

        case "petugas":
          return {
            kind: GridCellKind.Text,
            data: item.petugas || "-",
            displayData: item.petugas || "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: mutedTheme,
          };

        case "tanggal":
          return {
            kind: GridCellKind.Text,
            data: item.tanggalCatat || "-",
            displayData: item.tanggalCatat
              ? formatTanggalWaktu(item.tanggalCatat)
              : "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: monoMutedTheme,
          };

        case "status": {
          const statusText = labelStatus(
            item.row,
            item.tahap,
            modeBelumDibaca,
            modeRing,
          );
          return {
            kind: GridCellKind.Text,
            data: statusText,
            displayData: "", // Lencana digambar via drawCell
            allowOverlay: false,
            contentAlign: "center",
            themeOverride: rowTheme,
          };
        }

        default:
          return {
            kind: GridCellKind.Text,
            data: "",
            displayData: "-",
            allowOverlay: false,
            contentAlign: "left",
            themeOverride: rowTheme,
          };
      }
    },
    [
      sortedData,
      columns,
      ambangAnomali,
      isDark,
      idTerpilih,
      terpilih,
      modeBelumDibaca,
      modeRing,
      bolehEdit,
      bolehEditTagihan,
    ],
  );

  // Custom Header Rendering: Gambar checkbox Pilih Semua & Indikator Sort
  const drawHeader = React.useCallback<DrawHeaderCallback>(
    (args, defaultDraw) => {
      const { ctx, rect, columnIndex } = args;
      const columnDef = columns[columnIndex];
      if (!columnDef) return;

      if (columnDef.id === "ceklis") {
        defaultDraw();

        const boxSize = 18;
        const boxX = Math.round(rect.x + (rect.width - boxSize) / 2);
        const boxY = Math.round(rect.y + (rect.height - boxSize) / 2);
        const semuaTerpilih =
          sortedData.length > 0 && terpilih.size === sortedData.length;
        const sebagianTerpilih =
          terpilih.size > 0 && terpilih.size < sortedData.length;

        ctx.save();
        if (semuaTerpilih) {
          ctx.fillStyle = isDark ? "#3b82f6" : "#2563eb";
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
          } else {
            ctx.rect(boxX, boxY, boxSize, boxSize);
          }
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(boxX + 3.8, boxY + 9);
          ctx.lineTo(boxX + 7.2, boxY + 13);
          ctx.lineTo(boxX + 14.2, boxY + 5);
          ctx.stroke();
        } else if (sebagianTerpilih) {
          ctx.fillStyle = isDark ? "#3b82f6" : "#2563eb";
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
          } else {
            ctx.rect(boxX, boxY, boxSize, boxSize);
          }
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(boxX + 4.5, boxY + 9);
          ctx.lineTo(boxX + 13.5, boxY + 9);
          ctx.stroke();
        } else {
          ctx.fillStyle = isDark ? "#1f1f23" : "#f4f4f5";
          ctx.strokeStyle = isDark
            ? "rgba(161, 161, 170, 0.45)"
            : "rgba(161, 161, 170, 0.65)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
          } else {
            ctx.rect(boxX, boxY, boxSize, boxSize);
          }
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      // Gambar header default Glide (judul, ikon kolom, dan menu 3-titik)
        defaultDraw();

      // Indikator Pengurutan Kolom Enterprise (▲ / ▼)
      if (sortConfig && sortConfig.colId === columnDef.id) {
        ctx.save();
        ctx.fillStyle = isDark ? "#60a5fa" : "#2563eb";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const arrow = sortConfig.dir === "asc" ? "▲" : "▼";
        // Posisikan panah di sebelah kiri menu dots
        const arrowX = rect.x + rect.width - 24;
        const arrowY = rect.y + rect.height / 2;
        ctx.fillText(arrow, arrowX, arrowY);
        ctx.restore();
      }
    },
    [columns, sortedData, terpilih, isDark, sortConfig],
  );

  // Custom Canvas Rendering: Checkbox, Aksen Garis Tahap, Indikator Ring, Ikon Mandiri/Manual, MB Segitiga, Deviasi Pill, Status Pill
  const drawCell = React.useCallback<DrawCellCallback>(
    (args, defaultDraw) => {
      const { ctx, rect, col, row } = args;
      const item = sortedData[row];
      const columnDef = columns[col];
      if (!item || !columnDef) return;

      const colId = columnDef.id as KolomVerifikasi | "ceklis";

      // 0. Gambar Kolom Ceklis (Kotak Centang + Garis Aksen Tahap di sisi kiri)
      if (colId === "ceklis") {
        defaultDraw();

        // A. Garis Penanda Tahap di Sisi Kiri Baris (Garis Aksen 3.5px) — Prioritas UP
        let stripeColor: string | null = null;
        if (item.tahap === "V3") {
          stripeColor = "#10b981"; // emerald-500
        } else if (item.tahap === "V2" || item.tahap === "TERVERIFIKASI") {
          stripeColor = "#3b82f6"; // blue-500
        } else if (item.tahap === "V1") {
          stripeColor = "#f59e0b"; // amber-500
        } else if (item.tahap === "DITOLAK") {
          stripeColor = "#ef4444"; // red-500
        } else if (item.dikoreksi && !modeBelumDibaca) {
          stripeColor = "#a855f7"; // purple-500 (hanya saat belum masuk V1-V3)
        }

        if (stripeColor) {
          ctx.save();
          ctx.fillStyle = stripeColor;
          ctx.fillRect(rect.x, rect.y, 3.5, rect.height);
          ctx.restore();
        }

        // B. Kotak Centang Checkbox (18x18 px — mudah dilihat & diakses)
        const boxSize = 18;
        const boxX = Math.round(rect.x + (rect.width - boxSize) / 2);
        const boxY = Math.round(rect.y + (rect.height - boxSize) / 2);
        const isChecked = terpilih.has(item.id);

        ctx.save();
        if (isChecked) {
          ctx.fillStyle = isDark ? "#3b82f6" : "#2563eb";
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
          } else {
            ctx.rect(boxX, boxY, boxSize, boxSize);
          }
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(boxX + 3.8, boxY + 9);
          ctx.lineTo(boxX + 7.2, boxY + 13);
          ctx.lineTo(boxX + 14.2, boxY + 5);
          ctx.stroke();
        } else {
          ctx.fillStyle = isDark ? "#18181b" : "#ffffff";
          ctx.strokeStyle = isDark
            ? "rgba(161, 161, 170, 0.45)"
            : "rgba(161, 161, 170, 0.65)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
          } else {
            ctx.rect(boxX, boxY, boxSize, boxSize);
          }
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      // 1. Gambar Sel Status Ring Verifikasi dengan Batang Indikator (V1/V2/V3 atau Mandiri)
      if (colId === "ring") {
        defaultDraw();

        const ditolak = item.tahap === "DITOLAK" || item.row.status === "DITOLAK";

        const WARNA_KOSONG = isDark
          ? "rgba(255, 255, 255, 0.18)"
          : "rgba(0, 0, 0, 0.15)";
        const WARNA_ERROR = "#ef4444";
        const WARNA_V1 = "#f59e0b"; // V1: Amber (Supervisor)
        const WARNA_V2 = "#3b82f6"; // V2: Blue (Manager)
        const WARNA_V3 = "#10b981"; // V3: Emerald (Resmi Final)
        const WARNA_MANDIRI = "#06b6d4";

        let barColors: string[] = [];

        if (ditolak) {
          barColors =
            modeRing === "tunggal"
              ? [WARNA_ERROR]
              : [WARNA_ERROR, WARNA_ERROR, WARNA_ERROR];
        } else if (modeRing === "tunggal") {
          // Mode Tunggal (Verifikasi Mandiri): 1 bar indikator tegas tanpa ambiguitas
          // Abu-abu = Menunggu, Hijau Emerald = Terverifikasi/Disetujui, Merah = Ditolak
          const isSelesai = Boolean(
            item.row.laporanMandiriTerverifikasi ||
              item.row.isVerified ||
              item.row.status === "DIVERIFIKASI" ||
              item.row.status === "DIGUNAKAN" ||
              item.row.verif3At,
          );
          barColors = [isSelesai ? WARNA_V3 : WARNA_KOSONG];
        } else {
          const v1 = Boolean(item.row.verif1At);
          const v2 = Boolean(item.row.verif2At);
          const v3 = Boolean(item.row.verif3At || item.row.isVerified);
          barColors = [
            v1 ? WARNA_V1 : WARNA_KOSONG,
            v2 ? WARNA_V2 : WARNA_KOSONG,
            v3 ? WARNA_V3 : WARNA_KOSONG,
          ];
        }

        const barWidth = modeRing === "tunggal" ? 6 : 5;
        const barHeight = 20;
        const barGap = 3.5;
        const totalWidth =
          barColors.length * barWidth + (barColors.length - 1) * barGap;
        const startX = Math.round(rect.x + (rect.width - totalWidth) / 2);
        const startY = Math.round(rect.y + (rect.height - barHeight) / 2);

        ctx.save();
        for (let i = 0; i < barColors.length; i++) {
          ctx.fillStyle = barColors[i]!;
          const x = startX + i * (barWidth + barGap);
          const y = startY;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, barWidth, barHeight, 2.5);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      // 2. Gambar Sel Stand Akhir: Ikon Mandiri/Manual tepat di samping kiri angka + Segitiga MB di kanan atas
      if (colId === "standAkhir") {
        defaultDraw();

        const jenis = item.row.jenisInput ?? (item.row as any).sumberLaporan;
        const isMandiri =
          jenis === "KONSUMEN" ||
          (typeof jenis === "string" && jenis.startsWith("MANDIRI"));
        const isManual =
          jenis === "MANUAL_SATUAN" ||
          jenis === "MANUAL_MASSAL" ||
          jenis === "MANUAL" ||
          (typeof jenis === "string" && jenis.includes("MANUAL"));

        if (isMandiri || isManual) {
          ctx.save();
          // Ikon ditempatkan seimbang di sisi KIRI sel (14px dari border kiri)
          // Angka stand akhir berada di sisi KANAN sel (via defaultDraw / GridCellKind.Number)
          const iconX = rect.x + 14;
          const iconY = Math.round(rect.y + rect.height / 2);

          if (isMandiri) {
            // Icon Pelanggan / UserCircle presisi & proporsional
            const warnaMandiri = isDark ? "#22d3ee" : "#0891b2";
            ctx.strokeStyle = warnaMandiri;
            ctx.fillStyle = warnaMandiri;
            ctx.lineWidth = 1.3;

            // Lingkaran luar
            ctx.beginPath();
            ctx.arc(iconX, iconY, 6.5, 0, Math.PI * 2);
            ctx.stroke();

            // Clip torso agar rapi di dalam lingkaran
            ctx.save();
            ctx.beginPath();
            ctx.arc(iconX, iconY, 5.8, 0, Math.PI * 2);
            ctx.clip();

            // Kepala
            ctx.beginPath();
            ctx.arc(iconX, iconY - 1.8, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Badan / pundak
            ctx.beginPath();
            ctx.arc(iconX, iconY + 5.2, 3.8, Math.PI, 0);
            ctx.fill();
            ctx.restore();
          } else {
            // Icon Pensil / Manual Add yang proporsional & realistis dengan orientasi 45 derajat
            ctx.save();
            ctx.translate(iconX, iconY);
            ctx.rotate((-45 * Math.PI) / 180);

            const warnaPensil = isDark ? "#fbbf24" : "#d97706";
            ctx.fillStyle = warnaPensil;
            ctx.strokeStyle = warnaPensil;
            ctx.lineWidth = 1.2;

            // Batang pensil
            ctx.beginPath();
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(-2, -5, 4, 7, 0.5);
            } else {
              ctx.rect(-2, -5, 4, 7);
            }
            ctx.fill();

            // Mata pensil
            ctx.beginPath();
            ctx.moveTo(-2, 2);
            ctx.lineTo(2, 2);
            ctx.lineTo(0, 5.5);
            ctx.closePath();
            ctx.fill();

            // Ujung mata pensil hitam/aksen
            ctx.fillStyle = isDark ? "#09090b" : "#451a03";
            ctx.beginPath();
            ctx.moveTo(-1, 3.8);
            ctx.lineTo(1, 3.8);
            ctx.lineTo(0, 5.5);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }
          ctx.restore();
        }

        if (item.isMB) {
          ctx.save();
          ctx.fillStyle = "#06b6d4";
          ctx.beginPath();
          ctx.moveTo(rect.x + rect.width - 10, rect.y);
          ctx.lineTo(rect.x + rect.width, rect.y);
          ctx.lineTo(rect.x + rect.width, rect.y + 10);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        return;
      }

      // 3. Gambar Sel Deviasi: Lencana Anomali (Pill Merah Bundar)
      if (colId === "deviasi" && item.persentase != null) {
        const isAnomali = Math.abs(item.persentase) > ambangAnomali;
        if (isAnomali) {
        defaultDraw();
          const label = `${item.persentase > 0 ? "+" : ""}${item.persentase}%`;
          ctx.save();
          ctx.font = "bold 12px monospace";
          const textMetrics = ctx.measureText(label);
          const pillWidth = Math.max(50, textMetrics.width + 16);
          const pillHeight = 24;
          const pillX = Math.round(rect.x + rect.width - pillWidth - 6);
          const pillY = Math.round(rect.y + (rect.height - pillHeight) / 2);

          ctx.fillStyle = isDark
            ? "rgba(239, 68, 68, 0.20)"
            : "rgba(254, 226, 226, 0.95)";
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 12);
          } else {
            ctx.rect(pillX, pillY, pillWidth, pillHeight);
          }
          ctx.fill();

          ctx.strokeStyle = isDark
            ? "rgba(239, 68, 68, 0.45)"
            : "rgba(248, 113, 113, 0.65)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = isDark ? "#fca5a5" : "#b91c1c";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, pillX + pillWidth / 2, pillY + pillHeight / 2);
          ctx.restore();
          return;
        }
      }

      // 4. Gambar Sel Status: Lencana Pill Status Verifikasi
      if (colId === "status") {
        defaultDraw();
        const statusText = labelStatus(
          item.row,
          item.tahap,
          modeBelumDibaca,
          modeRing,
        );

        let pillBg = isDark
          ? "rgba(113, 113, 122, 0.2)"
          : "rgba(228, 228, 231, 0.85)";
        let pillText = isDark ? "#e4e4e7" : "#3f3f46";
        let pillBorder = isDark
          ? "rgba(161, 161, 170, 0.3)"
          : "rgba(161, 161, 170, 0.45)";

        if (statusText === "Disetujui") {
          pillBg = isDark
            ? "rgba(16, 185, 129, 0.18)"
            : "rgba(209, 250, 229, 0.9)";
          pillText = isDark ? "#6ee7b7" : "#065f46";
          pillBorder = isDark
            ? "rgba(16, 185, 129, 0.45)"
            : "rgba(52, 211, 153, 0.6)";
        } else if (
          statusText === "Tervalidasi V2" ||
          statusText === "Terverifikasi"
        ) {
          pillBg = isDark
            ? "rgba(59, 130, 246, 0.18)"
            : "rgba(219, 234, 254, 0.9)";
          pillText = isDark ? "#93c5fd" : "#1e40af";
          pillBorder = isDark
            ? "rgba(59, 130, 246, 0.45)"
            : "rgba(96, 165, 250, 0.6)";
        } else if (statusText === "Tervalidasi V1") {
          pillBg = isDark
            ? "rgba(245, 158, 11, 0.18)"
            : "rgba(254, 243, 199, 0.9)";
          pillText = isDark ? "#fcd34d" : "#92400e";
          pillBorder = isDark
            ? "rgba(245, 158, 11, 0.45)"
            : "rgba(251, 191, 36, 0.6)";
        } else if (statusText === "Perlu Review") {
          pillBg = isDark
            ? "rgba(239, 68, 68, 0.18)"
            : "rgba(254, 226, 226, 0.9)";
          pillText = isDark ? "#fca5a5" : "#991b1b";
          pillBorder = isDark
            ? "rgba(239, 68, 68, 0.45)"
            : "rgba(248, 113, 113, 0.6)";
        }

        ctx.save();
        ctx.font = "600 12px sans-serif";
        const textMetrics = ctx.measureText(statusText);
        const pillWidth = Math.min(rect.width - 12, textMetrics.width + 18);
        const pillHeight = 24;
        const pillX = Math.round(rect.x + (rect.width - pillWidth) / 2);
        const pillY = Math.round(rect.y + (rect.height - pillHeight) / 2);

        ctx.fillStyle = pillBg;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 12);
        } else {
          ctx.rect(pillX, pillY, pillWidth, pillHeight);
        }
        ctx.fill();

        ctx.strokeStyle = pillBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = pillText;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(statusText, pillX + pillWidth / 2, pillY + pillHeight / 2);
        ctx.restore();
        return;
      }

      // 5. Penanganan Truncate Teks Otomatis dengan Ellipsis (...) saat Kolom Disempitkan
      // Meniru secara otomatis perilaku CSS `truncate` (text-overflow: ellipsis) tabel TanStack
      const KONFIG_KOLOM_TEKS: Record<
        string,
        {
          font: string;
          colorDark: string;
          colorLight: string;
          getText: (it: BarisTurunan) => string;
        }
      > = {
        nama: {
          font: `bold 13px ${FONT_SANS}`,
          colorDark: "#f4f4f5",
          colorLight: "#09090b",
          getText: (it) => it.nama || "-",
        },
        alamat: {
          font: `normal 12px ${FONT_SANS}`,
          colorDark: "#a1a1aa",
          colorLight: "#71717a",
          getText: (it) => it.alamat || "-",
        },
        nomor: {
          font: `normal 12px ${FONT_MONO}`,
          colorDark: "#f4f4f5",
          colorLight: "#18181b",
          getText: (it) => it.nomor || "-",
        },
        petugas: {
          font: `normal 12px ${FONT_SANS}`,
          colorDark: "#f4f4f5",
          colorLight: "#18181b",
          getText: (it) => it.petugas || "-",
        },
        kondisi: {
          font: `normal 12px ${FONT_SANS}`,
          colorDark: "#f4f4f5",
          colorLight: "#18181b",
          getText: (it) => it.kondisiLabel || "-",
        },
        rute: {
          font: `normal 12px ${FONT_MONO}`,
          colorDark: "#f4f4f5",
          colorLight: "#18181b",
          getText: (it) => it.rute || "-",
        },
        tanggal: {
          font: `normal 11px ${FONT_MONO}`,
          colorDark: "#a1a1aa",
          colorLight: "#71717a",
          getText: (it) =>
            it.tanggalCatat ? formatTanggalWaktu(it.tanggalCatat) : "-",
        },
      };

      const konfigTeks = KONFIG_KOLOM_TEKS[colId];
      if (konfigTeks) {
        const text = konfigTeks.getText(item);
        const paddingX = 8;
        const availableWidth = rect.width - paddingX * 2;

        ctx.save();
        ctx.font = konfigTeks.font;
        const textWidth = ctx.measureText(text).width;

        if (textWidth > availableWidth) {
          defaultDraw();

          // Timpa latar belakang sel agar teks terpotong kasar tertutup rapi
          const isAktif = item.id === idTerpilih;
          const isDipilih = terpilih.has(item.id);
          const isKoreksi = Boolean(item.dikoreksi && !modeBelumDibaca);
          ctx.fillStyle = isDark ? "#18181b" : "#ffffff";
          ctx.fillRect(
            rect.x + 0.5,
            rect.y + 0.5,
            rect.width - 1,
            rect.height - 1,
          );

          const bgWarna = hitungLatarBaris(
            item.tahap,
            isAktif,
            isDipilih,
            isKoreksi,
            isDark,
          );
          ctx.fillStyle = bgWarna;
          ctx.fillRect(
            rect.x + 0.5,
            rect.y + 0.5,
            rect.width - 1,
            rect.height - 1,
          );

          const truncated = potongTeksDenganEllipsis(ctx, text, availableWidth);
          ctx.fillStyle = isDark ? konfigTeks.colorDark : konfigTeks.colorLight;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(
            truncated,
            rect.x + paddingX,
            Math.round(rect.y + rect.height / 2),
          );
          ctx.restore();
          return;
        }
        ctx.restore();
      }

      defaultDraw();
    },
    [sortedData, columns, modeRing, isDark, ambangAnomali, modeBelumDibaca, terpilih, idTerpilih],
  );

  // Penanganan klik header:
  // - Kolom "ceklis": toggle seluruh baris
  // - Kolom data lainnya: ubah pengurutan (Sort ASC -> DESC -> Reset)
  const onHeaderClicked = React.useCallback(
    (colIndex: number, event: HeaderClickedEventArgs) => {
      const colDef = columns[colIndex];
      if (!colDef) return;

      if (colDef.id === "ceklis") {
        const semuaTerpilih =
          sortedData.length > 0 && terpilih.size === sortedData.length;
        onToggleSemua(!semuaTerpilih);
        return;
      }

      if (colDef.id === "ring") return;

      const colId = colDef.id as KolomVerifikasi;
      setSortConfig((prev) => {
        if (prev?.colId === colId) {
          if (prev.dir === "asc") return { colId, dir: "desc" };
          return null;
        }
        return { colId, dir: "asc" };
      });
    },
    [columns, sortedData, terpilih, onToggleSemua],
  );

  // Penanganan klik tombol menu 3-titik di header kolom
  const onHeaderMenuClick = React.useCallback(
    (colIndex: number, screenPosition: Rectangle) => {
      const colDef = columns[colIndex];
      if (!colDef || colDef.id === "ceklis" || colDef.id === "ring") return;

      setMenuKolom({
        colIndex,
        colId: colDef.id as KolomVerifikasi,
        title: colDef.title,
        posisi: screenPosition,
      });
    },
    [columns],
  );

  // Penanganan klik sel:
  // - Kolom ceklis: toggle centang
  // - Kolom kondisi: buka Popover Dropdown Pilihan Kondisi (posisi presisi viewport)
  // - Kolom stand akhir pada baris MB: buka Popover 2-Input MB (posisi presisi viewport)
  // - Lainnya: update panel foto detail di samping
  const onCellClicked = React.useCallback(
    ([col, row]: Item, event: CellClickedEventArgs) => {
      const item = sortedData[row];
      if (!item) return;

      const colId = columns[col]?.id;
      if (colId === "ceklis") {
        onToggle(item.id, false, row);
        return;
      }

      const userBolehEdit = bolehEdit ? bolehEdit(item.row) : true;

      // 1. Klik kolom KONDISI: buka Popover Dropdown Pilihan Kondisi Catat
      if (colId === "kondisi" && userBolehEdit) {
        onKlikBaris(item.row);
        // event.bounds di Glide Data Grid SUDAH merupakan koordinat viewport (client rect)!
        setPopoverKondisi({
          item,
          posisi: {
            x: event.bounds.x,
            y: event.bounds.y + event.bounds.height,
            width: event.bounds.width,
            height: event.bounds.height,
          },
        });
        return;
      }

      // 2. Klik kolom STAND AKHIR pada kondisi Meter Baru (MB): buka Popover 2-Input MB
      const isBarisMB =
        item.isMB ||
        item.row.kondisi === "MB" ||
        item.row.kondisiRevisi === "MB";
      if (colId === "standAkhir" && isBarisMB && userBolehEdit) {
        onKlikBaris(item.row);
        setPopoverMB({
          item,
          posisi: {
            x: event.bounds.x,
            y: event.bounds.y + event.bounds.height,
            width: event.bounds.width,
            height: event.bounds.height,
          },
        });
        return;
      }

      onKlikBaris(item.row);
    },
    [sortedData, columns, onToggle, onKlikBaris, bolehEdit],
  );

  // Penanganan klik kanan (Menu Konteks verifikasi)
  const onCellContextMenu = React.useCallback(
    (
      cell: Item,
      event: {
        preventDefault: () => void;
        bounds: { x: number; y: number };
        localEventX: number;
        localEventY: number;
      },
    ) => {
      event.preventDefault();
      const item = sortedData[cell[1]];
      if (item && onKlikKanan) {
        onKlikKanan(item.row, {
          x: event.bounds.x + event.localEventX,
          y: event.bounds.y + event.localEventY,
        });
      }
    },
    [sortedData, onKlikKanan],
  );

  // Resize kolom di Canvas
  const onColumnResize = React.useCallback(
    (col: GridColumn, newSize: number) => {
      const colId = col.id;
      if (colId && colId !== "ceklis") {
        setManualColumnSizes((prev) => ({ ...prev, [colId]: newSize }));
        if (onLebarKolom) {
          onLebarKolom(colId as KolomVerifikasi, newSize);
        }
      }
    },
    [onLebarKolom],
  );

  // Drag & Reorder kolom di Canvas (menjaga kolom beku ceklis & ring tetap di posisi awal)
  const handleColumnMoved = React.useCallback(
    (startIndex: number, endIndex: number) => {
      if (startIndex <= 1 || endIndex <= 1) return;
      const dariCol = columns[startIndex]?.id as KolomVerifikasi | undefined;
      const keCol = columns[endIndex]?.id as KolomVerifikasi | undefined;
      if (dariCol && keCol && onPindahKolom) {
        onPindahKolom(dariCol, keCol);
      }
    },
    [columns, onPindahKolom],
  );

  // Inline Cell Editing langsung di Canvas (Stand Akhir, Stand Revisi, Pakai, & Tagihan)
  const onCellEdited = React.useCallback(
    async ([col, row]: Item, newValue: EditableGridCell) => {
      if (!onSimpanKoreksi) return;
      const item = sortedData[row];
      const columnDef = columns[col];
      if (!item || !columnDef) return;

      const colId = columnDef.id as KolomVerifikasi;
      if (
        newValue.kind !== GridCellKind.Text &&
        newValue.kind !== GridCellKind.Number
      )
        return;

      const nilaiRaw = newValue.data;
      const angkaBaru =
        typeof nilaiRaw === "number"
          ? nilaiRaw
          : parseInt(String(nilaiRaw ?? "").trim(), 10);

      const userBolehEdit = bolehEdit ? bolehEdit(item.row) : true;
      const userBolehTagihan = bolehEditTagihan ? bolehEditTagihan(item.row) : true;

      if (colId === "standAkhir" && userBolehEdit && !isNaN(angkaBaru)) {
        await onSimpanKoreksi(item.row, {
          standAwalRevisi: item.row.standAwalRevisi ?? null,
          standAkhirRevisi: angkaBaru,
          kondisiRevisi: item.row.kondisiRevisi ?? item.row.kondisi ?? null,
          standMeterBaru: null,
          standAngkatLama: null,
        });
      } else if (colId === "standRevisi" && userBolehEdit) {
        const strVal = String(nilaiRaw ?? "").trim();
        const valRevisi = strVal === "" || isNaN(angkaBaru) ? null : angkaBaru;
        await onSimpanKoreksi(item.row, {
          standAwalRevisi: valRevisi,
          standAkhirRevisi:
            item.row.standAkhirRevisi ?? item.standAkhir ?? null,
          // Otomatis mengubah Kondisi Catat menjadi Revisi Pencatat (REV_PENCATAT)
          kondisiRevisi: valRevisi != null ? "REV_PENCATAT" : null,
          standMeterBaru: null,
          standAngkatLama: null,
        });
      } else if (colId === "pakai" && userBolehEdit && !isNaN(angkaBaru)) {
        await onSimpanKoreksi(item.row, {
          standAwalRevisi: item.row.standAwalRevisi ?? null,
          standAkhirRevisi:
            item.row.standAkhirRevisi ?? item.standAkhir ?? null,
          pemakaianRevisi: angkaBaru,
          kondisiRevisi: item.row.kondisiRevisi ?? item.row.kondisi ?? null,
          standMeterBaru: null,
          standAngkatLama: null,
        });
      } else if (
        colId === "tagihan" &&
        userBolehTagihan &&
        !isNaN(angkaBaru)
      ) {
        await onSimpanKoreksi(item.row, {
          standAwalRevisi: item.row.standAwalRevisi ?? null,
          standAkhirRevisi:
            item.row.standAkhirRevisi ?? item.standAkhir ?? null,
          kondisiRevisi: item.row.kondisiRevisi ?? item.row.kondisi ?? null,
          standMeterBaru: null,
          standAngkatLama: null,
          pemakaianTagihVerif: angkaBaru,
        });
      }
    },
    [sortedData, columns, onSimpanKoreksi, bolehEdit, bolehEditTagihan],
  );

  // Handler pemilihan kondisi dari Popover dropdown
  const handlePilihKondisi = React.useCallback(
    (kodeBaru: string) => {
      if (!popoverKondisi) return;
      const { item, posisi } = popoverKondisi;
      setPopoverKondisi(null);

      // 1. Jika memilih MB -> langsung alihkan buka Popover 2-Input MB pada koordinat yang sama
      if (kodeBaru === "MB") {
        setPopoverMB({ item, posisi });
        return;
      }

      if (!onSimpanKoreksi) return;

      // 2. Daftar 14 Kondisi Taksasi Otomatis
      const KONDISI_TAKSASI = new Set([
        "RUMAH_KOSONG",
        "METER_RUSAK",
        "METER_MATI_ADA_AIR",
        "METER_MUNDUR",
        "METER_TERBALIK",
        "METER_DALAM_AIR",
        "LOS_METER",
        "BMK_BMB",
        "TTB",
        "MTA",
        "TERHALANG",
        "ADA_ANJING",
        "DK",
        "DICABUT",
      ]);

      if (KONDISI_TAKSASI.has(kodeBaru)) {
        const standAwalAktif = item.row.standAwal ?? item.standAwal ?? 0;
        const estimasiTaksasi =
          item.row.pemakaianRevisi ??
          (item.pemakaian != null && item.pemakaian > 0
            ? item.pemakaian
            : item.pemakaianLalu != null && item.pemakaianLalu > 0
              ? Math.ceil(item.pemakaianLalu)
              : 5);

        void onSimpanKoreksi(item.row, {
          standAwalRevisi: item.row.standAwalRevisi ?? null,
          standAkhirRevisi:
            standAwalAktif === item.row.standAkhir ? null : standAwalAktif,
          kondisiRevisi: kodeBaru === item.row.kondisi ? null : kodeBaru,
          pemakaianRevisi: estimasiTaksasi,
          standAngkatLama: null,
          standMeterBaru: null,
        });
        return;
      }

      // 3. Kondisi reguler
      void onSimpanKoreksi(item.row, {
        standAwalRevisi: item.row.standAwalRevisi ?? null,
        standAkhirRevisi: item.row.standAkhirRevisi ?? null,
        kondisiRevisi: kodeBaru === item.row.kondisi ? null : kodeBaru,
        standAngkatLama: null,
        standMeterBaru: null,
      });
    },
    [popoverKondisi, onSimpanKoreksi],
  );

  // Handler simpan Popover Meter Baru (MB) 2-Input
  const handleSimpanMB = React.useCallback(
    async (
      item: BarisTurunan,
      angkatVal: number | null,
      baruVal: number | null,
      pakaiVal: number | null,
    ) => {
      if (!onSimpanKoreksi) return;
      await onSimpanKoreksi(item.row, {
        standAwalRevisi: item.row.standAwalRevisi ?? null,
        standAkhirRevisi: baruVal,
        kondisiRevisi: "MB",
        standMeterBaru: baruVal,
        standAngkatLama: angkatVal,
        pemakaianRevisi: pakaiVal,
      });
    },
    [onSimpanKoreksi],
  );

  // 1. Tampilan Skeleton saat data pertama kali dimuat (mencegah layout-shift/berkedip)
  if (rows.length === 0 && memuat) {
    return (
      <div className="relative flex h-full w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        {/* Header Skeleton */}
        <div className="flex h-9 w-full shrink-0 items-center border-b border-border bg-muted/30 px-3">
          <div className="flex items-center gap-3 w-full">
            <div className="h-4 w-7 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse ml-auto" />
          </div>
        </div>
        {/* Rows Skeleton */}
        <div className="flex flex-1 flex-col divide-y divide-border/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex h-10 items-center gap-3 px-3">
              <div className="h-4 w-5 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-14 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-44 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-12 rounded bg-muted/60 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Tampilan Empty State saat data memang kosong setelah selesai memuat
  if (rows.length === 0 && !memuat) {
    return (
      <div className="relative flex h-full w-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-xs">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-border bg-muted/80 text-muted-foreground">
          {modeBelumDibaca ? (
            <HugeiconsIcon
              icon={Task01Icon}
              strokeWidth={1.5}
              className="size-6 text-emerald-500"
              aria-hidden
            />
          ) : (
            <HugeiconsIcon
              icon={ViewOffIcon}
              strokeWidth={1.5}
              className="size-6 text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
        <h3 className="text-heading-16 font-semibold text-foreground">
          {modeBelumDibaca
            ? "Semua Sambungan Sudah Tercatat"
            : pesanKosong
              ? "Belum Ada Setoran Laporan"
              : "Tidak Ada Laporan yang Cocok"}
        </h3>
        <div className="mt-1.5 max-w-md text-copy-13 text-muted-foreground leading-relaxed">
          {pesanKosong ??
            (modeBelumDibaca
              ? "Semua sambungan di daftar catat rute ini sudah memiliki setoran — tidak ada pekerjaan tertinggal."
              : "Tidak ada data verifikasi yang sesuai dengan kombinasi saringan dan pencarian saat ini.")}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs"
    >
      <DataEditor
        width="100%"
        height="100%"
        groupHeaderHeight={28}
        headerHeight={36}
        rowHeight={40}
        editorBloom={[0, 0]}
        theme={theme}
        columns={columns}
        rows={sortedData.length}
        getCellContent={getCellContent}
        drawCell={drawCell}
        drawHeader={drawHeader}
        onHeaderClicked={onHeaderClicked}
        onHeaderMenuClick={onHeaderMenuClick}
        onCellClicked={onCellClicked}
        onCellContextMenu={onCellContextMenu}
        onColumnResize={onColumnResize}
        onColumnMoved={handleColumnMoved}
        onCellEdited={onCellEdited}
        cellActivationBehavior="double-click"
        editOnType
        rowMarkers="none"
        freezeColumns={2}
        fixedShadowX
        smoothScrollX
        smoothScrollY
        verticalBorder
        isDraggable={false}
      />

      {/* Popover Dropdown Pilihan Kondisi Catat */}
      <PopoverKondisiDialog
        data={popoverKondisi}
        onTutup={() => setPopoverKondisi(null)}
        onPilihKondisi={handlePilihKondisi}
      />

      {/* Popover 2-Input Khusus Koreksi Meter Baru (MB) */}
      <PopoverMBDialog
        data={popoverMB}
        onTutup={() => setPopoverMB(null)}
        onSimpan={handleSimpanMB}
      />

      {/* Popover Menu Kolom Header Enterprise */}
      <PopoverMenuKolomDialog
        data={menuKolom}
        sortConfig={sortConfig}
        onTutup={() => setMenuKolom(null)}
        onSort={(colId, dir) => setSortConfig({ colId, dir })}
        onHapusSort={() => setSortConfig(null)}
        onResetLebar={(colId) => {
          setManualColumnSizes((prev) => {
            const next = { ...prev };
            delete next[colId];
            return next;
          });
          onLebarKolom?.(
            colId,
            autoContentWidths[colId] ?? LEBAR_KONTEN_MINIMAL[colId] ?? 120,
          );
        }}
        onSembunyikanKolom={
          onUbahVisibilitasKolom
            ? (colId) => onUbahVisibilitasKolom(colId, false)
            : undefined
        }
        onResetKolom={onResetKolom}
      />
    </div>
  );
}

// ============================================================================
// Komponen Dialog Popover Menu Kolom Enterprise
// ============================================================================

interface PopoverMenuKolomDialogProps {
  data: {
    colIndex: number;
    colId: KolomVerifikasi;
    title: string;
    posisi: Rectangle;
  } | null;
  sortConfig: { colId: KolomVerifikasi; dir: "asc" | "desc" } | null;
  onTutup: () => void;
  onSort: (colId: KolomVerifikasi, dir: "asc" | "desc") => void;
  onHapusSort: () => void;
  onResetLebar: (colId: KolomVerifikasi) => void;
  onSembunyikanKolom?: (colId: KolomVerifikasi) => void;
  onResetKolom?: () => void;
}

function PopoverMenuKolomDialog({
  data,
  sortConfig,
  onTutup,
  onSort,
  onHapusSort,
  onResetLebar,
  onSembunyikanKolom,
  onResetKolom,
}: PopoverMenuKolomDialogProps) {
  if (!data) return null;
  const { colId, title, posisi } = data;
  const isSortedAsc = sortConfig?.colId === colId && sortConfig.dir === "asc";
  const isSortedDesc = sortConfig?.colId === colId && sortConfig.dir === "desc";

  return (
    <Popover open onOpenChange={(open) => !open && onTutup()}>
      <PopoverTrigger asChild>
        <div
          style={{
            position: "fixed",
            left: posisi.x,
            top: posisi.y + posisi.height,
            width: posisi.width,
            height: 1,
            pointerEvents: "none",
            opacity: 0,
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-56 p-1 text-copy-13 shadow-xl z-50 border border-border bg-popover"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-copy-11 font-semibold tracking-wide text-muted-foreground uppercase border-b border-border/60 mb-1">
          {title}
        </div>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSort(colId, "asc");
              onTutup();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer",
              isSortedAsc && "bg-primary/10 font-semibold text-primary",
            )}
          >
            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Urutkan Menaik (A→Z)</span>
            {isSortedAsc && <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onSort(colId, "desc");
              onTutup();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer",
              isSortedDesc && "bg-primary/10 font-semibold text-primary",
            )}
          >
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Urutkan Menurun (Z→A)</span>
            {isSortedDesc && <Check className="h-3.5 w-3.5" />}
          </button>
          {(isSortedAsc || isSortedDesc) && (
            <button
              type="button"
              onClick={() => {
                onHapusSort();
                onTutup();
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted text-muted-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Hapus Pengurutan</span>
            </button>
          )}

          <div className="my-1 border-t border-border/60" />

          <button
            type="button"
            onClick={() => {
              onResetLebar(colId);
              onTutup();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span>Reset Lebar Kolom</span>
          </button>

          {onSembunyikanKolom && (
            <button
              type="button"
              onClick={() => {
                onSembunyikanKolom(colId);
                onTutup();
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-destructive/10 text-destructive cursor-pointer"
            >
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
              <span>Sembunyikan Kolom</span>
            </button>
          )}

          {onResetKolom && (
            <button
              type="button"
              onClick={() => {
                onResetKolom();
                onTutup();
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted text-muted-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Reset / Tampilkan Semua Kolom</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Komponen Dialog Popover Pilihan Kondisi (Ket. Catat)
// ============================================================================

interface PopoverKondisiDialogProps {
  data: {
    item: BarisTurunan;
    posisi: { x: number; y: number; width?: number; height?: number };
  } | null;
  onTutup: () => void;
  onPilihKondisi: (kode: string) => void;
}

function PopoverKondisiDialog({
  data,
  onTutup,
  onPilihKondisi,
}: PopoverKondisiDialogProps) {
  if (!data) return null;
  const { item, posisi } = data;
  const kondisiAktif = item.row.kondisiRevisi ?? item.row.kondisi ?? "";

  return (
    <Popover open onOpenChange={(open) => !open && onTutup()}>
      <PopoverTrigger asChild>
        <div
          style={{
            position: "fixed",
            left: posisi.x,
            top: posisi.y,
            width: posisi.width ?? 1,
            height: 1,
            pointerEvents: "none",
            opacity: 0,
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-56 p-1.5 text-copy-13 shadow-xl z-50 border border-border bg-popover"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-copy-11 font-semibold tracking-wide text-muted-foreground uppercase">
          Pilih Ket. Catat
        </div>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {Object.entries(LABEL_KONDISI_CATAT).map(([kode, label]) => {
            const aktif = kode === kondisiAktif;
            return (
              <button
                key={kode}
                type="button"
                onClick={() => onPilihKondisi(kode)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted cursor-pointer",
                  aktif && "bg-primary/10 font-semibold text-primary",
                )}
              >
                <span>{label}</span>
                {kode === "MB" && (
                  <span className="rounded bg-muted px-1 py-0.5 text-copy-11 text-muted-foreground">
                    2 Input
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Komponen Dialog Popover 2-Input Koreksi Meter Baru (MB)
// ============================================================================

interface PopoverMBDialogProps {
  data: {
    item: BarisTurunan;
    posisi: { x: number; y: number; width?: number; height?: number };
  } | null;
  onTutup: () => void;
  onSimpan: (
    item: BarisTurunan,
    angkat: number | null,
    baru: number | null,
    pakai: number | null,
  ) => Promise<void>;
}

function PopoverMBDialog({ data, onTutup, onSimpan }: PopoverMBDialogProps) {
  if (!data) return null;
  return (
    <PopoverMBDialogInner
      key={data.item.id}
      data={data}
      onTutup={onTutup}
      onSimpan={onSimpan}
    />
  );
}

interface PopoverMBDialogInnerProps {
  data: {
    item: BarisTurunan;
    posisi: { x: number; y: number; width?: number; height?: number };
  };
  onTutup: () => void;
  onSimpan: (
    item: BarisTurunan,
    angkat: number | null,
    baru: number | null,
    pakai: number | null,
  ) => Promise<void>;
}

function PopoverMBDialogInner({
  data,
  onTutup,
  onSimpan,
}: PopoverMBDialogInnerProps) {
  const { item, posisi } = data;
  const [angkatMB, setAngkatMB] = React.useState(() =>
    item.row.standAngkatLama != null ? String(item.row.standAngkatLama) : "",
  );
  const [meterBaruMB, setMeterBaruMB] = React.useState(() =>
    item.row.standMeterBaru != null
      ? String(item.row.standMeterBaru)
      : item.standAkhir != null
        ? String(item.standAkhir)
        : "",
  );

  const stAwal = item.standAwal ?? 0;
  const angkatVal = angkatMB.trim() !== "" ? parseInt(angkatMB, 10) : null;
  const baruVal = meterBaruMB.trim() !== "" ? parseInt(meterBaruMB, 10) : null;

  const pakaiMBPreview =
    angkatVal != null && !isNaN(angkatVal)
      ? Math.max(0, angkatVal - stAwal) +
        (baruVal != null && !isNaN(baruVal) ? baruVal : 0)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSimpan(item, angkatVal, baruVal, pakaiMBPreview);
    onTutup();
  };

  return (
    <Popover open onOpenChange={(open) => !open && onTutup()}>
      <PopoverTrigger asChild>
        <div
          style={{
            position: "fixed",
            left: posisi.x,
            top: posisi.y,
            width: posisi.width ?? 1,
            height: 1,
            pointerEvents: "none",
            opacity: 0,
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-80 p-3 text-copy-13 shadow-xl z-50 border border-border bg-popover"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <PopoverHeader className="mb-2.5 border-b border-border pb-2">
          <PopoverTitle className="flex items-center justify-between text-copy-13 font-semibold">
            <span>Koreksi Meter Baru (MB)</span>
            <span className="rounded bg-(--verif-info)/15 px-1.5 py-0.5 font-mono text-copy-11 text-(--verif-info)">
              {item.nomor ?? "—"}
            </span>
          </PopoverTitle>
        </PopoverHeader>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-copy-11 font-medium text-muted-foreground">
                Stand Angkat Lama
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus={angkatMB === ""}
                value={angkatMB}
                onChange={(e) =>
                  setAngkatMB(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="Meter lama"
                className="font-mono tabular-nums h-8 text-copy-13 text-right"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-copy-11 font-medium text-muted-foreground">
                Stand Meter Baru
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus={angkatMB !== ""}
                value={meterBaruMB}
                onChange={(e) =>
                  setMeterBaruMB(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="Meter baru"
                className="font-mono tabular-nums h-8 text-copy-13 text-right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5 text-copy-12">
            <span className="text-muted-foreground">
              ST Awal:{" "}
              <strong className="text-foreground">
                {formatAngka(item.standAwal)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              Pakai:{" "}
              <strong
                className={cn(
                  "font-mono tabular-nums",
                  pakaiMBPreview != null && pakaiMBPreview < 0
                    ? "text-(--verif-error)"
                    : "text-foreground",
                )}
              >
                {formatAngka(pakaiMBPreview)} m³
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-copy-12 cursor-pointer"
              onClick={onTutup}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 px-3 text-copy-12 cursor-pointer"
            >
              Simpan MB
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
