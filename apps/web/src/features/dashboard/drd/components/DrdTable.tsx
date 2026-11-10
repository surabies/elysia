"use client";

import * as React from "react";
import type {
  CellValueChangedEvent,
  ColDef,
  ColGroupDef,
} from "ag-grid-community";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { IconTile } from "@/components/reui/icon-tile";
import { useRbac } from "@/components/layout/shell/RbacContext";
import {
  DataGrid,
  temaVercelGrid,
  type BarisData,
} from "@/features/dashboard/shared/data-grid";
import { kirimJson } from "@/features/dashboard/shared/api/api-dashboard";
import type {
  DrdColumn,
  DrdRow,
  DrdTab,
} from "@/server/services/dashboard/drd.service";

interface DrdTableProps {
  columns: DrdColumn[];
  rows: DrdRow[];
  footer?: DrdRow;
  period: string;
  tab: Exclude<DrdTab, "ringkasan">;
}

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const COLUMN_WIDTHS: Record<string, number> = {
  alamat: 190,
  beaAdmin: 120,
  beaBeban: 120,
  hargaAir: 130,
  jumlahPenduduk: 145,
  persentaseCakupan: 155,
  jumlahPelanggan: 130,
  kelurahan: 150,
  lainLain: 120,
  nama: 150,
  namaTarif: 190,
  nomorLangganan: 130,
  pemakaianM3: 130,
  tarif: 90,
  totalTagihan: 150,
  airKotor: 120,
  kondisi: 150,
};

function columnWidth(key: string) {
  if (key.endsWith("_sl")) return 70;
  if (key.endsWith("_m3")) return 78;
  if (key.endsWith("_drd")) return 112;
  if (key.startsWith("teknis_")) return 82;
  if (key.startsWith("sl_")) return 110;
  if (key.startsWith("pemakaianM3_")) return 115;
  if (key.startsWith("totalTagihan_")) return 125;
  return COLUMN_WIDTHS[key] ?? 130;
}

function coverageColumnWidth(
  column: DrdColumn,
  rows: DrdRow[],
  footer?: DrdRow,
) {
  const contents = [
    column.label,
    ...rows.map((row) => formatValue(row[column.key], column.format)),
    ...(footer ? [formatValue(footer[column.key], column.format)] : []),
  ];
  const contentWidth = Math.max(
    ...contents.map((value) => Math.ceil(value.length * 7.5 + 28)),
  );
  return Math.min(280, Math.max(minimumColumnWidth(column.key), contentWidth));
}

function minimumColumnWidth(key: string) {
  if (key.endsWith("_sl") || key.startsWith("teknis_")) return 65;
  if (key.endsWith("_m3")) return 70;
  if (key.endsWith("_drd")) return 95;
  if (key === "alamat" || key === "namaTarif") return 125;
  if (key === "totalTagihan" || key.startsWith("totalTagihan_")) return 115;
  if (key === "nomorLangganan") return 110;
  return 85;
}

