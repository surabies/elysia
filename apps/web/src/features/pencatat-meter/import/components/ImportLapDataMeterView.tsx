// features/dashboard/import/components/ImportLapDataMeterView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Gauge,
  Layers,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Badge, Button } from "@cater/ui";
import { cn } from "@/lib/utils";
import { readFileAsText } from "../lib/file-reader";
import { getErrorMessage, postImport } from "../lib/import-api";
import { IMPORT_API, IMPORT_LIMITS } from "../lib/import-config";
import {
  isKondisiNormal,
  parseLapDataMeterCsv,
  validateLapDataMeterRows,
} from "../lib/import-parsers";
import { TONE_STYLE, formatAngka } from "../lib/import-ui";
import { broadcastDataUpdated } from "@/lib/data-sync";
import type {
  ImportProgressState,
  LapDataMeterImportResponse,
  LapDataMeterResultStats,
  LapDataMeterRow,
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
import { ImportSafetyModal, type ImportMode, type LapDataMeterPreflightInfo } from "./shared/ImportSafetyModal";
import { ImportStatCard, ImportStatGrid } from "./shared/ImportStatCard";

export type { LapDataMeterRow } from "../types/import.types";

const COLUMNS: ImportColumn<LapDataMeterRow>[] = [
  {
    id: "thbl",
    header: "Periode",
    cell: (r) => r.thbl,
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "nolg",
    header: "No. Pelanggan (NOLG)",
    cell: (r) => r.nolg,
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "nama",
    header: "Nama & Alamat",
    cell: (r) => (
      <div className="max-w-52">
        <span className="block truncate font-medium text-foreground">
          {r.nama || "-"}
        </span>
        {r.alamat && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {r.alamat}
          </span>
        )}
      </div>
    ),
    cellClassName: "text-label-13",
  },
  {
    id: "rute",
    header: "Tarif & Rute",
    cell: (r) => (
      <div className="flex items-center gap-1">
        {r.trf && (
          <Badge variant="outline" className="font-mono text-label-11">
            {r.trf}
          </Badge>
        )}
        <Badge variant="secondary" className="font-mono text-label-11">
          {r.ruteKode || "-"}
        </Badge>
      </div>
    ),
  },
  {
    id: "kdWm",
    header: "No. Meter",
    cell: (r) => r.kdWm || "-",
    cellClassName: "text-copy-13-mono text-muted-foreground",
  },
  {
    id: "stml",
    header: "Stand Awal (STML)",
    cell: (r) => formatAngka(r.stml),
    className: "text-right",
    cellClassName: "text-copy-13-mono",
  },
  {
    id: "stma",
    header: "Stand Akhir (STMA)",
    cell: (r) => formatAngka(r.stma),
    className: "text-right",
    cellClassName: "text-label-13-mono text-foreground",
  },
  {
    id: "pakai",
    header: "Pakai (m³)",
    cell: (r) => formatAngka(r.pakaiM3),
    className: "text-right",
    cellClassName: "text-label-13-mono text-blue-700 dark:text-blue-400",
  },
  {
    id: "pakaiLalu",
    header: "Pakai Lalu",
    cell: (r) => (r.pakaiLalu !== undefined ? formatAngka(r.pakaiLalu) : "-"),
    className: "text-right",
    cellClassName: "text-copy-13-mono text-muted-foreground",
  },
  {
    id: "kondisi",
    header: "Kondisi / TMSS",
    cell: (r) => (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            TONE_STYLE[isKondisiNormal(r.ketCatat, r.tmss) ? "green" : "amber"]
              .dot,
          )}
          aria-hidden
        />
        <span className="max-w-32 truncate">{r.ketCatat}</span>
      </span>
    ),
    cellClassName: "text-copy-13",
  },
  {
    id: "petugas",
    header: "Petugas",
    cell: (r) => r.petugasId || r.namaPetugas || "-",
    cellClassName: "text-copy-13 text-muted-foreground",
  },
  {
    id: "tgl",
    header: "Tgl Catat",
    cell: (r) => r.tglCatat?.slice(0, 10) || "-",
    cellClassName: "text-copy-13 text-muted-foreground",
  },
];

