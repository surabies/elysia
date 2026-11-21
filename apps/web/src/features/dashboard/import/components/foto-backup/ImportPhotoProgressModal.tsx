// apps/web/src/features/dashboard/import/components/foto-backup/ImportPhotoProgressModal.tsx
"use client";

import * as React from "react";
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  FileClock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ImportProgressState } from "../../types/foto-backup.types";

interface ImportPhotoProgressModalProps {
  progress: ImportProgressState | null;
}

export function ImportPhotoProgressModal({ progress }: ImportPhotoProgressModalProps) {
  if (!progress || !progress.isActive) return null;

  const isCompleted = progress.stage === "completed" || progress.percent >= 100;
  const isReading = progress.stage === "reading";
  const sisa = Math.max(0, progress.total - progress.processed);

  return (
    <Dialog open={progress.isActive} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md p-6 border-border bg-[var(--card)] shadow-2xl focus-visible:outline-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isCompleted
                  ? "bg-[var(--verif-v3-soft)] text-[var(--verif-v3-text)] dark:text-[var(--verif-v3-text)]"
                  : isReading
                  ? "bg-[var(--verif-v1-soft)] text-[var(--verif-v1-text)] dark:text-[var(--verif-v1-text)]"
                  : "bg-[var(--primary)]/15 text-[var(--primary)]"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-5" />
              ) : isReading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <UploadCloud className="size-5 animate-bounce" />
              )}
            </div>
            <div>
              <DialogTitle className="text-heading-16 font-semibold text-[var(--primary-foreground)]">
                {isCompleted
                  ? "Proses Pemetaan Selesai"
                  : isReading
                  ? "Membaca Berkas dari Perangkat"
                  : "Mengunggah & Memetakan Foto"}
              </DialogTitle>
              <DialogDescription className="text-copy-12 text-muted-foreground">
                {isCompleted
                  ? "Seluruh berkas telah diproses dan disimpan ke database."
                  : isReading
                  ? "Mempersiapkan data berkas foto sebelum dikirim ke server..."
                  : "Menyimpan ke Cloudinary dan memetakan ke tabel cater_baca_meter..."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar & Persentase */}
        <div className="space-y-2 py-3">
          <div className="flex items-center justify-between text-copy-13 font-medium">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {!isCompleted && <Loader2 className="size-3.5 animate-spin text-[var(--primary)]" />}
              {isCompleted ? "Selesai 100%" : `Memproses... (${progress.processed}/${progress.total})`}
            </span>
            <span className="font-mono text-label-14 font-bold text-[var(--primary-foreground)] tabular-nums">
              {progress.percent}%
            </span>
          </div>

          <Progress value={progress.percent} className="h-2.5 w-full rounded-full" />
        </div>

        {/* Current Active File Info */}
        {progress.currentFileName && (
          <div className="rounded-md border border-[var(--border)]/70 bg-[var(--muted)]/50 p-2.5 text-copy-12 space-y-1">
            <span className="text-label-11 uppercase font-semibold text-muted-foreground tracking-wider block">
              Berkas Aktif
            </span>
            <div className="flex items-center gap-1.5 text-[var(--primary-foreground)] font-mono text-label-12 truncate">
              <span className="truncate">{progress.currentFileName}</span>
            </div>
          </div>
        )}

        {/* Executive Counters (Sukses / Gagal / Sisa) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-lg border border-[var(--verif-v3-border)]/20 bg-[var(--verif-v3-soft)] p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[var(--verif-v3-text)] text-label-11 font-medium">
              <FileCheck2 className="size-3" />
              <span>Sukses</span>
            </div>
            <div className="mt-1 font-mono text-label-14 font-bold text-[var(--verif-v3-text)] tabular-nums">
              {progress.sukses}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-[var(--muted)]/30 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-label-11 font-medium">
              <FileClock className="size-3" />
              <span>Sisa</span>
            </div>
            <div className="mt-1 font-mono text-label-14 font-semibold text-[var(--primary-foreground)] tabular-nums">
              {sisa}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[var(--destructive)] text-label-11 font-medium">
              <AlertCircle className="size-3" />
              <span>Gagal</span>
            </div>
            <div className="mt-1 font-mono text-label-14 font-bold text-[var(--destructive)] tabular-nums">
              {progress.gagal}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
