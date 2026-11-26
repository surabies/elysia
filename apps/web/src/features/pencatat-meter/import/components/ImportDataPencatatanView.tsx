// features/dashboard/import/components/ImportDataPencatatanView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Gauge,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Badge, Button } from "@cater/ui";
import { readFileAsText } from "../lib/file-reader";
import { getErrorMessage, postImport } from "../lib/import-api";
import { IMPORT_API, IMPORT_LIMITS } from "../lib/import-config";
import { isKondisiNormal, parsePencatatanCsv } from "../lib/import-parsers";
import { formatAngka } from "../lib/import-ui";
import { broadcastDataUpdated } from "@/lib/data-sync";
import type {
  BatchImportResponse,
  ImportBatchStats,
  ImportProgressState,
  PencatatanRow,
} from "../types/import.types";
import { ImportDataTable, type ImportColumn } from "./shared/ImportDataTable";
import { ImportEmptyState } from "./shared/ImportEmptyState";
import { ImportFileButton } from "./shared/ImportFileButton";
import {
  ImportControlPanel,
  ImportTablePanel,
} from "./shared/ImportPanels";
import { ImportProgressModal } from "./shared/ImportProgressModal";
import { ImportResultBanner } from "./shared/ImportResultBanner";
import { ImportStatCard, ImportStatGrid } from "./shared/ImportStatCard";

const COLUMNS: ImportColumn<PencatatanRow>[] = [
  {
    id: "nolg",
    header: "No. Langganan",
    cell: (r) => r.nolg,
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "thbl",
    header: "Periode",
    cell: (r) => r.thbl,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "stml",
    header: "Stand Lalu",
    cell: (r) => `${r.stml} m³`,
    cellClassName: "text-copy-13-mono text-muted-foreground",
  },
  {
    id: "stma",
    header: "Stand Akhir",
    cell: (r) => `${r.stma} m³`,
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "pakai",
    header: "Kubikasi",
    cell: (r) => `${r.pakaiM3} m³`,
    cellClassName: "text-label-13-mono text-blue-700 dark:text-blue-400 font-semibold",
  },
  {
    id: "tglCatat",
    header: "Waktu Catat",
    cell: (r) => r.tglCatat,
    cellClassName: "text-copy-13 text-muted-foreground",
  },
  {
    id: "petugas",
    header: "Petugas",
    cell: (r) => r.petugasId,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "rute",
    header: "Rute",
    cell: (r) => r.ruteKode,
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "kondisi",
    header: "Kondisi",
    cell: (r) => (
      <Badge
        variant={isKondisiNormal(r.ketCatat) ? "green-subtle" : "amber-subtle"}
      >
        {r.ketCatat}
      </Badge>
    ),
  },
  {
    id: "gps",
    header: "Koordinat GPS",
    cell: (r) =>
      r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : "-",
    cellClassName: "text-copy-13-mono text-muted-foreground",
  },
];