export function ImportLapDataMeterView() {
  const [items, setItems] = React.useState<LapDataMeterRow[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] =
    React.useState<LapDataMeterResultStats | null>(null);
  const [lastImportMode, setLastImportMode] =
    React.useState<ImportMode>("SKIP_EXISTING");
  const [progressState, setProgressState] =
    React.useState<ImportProgressState | null>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = React.useState(false);
  const [preflightInfo, setPreflightInfo] =
    React.useState<LapDataMeterPreflightInfo | null>(null);
  const [isPreflighting, setIsPreflighting] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
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
      customDescription: "Mempersiapkan dan mem-parsing data LapDataMeter...",
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
      const parsed = parseLapDataMeterCsv(text);
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
          `Berhasil membaca ${parsed.length.toLocaleString("id-ID")} baris data dari ${file.name}!`,
        );
      } else {
        toast.warning(
          "Format CSV tidak dikenali atau tidak ada baris data valid.",
        );
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Gagal membaca berkas CSV LapDataMeter."),
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
      toast.info("Proses impor dibatalkan...");
    }
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Tidak ada baris data LapDataMeter untuk diproses.");
      return;
    }

    const validationError = validateLapDataMeterRows(items);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const thbl = items[0]?.thbl;
    if (!thbl) {
      executeImport("SKIP_EXISTING");
      return;
    }

    setIsPreflighting(true);
    try {
      const res = await fetch(
        `${IMPORT_API.lapDataMeterPreflight}?thbl=${encodeURIComponent(thbl)}`,
      );
      const data = await res.json();
      if (data.success && data.totalExisting > 0) {
        setPreflightInfo(data);
        setIsSafetyModalOpen(true);
        return;
      }
      // Jika data belum ada sama sekali di database, langsung jalankan mode aman
      executeImport("SKIP_EXISTING");
    } catch (err) {
      console.warn("Gagal melakukan pre-flight check, melanjutkan mode aman:", err);
      executeImport("SKIP_EXISTING");
    } finally {
      setIsPreflighting(false);
    }
  };

  const executeImport = async (mode: ImportMode) => {
    setIsSafetyModalOpen(false);
    setIsSubmitting(true);
    setLastImportMode(mode);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let totalSukses = 0;
    let totalGagal = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let wasAborted = false;

    const totalRows = items.length;
    const batchSize = IMPORT_LIMITS.lapDataMeterBatchSize;
    const totalBatches = Math.ceil(totalRows / batchSize);
    const isForceReset = mode === "FORCE_RESET_OVERWRITE";

    setProgressState({
      isActive: true,
      stage: "uploading",
      total: totalRows,
      processed: 0,
      sukses: 0,
      gagal: 0,
      percent: 0,
      currentLabel: `Batch 1 / ${totalBatches} (0 / ${totalRows.toLocaleString("id-ID")} baris)`,
      customTitle: isForceReset
        ? "Memulihkan & Menimpa Data Meter"
        : "Mengimpor & Memetakan Data Meter",
      customDescription: isForceReset
        ? "Menimpa stand lama & mereset verifikasi ke antrean awal (SUBMITTED)..."
        : "Menyimpan data pembacaan meter ke tabel cater_baca_meter secara bertahap...",
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

        // Per-batch abort controller dengan timeout mandiri
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
          const json = await postImport<LapDataMeterImportResponse>(
            IMPORT_API.lapDataMeter,
            { items: chunk, mode },
            {
              signal: batchController.signal,
              fallbackError: `Gagal mengimpor batch ${batchIdx}.`,
            },
          );

          totalSukses += json.sukses ?? chunk.length;
          totalGagal += json.gagal ?? 0;
          totalCreated += json.created ?? 0;
          totalUpdated += json.updated ?? 0;
          totalSkipped += json.skipped ?? 0;
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
                sukses: totalCreated + totalUpdated,
                gagal: totalGagal,
                percent,
                currentLabel: `Batch ${batchIdx} / ${totalBatches} selesai (${processed.toLocaleString("id-ID")} / ${totalRows.toLocaleString("id-ID")} baris)`,
              }
            : null,
        );
      }

      if (wasAborted) {
        toast.warning(
          `Impor dibatalkan oleh pengguna. ${totalSukses.toLocaleString("id-ID")} baris telah diproses.`,
        );
      } else {
        const selesaiLabel = isForceReset
          ? `Selesai! ${totalCreated.toLocaleString("id-ID")} baru, ${totalUpdated.toLocaleString("id-ID")} ditimpa & di-reset ke Menunggu.`
          : totalCreated === 0 && totalSkipped > 0
            ? `Selesai! Seluruh ${totalSkipped.toLocaleString("id-ID")} baris data dilewati (sudah tersedia).`
            : totalSkipped > 0
              ? `Selesai! ${totalCreated.toLocaleString("id-ID")} baru diimpor, ${totalSkipped.toLocaleString("id-ID")} dilewati.`
              : "Seluruh baris data baru berhasil diimpor!";

        setProgressState((prev) =>
          prev
            ? {
                ...prev,
                stage: "completed",
                percent: 100,
                processed: totalRows,
                sukses: isForceReset ? totalCreated + totalUpdated : totalCreated,
                gagal: totalGagal,
                currentLabel: selesaiLabel,
              }
            : null,
        );

        await new Promise((resolve) =>
          setTimeout(resolve, IMPORT_LIMITS.progressSettleMs),
        );

        if (isForceReset) {
          toast.success(
            `Sukses Pemulihan! ${totalCreated.toLocaleString("id-ID")} data baru dibuat, ${totalUpdated.toLocaleString("id-ID")} data stand ditimpa & diverifikasi ulang.`,
          );
        } else if (totalCreated === 0 && totalSkipped > 0) {
          toast.info(
            `Seluruh ${totalSkipped.toLocaleString("id-ID")} baris data dilewati karena sudah tersedia di sistem.`,
          );
        } else if (totalSkipped > 0) {
          toast.success(
            `${totalCreated.toLocaleString("id-ID")} data baru berhasil diimpor, ${totalSkipped.toLocaleString("id-ID")} data dilewati (sudah tersedia).`,
          );
        } else {
          toast.success(
            `Sukses! Berhasil memetakan ${totalCreated.toLocaleString("id-ID")} baris data meter baru ke tabel cater_baca_meter.`,
          );
        }
      }

      const stats: LapDataMeterResultStats = {
        total: totalCreated + totalSkipped + totalUpdated + totalGagal,
        sukses: isForceReset ? totalCreated + totalUpdated : totalCreated,
        gagal: totalGagal,
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
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
            "Terjadi kesalahan saat mengimpor data LapDataMeter.",
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
    setFileName("");
    setResultStats(null);
    setSearchQuery("");
    toast.info("Tampilan data import telah dibersihkan.");
  };

  const totalKubikasi = React.useMemo(
    () => items.reduce((sum, item) => sum + item.pakaiM3, 0),
    [items],
  );
  const normalCount = React.useMemo(
    () =>
      items.filter((item) => isKondisiNormal(item.ketCatat, item.tmss)).length,
    [items],
  );

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = q
      ? items.filter((item) =>
          [
            item.nolg,
            item.nama,
            item.ruteKode,
            item.petugasId,
            item.ketCatat,
          ].some((field) => field?.toLowerCase().includes(q)),
        )
      : items;
    return matched.slice(0, IMPORT_LIMITS.lapDataMeterPreviewRows);
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      <ImportStatGrid columns={4}>
        <ImportStatCard
          label="Total Baris Meter"
          value={formatAngka(items.length)}
          unit="Baris"
          caption={fileName || "Belum ada berkas dimuat"}
          icon={Layers}
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
          label="Status Kondisi"
          value={formatAngka(normalCount)}
          unit="Normal"
          caption={`${items.length - normalCount} kendala/akses`}
          icon={CheckCircle2}
          tone="green"
        />
        <ImportStatCard
          label="Periode Pembacaan"
          value={items[0]?.thbl || "-"}
          unit="THBL"
          caption="Format baku YYYYMM"
          icon={CalendarDays}
          tone="blue"
        />
      </ImportStatGrid>

      <ImportControlPanel
        title="Import LapDataMeter (Laporan Bacaan Meter)"
        badge={<Badge variant="secondary" className="font-mono text-label-11">Format: CSV / TXT</Badge>}
        description="Import dan perbarui pembacaan meter bulanan petugas (lapdatameter) ke tabel cater_baca_meter."
        hasData={items.length > 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Pel / Nama / Rute..."
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
              Unggah CSV LapDataMeter
            </ImportFileButton>

            <Button
              onClick={handleImport}
              disabled={isSubmitting || isPreflighting || items.length === 0}
            >
              <Database />
              {isPreflighting
                ? "Memeriksa Status Data..."
                : isSubmitting
                  ? "Memproses..."
                  : `Import ${items.length} Data ke cater_baca_meter`}
            </Button>
          </>
        }
      />

      {resultStats && (
        <ImportResultBanner
          tone={
            lastImportMode === "FORCE_RESET_OVERWRITE"
              ? "amber"
              : resultStats.created === 0 && resultStats.skipped > 0
                ? "blue"
                : resultStats.gagal > 0
                  ? "amber"
                  : "green"
          }
          title={
            lastImportMode === "FORCE_RESET_OVERWRITE"
              ? "Pemulihan & Timpa Data Selesai!"
              : resultStats.created === 0 && resultStats.skipped > 0
                ? "Data Sudah Tersedia di Sistem (Dilewati)"
                : "Proses Import Selesai!"
          }
          description={
            lastImportMode === "FORCE_RESET_OVERWRITE"
              ? `Total ${resultStats.total.toLocaleString("id-ID")} baris data diproses • ${resultStats.created.toLocaleString("id-ID")} data baru • ${resultStats.updated.toLocaleString("id-ID")} data stand ditimpa & di-reset ke Menunggu • ${resultStats.gagal} gagal.`
              : resultStats.created === 0 && resultStats.skipped > 0
                ? `Seluruh ${resultStats.skipped.toLocaleString("id-ID")} baris data dilewati karena data pembacaan periode ini sudah tercatat di database.`
                : `Total ${resultStats.total.toLocaleString("id-ID")} baris data diproses • ${resultStats.created.toLocaleString("id-ID")} transaksi baru dibuat • ${resultStats.skipped.toLocaleString("id-ID")} data dilewati (sudah ada) • ${resultStats.gagal.toLocaleString("id-ID")} gagal.`
          }
          actions={
            <Badge variant="secondary" className="font-mono text-label-11">
              {lastImportMode === "FORCE_RESET_OVERWRITE"
                ? "cater_baca_meter: DIRESET ULANG"
                : resultStats.created === 0 && resultStats.skipped > 0
                  ? "cater_baca_meter: DATA IDENTIK"
                  : "cater_baca_meter: SYNC OK"}
            </Badge>
          }
        />
      )}

      {items.length === 0 ? (
        <ImportEmptyState
          icon={Layers}
          title="Belum Ada Berkas LapDataMeter Dipilih"
          description="Pilih berkas CSV laporan data pembacaan meter bulanan dari sistem untuk dipetakan ke database cater_baca_meter."
          badges={
            <>
              <Badge variant="secondary" className="font-mono text-label-11">
                NO PEL;NAMA;PERIODE;ST AWAL;ST AKHIR;PAKAI;KONDISI;RUTE
              </Badge>
            </>
          }
          onFileSelect={handleFileUpload}
          accept=".csv,.txt"
          buttonLabel="Pilih Berkas LapDataMeter"
          infoNote="Sistem otomatis memvalidasi duplikasi NOLG dan konsistensi stand meter sebelum penyimpanan."
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
            "Hasil parsing berkas CSV",
          ]}
        >
          <ImportDataTable
            columns={COLUMNS}
            rows={filteredItems}
            getRowKey={(row, index) => `${row.thbl}-${row.nolg}-${index}`}
            empty={{
              icon: FileSpreadsheet,
              title: "Tidak ada hasil",
              description: `Tidak ada data yang sesuai dengan pencarian "${searchQuery}".`,
            }}
          />
        </ImportTablePanel>
      )}

      <ImportProgressModal
        progress={progressState}
        onCancel={handleCancelImport}
      />

      <ImportSafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        onConfirm={(mode) => executeImport(mode)}
        isSubmitting={isSubmitting}
        preflightInfo={preflightInfo}
        totalRowsToImport={items.length}
      />
    </div>
  );
}
