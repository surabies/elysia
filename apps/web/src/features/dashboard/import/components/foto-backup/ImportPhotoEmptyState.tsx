// apps/web/src/features/dashboard/import/components/foto-backup/ImportPhotoEmptyState.tsx
"use client";

import * as React from "react";
import { FolderArchive, UploadCloud, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportPhotoEmptyStateProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImportPhotoEmptyState({ onFileSelect }: ImportPhotoEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-[var(--card)]/60 p-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mb-4">
        <FolderArchive className="size-7" />
      </div>

      <h3 className="text-title-16 font-semibold text-[var(--primary-foreground)]">
        Belum Ada Berkas Foto Dipilih
      </h3>
      <p className="text-copy-13 text-muted-foreground mt-1 max-w-lg">
        Pilih berkas foto backup dari penyimpanan HP petugas atau gunakan berkas uji yang tersedia di folder{" "}
        <code className="font-mono text-xs bg-[var(--muted)] px-1.5 py-0.5 rounded text-[var(--primary-foreground)]">
          packages/db/data/mock-photos/
        </code>
      </p>

      {/* Standar Penamaan Format */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono">
        <span className="bg-[var(--muted)] px-2 py-1 rounded border border-[var(--border)]/50">
          202601_stand_00703600750.jpg
        </span>
        <span className="bg-[var(--muted)] px-2 py-1 rounded border border-[var(--border)]/50">
          202601_segel_00703600750.jpg
        </span>
        <span className="bg-[var(--muted)] px-2 py-1 rounded border border-[var(--border)]/50">
          202601_rumah_00703600750.jpg
        </span>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
          <Button size="sm" asChild className="gap-2 cursor-pointer">
            <span>
              <UploadCloud className="size-4" />
              Pilih Berkas dari HP
            </span>
          </Button>
        </label>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
        <Info className="size-3.5" />
        <span>Modul dinamis: Mendukung upload foto Stand saja, Segel saja, Rumah saja, atau sekaligus.</span>
      </div>
    </div>
  );
}
