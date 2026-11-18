// apps/web/src/features/dashboard/import/components/foto-backup/ImportPhotoDialog.tsx
"use client";

import * as React from "react";
import { Gauge, ShieldCheck, Home, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CustomerPhotoGroup } from "../../types/foto-backup.types";

interface ImportPhotoDialogProps {
  previewCustomer: CustomerPhotoGroup | null;
  previewActiveTab: "stand" | "segel" | "rumah";
  setPreviewActiveTab: (tab: "stand" | "segel" | "rumah") => void;
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

  const currentPhoto =
    previewActiveTab === "stand"
      ? previewCustomer.fotoStand
      : previewActiveTab === "segel"
      ? previewCustomer.fotoSegel
      : previewCustomer.fotoRumah;

  return (
    <Dialog open={Boolean(previewCustomer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border bg-card">
        {/* Header Dialog */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-title-16 font-semibold flex items-center gap-2">
                <span>{previewCustomer.nama || `Pelanggan #${previewCustomer.nolg}`}</span>
                <Badge variant="outline" className="font-mono text-primary text-[11px]">
                  {previewCustomer.nolg}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-copy-13 text-muted-foreground mt-0.5">
                {previewCustomer.alamat
                  ? `${previewCustomer.alamat} · Periode: ${previewCustomer.thbl}`
                  : `Pratinjau berkas foto backup mobile lapangan · Periode: ${previewCustomer.thbl}`}
              </DialogDescription>
            </div>
          </div>

          {/* Segment Tab Dialog */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              type="button"
              variant={previewActiveTab === "stand" ? "default" : "outline"}
              size="sm"
              disabled={!previewCustomer.fotoStand}
              onClick={() => setPreviewActiveTab("stand")}
              className="h-7 text-label-12 gap-1.5 cursor-pointer"
            >
              <Gauge className="size-3.5 text-sky-400" />
              Foto Stand {previewCustomer.fotoStand ? "✓" : "(Kosong)"}
            </Button>
            <Button
              type="button"
              variant={previewActiveTab === "segel" ? "default" : "outline"}
              size="sm"
              disabled={!previewCustomer.fotoSegel}
              onClick={() => setPreviewActiveTab("segel")}
              className="h-7 text-label-12 gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="size-3.5 text-amber-400" />
              Foto Segel {previewCustomer.fotoSegel ? "✓" : "(Kosong)"}
            </Button>
            <Button
              type="button"
              variant={previewActiveTab === "rumah" ? "default" : "outline"}
              size="sm"
              disabled={!previewCustomer.fotoRumah}
              onClick={() => setPreviewActiveTab("rumah")}
              className="h-7 text-label-12 gap-1.5 cursor-pointer"
            >
              <Home className="size-3.5 text-indigo-400" />
              Foto Rumah {previewCustomer.fotoRumah ? "✓" : "(Kosong)"}
            </Button>
          </div>
        </div>

        {/* Konten Gambar High-Res */}
        <div className="p-4 flex flex-col items-center justify-center bg-black/90 min-h-[300px]">
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              alt={currentPhoto.fileName}
              className="max-h-[340px] w-auto rounded-lg shadow-lg border border-border/40 object-contain"
            />
          ) : (
            <div className="text-center text-muted-foreground/60 text-sm">
              Berkas foto untuk jenis ini belum diunggah.
            </div>
          )}
        </div>

        {/* Footer Dialog Metadata */}
        {currentPhoto && (
          <div className="p-3.5 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3 text-label-12">
            <div className="flex items-center gap-2 font-mono text-muted-foreground text-[11px]">
              <span>Berkas:</span>
              <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-semibold">
                {currentPhoto.fileName}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onCopy(currentPhoto.fileName)}
                className="h-6 px-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Salin nama berkas"
              >
                <Copy className="size-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                Buka Tab Penuh
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
