// features/dashboard/import/components/ImportPbpkView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileText,
  FolderSync,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PERIODE_BERJALAN_AKTIF } from "@/config/periode";
import { readFileAsText } from "../lib/file-reader";
import { getErrorMessage, postImport } from "../lib/import-api";
import { IMPORT_API, IMPORT_LIMITS, PBPK_DEFAULTS } from "../lib/import-config";
import { parsePbpkCsv } from "../lib/import-parsers";
import type {
  PbpkImportResponse,
  PbpkResultStats,
  PbpkRow,
} from "../types/import.types";
import { ImportDataTable, type ImportColumn } from "./shared/ImportDataTable";
import { ImportEmptyState } from "./shared/ImportEmptyState";
import { ImportFileButton } from "./shared/ImportFileButton";
import {
  ImportControlPanel,
  ImportTablePanel,
} from "./shared/ImportPanels";
import { ImportResultBanner } from "./shared/ImportResultBanner";
import { ImportStatCard, ImportStatGrid } from "./shared/ImportStatCard";

const COLUMNS: ImportColumn<PbpkRow>[] = [
  {
    id: "mutasian",
    header: "Tipe Mutasi",
    cell: (row) =>
      row.mutasian === "PB" ? (
        <Badge variant="blue-subtle">Pasang Baru (PB)</Badge>
      ) : (
        <Badge variant="green-subtle">Pasang Kembali (PK)</Badge>
      ),
  },
  {
    id: "nolg",
    header: "No. Langganan",
    cell: (row) => row.nolg,
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "nama",
    header: "Nama Pelanggan",
    cell: (row) => (
      <span className="block max-w-44 truncate" title={row.nama}>
        {row.nama}
      </span>
    ),
    cellClassName: "text-label-13",
  },
  {
    id: "alamat",
    header: "Alamat Sambungan",
    cell: (row) => {
      const rtrw =
        row.rt || row.rw
          ? ` RT.${row.rt || "-"}/RW.${row.rw || "-"}`
          : "";
      const full = `${row.alamat}${rtrw}`;
      return (
        <span className="block max-w-64 truncate" title={full}>
          {full}
        </span>
      );
    },
    cellClassName: "text-copy-13 text-muted-foreground",
  },
  {
    id: "tarif",
    header: "Tarif",
    cell: (row) => row.kd_goltarif ?? PBPK_DEFAULTS.tarif,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "rute",
    header: "Rute DPM",
    cell: (row) => row.kd_rute ?? PBPK_DEFAULTS.rute,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "urutan",
    header: "No. Urut",
    cell: (row) => row.no_urutrute ?? 0,
    className: "text-right",
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "nometer",
    header: "No. Meter",
    cell: (row) => (
      <span className="inline-flex items-center gap-1">
        <span>{row.nometer ?? "-"}</span>
        {row.kd_merkmeter && (
          <span className="text-label-11 text-muted-foreground">
            ({row.kd_merkmeter})
          </span>
        )}
      </span>
    ),
    cellClassName: "text-copy-13-mono text-muted-foreground",
  },
  {
    id: "tglaktif",
    header: "Tgl Aktif",
    cell: (row) => row.tglaktif?.slice(0, 10) ?? "-",
    cellClassName: "text-copy-13-mono text-muted-foreground",
  },
];

