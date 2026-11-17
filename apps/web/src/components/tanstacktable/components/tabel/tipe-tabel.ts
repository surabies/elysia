// features/dashboard/verifikasi/components/tabel/tipe-tabel.ts — konfigurasi
// fitur dan metadata kolom TanStack Table untuk layar verifikasi.
import {
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  metaHelper,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
} from "@tanstack/react-table";
import type { BarisTurunan } from "../../lib/turunan-baris";

export interface MetaKolom {
  /** Tooltip native pada header. */
  judul?: string;
  /** Kolom angka: rata kanan, angka tabular. */
  angka?: boolean;
  tengah?: boolean;
  /** Kelas tambahan pada <td>. */
  kelasSel?: string;
  /** Atribut title pada <td>; undefined = tanpa tooltip. */
  judulSel?: (baris: BarisTurunan) => string | undefined;
}

export const verifikasiFeatures = tableFeatures({
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSortingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    basic: sortFn_basic,
    alphanumeric: sortFn_alphanumeric,
  },
  columnMeta: metaHelper<MetaKolom>(),
});

export type VerifikasiFeatures = typeof verifikasiFeatures;