function formatValue(value: unknown, format: DrdColumn["format"]) {
  if (value == null || value === "") return "—";
  if (format === "currency") return currencyFormatter.format(Number(value));
  if (format === "percent")
    return `${numberFormatter.format(Number(value))}%`;
  if (format === "number") return numberFormatter.format(Number(value));
  return String(value);
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const TAB_METADATA: Record<
  Exclude<DrdTab, "ringkasan">,
  { title: string; subtitle: string }
> = {
  kelurahan: {
    title: "Rekapitulasi Tagihan per Kelurahan",
    subtitle: "Rincian lembar rekening, kubikasi pemakaian, dan total tagihan per wilayah",
  },
  domestik: {
    title: "Segmentasi Sambungan Domestik",
    subtitle: "Rincian tagihan kelompok rumah tangga (1A, 2A1, 2A2, 2A3)",
  },
  tarif: {
    title: "Distribusi per Golongan Tarif",
    subtitle: "Analisis pendapatan dan volume per kode golongan tarif pelanggan",
  },
  "taa-kelurahan": {
    title: "Rekapitulasi TAA",
    subtitle: "Sebaran rekening tanpa air / anomali pencatatan per wilayah kelurahan",
  },
  taa: {
    title: "Detail Anomali TAA",
    subtitle: "Daftar rekening terindikasi kelainan catat yang memerlukan verifikasi lapangan",
  },
  cakupan: {
    title: "Cakupan Layanan",
    subtitle: "Rasio jiwa terlayani terhadap proyeksi jumlah penduduk per kelurahan",
  },
  tagihan: {
    title: "Buku Besar Daftar Rekening Ditagih (DRD)",
    subtitle: "Data terperinci lembar rekening pelanggan periode aktif",
  },
  pelanggan: {
    title: "Data Induk Pelanggan",
    subtitle: "Daftar pelanggan aktif beserta nomor sambungan dan status meter",
  },
};

export function DrdTable({
  columns,
  rows,
  footer,
  period,
  tab,
}: DrdTableProps) {
  const { isSuperAdmin } = useRbac();
  const canEditPopulation = isSuperAdmin && tab === "cakupan";
  const tabMeta = TAB_METADATA[tab] ?? {
    title: `Laporan DRD ${tab}`,
    subtitle: "Rincian data laporan rekening ditagih",
  };
  const rowHeight = 42;
  const gridRows = React.useMemo(
    () =>
      rows.map((row, index) => {
        const key =
          row.id ??
          row.nomorLangganan ??
          row.kelurahan ??
          row.tarif ??
          JSON.stringify(columns.map((column) => row[column.key] ?? null));
        return { ...row, id: `${tab}-${period}-${String(key)}-${index}` };
      }),
    [columns, period, rows, tab],
  );
  const columnDefs = React.useMemo<ColDef<DrdRow>[]>(
    () =>
      columns.map((column) => {
        const numeric =
          column.format === "currency" ||
          column.format === "number" ||
          column.format === "percent";
        const editable =
          canEditPopulation && column.key === "jumlahPenduduk";

        return {
          field: column.key,
          colId: column.key,
          headerName: column.label,
          width:
            tab === "cakupan"
              ? coverageColumnWidth(column, rows, footer)
              : columnWidth(column.key),
          minWidth: minimumColumnWidth(column.key),
          flex: tab === "cakupan" ? 0 : columnWidth(column.key),
          sortable: true,
          editable,
          cellDataType: column.key === "jumlahPenduduk" ? "number" : undefined,
          cellEditor:
            editable && column.key === "jumlahPenduduk"
              ? "agNumberCellEditor"
              : undefined,
          cellEditorParams:
            editable && column.key === "jumlahPenduduk"
              ? { min: 0, max: 2_147_483_647, precision: 0, step: 1 }
              : undefined,
          valueParser:
            editable && column.key === "jumlahPenduduk"
              ? ({ newValue }) => {
                  const parsed = Number(newValue);
                  return (
                    Number.isSafeInteger(parsed) &&
                    parsed >= 0 &&
                    parsed <= 2_147_483_647
                  )
                    ? parsed
                    : null;
                }
              : undefined,
          pinned:
            tab === "cakupan" && column.key === "kelurahan"
              ? "left"
              : undefined,
          valueFormatter: ({ value, node }) =>
            node?.rowPinned && (value == null || value === "")
              ? ""
              : formatValue(value, column.format),
          cellStyle: (params) => {
            const style: Record<string, string | number> = {};
            if (numeric) style.textAlign = "right";
            if (params.node?.rowPinned) style.fontWeight = 600;
            return Object.keys(style).length > 0 ? style : undefined;
          },
          cellClass: editable
            ? "drd-population-editable text-right tabular-nums font-mono font-medium"
            : numeric
              ? "text-right tabular-nums font-mono text-[13px]"
              : column.key === "nomorLangganan" || column.key === "tarif"
                ? "font-mono font-medium text-xs text-foreground"
                : undefined,
          tooltipField: column.key === "alamat" ? column.key : undefined,
        };
      }),
    [canEditPopulation, columns, footer, rows, tab],
  );
  const columnGroupDefs = React.useMemo<
    (ColDef<DrdRow> | ColGroupDef<DrdRow>)[]
  >(() => {
    if (tab !== "cakupan" || columnDefs.length === 0) return columnDefs;

    const definitions: (ColDef<DrdRow> | ColGroupDef<DrdRow>)[] = [];
    for (let index = 0; index < columnDefs.length; ) {
      const group = columns[index]?.group;
      if (!group) {
        definitions.push(columnDefs[index]);
        index += 1;
        continue;
      }

      const children: ColDef<DrdRow>[] = [];
      while (index < columnDefs.length && columns[index]?.group === group) {
        children.push({
          ...columnDefs[index],
          headerClass: "drd-coverage-subheader",
        });
        index += 1;
      }
      definitions.push({
        headerName: group,
        headerClass: "drd-coverage-group border-b border-border font-semibold text-xs",
        marryChildren: true,
        children,
      });
    }
    return definitions;
  }, [columnDefs, columns, tab]);

  const onCellValueChanged = React.useCallback(
    async (event: CellValueChangedEvent<BarisData>) => {
      if (event.colDef.field !== "jumlahPenduduk" || !event.data) return;
      const jumlahPenduduk = event.newValue;
      const kelurahanKode = event.data.kelurahanKode;
      if (
        typeof jumlahPenduduk !== "number" ||
        !Number.isSafeInteger(jumlahPenduduk) ||
        jumlahPenduduk < 0 ||
        jumlahPenduduk > 2_147_483_647 ||
        typeof kelurahanKode !== "string" ||
        kelurahanKode.length === 0
      ) {
        event.node.setDataValue("jumlahPenduduk", event.oldValue);
        toast.error("Jumlah penduduk harus bilangan bulat nol atau lebih.");
        return;
      }

      try {
        await kirimJson("/drd/coverage-population", "PATCH", {
          kelurahanKode,
          jumlahPenduduk,
        });
        event.data.persentaseCakupan =
          jumlahPenduduk > 0
            ? Math.round(
                (Number(event.data.jiwaTerlayani ?? 0) / jumlahPenduduk) *
                  10000,
              ) / 100
            : null;
        event.api.refreshCells({
          rowNodes: [event.node],
          columns: ["persentaseCakupan"],
        });
        toast.success("Jumlah penduduk berhasil disimpan.");
      } catch (error) {
        event.node.setDataValue("jumlahPenduduk", event.oldValue);
        toast.error(
          error instanceof Error
            ? error.message
            : "Jumlah penduduk gagal disimpan.",
        );
      }
    },
    [],
  );

  const headerTabel = (
    <div className="flex flex-row items-center justify-between border-b border-border bg-[var(--table-head)] px-4 py-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {tabMeta.title}
        </h3>
        <span className="text-muted-foreground/40 shrink-0">•</span>
        <span className="tabular-nums font-mono text-xs text-muted-foreground shrink-0">
          {rows.length.toLocaleString("id-ID")} baris data
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">
          Periode {period}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col p-3 sm:p-5 lg:p-6 overflow-hidden">
      <DataGrid
        judul={tabMeta.title}
        rowData={gridRows}
        columnDefs={columnDefs}
        columnGroupDefs={columnGroupDefs}
        pinnedBottomRowData={footer ? [footer] : undefined}
        rowHeight={rowHeight}
        onCellValueChanged={onCellValueChanged}
        checkbox={true}
        showToolbar={false}
        theme={temaVercelGrid}
        headerTabel={headerTabel}
        sesuaikanTinggiDenganBaris={true}
        tinggiClassName={
          tab === "cakupan"
            ? "flex-1 min-h-0 [&_.drd-coverage-group_.ag-header-group-cell-label]:justify-center [&_.drd-coverage-subheader_button]:justify-center [&_.drd-coverage-subheader_button]:text-center [&_.drd-coverage-subheader_button_span]:text-center [&_.drd-population-editable]:cursor-text [&_.drd-population-editable]:underline [&_.drd-population-editable]:decoration-dotted [&_.drd-population-editable]:underline-offset-4 [&_.ag-row-pinned]:bg-[var(--table-head)] [&_.ag-row-pinned]:font-semibold [&_.ag-row-pinned]:text-foreground"
            : "flex-1 min-h-0 [&_.ag-row-pinned]:bg-[var(--table-head)] [&_.ag-row-pinned]:font-semibold [&_.ag-row-pinned]:text-foreground"
        }
      />
    </div>
  );
}

export function DrdCsvExportButton({
  columns,
  rows,
  period,
  tab,
}: DrdTableProps) {
  const exportCsv = React.useCallback(() => {
    const csv = [
      columns.map((column) => escapeCsv(column.label)).join(";"),
      ...rows.map((row) =>
        columns.map((column) => escapeCsv(row[column.key])).join(";"),
      ),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `drd-${tab}-${period}-${rows.length}baris.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [columns, period, rows, tab]);

  return (
    <IconTile
      render={
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          aria-label="Ekspor CSV"
          title="Ekspor CSV"
        />
      }
      variant="frame"
      size="sm"
      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download aria-hidden="true" />
    </IconTile>
  );
}
