// features/dashboard/import/components/ImportRNomorView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  FileText,
  RotateCcw,
  ShieldAlert,
  Upload,
  UserMinus,
} from "lucide-react";
import { Badge, Button } from "@cater/ui";
import { readFileAsText } from "../lib/file-reader";
import { getErrorMessage, postImport } from "../lib/import-api";
import { IMPORT_API } from "../lib/import-config";
import { parseRNomorCsv } from "../lib/import-parsers";
import { formatAngka } from "../lib/import-ui";
import type {
  BatchImportResponse,
  ImportBatchStats,
  RNomorRow,
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

const COLUMNS: ImportColumn<RNomorRow>[] = [
  {
    id: "nolg",
    header: "No. Langganan",
    cell: (row) => row.nolg,
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "nama",
    header: "Nama Pelanggan",
    cell: (row) => row.nama,
    cellClassName: "text-label-13",
  },
  {
    id: "alamat",
    header: "Alamat Sambungan",
    cell: (row) => row.alamat,
    cellClassName: "text-copy-13 text-muted-foreground",
  },
  {
    id: "tglPutus",
    header: "Tanggal Putus",
    cell: (row) => row.tglPutus,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "nomorBa",
    header: "Nomor BA",
    cell: (row) => row.nomorBa,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "standCabut",
    header: "Stand Cabut",
    cell: (row) => `${row.standCabut} m³`,
    cellClassName: "text-label-13-mono text-destructive font-semibold",
  },
  {
    id: "alasan",
    header: "Alasan Pemutusan",
    cell: (row) => (
      <span className="block max-w-65 truncate" title={row.alasan}>
        {row.alasan}
      </span>
    ),
    cellClassName: "text-copy-13 text-muted-foreground",
  },
];

export function ImportRNomorView() {
  const [items, setItems] = React.useState<RNomorRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<ImportBatchStats | null>(
    null,
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parsed = parseRNomorCsv(await readFileAsText(file));
    setItems(parsed);
    setResultStats(null);
    if (parsed.length > 0) {
      toast.success(
        `Berhasil membaca ${parsed.length} baris data dari berkas ${file.name}!`,
      );
    } else {
      toast.warning(
        "Format CSV tidak dikenali atau tidak ada baris data valid.",
      );
    }
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Tidak ada rekening R-Nomor untuk diproses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await postImport<BatchImportResponse>(
        IMPORT_API.rNomor,
        {
          items: items.map(
            ({ nolg, tglPutus, nomorBa, standCabut, alasan }) => ({
              nolg,
              tglPutus,
              nomorBa,
              standCabut,
              alasan,
            }),
          ),
        },
        { fallbackError: "Gagal memproses pemutusan R-Nomor." },
      );

      const stats: ImportBatchStats = {
        total: data?.total ?? items.length,
        sukses: data?.sukses ?? items.length,
        gagal: data?.gagal ?? 0,
      };
      setResultStats(stats);
      toast.success(
        `Berhasil memproses pemutusan untuk ${stats.sukses} rekening R-Nomor!`,
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Terjadi kesalahan saat memproses pemutusan R-Nomor.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setItems([]);
    setSearchQuery("");
    setResultStats(null);
    toast.info("Daftar rekening pemutusan R-Nomor telah dikosongkan.");
  };

  const tanggalTerdekat = React.useMemo(() => {
    if (items.length === 0) return "-";
    const dates = items.map((item) => item.tglPutus).filter(Boolean);
    return dates.length > 0 ? dates.sort()[0] : "-";
  }, [items]);

  const totalStandCabut = React.useMemo(
    () => items.reduce((sum, item) => sum + (item.standCabut || 0), 0),
    [items],
  );

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.nolg, item.nama, item.alamat, item.nomorBa, item.alasan].some(
        (field) => field?.toLowerCase().includes(q),
      ),
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      <ImportStatGrid columns={4}>
        <ImportStatCard
          label="Total Rekening"
          value={formatAngka(items.length)}
          unit="Rekening"
          caption="Rekening siap diproses"
          icon={FileText}
        />
        <ImportStatCard
          label="Status Diajukan"
          value={formatAngka(items.length)}
          unit="Diajukan"
          caption="Pemutusan sambungan"
          icon={UserMinus}
        />
        <ImportStatCard
          label="Tanggal Awal"
          value={tanggalTerdekat}
          unit="Terdekat"
          caption="Pemutusan terdekat"
          icon={AlertTriangle}
          tone="amber"
        />
        <ImportStatCard
          label="Stand Cabut"
          value={formatAngka(totalStandCabut)}
          unit="m³"
          caption="Total stand akhir pengangkatan"
          icon={ShieldAlert}
          tone="red"
        />
      </ImportStatGrid>

      <ImportControlPanel
        title="Import R-Nomor (Pemutusan Pelanggan)"
        badge={<Badge variant="secondary" className="font-mono text-label-11">Format: CSV / TXT</Badge>}
        description="Pemrosesan pemutusan sambungan pelanggan (status R) dan pencatatan stand meter cabut."
        hasData={items.length > 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. Langganan / Nama / Alamat..."
        actions={
          <>
            {items.length > 0 && (
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
              accept=".csv,.txt"
              onChange={handleFileUpload}
              icon={Upload}
              disabled={isSubmitting}
            >
              Unggah CSV R-Nomor
            </ImportFileButton>

            <Button
              variant="destructive"
              onClick={handleImport}
              disabled={isSubmitting || items.length === 0}
            >
              <ShieldAlert />
              {isSubmitting
                ? "Memproses..."
                : `Eksekusi Pemutusan (R) (${items.length})`}
            </Button>
          </>
        }
      />

      {resultStats && (
        <ImportResultBanner
          tone="red"
          title="Pemutusan R-Nomor Selesai Diproses"
          description={`Total ${resultStats.total} pelanggan: ${resultStats.sukses} status diubah menjadi NON AKTIF (R), ${resultStats.gagal} gagal.`}
          actions={<Badge variant="destructive">Status: Diputus</Badge>}
        />
      )}

      {items.length === 0 ? (
        <ImportEmptyState
          icon={ShieldAlert}
          title="Belum Ada Berkas R-Nomor Dipilih"
          description="Unggah berkas CSV daftar rekening pemutusan pelanggan untuk mengubah status sambungan menjadi Non Aktif (R)."
          badges={
            <>
              <Badge variant="secondary" className="font-mono text-label-11">
                nolg,nama,alamat,tgl_putus,nomor_ba,stand_cabut,alasan
              </Badge>
            </>
          }
          onFileSelect={handleFileUpload}
          accept=".csv,.txt"
          buttonLabel="Pilih Berkas CSV R-Nomor"
          infoNote="Pemutusan akan mengubah status rekening menjadi NON AKTIF (R) dan mencatat stand meter pengangkatan."
        />
      ) : (
        <ImportTablePanel
          summary={[
            `${items.length} Rekening Siap Cabut`,
            "Verifikasi nomor Berita Acara (BA)",
          ]}
          aside={
            <AlertTriangle
              className="geist-icon text-destructive"
              aria-label="Peringatan pemutusan"
            />
          }
        >
          <ImportDataTable
            columns={COLUMNS}
            rows={filteredItems}
            getRowKey={(row) => row.nolg}
            empty={{
              icon: FileText,
              title: "Tidak ada data cocok",
              description: `Tidak ditemukan rekening yang cocok dengan kata kunci "${searchQuery}".`,
            }}
          />
        </ImportTablePanel>
      )}
    </div>
  );
}
