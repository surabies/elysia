// features/dashboard/import/components/foto-backup/ImportPhotoDialog.tsx
import * as React from "react";
import { Copy, ExternalLink } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@cater/ui";
import { cn } from "@/lib/utils";
import {
  FOTO_JENIS_LIST,
  getFoto,
  type FotoJenis,
} from "../../lib/foto-backup";
import { TONE_STYLE } from "../../lib/import-ui";
import type { CustomerPhotoGroup } from "../../types/foto-backup.types";

interface ImportPhotoDialogProps {
  previewCustomer: CustomerPhotoGroup | null;
  previewActiveTab: FotoJenis;
  setPreviewActiveTab: (tab: FotoJenis) => void;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function ImportPhotoDialog({
  previewCustomer,
  previewActiveTab,
  setPreviewActiveTab,
  onClose,
  onCopy,
}: ImportPhotoDialogProps) {
  if (!previewCustomer) return null;

  const currentPhoto = getFoto(previewCustomer, previewActiveTab);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden border-border bg-card p-0">
        <div className="border-b border-border bg-muted p-4">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-heading-16">
            <span>
              {previewCustomer.nama || `Pelanggan #${previewCustomer.nolg}`}
            </span>
            <Badge variant="secondary" className="font-mono text-label-11">
              {previewCustomer.nolg}
            </Badge>
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-copy-13 text-muted-foreground">
            {previewCustomer.alamat
              ? `${previewCustomer.alamat} · Periode: ${previewCustomer.thbl}`
              : `Pratinjau berkas foto backup mobile lapangan · Periode: ${previewCustomer.thbl}`}
          </DialogDescription>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {FOTO_JENIS_LIST.map((meta) => {
              const Icon = meta.icon;
              const hasPhoto = Boolean(getFoto(previewCustomer, meta.key));
              const isActive = previewActiveTab === meta.key;
              return (
                <Button
                  key={meta.key}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  disabled={!hasPhoto}
                  onClick={() => setPreviewActiveTab(meta.key)}
                >
                  <Icon
                    className={cn(!isActive && TONE_STYLE[meta.tone].icon)}
                  />
                  {meta.groupLabel} {hasPhoto ? "✓" : "(Kosong)"}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-75 flex-col items-center justify-center bg-muted p-4">
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              alt={currentPhoto.fileName}
              className="max-h-85 w-auto rounded-lg border border-border object-contain"
            />
          ) : (
            <p className="text-copy-14 text-muted-foreground">
              Berkas foto untuk jenis ini belum diunggah.
            </p>
          )}
        </div>

        {currentPhoto && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-3.5">
            <div className="flex items-center gap-2 text-label-12 text-muted-foreground">
              <span>Berkas:</span>
              <code className="rounded-sm bg-muted px-1.5 py-0.5 text-label-12-mono text-foreground">
                {currentPhoto.fileName}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onCopy(currentPhoto.fileName)}
                aria-label="Salin nama berkas"
                title="Salin nama berkas"
              >
                <Copy />
              </Button>
            </div>

            <a
              href={currentPhoto.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-label-12 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Buka Tab Penuh
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
