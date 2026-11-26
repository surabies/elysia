// features/dashboard/import/components/foto-backup/ImportPhotoProgressModal.tsx
import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileClock,
  Loader2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TONE_STYLE, type ImportTone } from "../../lib/import-ui";
import type { ImportProgressState } from "../../types/foto-backup.types";

interface ImportPhotoProgressModalProps {
  progress: ImportProgressState | null;
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
        {value}
      </div>
    </div>
  );
}

export function ImportPhotoProgressModal({
  progress,
}: ImportPhotoProgressModalProps) {
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
      : UploadCloud;
  const title = isCompleted
    ? "Proses Pemetaan Selesai"
    : isReading
      ? "Membaca Berkas dari Perangkat"
      : "Mengunggah & Memetakan Foto";
  const description = isCompleted
    ? "Seluruh berkas telah diproses dan disimpan ke database."
    : isReading
      ? "Mempersiapkan data berkas foto sebelum dikirim ke server..."
      : "Menyimpan ke Cloudinary dan memetakan ke tabel cater_baca_meter...";

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
                  !isReading && !isCompleted && "animate-bounce",
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
                : `Memproses... (${progress.processed}/${progress.total})`}
            </span>
            <span className="text-label-14-mono tabular-nums text-foreground">
              {progress.percent}%
            </span>
          </div>
          <Progress value={progress.percent} />
        </div>

        {progress.currentFileName && (
          <div className="space-y-1 rounded-md border border-border bg-muted p-2.5">
            <span className="block text-label-11 uppercase tracking-wider text-muted-foreground">
              Berkas Aktif
            </span>
            <span className="block truncate text-label-12-mono text-foreground">
              {progress.currentFileName}
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
      </DialogContent>
    </Dialog>
  );
}