export function ImportDataPencatatanView() {
  const [items, setItems] = React.useState<PencatatanRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<ImportBatchStats | null>(
    null,
  );
  const [progressState, setProgressState] =
    React.useState<ImportProgressState | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProgressState({
      isActive: true,
      stage: "reading",
      total: 100,
      processed: 30,
      sukses: 0,
      gagal: 0,
      percent: 30,
      currentLabel: `Membaca berkas ${file.name}...`,
      customTitle: "Membaca Berkas CSV",
      customDescription: "Mempersiapkan dan mem-parsing data pencatatan meter...",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const text = await readFileAsText(file);
      setProgressState((prev) =>
        prev
          ? {
              ...prev,
              percent: 75,
              processed: 75,
              currentLabel: "Mem-parsing baris CSV...",
            }
          : null,
      );
      await new Promise((resolve) => setTimeout(resolve, 30));
      const parsed = parsePencatatanCsv(text);
      setItems(parsed);
      setResultStats(null);

      setProgressState((prev) =>
        prev
          ? {
              ...prev,
              stage: "completed",
              percent: 100,
              processed: 100,
              currentLabel: `Selesai membaca ${parsed.length.toLocaleString("id-ID")} baris data.`,
            }
          : null,
      );

      await new Promise((resolve) =>
        setTimeout(resolve, IMPORT_LIMITS.progressSettleMs),
      );

      if (parsed.length > 0) {
        toast.success(
          `Berhasil membaca ${parsed.length.toLocaleString("id-ID")} baris data dari berkas ${file.name}!`,
        );
      } else {
        toast.warning(
          "Format CSV tidak dikenali atau tidak ada baris data valid.",
        );
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Gagal membaca berkas CSV data pencatatan."),
      );
    } finally {
      setProgressState(null);
    }
  };

  const handleCancelImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setProgressState((prev) =>
        prev
          ? {
              ...prev,
              isCancelling: true,
              currentLabel: "Membatalkan proses impor...",
            }
          : null,
      );
    }
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Tidak ada baris data pencatatan untuk diproses.");
      return;
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let totalSukses = 0;
    let totalGagal = 0;
    let wasAborted = false;

    const totalRows = items.length;
    const batchSize = IMPORT_LIMITS.lapDataMeterBatchSize;
    const totalBatches = Math.ceil(totalRows / batchSize);

    setProgressState({
      isActive: true,
      stage: "uploading",
      total: totalRows,
      processed: 0,
      sukses: 0,
      gagal: 0,
      percent: 0,
      currentLabel: `Batch 1 / ${totalBatches} (0 / ${totalRows.toLocaleString("id-ID")} baris)`,
      customTitle: "Mengimpor & Memetakan Data Pencatatan",
      customDescription:
        "Menyimpan data bacaan meter ke tabel cater_baca_meter secara bertahap...",
      isCancelling: false,
    });

    try {
      for (let i = 0; i < totalRows; i += batchSize) {
        if (controller.signal.aborted) {
          wasAborted = true;
          break;
        }

        const batchIdx = Math.floor(i / batchSize) + 1;
        const chunk = items.slice(i, i + batchSize);

        setProgressState((prev) =>
          prev
            ? {
                ...prev,
                currentLabel: `Batch ${batchIdx} / ${totalBatches} (${i.toLocaleString("id-ID")} / ${totalRows.toLocaleString("id-ID")} baris)`,
              }
            : null,
        );

        const batchController = new AbortController();
        const batchTimeoutId = setTimeout(
          () => batchController.abort(),
          IMPORT_LIMITS.lapDataMeterBatchTimeoutMs,
        );

        const onParentAbort = () => batchController.abort();
        controller.signal.addEventListener("abort", onParentAbort, {
          once: true,
        });

        try {
          const { data } = await postImport<BatchImportResponse>(
            IMPORT_API.data,
            { items: chunk },
            {
              signal: batchController.signal,
              fallbackError: `Gagal mengimpor batch ${batchIdx}.`,
            },
          );

          totalSukses += data?.sukses ?? chunk.length;
          totalGagal += data?.gagal ?? 0;
        } catch (batchError) {
          if (controller.signal.aborted || batchController.signal.aborted) {
            wasAborted = true;
            break;
          }
          console.warn(`Gagal pada batch ${batchIdx}:`, batchError);
          totalGagal += chunk.length;
        } finally {
          clearTimeout(batchTimeoutId);
          controller.signal.removeEventListener("abort", onParentAbort);
        }

        const processed = Math.min(i + chunk.length, totalRows);
        const percent = Math.round((processed / totalRows) * 100);

        setProgressState((prev) =>
          prev
            ? {
                ...prev,
                processed,
                sukses: totalSukses,
                gagal: totalGagal,
                percent,
                currentLabel: `Batch ${batchIdx} / ${totalBatches} selesai (${processed.toLocaleString("id-ID")} / ${totalRows.toLocaleString("id-ID")} baris)`,
              }
            : null,
        );
      }

      if (wasAborted) {
        toast.warning(
          `Impor dibatalkan oleh pengguna. ${totalSukses.toLocaleString("id-ID")} baris telah tersimpan.`,
        );
      } else {
        setProgressState((prev) =>
          prev
            ? {
                ...prev,
                stage: "completed",
                percent: 100,
                processed: totalRows,
                sukses: totalSukses,
                gagal: totalGagal,
                currentLabel: "Seluruh baris data berhasil diproses!",
              }
            : null,
        );

        await new Promise((resolve) =>
          setTimeout(resolve, IMPORT_LIMITS.progressSettleMs),
        );

        toast.success(
          `Sukses! Berhasil menyerap ${totalSukses.toLocaleString("id-ID")} baris data bacaan meter ke database cater_baca_meter!`,
        );
      }

      const stats: ImportBatchStats = {
        total: totalSukses + totalGagal,
        sukses: totalSukses,
        gagal: totalGagal,
      };
      setResultStats(stats);
      if (totalSukses > 0) {
        broadcastDataUpdated();
      }
    } catch (error) {
      if (controller.signal.aborted) {
        toast.warning("Impor dibatalkan oleh pengguna.");
      } else {
        toast.error(
          getErrorMessage(
            error,
            "Terjadi kesalahan saat mengimpor data pencatatan.",
          ),
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsSubmitting(false);
      setProgressState(null);
    }
  };

  const handleClear = () => {
    setItems([]);
    setSearchQuery("");
    setResultStats(null);
    toast.info("Daftar berkas data pencatatan telah dikosongkan.");
  };

  const totalKubikasi = React.useMemo(
    () => items.reduce((sum, item) => sum + item.pakaiM3, 0),
    [items],
  );
  const normalCount = React.useMemo(
    () => items.filter((item) => isKondisiNormal(item.ketCatat)).length,
    [items],
  );

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [row.nolg, row.petugasId, row.ruteKode, row.ketCatat, row.thbl].some(
        (field) => field?.toLowerCase().includes(q),
      ),
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      <ImportStatGrid columns={4}>
        <ImportStatCard
          label="Total Baris Data"
          value={formatAngka(items.length)}
          unit="Baris"
          caption="Baris transaksi siap diproses"
          icon={FileSpreadsheet}
        />
        <ImportStatCard
          label="Total Pemakaian"
          value={formatAngka(totalKubikasi)}
          unit="m³"
          caption="Akumulasi volume air terbaca"
          icon={Gauge}
          tone="blue"
        />
        <ImportStatCard
          label="Kondisi Normal"
          value={formatAngka(normalCount)}
          unit="Normal"
          caption={`${items.length - normalCount} kendala`}
          icon={CheckCircle2}
          tone="green"
        />
        <ImportStatCard
          label="Periode Aktif"
          value={items[0]?.thbl || "-"}
          unit="THBL"
          caption="Format baku YYYYMM"
          icon={CalendarDays}
          tone="blue"
        />
      </ImportStatGrid>

      <ImportControlPanel
        title="Import Data Pencatatan (Stand Meter Mobile)"
        badge={<Badge variant="secondary" className="font-mono text-label-11">Format: CSV / TXT</Badge>}
        description="Sinkronisasi hasil pembacaan stand meter mandiri petugas mobile ke database cater_baca_meter."
        hasData={items.length > 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. Langganan / Petugas / Rute..."
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
              accept=".csv,.txt,.json"
              onChange={handleFileUpload}
              icon={Upload}
              disabled={isSubmitting}
            >
              Unggah CSV Mobile
            </ImportFileButton>

            <Button
              onClick={handleImport}
              disabled={isSubmitting || items.length === 0}
            >
              <Database />
              {isSubmitting
                ? "Memproses..."
                : `Import ${items.length} Data Meter`}
            </Button>
          </>
        }
      />

      {resultStats && (
        <ImportResultBanner
          tone="green"
          title="Import Data Pencatatan Sukses"
          description={`Total ${resultStats.total} baris: ${resultStats.sukses} terserap ke database cater_baca_meter, ${resultStats.gagal} gagal.`}
          actions={<Badge variant="secondary" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/10 dark:text-emerald-400">Status: Terverifikasi</Badge>}
        />
      )}

      {items.length === 0 ? (
        <ImportEmptyState
          icon={FileSpreadsheet}
          title="Belum Ada Berkas Pencatatan Dipilih"
          description="Pilih atau unggah berkas CSV/TXT pembacaan meter mobile dari HP petugas untuk diproses ke database cater_baca_meter."
          badges={
            <>
              <Badge variant="secondary" className="font-mono text-label-11">
                thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi
              </Badge>
            </>
          }
          onFileSelect={handleFileUpload}
          accept=".csv,.txt,.json"
          buttonLabel="Pilih Berkas CSV Mobile"
          infoNote="Mendukung pemisah titik koma (;), koma (,), atau tab. Data langsung diurai di peramban."
        />
      ) : (
        <ImportTablePanel
          summary={[
            <>
              Menampilkan{" "}
              <strong className="text-label-12-mono text-foreground">
                {filteredItems.length}
              </strong>{" "}
              / {items.length} baris
            </>,
            "Data angka stand meter lalu (STML) dan akhir (STMA) siap disimpan",
          ]}
        >
          <ImportDataTable
            columns={COLUMNS}
            rows={filteredItems}
            getRowKey={(row, index) => `${row.nolg}-${index}`}
            empty={{
              icon: FileSpreadsheet,
              title: "Tidak ada data cocok",
              description: `Tidak ditemukan baris yang cocok dengan kata kunci "${searchQuery}".`,
            }}
          />
        </ImportTablePanel>
      )}

      <ImportProgressModal
        progress={progressState}
        onCancel={handleCancelImport}
      />
    </div>
  );
}