export function ImportPbpkView() {
  const [rows, setRows] = React.useState<PbpkRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<PbpkResultStats | null>(
    null,
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parsed = parsePbpkCsv(await readFileAsText(file));
    setRows(parsed);
    setResultStats(null);
    if (parsed.length > 0) {
      toast.success(
        `Berhasil mengurai ${parsed.length} baris data dari berkas ${file.name}!`,
      );
    } else {
      toast.warning(
        "Format CSV tidak dikenali atau tidak ada baris data valid.",
      );
    }
  };

  const handleExecuteImport = async () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data PBPK untuk diproses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await postImport<PbpkImportResponse>(
        IMPORT_API.pbpk,
        { rows, periode: PERIODE_BERJALAN_AKTIF },
        { fallbackError: "Gagal mengimpor data PBPK." },
      );

      const stats: PbpkResultStats = {
        total: data?.total ?? rows.length,
        pb: data?.pb ?? 0,
        pk: data?.pk ?? 0,
        sukses: data?.sukses ?? rows.length,
        gagal: data?.gagal ?? 0,
      };
      setResultStats(stats);
      toast.success(
        `Sukses! Berhasil mendaftarkan ${stats.pb} Pasang Baru (PB) & ${stats.pk} Pemasangan Kembali (PK) ke Master Pelanggan & DPM!`,
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Terjadi kesalahan saat memproses data PBPK."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setRows([]);
    setSearchQuery("");
    setResultStats(null);
    toast.info("Daftar mutasi PBPK telah dikosongkan.");
  };

  const pbCount = React.useMemo(
    () => rows.filter((r) => r.mutasian === "PB").length,
    [rows],
  );
  const pkCount = rows.length - pbCount;

  const filteredRows = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.nolg,
        r.nama,
        r.alamat,
        r.kd_rute,
        r.kd_goltarif,
        r.nometer,
        r.mutasian,
      ].some((field) => field?.toLowerCase().includes(q)),
    );
  }, [rows, searchQuery]);

  const previewRows = filteredRows.slice(0, IMPORT_LIMITS.pbpkPreviewRows);

  return (
    <div className="space-y-4">
      <ImportStatGrid columns={3}>
        <ImportStatCard
          label="Total Rekening PBPK"
          value={rows.length}
          unit="Sambungan"
          caption="Dari berkas CSV yang diunggah"
          icon={FileText}
        />
        <ImportStatCard
          label="Pasang Baru (PB)"
          value={pbCount}
          unit="Baru"
          caption="Pelanggan & Water Meter Baru"
          icon={FolderSync}
          tone="blue"
        />
        <ImportStatCard
          label="Pemasangan Kembali (PK)"
          value={pkCount}
          unit="Aktif"
          caption="Aktivasi Sambungan Eksisting"
          icon={CheckCircle2}
          tone="green"
        />
      </ImportStatGrid>

      <ImportControlPanel
        title="Import PBPK (Pasang Baru & Pasang Kembali)"
        badge={<Badge variant="pill">Format: CSV</Badge>}
        description={`Pendaftaran mutasi Pasang Baru (PB) dan Pemasangan Kembali (PK) pelanggan ke Master & DPM periode ${PERIODE_BERJALAN_AKTIF}.`}
        hasData={rows.length > 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. Langganan / Nama / Alamat..."
        actions={
          <>
            {rows.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isSubmitting}
                title="Kosongkan daftar data"
              >
                <RotateCcw />
                Kosongkan
              </Button>
            )}

            <ImportFileButton
              accept=".csv"
              onChange={handleFileUpload}
              icon={Upload}
              disabled={isSubmitting}
            >
              Unggah CSV PBPK
            </ImportFileButton>

            <Button
              onClick={handleExecuteImport}
              disabled={isSubmitting || rows.length === 0}
            >
              <FolderSync />
              {isSubmitting
                ? "Memproses..."
                : `Eksekusi Import ke DPM (${rows.length})`}
            </Button>
          </>
        }
      />

      {resultStats && (
        <ImportResultBanner
          tone="green"
          title="Sinkronisasi PBPK Berhasil"
          description={`Total ${resultStats.total} data (${resultStats.pb} Pasang Baru, ${resultStats.pk} Pemasangan Kembali). Seluruhnya siap dicatat pada DPM periode ${PERIODE_BERJALAN_AKTIF}.`}
          actions={<Badge variant="green">Status: Masuk DPM</Badge>}
        />
      )}

      {rows.length === 0 ? (
        <ImportEmptyState
          icon={FileText}
          title="Belum Ada Berkas Mutasi PBPK Dipilih"
          description={`Unggah berkas CSV mutasi Pasang Baru (PB) atau Pasang Kembali (PK) untuk didaftarkan ke DPM periode ${PERIODE_BERJALAN_AKTIF}.`}
          badges={
            <>
              <Badge variant="pill" className="font-mono">
                nolg;nama;kd_kelurahan;rt;rw;alamat;notelp;nometer;kd_merkmeter;kd_rute;kd_goltarif;no_urutrute;mutasian
              </Badge>
            </>
          }
          onFileSelect={handleFileUpload}
          accept=".csv,.txt"
          buttonLabel="Pilih Berkas CSV PBPK"
          infoNote="Mendukung format resmi PBPK.csv PDAM (pemisah titik koma ; atau koma ,). Mutasi PB (Pasang Baru) dan PK (Pemasangan Kembali) otomatis diintegrasikan ke Master Pelanggan, Aset Water Meter, dan DPM periode berjalan."
        />
      ) : (
        <ImportTablePanel
          summary={[
            `Daftar pelanggan baru (PB) dan pemasangan kembali (PK) untuk DPM periode ${PERIODE_BERJALAN_AKTIF}`,
            `${rows.length} Sambungan`,
            ...(filteredRows.length > previewRows.length
              ? [
                  `Menampilkan ${previewRows.length} dari ${filteredRows.length} hasil`,
                ]
              : []),
          ]}
        >
          <ImportDataTable
            columns={COLUMNS}
            rows={previewRows}
            getRowKey={(row, index) => `${row.nolg}-${index}`}
            empty={{
              icon: FileText,
              title: "Tidak ada data cocok",
              description: `Tidak ditemukan data yang sesuai dengan kata kunci "${searchQuery}".`,
            }}
          />
        </ImportTablePanel>
      )}
    </div>
  );
}
