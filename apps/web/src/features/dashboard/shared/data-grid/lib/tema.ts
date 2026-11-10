// Tema AG Grid (token CSS proyek, gaya Geist).
import { themeQuartz } from "ag-grid-community"

// Kelas status filter dan panel diterbitkan ulang di sini bersama tema AG Grid.
export {
  KELAS_KONTROL_AKTIF,
  KELAS_KONTROL_PANEL,
} from "./kelas-kontrol"

const garisTabel = () => ({
  style: "solid" as const,
  width: 1,
  color: "var(--border)",
})

export const temaGrid = themeQuartz.withParams({
  accentColor: "var(--ring)",
  backgroundColor: "var(--card)",
  foregroundColor: "var(--foreground)",
  borderColor: "var(--border)",
  headerBackgroundColor: "var(--table-head)",
  headerTextColor: "var(--foreground)",
  cellTextColor: "var(--foreground)",
  headerFontWeight: 600,
  fontFamily: "var(--font-geist-sans)",
  cellFontFamily: "var(--font-geist-sans)",
  fontSize: 13,
  cellFontSize: 13,
  cellFontWeight: 400,
  headerFontSize: 12,
  borderRadius: 0,
  wrapperBorderRadius: 0,
  wrapperBorder: false,
  columnBorder: garisTabel(),
  rowBorder: garisTabel(),
  headerColumnBorder: garisTabel(),
  headerColumnResizeHandleColor: "transparent",
  headerRowBorder: false,
  rowHeight: 40,
  cellHorizontalPadding: 12,
  spacing: 8,
  oddRowBackgroundColor: "transparent",
  rowHoverColor: "var(--table-hover)",
  selectedRowBackgroundColor: "var(--table-accent)",
  checkboxBorderRadius: 4,
  checkboxBorderWidth: 1,
  checkboxUncheckedBackgroundColor: "var(--card)",
  checkboxUncheckedBorderColor: "var(--input)",
  checkboxCheckedBackgroundColor: "var(--primary)",
  checkboxCheckedBorderColor: "var(--primary)",
  checkboxCheckedShapeColor: "var(--primary-foreground)",
  checkboxIndeterminateBackgroundColor: "var(--primary)",
  checkboxIndeterminateBorderColor: "var(--primary)",
  checkboxIndeterminateShapeColor: "var(--primary-foreground)",
  browserColorScheme: "inherit",
  scrollbarWidth: "thin",
  scrollbarThumbColor: "var(--ds-gray-alpha-400)",
  scrollbarTrackColor: "transparent",
})

export const KELAS_AREA_GRID =
  // min-h-0: AG Grid perlu ruang terukur agar bisa menggulir di panel.
  "min-h-0 [&_.ag-header]:border-b-0 " +
  "[&_.ag-cell]:tabular-nums " +
  "[&_.baris-terpilih]:bg-table-accent "
