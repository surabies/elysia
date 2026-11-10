import type { Tahap } from "./warna-tahap";

export const KELAS_PANEL_DETAIL =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card";

export const KELAS_JUDUL_PANEL = "text-copy-13 font-semibold";
export const KELAS_TEKS_BANTUAN = "text-copy-13 text-muted-foreground";
export const KELAS_TEKS_META = "text-label-12 text-muted-foreground";

export const TEMA_GRID_WADAH =
  "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card";

export const TEMA_GRID_TABEL =
  "tabel-verifikasi w-max min-w-full table-fixed border-separate border-spacing-0 text-copy-13 bg-card";

export const TEMA_GRID_HEADER_ROW =
  "bg-table-head text-foreground border-b border-border select-none";

export const TEMA_GRID_TH =
  "border-r border-b border-border px-3 text-left text-label-12 font-semibold text-foreground tracking-wide select-none whitespace-nowrap bg-table-head";

export const TEMA_GRID_TH_BEKU =
  "sticky left-0 z-30 bg-table-head text-foreground border-r border-b border-border select-none";

export const TEMA_TOGGLE_ITEM =
  "w-8 min-w-8 rounded-md bg-card p-0 text-foreground transition-colors hover:bg-accent data-[state=on]:bg-accent data-[state=on]:text-foreground";

export const TEMA_TAB_AKTIF =
  "bg-card text-foreground font-medium border border-border shadow-xs hover:bg-card";

export const TEMA_TAB_TIDAK_AKTIF =
  "text-muted-foreground hover:text-foreground hover:bg-card/60";

export interface LatarBarisVerifikasi {
  normal: string;
  hover: string;
}

const WARNA_BARIS_TAHAP: Record<Tahap, LatarBarisVerifikasi> = {
  MENUNGGU: { normal: "transparent", hover: "var(--table-hover)" },
  V1: {
    normal: "var(--verif-v1-soft)",
    hover: "var(--verif-v1-hover)",
  },
  V2: {
    normal: "var(--verif-v2-soft)",
    hover: "var(--verif-v2-hover)",
  },
  TERVERIFIKASI: {
    normal: "var(--verif-v2-soft)",
    hover: "var(--verif-v2-hover)",
  },
  V3: {
    normal: "var(--verif-v3-soft)",
    hover: "var(--verif-v3-hover)",
  },
  DITOLAK: {
    normal: "var(--verif-error-soft)",
    hover: "var(--verif-error-hover)",
  },
};

export function tentukanLatarBaris({
  aktif,
  dipilih,
  tahap,
  koreksi,
}: {
  aktif: boolean;
  dipilih: boolean;
  tahap: Tahap;
  koreksi?: boolean;
}): LatarBarisVerifikasi {
  if (aktif || dipilih) {
    return { normal: "var(--table-accent)", hover: "var(--table-accent)" };
  }
  if (tahap !== "MENUNGGU")
    return WARNA_BARIS_TAHAP[tahap] ?? WARNA_BARIS_TAHAP.MENUNGGU;
  if (koreksi)
    return {
      normal: "var(--verif-correction-soft)",
      hover: "var(--verif-correction-hover)",
    };
  return WARNA_BARIS_TAHAP[tahap] ?? WARNA_BARIS_TAHAP.MENUNGGU;
}
