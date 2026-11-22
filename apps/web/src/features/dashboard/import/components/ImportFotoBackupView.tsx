// features/dashboard/import/components/ImportFotoBackupView.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CustomerPhotoGroup,
  ImportProgressState,
  ModeImportFilter,
} from "../types/foto-backup.types";
import type {
  FotoBackupUploadResponse,
  LookupPelangganResponse,
} from "../types/import.types";
import { formatFileSize, readFileAsDataUrl } from "../lib/file-reader";
import {
  FOTO_JENIS_LIST,
  buildSearchText,
  buildUploadPayload,
  countFotoByMode,
  getFoto,
  getModeLabel,
  mergePhotoGroups,
  parseFotoFileName,
  type FotoJenis,
  type IncomingPhotoGroups,
} from "../lib/foto-backup";
import { getErrorMessage, postImport } from "../lib/import-api";
import {
  FOTO_FILENAME_TEMPLATE,
  IMPORT_API,
  IMPORT_LIMITS,
  IMPORT_ROUTES,
} from "../lib/import-config";
import { ImportPhotoDialog } from "./foto-backup/ImportPhotoDialog";
import { ImportPhotoEmptyState } from "./foto-backup/ImportPhotoEmptyState";
import { ImportPhotoFilterBar } from "./foto-backup/ImportPhotoFilterBar";
import { ImportPhotoProgressModal } from "./foto-backup/ImportPhotoProgressModal";
import { ImportPhotoTable } from "./foto-backup/ImportPhotoTable";
import { ImportSummaryCards } from "./foto-backup/ImportSummaryCards";
import { ImportResultBanner } from "./shared/ImportResultBanner";

interface ResultSummary {
  sukses: number;
  gagal: number;
  total: number;
  slCount: number;
  labelKelompok: string;
}

