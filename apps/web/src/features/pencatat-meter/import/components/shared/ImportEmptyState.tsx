// features/dashboard/import/components/shared/ImportEmptyState.tsx
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Info, UploadCloud } from "lucide-react";
import { ImportFileButton } from "./ImportFileButton";

export interface ImportEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  badges?: React.ReactNode;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
  buttonLabel?: string;
  buttonIcon?: LucideIcon;
  infoNote?: React.ReactNode;
}

export function ImportEmptyState({
  icon: Icon,
  title,
  description,
  badges,
  onFileSelect,
  accept = ".csv,.txt",
  multiple = false,
  buttonLabel = "Pilih Berkas",
  buttonIcon = UploadCloud,
  infoNote,
}: ImportEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-foreground">
        <Icon className="size-7" strokeWidth={1.5} aria-hidden />
      </div>

      <h3 className="text-heading-16 text-foreground">{title}</h3>
      <p className="mt-1 max-w-lg text-copy-13 text-muted-foreground">
        {description}
      </p>

      {badges && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {badges}
        </div>
      )}

      <div className="mt-6">
        <ImportFileButton
          accept={accept}
          multiple={multiple}
          onChange={onFileSelect}
          icon={buttonIcon}
          variant="default"
        >
          {buttonLabel}
        </ImportFileButton>
      </div>

      {infoNote && (
        <div className="mt-6 flex items-center gap-1.5 text-label-11 text-muted-foreground">
          <Info className="size-3.5" aria-hidden />
          <span>{infoNote}</span>
        </div>
      )}
    </div>
  );
}
