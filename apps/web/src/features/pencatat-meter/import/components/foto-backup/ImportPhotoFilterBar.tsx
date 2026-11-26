// features/dashboard/import/components/foto-backup/ImportPhotoFilterBar.tsx
import * as React from "react";
import { FolderArchive, Layers, RotateCcw, UploadCloud } from "lucide-react";
import { Badge, Button } from "@cater/ui";
import { cn } from "@/lib/utils";
import { FOTO_FILENAME_TEMPLATE } from "../../lib/import-config";
import {
  FOTO_JENIS_LIST,
  getExecuteLabel,
  type FotoJenis,
} from "../../lib/foto-backup";
import { TONE_STYLE } from "../../lib/import-ui";
import type { ModeImportFilter } from "../../types/foto-backup.types";
import { ImportFileButton } from "../shared/ImportFileButton";
import { ImportSearchInput } from "../shared/ImportSearchInput";

interface ImportPhotoFilterBarProps {
  modeFilter: ModeImportFilter;
  setModeFilter: (mode: ModeImportFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalBerkas: number;
  counts: Record<FotoJenis, number>;
  selectedNolgsCount: number;
  activeProcessCount: number;
  isSubmitting: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExecuteImport: () => void;
  onClear: () => void;
  hasData: boolean;
}

interface SegmentOption {
  mode: ModeImportFilter;
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  activeClassName: string;
}

export function ImportPhotoFilterBar({
  modeFilter,
  setModeFilter,
  searchQuery,
  setSearchQuery,
  totalBerkas,
  counts,
  selectedNolgsCount,
  activeProcessCount,
  isSubmitting,
  onFileSelect,
  onExecuteImport,
  onClear,
  hasData,
}: ImportPhotoFilterBarProps) {
  const options: SegmentOption[] = [
    {
      mode: "all",
      label: "Semua Foto (Sekaligus)",
      count: totalBerkas,
      icon: Layers,
      iconClassName: TONE_STYLE.neutral.icon,
      activeClassName: "border-border bg-background text-foreground",
    },
    ...FOTO_JENIS_LIST.map((meta) => {
      const tone = TONE_STYLE[meta.tone];
      return {
        mode: meta.key,
        label: meta.filterLabel,
        count: counts[meta.key],
        icon: meta.icon,
        iconClassName: tone.icon,
        activeClassName: cn(tone.soft, tone.border, tone.text),
      };
    }),
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-heading-16 text-foreground">
              Import Foto Backup (Mobile Recovery)
            </h2>
            <Badge variant="secondary" className="font-mono text-label-11">
              Pola: {FOTO_FILENAME_TEMPLATE}
            </Badge>
          </div>
          <p className="text-copy-13 text-muted-foreground">
            Pemulihan foto lapangan saat gagal sinkronisasi jaringan mobile.
            Sistem dinamis memetakan foto ke database secara otomatis.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasData && (
            <Button
              variant="outline"
              onClick={onClear}
              disabled={isSubmitting}
              title="Kosongkan daftar berkas"
            >
              <RotateCcw />
              Kosongkan
            </Button>
          )}

          <ImportFileButton
            accept="image/*"
            multiple
            onChange={onFileSelect}
            icon={FolderArchive}
            disabled={isSubmitting}
          >
            Pilih Berkas dari HP
          </ImportFileButton>

          <Button
            onClick={onExecuteImport}
            disabled={
              isSubmitting ||
              selectedNolgsCount === 0 ||
              activeProcessCount === 0
            }
          >
            <UploadCloud />
            {isSubmitting
              ? "Memproses..."
              : getExecuteLabel(
                  modeFilter,
                  activeProcessCount,
                  selectedNolgsCount,
                )}
          </Button>
        </div>
      </div>

      {hasData && (
        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filter jenis foto"
            className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted p-1 select-none"
          >
            {options.map(
              ({
                mode,
                label,
                count,
                icon: Icon,
                iconClassName,
                activeClassName,
              }) => {
                const isActive = modeFilter === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setModeFilter(mode)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-label-12 transition-colors",
                      isActive
                        ? activeClassName
                        : "border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-3.5", iconClassName)} />
                    <span>{label}</span>
                    <span className="text-label-11">({count})</span>
                  </button>
                );
              },
            )}
          </div>

          <ImportSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari No. Langganan / Berkas..."
          />
        </div>
      )}
    </div>
  );
}