export function ImportFotoBackupView() {
  // Halaman dimulai kosong (clean initial state).
  const [customers, setCustomers] = React.useState<CustomerPhotoGroup[]>([]);
  const [selectedNolgs, setSelectedNolgs] = React.useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [modeFilter, setModeFilter] = React.useState<ModeImportFilter>("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [progressState, setProgressState] =
    React.useState<ImportProgressState | null>(null);
  const [resultSummary, setResultSummary] =
    React.useState<ResultSummary | null>(null);

  const [previewCustomer, setPreviewCustomer] =
    React.useState<CustomerPhotoGroup | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = React.useState<FotoJenis>(
    FOTO_JENIS_LIST[0].key,
  );

  const updateProgress = (patch: Partial<ImportProgressState>) =>
    setProgressState((prev) => (prev ? { ...prev, ...patch } : prev));

  /* ------------------------------ Turunan data ----------------------------- */

  const filteredCustomers = React.useMemo(() => {
    const byMode =
      modeFilter === "all"
        ? customers
        : customers.filter((c) => getFoto(c, modeFilter));
    const q = searchQuery.trim().toLowerCase();
    return q ? byMode.filter((c) => buildSearchText(c).includes(q)) : byMode;
  }, [customers, modeFilter, searchQuery]);

  const counts = React.useMemo(() => {
    const result: Record<FotoJenis, number> = { stand: 0, segel: 0, rumah: 0 };
    for (const customer of customers) {
      for (const meta of FOTO_JENIS_LIST) {
        if (getFoto(customer, meta.key)) result[meta.key]++;
      }
    }
    return result;
  }, [customers]);

  const totalBerkas = counts.stand + counts.segel + counts.rumah;

  const activeProcessCount = React.useMemo(
    () =>
      customers
        .filter((c) => selectedNolgs.has(c.nolg))
        .reduce((total, c) => total + countFotoByMode(c, modeFilter), 0),
    [customers, selectedNolgs, modeFilter],
  );

  /* ------------------------------- Pemilihan ------------------------------- */

  const isAllSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedNolgs.has(c.nolg));
  const isIndeterminate =
    !isAllSelected && filteredCustomers.some((c) => selectedNolgs.has(c.nolg));

  const toggleSelectAll = () => {
    setSelectedNolgs((prev) => {
      const next = new Set(prev);
      filteredCustomers.forEach((c) =>
        isAllSelected ? next.delete(c.nolg) : next.add(c.nolg),
      );
      return next;
    });
  };

  const toggleRowSelect = (nolg: string) => {
    setSelectedNolgs((prev) => {
      const next = new Set(prev);
      if (next.has(nolg)) next.delete(nolg);
      else next.add(nolg);
      return next;
    });
  };

  /* ---------------------------- Pilih berkas foto --------------------------- */

  // Cocokkan NOLG dengan master pelanggan di database.
  const syncCustomerInfo = async (nolgs: string[]) => {
    try {
      const json = await postImport<LookupPelangganResponse>(
        IMPORT_API.lookupPelanggan,
        { nolgs },
        { fallbackError: "Gagal sinkronisasi data pelanggan." },
      );
      const byNolg = new Map((json.data ?? []).map((row) => [row.nolg, row]));
      if (byNolg.size === 0) return;

      setCustomers((prev) =>
        prev.map((customer) => {
          const info = byNolg.get(customer.nolg);
          return info
            ? {
                ...customer,
                nama: info.nama,
                alamat: info.alamat,
                ruteKode: info.ruteKode || customer.ruteKode,
              }
            : customer;
        }),
      );
    } catch (error) {
      console.error("Gagal sinkronisasi data pelanggan dari database:", error);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    input.value = ""; // izinkan memilih berkas yang sama lagi
    if (files.length === 0) return;

    const incoming: IncomingPhotoGroups = {};
    let validCount = 0;
    let invalidCount = 0;

    setProgressState({
      isActive: true,
      stage: "reading",
      total: files.length,
      processed: 0,
      sukses: 0,
      gagal: 0,
      percent: 0,
      currentFileName: files[0].name,
    });

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      updateProgress({
        processed: index + 1,
        percent: Math.round(((index + 1) / files.length) * 100),
        currentFileName: file.name,
      });

      const parsed = parseFotoFileName(file.name);
      if (!parsed) {
        invalidCount++;
        continue;
      }
      validCount++;

      // DataURL nyata agar Cloudinary & backend dapat menyimpannya.
      const url = await readFileAsDataUrl(file);
      const group = (incoming[parsed.nolg] ??= {
        thbl: parsed.thbl,
        photos: {},
      });
      group.photos[parsed.jenis] = {
        fileName: file.name,
        thbl: parsed.thbl,
        jenis: parsed.jenis,
        nolg: parsed.nolg,
        url,
        size: formatFileSize(file.size),
        valid: true,
      };
    }

    setProgressState(null);

    if (validCount === 0) {
      toast.error(
        `Tidak ada berkas yang sesuai dengan format baku ${FOTO_FILENAME_TEMPLATE}.`,
      );
      return;
    }

    const nolgs = Object.keys(incoming);
    setCustomers((prev) => mergePhotoGroups(prev, incoming));
    setSelectedNolgs((prev) => {
      const next = new Set(prev);
      nolgs.forEach((nolg) => next.add(nolg));
      return next;
    });
    void syncCustomerInfo(nolgs);

    if (invalidCount > 0) {
      toast.warning(
        `Memuat ${validCount} berkas valid. Terdapat ${invalidCount} berkas diabaikan karena tidak mengikuti pola penamaan baku.`,
      );
    } else {
      toast.success(`Berhasil memuat ${validCount} berkas foto backup!`);
    }
  };

  const handleClear = () => {
    setCustomers([]);
    setSelectedNolgs(new Set());
    setSearchQuery("");
    setModeFilter("all");
    setResultSummary(null);
    toast.info("Daftar berkas foto backup telah dikosongkan.");
  };

  /* ------------------------------ Eksekusi import --------------------------- */

  const handleExecuteImport = async () => {
    const selectedCustomers = customers.filter((c) =>
      selectedNolgs.has(c.nolg),
    );
    if (selectedCustomers.length === 0) {
      toast.error("Pilih minimal satu nomor langganan untuk dipetakan.");
      return;
    }

    const payloadFiles = buildUploadPayload(selectedCustomers, modeFilter);
    if (payloadFiles.length === 0) {
      toast.error(
        "Tidak ada berkas foto yang cocok dengan kelompok filter saat ini.",
      );
      return;
    }

    setIsSubmitting(true);
    setResultSummary(null);

    let totalSukses = 0;
    let totalGagal = 0;

    setProgressState({
      isActive: true,
      stage: "uploading",
      total: payloadFiles.length,
      processed: 0,
      sukses: 0,
      gagal: 0,
      percent: 0,
      currentFileName: payloadFiles[0].fileName,
    });

    try {
      for (
        let i = 0;
        i < payloadFiles.length;
        i += IMPORT_LIMITS.fotoBatchSize
      ) {
        const chunk = payloadFiles.slice(i, i + IMPORT_LIMITS.fotoBatchSize);
        updateProgress({ currentFileName: chunk[0].fileName });

        try {
          const json = await postImport<FotoBackupUploadResponse>(
            IMPORT_API.fotoBackup,
            { files: chunk },
            { fallbackError: "Gagal mengunggah berkas foto." },
          );
          totalSukses += json.data?.sukses ?? chunk.length;
          totalGagal += json.data?.gagal ?? 0;
        } catch (chunkError) {
          console.error("Batch upload failed:", chunkError);
          totalGagal += chunk.length;
        }

        const processed = Math.min(i + chunk.length, payloadFiles.length);
        updateProgress({
          processed,
          sukses: totalSukses,
          gagal: totalGagal,
          percent: Math.round((processed / payloadFiles.length) * 100),
        });
      }

      updateProgress({
        stage: "completed",
        percent: 100,
        processed: payloadFiles.length,
        sukses: totalSukses,
        gagal: totalGagal,
      });

      // Jeda singkat agar status 100% terekam visual sebelum modal tertutup.
      await new Promise((resolve) =>
        setTimeout(resolve, IMPORT_LIMITS.progressSettleMs),
      );

      const labelKelompok = getModeLabel(modeFilter);
      setResultSummary({
        total: payloadFiles.length,
        sukses: totalSukses,
        gagal: totalGagal,
        slCount: selectedCustomers.length,
        labelKelompok,
      });

      // Antrian dikosongkan otomatis setelah batch selesai.
      setCustomers([]);
      setSelectedNolgs(new Set());
      setSearchQuery("");

      toast.success(
        `Sukses! ${totalSukses} berkas ${labelKelompok} berhasil dipetakan ke ${selectedCustomers.length} pelanggan di database cater_baca_meter.`,
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Terjadi kesalahan saat memulihkan foto backup.",
        ),
      );
    } finally {
      setIsSubmitting(false);
      setProgressState(null);
    }
  };

  /* ---------------------------------- Pratinjau ---------------------------- */

  const handleOpenPreview = (group: CustomerPhotoGroup, tab: FotoJenis) => {
    setPreviewCustomer(group);
    setPreviewActiveTab(tab);
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Nama berkas berhasil disalin!");
  };

  return (
    <div className="space-y-4">
      <ImportSummaryCards
        totalBerkas={totalBerkas}
        counts={counts}
        totalSL={customers.length}
      />

      <ImportPhotoFilterBar
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalBerkas={totalBerkas}
        counts={counts}
        selectedNolgsCount={selectedNolgs.size}
        activeProcessCount={activeProcessCount}
        isSubmitting={isSubmitting}
        onFileSelect={handleFileSelect}
        onExecuteImport={() => void handleExecuteImport()}
        onClear={handleClear}
        hasData={customers.length > 0}
      />

      {resultSummary && (
        <ImportResultBanner
          tone="green"
          title="Pemetaan Berkas Foto Berhasil Disimpan!"
          description={
            <>
              Sebanyak{" "}
              <strong>
                {resultSummary.sukses} berkas ({resultSummary.labelKelompok})
              </strong>{" "}
              berhasil dipetakan ke{" "}
              <strong>{resultSummary.slCount} Nomor Langganan</strong> di tabel{" "}
              <code className="rounded-sm bg-ds-green-200 px-1 py-0.5 text-label-12-mono">
                cater_baca_meter
              </code>
              .
            </>
          }
          actions={
            <>
              <Button asChild>
                <Link href={IMPORT_ROUTES.pencatatanMeter}>
                  Lihat di Pencatatan Meter
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setResultSummary(null)}
                aria-label="Tutup notifikasi"
                title="Tutup notifikasi"
              >
                <X />
              </Button>
            </>
          }
        />
      )}

      {customers.length === 0 ? (
        <ImportPhotoEmptyState onFileSelect={handleFileSelect} />
      ) : (
        <ImportPhotoTable
          filteredCustomers={filteredCustomers}
          selectedNolgs={selectedNolgs}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          toggleSelectAll={toggleSelectAll}
          toggleRowSelect={toggleRowSelect}
          modeFilter={modeFilter}
          activeProcessCount={activeProcessCount}
          onOpenPreview={handleOpenPreview}
        />
      )}

      <ImportPhotoDialog
        previewCustomer={previewCustomer}
        previewActiveTab={previewActiveTab}
        setPreviewActiveTab={setPreviewActiveTab}
        onClose={() => setPreviewCustomer(null)}
        onCopy={copyToClipboard}
      />

      <ImportPhotoProgressModal progress={progressState} />
    </div>
  );
}
