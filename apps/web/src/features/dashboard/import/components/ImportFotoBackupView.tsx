// apps/web/src/features/dashboard/import/components/ImportFotoBackupView.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ModeImportFilter,
  CustomerPhotoGroup,
  ParsedPhotoItem,
  ImportProgressState,
} from "../types/foto-backup.types";
import { ImportSummaryCards } from "./foto-backup/ImportSummaryCards";
import { ImportPhotoFilterBar } from "./foto-backup/ImportPhotoFilterBar";
import { ImportPhotoEmptyState } from "./foto-backup/ImportPhotoEmptyState";
import { ImportPhotoTable } from "./foto-backup/ImportPhotoTable";
import { ImportPhotoDialog } from "./foto-backup/ImportPhotoDialog";
import { ImportPhotoProgressModal } from "./foto-backup/ImportPhotoProgressModal";

export function ImportFotoBackupView() {
  // Halaman mulai dalam keadaan kosong (clean initial state)
  const [customers, setCustomers] = React.useState<CustomerPhotoGroup[]>([]);
  const [selectedNolgs, setSelectedNolgs] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [modeFilter, setModeFilter] = React.useState<ModeImportFilter>("all");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [progressState, setProgressState] = React.useState<ImportProgressState | null>(null);
  const [resultSummary, setResultSummary] = React.useState<{
    sukses: number;
    gagal: number;
    total: number;
    slCount: number;
    labelKelompok: string;
  } | null>(null);

  // Dialog Pratinjau Modal
  const [previewCustomer, setPreviewCustomer] = React.useState<CustomerPhotoGroup | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = React.useState<"stand" | "segel" | "rumah">("stand");

  // Filter data berdasarkan mode kelompok foto dan pencarian teks
  const filteredCustomers = React.useMemo(() => {
    let list = customers;

    if (modeFilter === "stand") {
      list = list.filter((c) => Boolean(c.fotoStand));
    } else if (modeFilter === "segel") {
      list = list.filter((c) => Boolean(c.fotoSegel));
    } else if (modeFilter === "rumah") {
      list = list.filter((c) => Boolean(c.fotoRumah));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (c) =>
        c.nolg.toLowerCase().includes(q) ||
        (c.nama && c.nama.toLowerCase().includes(q)) ||
        (c.alamat && c.alamat.toLowerCase().includes(q)) ||
        (c.ruteKode && c.ruteKode.toLowerCase().includes(q)) ||
        c.thbl.toLowerCase().includes(q) ||
        c.fotoStand?.fileName.toLowerCase().includes(q) ||
        c.fotoSegel?.fileName.toLowerCase().includes(q) ||
        c.fotoRumah?.fileName.toLowerCase().includes(q)
    );
  }, [customers, modeFilter, searchQuery]);

  // Statistik Dinamis
  const totalSL = customers.length;
  const countStand = customers.filter((c) => Boolean(c.fotoStand)).length;
  const countSegel = customers.filter((c) => Boolean(c.fotoSegel)).length;
  const countRumah = customers.filter((c) => Boolean(c.fotoRumah)).length;
  const totalBerkas = countStand + countSegel + countRumah;

  // Hitung jumlah berkas yang siap dipetakan sesuai filter aktif
  const activeProcessCount = React.useMemo(() => {
    const selectedCustomers = customers.filter((c) => selectedNolgs.has(c.nolg));
    if (modeFilter === "stand") {
      return selectedCustomers.filter((c) => Boolean(c.fotoStand)).length;
    }
    if (modeFilter === "segel") {
      return selectedCustomers.filter((c) => Boolean(c.fotoSegel)).length;
    }
    if (modeFilter === "rumah") {
      return selectedCustomers.filter((c) => Boolean(c.fotoRumah)).length;
    }
    return selectedCustomers.reduce(
      (acc, c) =>
        acc +
        (c.fotoStand ? 1 : 0) +
        (c.fotoSegel ? 1 : 0) +
        (c.fotoRumah ? 1 : 0),
      0
    );
  }, [customers, selectedNolgs, modeFilter]);

  // Checkbox select all & toggle row
  const isAllSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedNolgs.has(c.nolg));
  const isIndeterminate =
    filteredCustomers.some((c) => selectedNolgs.has(c.nolg)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNolgs((prev) => {
        const next = new Set(prev);
        filteredCustomers.forEach((c) => next.delete(c.nolg));
        return next;
      });
    } else {
      setSelectedNolgs((prev) => {
        const next = new Set(prev);
        filteredCustomers.forEach((c) => next.add(c.nolg));
        return next;
      });
    }
  };

  const toggleRowSelect = (nolg: string) => {
    setSelectedNolgs((prev) => {
      const next = new Set(prev);
      if (next.has(nolg)) {
        next.delete(nolg);
      } else {
        next.add(nolg);
      }
      return next;
    });
  };

  // Helper membaca file fisik browser ke Base64 DataURL yang sah
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  // Upload berkas dinamis dari HP atau dari berkas uji packages/db/data/mock-photos/
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileMap: Record<
      string,
      { thbl: string; stand?: ParsedPhotoItem; segel?: ParsedPhotoItem; rumah?: ParsedPhotoItem }
    > = {};

    let validCount = 0;
    let invalidCount = 0;

    const filesArray = Array.from(selectedFiles);

    setProgressState({
      isActive: true,
      stage: "reading",
      total: filesArray.length,
      processed: 0,
      sukses: 0,
      gagal: 0,
      percent: 0,
      currentFileName: filesArray[0]?.name || "",
    });

    for (let idx = 0; idx < filesArray.length; idx++) {
      const file = filesArray[idx];
      const match = file.name.match(
        /^(\d{6})_(stand|segel|rumah)_([a-zA-Z0-9_-]+)\.(jpg|jpeg|png|webp)$/i
      );
      const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;

      setProgressState((prev) => ({
        ...prev!,
        processed: idx + 1,
        percent: Math.round(((idx + 1) / filesArray.length) * 100),
        currentFileName: file.name,
      }));

      if (match) {
        validCount++;
        const [, thbl, jenis, nolg] = match;
        const j = jenis.toLowerCase() as "stand" | "segel" | "rumah";

        // Konversi File ke DataURL Base64 nyata agar Cloudinary & Backend dapat menyimpannya
        const dataUrl = await readFileAsDataUrl(file);

        if (!fileMap[nolg]) {
          fileMap[nolg] = { thbl };
        }

        fileMap[nolg][j] = {
          fileName: file.name,
          thbl,
          jenis: j,
          nolg,
          url: dataUrl,
          size: sizeStr,
          valid: true,
        };
      } else {
        invalidCount++;
      }
    }

    setProgressState(null);

    if (validCount === 0) {
      toast.error(
        "Tidak ada berkas yang sesuai dengan format baku {THBL}_{JENIS}_{NOLG}.jpg."
      );
      return;
    }

    // Merge dengan state customers yang ada secara dinamis
    setCustomers((prev) => {
      const updated = [...prev];
      const newlyAddedNolgs: string[] = [];

      Object.entries(fileMap).forEach(([nolg, data]) => {
        const existingIdx = updated.findIndex((c) => c.nolg === nolg);
        if (existingIdx >= 0) {
          const current = updated[existingIdx];
          const stand = data.stand || current.fotoStand;
          const segel = data.segel || current.fotoSegel;
          const rumah = data.rumah || current.fotoRumah;
          const count = (stand ? 1 : 0) + (segel ? 1 : 0) + (rumah ? 1 : 0);

          updated[existingIdx] = {
            ...current,
            fotoStand: stand,
            fotoSegel: segel,
            fotoRumah: rumah,
            countLengkap: count,
          };
        } else {
          const count = (data.stand ? 1 : 0) + (data.segel ? 1 : 0) + (data.rumah ? 1 : 0);
          updated.push({
            nolg,
            thbl: data.thbl,
            fotoStand: data.stand,
            fotoSegel: data.segel,
            fotoRumah: data.rumah,
            countLengkap: count,
          });
          newlyAddedNolgs.push(nolg);
        }
      });

      // Otomatis centang seluruh NOLG yang terdeteksi
      setSelectedNolgs((prevNolgs) => {
        const next = new Set(prevNolgs);
        Object.keys(fileMap).forEach((n) => next.add(n));
        return next;
      });

      return updated;
    });

    // Otomatis petakan dengan data master pelanggan di database berdasarkan NOLG
    const nolgsToLookup = Object.keys(fileMap);
    if (nolgsToLookup.length > 0) {
      void fetch("/api/import/lookup-pelanggan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nolgs: nolgsToLookup }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const dbMap = new Map<string, { nama: string; alamat: string; ruteKode?: string }>();
            json.data.forEach((d: any) => dbMap.set(d.nolg, d));

            setCustomers((prev) =>
              prev.map((c) => {
                const dbInfo = dbMap.get(c.nolg);
                if (!dbInfo) return c;
                return {
                  ...c,
                  nama: dbInfo.nama,
                  alamat: dbInfo.alamat,
                  ruteKode: dbInfo.ruteKode || c.ruteKode,
                };
              })
            );
          }
        })
        .catch((err) => {
          console.error("Gagal sinkronisasi data pelanggan dari database:", err);
        });
    }

    if (invalidCount > 0) {
      toast.warning(
        `Memuat ${validCount} berkas valid. Terdapat ${invalidCount} berkas diabaikan karena tidak mengikuti pola penamaan baku.`
      );
    } else {
      toast.success(`Berhasil memuat ${validCount} berkas foto backup!`);
    }

    // Reset input value agar dapat memilih berkas yang sama ulang jika diinginkan
    e.target.value = "";
  };

  // Reset / Bersihkan semua data
  const handleClear = () => {
    setCustomers([]);
    setSelectedNolgs(new Set());
    setSearchQuery("");
    setModeFilter("all");
    setResultSummary(null);
    toast.info("Daftar berkas foto backup telah dikosongkan.");
  };

  // Eksekusi Import / Pemetaan ke database
  const handleExecuteImport = async () => {
    const selectedCustomers = customers.filter((c) => selectedNolgs.has(c.nolg));
    if (selectedCustomers.length === 0) {
      toast.error("Pilih minimal satu nomor langganan untuk dipetakan.");
      return;
    }

    const payloadFiles: { fileName: string; fileData: string }[] = [];

    // Mengonversi blob URL ke data base64 atau mengirim payload
    for (const c of selectedCustomers) {
      if (modeFilter === "all" || modeFilter === "stand") {
        if (c.fotoStand) {
          payloadFiles.push({
            fileName: c.fotoStand.fileName,
            fileData: c.fotoStand.url,
          });
        }
      }
      if (modeFilter === "all" || modeFilter === "segel") {
        if (c.fotoSegel) {
          payloadFiles.push({
            fileName: c.fotoSegel.fileName,
            fileData: c.fotoSegel.url,
          });
        }
      }
      if (modeFilter === "all" || modeFilter === "rumah") {
        if (c.fotoRumah) {
          payloadFiles.push({
            fileName: c.fotoRumah.fileName,
            fileData: c.fotoRumah.url,
          });
        }
      }
    }

    if (payloadFiles.length === 0) {
      toast.error("Tidak ada berkas foto yang cocok dengan kelompok filter saat ini.");
      return;
    }

    setIsSubmitting(true);
    setResultSummary(null);

    const BATCH_SIZE = 4;
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
      currentFileName: payloadFiles[0]?.fileName || "",
    });

    try {
      for (let i = 0; i < payloadFiles.length; i += BATCH_SIZE) {
        const chunk = payloadFiles.slice(i, i + BATCH_SIZE);
        const currentFileName = chunk[0].fileName;

        setProgressState((prev) => ({
          ...prev!,
          currentFileName,
        }));

        try {
          const res = await fetch("/api/import/foto-backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: chunk }),
          });

          const json = await res.json();
          if (!res.ok || !json.success) {
            totalGagal += chunk.length;
          } else {
            totalSukses += json.data?.sukses ?? chunk.length;
            totalGagal += json.data?.gagal ?? 0;
          }
        } catch (chunkErr) {
          console.error("Batch upload failed:", chunkErr);
          totalGagal += chunk.length;
        }

        const processedCount = Math.min(i + chunk.length, payloadFiles.length);
        const percent = Math.round((processedCount / payloadFiles.length) * 100);

        setProgressState((prev) => ({
          ...prev!,
          processed: processedCount,
          sukses: totalSukses,
          gagal: totalGagal,
          percent,
        }));
      }

      setProgressState((prev) => ({
        ...prev!,
        stage: "completed",
        percent: 100,
        processed: payloadFiles.length,
        sukses: totalSukses,
        gagal: totalGagal,
      }));

      // Jeda 450ms agar status 100% terekam visual sebelum modal tertutup
      await new Promise((resolve) => setTimeout(resolve, 450));

      const labelKelompok =
        modeFilter === "stand"
          ? "Foto Stand"
          : modeFilter === "segel"
          ? "Foto Segel"
          : modeFilter === "rumah"
          ? "Foto Rumah"
          : "Semua Foto (Stand, Segel, Rumah)";

      const totalSl = selectedCustomers.length;

      setResultSummary({
        total: payloadFiles.length,
        sukses: totalSukses,
        gagal: totalGagal,
        slCount: totalSl,
        labelKelompok,
      });

      // Pola UI Bersih: Kosongkan antrian tabel otomatis setelah batch berhasil diimport
      setCustomers([]);
      setSelectedNolgs(new Set());
      setSearchQuery("");

      toast.success(
        `Sukses! ${totalSukses} berkas ${labelKelompok} berhasil dipetakan ke ${totalSl} pelanggan di database cater_baca_meter.`
      );
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memulihkan foto backup.");
    } finally {
      setIsSubmitting(false);
      setProgressState(null);
    }
  };

  const handleOpenPreview = (group: CustomerPhotoGroup, tab: "stand" | "segel" | "rumah") => {
    setPreviewCustomer(group);
    setPreviewActiveTab(tab);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nama berkas berhasil disalin!");
  };

  return (
    <div className="space-y-4">
      {/* 1. Card Ringkasan Eksekutif Murni */}
      <ImportSummaryCards
        totalBerkas={totalBerkas}
        countStand={countStand}
        countSegel={countSegel}
        countRumah={countRumah}
        totalSL={totalSL}
      />

      {/* 2. Bilah Kontrol, Filter Segmented, dan Aksi */}
      <ImportPhotoFilterBar
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalBerkas={totalBerkas}
        countStand={countStand}
        countSegel={countSegel}
        countRumah={countRumah}
        selectedNolgsCount={selectedNolgs.size}
        activeProcessCount={activeProcessCount}
        isSubmitting={isSubmitting}
        onFileSelect={handleFileSelect}
        onExecuteImport={() => void handleExecuteImport()}
        onClear={handleClear}
        hasData={customers.length > 0}
      />

      {/* Notifikasi Hasil Pemetaan Berhasil (Pola Sukses Batch Processing) */}
      {resultSummary && (
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Pemetaan Berkas Foto Berhasil Disimpan!
                </span>
                <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                  Batch Selesai
                </Badge>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Sebanyak <strong>{resultSummary.sukses} berkas ({resultSummary.labelKelompok})</strong> berhasil dipetakan ke{" "}
                <strong>{resultSummary.slCount} Nomor Langganan</strong> di tabel{" "}
                <code className="font-mono text-[11px] bg-emerald-500/20 px-1 py-0.5 rounded">
                  cater_baca_meter
                </code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              size="sm"
              asChild
              className="h-8 px-3 text-label-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
            >
              <Link href="/pencatatan-meter">
                <span>Lihat di Pencatatan Meter</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setResultSummary(null)}
              className="h-8 px-2.5 text-label-12 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 cursor-pointer"
              title="Tutup notifikasi"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 3. Tampilan Tabel atau Status Kosong */}
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

      {/* 4. Modal Lightbox Pratinjau Foto */}
      <ImportPhotoDialog
        previewCustomer={previewCustomer}
        previewActiveTab={previewActiveTab}
        setPreviewActiveTab={setPreviewActiveTab}
        onClose={() => setPreviewCustomer(null)}
        onCopy={copyToClipboard}
      />

      {/* 5. Modal Visual Progress Unggah & Pemetaan */}
      <ImportPhotoProgressModal progress={progressState} />
    </div>
  );
}
