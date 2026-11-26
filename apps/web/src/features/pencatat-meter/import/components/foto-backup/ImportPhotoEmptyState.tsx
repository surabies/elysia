// features/dashboard/import/components/foto-backup/ImportPhotoEmptyState.tsx
import * as React from "react";
import { FolderArchive, Info, UploadCloud } from "lucide-react";
import { PERIODE_BERJALAN_AKTIF } from "@/config/periode";
import { Badge } from "@cater/ui";
import { FOTO_JENIS_LIST } from "../../lib/foto-backup";
import { FOTO_EXAMPLE_NOLG } from "../../lib/import-config";
import { ImportFileButton } from "../shared/ImportFileButton";

interface ImportPhotoEmptyStateProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImportPhotoEmptyState({
  onFileSelect,
}: ImportPhotoEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-foreground">
        <FolderArchive className="size-7" strokeWidth={1.5} aria-hidden />
      </div>

      <h3 className="text-heading-16 text-foreground">
        Belum Ada Berkas Foto Dipilih
      </h3>
      <p className="mt-1 max-w-lg text-copy-13 text-muted-foreground">
        Pilih berkas foto backup (.jpg / .jpeg / .png) dari penyimpanan HP petugas
        atau galeri perangkat untuk diproses ke database.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {FOTO_JENIS_LIST.map((meta) => (
          <Badge key={meta.key} variant="secondary" className="font-mono text-label-11">
            {`${PERIODE_BERJALAN_AKTIF}_${meta.key}_${FOTO_EXAMPLE_NOLG}.jpg`}
          </Badge>
        ))}
      </div>

      <div className="mt-6">
        <ImportFileButton
          accept="image/*"
          multiple
          onChange={onFileSelect}
          icon={UploadCloud}
          variant="default"
        >
          Pilih Berkas dari HP
        </ImportFileButton>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-label-11 text-muted-foreground">
        <Info className="size-3.5" aria-hidden />
        <span>
          Modul dinamis: Mendukung upload foto Stand saja, Segel saja, Rumah
          saja, atau sekaligus.
        </span>
      </div>
    </div>
  );
}
