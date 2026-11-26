// features/dashboard/import/components/shared/ImportProgressModal.tsx
import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileCheck2,
  FileClock,
  Loader2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
} from "@cater/ui";
import { cn } from "@/lib/utils";
import { TONE_STYLE, type ImportTone } from "../../lib/import-ui";
import type { ImportProgressState } from "../../types/import.types";

export interface ImportProgressModalProps {
  progress: ImportProgressState | null;
  defaultTitle?: string;
  defaultDescription?: string;
  onCancel?: () => void;
}

interface ProgressCounterProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: ImportTone;
}

function ProgressCounter({
  label,
  value,
  icon: Icon,
  tone,
}: ProgressCounterProps) {
  const style = TONE_STYLE[tone];
  return (
    <div
      className={cn(
        "rounded-lg border p-2 text-center",
        style.soft,
        style.border,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-1 text-label-11",
          style.text,
        )}
      >
        <Icon className="size-3" aria-hidden />
        <span>{label}</span>
      </div>
      <div className={cn("mt-1 text-label-14-mono tabular-nums", style.text)}>
        {value.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

export function ImportProgressModal({
  progress,
  defaultTitle,
  defaultDescription,
  onCancel,
}: ImportProgressModalProps) {
  if (!progress || !progress.isActive) return null;

  const isCompleted = progress.stage === "completed" || progress.percent >= 100;
  const isReading = progress.stage === "reading";
  const sisa = Math.max(0, progress.total - progress.processed);

  const headerTone: ImportTone = isCompleted
    ? "green"
    : isReading
      ? "amber"
      : "neutral";

  const HeaderIcon = isCompleted
    ? CheckCircle2
    : isReading
      ? Loader2
      : Database;

  const title =
    progress.customTitle ||
    (isCompleted
      ? "Proses Selesai"
      : isReading
        ? "Membaca Berkas dari Perangkat"
        : defaultTitle || "Mengimpor & Memetakan Data");

  const description =
    progress.customDescription ||
    (isCompleted
      ? "Seluruh baris data telah berhasil diproses ke database."
      : isReading
        ? "Mempersiapkan dan mem-parsing berkas CSV..."
        : defaultDescription || "Menyimpan data transaksi ke tabel cater_baca_meter...");

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md border-border bg-card p-6"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                TONE_STYLE[headerTone].soft,
                TONE_STYLE[headerTone].text,
              )}
            >
              <HeaderIcon
                className={cn(
                  "size-5",
                  isReading && !isCompleted && "animate-spin",
                  !isReading && !isCompleted && "animate-pulse",
                )}
                aria-hidden
              />
            </div>
            <div>
              <DialogTitle className="text-heading-16 text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-copy-12 text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-copy-13 text-muted-foreground">
              {!isCompleted && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              )}
              {isCompleted
                ? "Selesai 100%"
                : `Memproses... (${progress.processed.toLocaleString("id-ID")}/${progress.total.toLocaleString("id-ID")})`}
            </span>
            <span className="text-label-14-mono tabular-nums text-foreground">
              {progress.percent}%
            </span>
          </div>
          <Progress value={progress.percent} />
        </div>

        {progress.currentLabel && (
          <div className="space-y-1 rounded-md border border-border bg-muted p-2.5">
            <span className="block text-label-11 uppercase tracking-wider text-muted-foreground">
              Status Pemrosesan
            </span>
            <span className="block truncate text-label-12-mono text-foreground" title={progress.currentLabel}>
              {progress.currentLabel}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <ProgressCounter
            label="Sukses"
            value={progress.sukses}
            icon={FileCheck2}
            tone="green"
          />
          <ProgressCounter
            label="Sisa"
            value={sisa}
            icon={FileClock}
            tone="neutral"
          />
          <ProgressCounter
            label="Gagal"
            value={progress.gagal}
            icon={AlertCircle}
            tone="red"
          />
        </div>

        {!isCompleted && onCancel && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={progress.isCancelling}
              className="text-label-12 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
            >
              {progress.isCancelling ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Membatalkan...
                </span>
              ) : (
                "Batalkan Impor"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
